"""
Stock Analysis Dividend Scraper Service
========================================
Scrapes upcoming dividend information from NGX_SOURCE_BASE_URL

Endpoint:
    {NGX_SOURCE_BASE_URL}/quote/ngx/{TICKER}/dividend/

Extracts: Ex-Dividend Date, Cash Amount, Record Date, Pay Date
Cache TTL: 3600 seconds (1 hour) since dividend data changes infrequently
"""

import logging
import time
import re
from typing import Optional
from datetime import datetime, timezone, date

try:
    import requests
    from bs4 import BeautifulSoup

    HAS_BEAUTIFULSOUP = True
except ImportError:
    HAS_BEAUTIFULSOUP = False
    import urllib.request
    import urllib.error

from app.config import settings
from app.models import DividendInfo
from app.db.engine import SessionLocal
from app.db import crud

log = logging.getLogger(__name__)


def _is_date(text: str) -> bool:
    """Check if text looks like a date (simple heuristic)"""
    text = text.strip()
    # Common date patterns: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Jan 1, 2024, etc.
    date_pattern = r"\d{1,4}[-/]\d{1,2}[-/]\d{1,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}"
    return bool(re.search(date_pattern, text, re.IGNORECASE))


def _is_currency(text: str) -> bool:
    """Check if text looks like a currency amount"""
    text = text.strip()
    # Look for $ or numbers with decimals
    currency_pattern = r"[\$₦]?\s*\d+\.?\d*"
    return bool(re.search(currency_pattern, text))


def _parse_currency_value(text: str) -> Optional[float]:
    """Extract numeric value from currency text like '15.000 NGN'"""
    text = text.strip()
    # Extract just the numeric part, ignoring currency symbols/codes (handles 15.000, 15,000, 15000, etc.)
    match = re.search(r"(\d+[\.,]\d+|\d+)", text)
    if match:
        numeric_str = match.group(1).replace(",", ".")  # Normalize comma to dot
        try:
            return float(numeric_str)
        except ValueError:
            return None
    return None


def _parse_dividend_table(table, ticker: str) -> Optional[DividendInfo]:
    """
    Parse a single HTML table element for dividend data.
    Uses header row to detect column positions; falls back to positional guessing.
    Returns DividendInfo if cash_amount and at least one date are found, else None.
    """
    rows = table.find_all("tr")
    if len(rows) < 2:
        return None

    # Build column index map from header row
    header_cells = rows[0].find_all(["th", "td"])
    col_map: dict[str, int] = {}
    for i, cell in enumerate(header_cells):
        text = cell.get_text(strip=True).lower()
        if "ex" in text and "div" in text:
            col_map["ex"] = i
        elif "cash" in text or "amount" in text or "dividend" in text:
            col_map["cash"] = i
        elif "record" in text:
            col_map["record"] = i
        elif "pay" in text:
            col_map["pay"] = i

    # Positional fallback if header detection found nothing useful
    if not col_map:
        col_map = {"ex": 0, "cash": 1, "record": 2, "pay": 3}

    for row in rows[1:]:
        cells = row.find_all(["td", "th"])
        if len(cells) < 2:
            continue
        texts = [c.get_text(strip=True) for c in cells]

        def _get(key: str) -> str:
            idx = col_map.get(key, -1)
            return texts[idx] if 0 <= idx < len(texts) else ""

        ex_div_date = _get("ex") if _is_date(_get("ex")) else None
        cash_text = _get("cash")
        cash_amount = _parse_currency_value(cash_text) if cash_text else None
        record_date = _get("record") if _is_date(_get("record")) else None
        pay_date = _get("pay") if _is_date(_get("pay")) else None

        # Only require cash_amount + at least one date
        if cash_amount is not None and (ex_div_date or pay_date):
            return DividendInfo(
                symbol=ticker,
                ex_dividend_date=ex_div_date,
                record_date=record_date,
                pay_date=pay_date,
                cash_amount=cash_amount,
                currency="NGN",
                timestamp=datetime.now().isoformat(),
            )

    return None


def _fetch_dividend_beautifulsoup(ticker: str) -> Optional[DividendInfo]:
    """
    Scrape upcoming dividend information using BeautifulSoup.
    Tries all tables on the page and returns the first usable result.
    """
    url = f"{settings.NGX_SOURCE_BASE_URL}/quote/ngx/{ticker}/dividend/"

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        for table in soup.find_all("table"):
            result = _parse_dividend_table(table, ticker)
            if result:
                return result

        log.debug("[Dividends] %s: no dividend data found in any table", ticker)
        return None

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            log.debug("[Dividends] %s: not found (404)", ticker)
        else:
            log.warning("[Dividends] %s HTTP error %d", ticker, e.response.status_code)
        return None
    except Exception as exc:
        log.warning("[Dividends] %s failed: %s", ticker, exc)
        return None


def _fetch_dividend_urllib(ticker: str) -> Optional[DividendInfo]:
    """
    Scrape upcoming dividend information using urllib (fallback).
    Scans all table rows; only requires cash_amount + at least one date.
    """
    url = f"{settings.NGX_SOURCE_BASE_URL}/quote/ngx/{ticker}/dividend/"

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode("utf-8", errors="ignore")

        rows_match = re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.DOTALL | re.IGNORECASE)
        header_seen = False

        for row_html in rows_match:
            cells = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", row_html, re.DOTALL | re.IGNORECASE)
            cell_texts = [re.sub(r"<[^>]+>", "", c).strip() for c in cells]

            if len(cell_texts) < 2:
                continue

            # Skip header rows
            if not header_seen:
                header_seen = True
                continue

            ex_div_date = None
            cash_amount = None
            record_date = None
            pay_date = None

            for text in cell_texts:
                if _is_date(text) and not ex_div_date:
                    ex_div_date = text
                elif _is_currency(text) and not cash_amount:
                    cash_amount = _parse_currency_value(text)
                elif _is_date(text) and ex_div_date and not record_date:
                    record_date = text
                elif _is_date(text) and ex_div_date and record_date and not pay_date:
                    pay_date = text

            if cash_amount is not None and (ex_div_date or pay_date):
                return DividendInfo(
                    symbol=ticker,
                    ex_dividend_date=ex_div_date,
                    record_date=record_date,
                    pay_date=pay_date,
                    cash_amount=cash_amount,
                    currency="NGN",
                    timestamp=datetime.now().isoformat(),
                )

        log.debug("[Dividends] %s: no dividend data found", ticker)
        return None

    except urllib.error.HTTPError as e:
        if e.code == 404:
            log.debug("[Dividends] %s: not found (404)", ticker)
        else:
            log.warning("[Dividends] %s HTTP error %d", ticker, e.code)
        return None
    except Exception as exc:
        log.warning("[Dividends] %s failed: %s", ticker, exc)
        return None


def _fetch_dividend(ticker: str) -> Optional[DividendInfo]:
    """
    Scrape upcoming dividend information from NGX_SOURCE_BASE_URL
    Uses BeautifulSoup if available, falls back to urllib/regex.
    """
    if HAS_BEAUTIFULSOUP:
        return _fetch_dividend_beautifulsoup(ticker)
    else:
        return _fetch_dividend_urllib(ticker)


def get_dividend(ticker: str) -> Optional[DividendInfo]:
    """Fetch fresh dividend data from scraper."""
    ticker_up = ticker.upper()

    db = SessionLocal()
    try:
        log.info("[Dividends] fetching %s", ticker_up)
        result = _fetch_dividend(ticker_up)

        if result:
            log.info(
                "[Dividends] %s → %s %s (ex: %s)",
                ticker_up,
                result.cash_amount,
                result.currency,
                result.ex_dividend_date,
            )
        else:
            log.info("[Dividends] %s → no data", ticker_up)
        return result

    finally:
        db.close()


def get_dividends(tickers: list[str]) -> dict[str, Optional[DividendInfo]]:
    """Get dividend information for multiple tickers."""
    return {ticker: get_dividend(ticker) for ticker in tickers}


# ── Dividend history (streak) ─────────────────────────────────────────────────


def _extract_year(date_str: str) -> Optional[str]:
    m = re.search(r"(20\d{2})", date_str)
    return m.group(1) if m else None


def _fetch_all_dividends_bs(ticker: str) -> list[dict]:
    """
    Scrape ALL dividend rows from the dividend page and group by year.
    Returns list of {'year': str, 'cash_amount': float} sorted oldest→newest.
    """
    url = f"{settings.NGX_SOURCE_BASE_URL}/quote/ngx/{ticker}/dividend/"
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        by_year: dict[str, float] = {}
        for table in soup.find_all("table"):
            rows = table.find_all("tr")
            if len(rows) < 2:
                continue
            for row in rows[1:]:
                cells = row.find_all(["td", "th"])
                if len(cells) < 2:
                    continue
                cell_texts = [c.get_text(strip=True) for c in cells]
                ex_date = cell_texts[0]
                cash_text = cell_texts[1] if len(cell_texts) > 1 else ""
                if not _is_date(ex_date) or not _is_currency(cash_text):
                    continue
                amount = _parse_currency_value(cash_text)
                year = _extract_year(ex_date)
                if amount and year:
                    by_year[year] = by_year.get(year, 0) + amount
        if not by_year:
            return []
        return sorted(
            [{"year": y, "cash_amount": round(a, 4)} for y, a in by_year.items()],
            key=lambda x: x["year"],
        )
    except Exception as exc:
        log.warning("[DividendHistory] %s failed: %s", ticker, exc)
        return []


def compute_streak(history: list[dict]) -> dict:
    """
    Compute dividend streak from history [{year, cash_amount}] (oldest→newest).
    Returns {streak, years_paid, growing}.
    """
    if not history:
        return {"streak": 0, "years_paid": 0, "growing": False}

    year_set = {int(h["year"]) for h in history}
    latest = max(year_set)
    current_year = date.today().year

    streak = 0
    if latest >= current_year - 1:
        streak = 1
        y = latest - 1
        while y in year_set:
            streak += 1
            y -= 1

    by_year = {h["year"]: h["cash_amount"] for h in history}
    recent_years = sorted(by_year.keys())[-3:]
    growing = len(recent_years) >= 2 and all(
        by_year[recent_years[i]] <= by_year[recent_years[i + 1]]
        for i in range(len(recent_years) - 1)
    )
    return {"streak": streak, "years_paid": len(history), "growing": growing}


def get_dividend_history(ticker: str) -> dict:
    """Fetch fresh dividend history and compute streak."""
    global _history_cache, _history_cache_ts
    t = ticker.upper()

    db = SessionLocal()
    try:
        log.info("[DividendHistory] fetching %s", t)
        if not HAS_BEAUTIFULSOUP:
            result = {"streak": 0, "years_paid": 0, "growing": False, "history": []}
        else:
            history = _fetch_all_dividends_bs(t)
            streak_data = compute_streak(history)
            result = {**streak_data, "history": history}
            if history:
                log.info(
                    "[DividendHistory] %s → %d years, streak=%d",
                    t,
                    len(history),
                    result["streak"],
                )

        return result
    finally:
        db.close()

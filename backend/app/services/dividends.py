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

_cache: dict = {"data": {}, "ts": 0.0}


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


def _fetch_dividend_beautifulsoup(ticker: str) -> Optional[DividendInfo]:
    """
    Scrape upcoming dividend information using BeautifulSoup.
    Returns the most recent dividend information.
    First row = header, second row = latest dividend data.
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
        tables = soup.find_all("table")

        for table in tables:
            rows = table.find_all("tr")

            # Need at least header row + 1 data row
            if len(rows) < 2:
                continue

            # Skip header row (row 0), process first data row (row 1)
            row = rows[1]
            cells = row.find_all(["td", "th"])

            if len(cells) < 4:
                continue

            cell_texts = [cell.get_text(strip=True) for cell in cells]
            # Extract dividend fields by column index
            # Table structure: [Ex-Dividend Date, Cash Amount, Record Date, Pay Date]
            ex_div_date = cell_texts[0] if _is_date(cell_texts[0]) else None
            cash_amount = (
                _parse_currency_value(cell_texts[1])
                if _is_currency(cell_texts[1])
                else None
            )
            record_date = cell_texts[2] if _is_date(cell_texts[2]) else None
            pay_date = cell_texts[3] if _is_date(cell_texts[3]) else None
            # If we found a complete dividend record, return it
            if all([ex_div_date, pay_date, record_date, cash_amount]):
                return DividendInfo(
                    symbol=ticker,
                    ex_dividend_date=ex_div_date,
                    record_date=record_date,
                    pay_date=pay_date,
                    cash_amount=cash_amount,
                    currency="NGN",
                    timestamp=datetime.now().isoformat(),
                )

        log.warning(f"[Dividends] {ticker}: could not extract dividend data from table")
        return None

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            log.debug(f"[Dividends] {ticker}: not found (404)")
        else:
            log.warning(f"[Dividends] {ticker} HTTP error {e.response.status_code}")
        return None
    except Exception as exc:
        log.warning(f"[Dividends] {ticker} failed: {exc}")
        return None


def _fetch_dividend_urllib(ticker: str) -> Optional[DividendInfo]:
    """
    Scrape upcoming dividend information using urllib (fallback).
    Returns the most recent dividend information.
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

        # Simple HTML parsing with regex
        # Look for table data
        rows_match = re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.DOTALL | re.IGNORECASE)

        for row_html in rows_match:
            cells = re.findall(
                r"<t[dh][^>]*>(.*?)</t[dh]>", row_html, re.DOTALL | re.IGNORECASE
            )
            cell_texts = [re.sub(r"<[^>]+>", "", cell).strip() for cell in cells]

            if len(cell_texts) < 4:
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

            if all([ex_div_date, pay_date, record_date, cash_amount]):
                return DividendInfo(
                    symbol=ticker,
                    ex_dividend_date=ex_div_date,
                    record_date=record_date,
                    pay_date=pay_date,
                    cash_amount=cash_amount,
                    currency="NGN",
                    timestamp=datetime.now().isoformat(),
                )

        log.warning(f"[Dividends] {ticker}: could not extract dividend data")
        return None

    except urllib.error.HTTPError as e:
        if e.code == 404:
            log.debug(f"[Dividends] {ticker}: not found (404)")
        else:
            log.warning(f"[Dividends] {ticker} HTTP error {e.code}")
        return None
    except Exception as exc:
        log.warning(f"[Dividends] {ticker} failed: {exc}")
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
    """
    Two-level cache: L1 = in-memory, L2 = DB (survives restarts).
    Falls back to scraping only when both levels are stale.
    """
    global _cache
    now = time.time()
    ticker_up = ticker.upper()

    # L1 — in-memory
    if ticker_up in _cache["data"] and (now - _cache["ts"]) < settings.DIVIDEND_TTL:
        return _cache["data"][ticker_up]

    # L2 — database
    db = SessionLocal()
    try:
        row = crud.get_dividend_cache(db, ticker_up)
        if row is not None:
            age = (datetime.now(timezone.utc) - row.fetched_at).total_seconds()
            if age < settings.DIVIDEND_TTL:
                result = (
                    DividendInfo(
                        symbol=row.symbol,
                        ex_dividend_date=row.ex_dividend_date,
                        record_date=row.record_date,
                        pay_date=row.pay_date,
                        cash_amount=row.cash_amount,
                        currency=row.currency,
                        timestamp=row.dividend_ts,
                    )
                    if row.cash_amount is not None
                    else None
                )
                _cache["data"][ticker_up] = result
                _cache["ts"] = now
                log.debug("[Dividends] %s from DB cache (age %.0fs)", ticker_up, age)
                return result

        # Scrape
        log.info("[Dividends] fetching %s", ticker_up)
        result = _fetch_dividend(ticker_up)

        crud.upsert_dividend_cache(db, ticker_up, result)
        _cache["data"][ticker_up] = result
        _cache["ts"] = now

        if result:
            log.info(
                "[Dividends] %s → %s %s (ex: %s)",
                ticker_up,
                result.cash_amount,
                result.currency,
                result.ex_dividend_date,
            )
        return result

    finally:
        db.close()


def get_dividends(tickers: list[str]) -> dict[str, Optional[DividendInfo]]:
    """
    Get dividend information for multiple tickers.
    Returns dict mapping ticker to DividendInfo (or None if not found).
    """
    results = {}
    for ticker in tickers:
        results[ticker] = get_dividend(ticker)
    return results


def cache_age() -> Optional[int]:
    """Returns age of cache in seconds, or None if empty"""
    return int(time.time() - _cache["ts"]) if _cache["ts"] else None


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


_history_cache: dict = {}
_history_cache_ts: dict = {}


def get_dividend_history(ticker: str) -> dict:
    """
    Two-level cache for dividend history.
    Returns {'streak': int, 'years_paid': int, 'growing': bool, 'history': list}.
    """
    global _history_cache, _history_cache_ts
    t = ticker.upper()
    now = time.time()
    key = f"divhist:{t}"

    if (
        key in _history_cache
        and (now - _history_cache_ts.get(key, 0)) < settings.FINANCIALS_TTL
    ):
        return _history_cache[key]

    db = SessionLocal()
    try:
        row = crud.get_financials_cache(db, t, "dividends")
        if row is not None:
            age = (datetime.now(timezone.utc) - row.fetched_at).total_seconds()
            if age < settings.FINANCIALS_TTL and row.periods:
                history = [
                    {"year": y, "cash_amount": a}
                    for y, a in zip(row.periods, row.col_a)
                    if a is not None
                ]
                result = {**compute_streak(history), "history": history}
                _history_cache[key] = result
                _history_cache_ts[key] = now
                return result

        log.info("[DividendHistory] fetching %s", t)
        if not HAS_BEAUTIFULSOUP:
            result = {"streak": 0, "years_paid": 0, "growing": False, "history": []}
        else:
            history = _fetch_all_dividends_bs(t)
            streak_data = compute_streak(history)
            result = {**streak_data, "history": history}
            if history:
                crud.upsert_financials_cache(
                    db,
                    t,
                    "dividends",
                    {
                        "periods": [h["year"] for h in history],
                        "amounts": [h["cash_amount"] for h in history],
                    },
                )
                log.info(
                    "[DividendHistory] %s → %d years, streak=%d",
                    t,
                    len(history),
                    result["streak"],
                )

        _history_cache[key] = result
        _history_cache_ts[key] = now
        return result
    finally:
        db.close()

"""
Financials Service
==================
  - Price history:    Yahoo Finance chart API  → OHLCV (NGX tickers use .LG suffix)
  - Earnings history: SOURCE_BASE_URL /financials/?p=quarterly  → Revenue, EPS, Net Income
  - Balance sheet:    SOURCE_BASE_URL /financials/balance-sheet/ → Assets, Liabilities, Equity

SOURCE_BASE_URL is a Next.js app. The /financials/ sub-pages server-render a static
HTML table that BeautifulSoup can parse. The main quote page is JS-only, so we use
Yahoo Finance for price history instead of scraping it.
"""

import logging
import re
import time
from typing import Optional
import requests
from bs4 import BeautifulSoup

from app.config import settings

log = logging.getLogger(__name__)

_cache:    dict = {}
_cache_ts: dict = {}

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

_YAHOO_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept":     "application/json",
}


# ── Price history via Yahoo Finance ──────────────────────────────────────────

def _get_soup(url: str) -> Optional[BeautifulSoup]:
    try:
        r = requests.get(url, headers=_HEADERS, timeout=15)
        r.raise_for_status()
        return BeautifulSoup(r.content, "html.parser")
    except Exception as exc:
        log.warning("[Financials] fetch failed %s: %s", url, exc)
        return None


def _clean_num(text: str) -> Optional[float]:
    """Parse '₦12.3B', '-4.56', '1,234' → float or None."""
    t = text.strip().replace(",", "").replace("₦", "").replace("$", "")
    # Handle magnitude suffixes
    mult = 1.0
    if t.endswith("T"):
        mult, t = 1e12, t[:-1]
    elif t.endswith("B"):
        mult, t = 1e9,  t[:-1]
    elif t.endswith("M"):
        mult, t = 1e6,  t[:-1]
    elif t.endswith("K"):
        mult, t = 1e3,  t[:-1]
    try:
        return float(t) * mult
    except (ValueError, TypeError):
        return None


def _parse_table(soup: BeautifulSoup, row_labels: list[str]) -> dict[str, list]:
    """
    Find the first <table> and extract columns matching row_labels.
    Returns {label: [val1, val2, ...]} ordered oldest→newest,
    plus a special 'periods' key for column headers.
    """
    result: dict[str, list] = {lbl: [] for lbl in row_labels}
    result["periods"] = []

    table = soup.find("table")
    if not table:
        return result

    rows = table.find_all("tr")
    if not rows:
        return result

    # Header row → period labels
    header_cells = rows[0].find_all(["th", "td"])
    periods = [c.get_text(strip=True) for c in header_cells[1:]]  # skip first (row-label col)
    result["periods"] = list(reversed(periods))  # oldest first

    for row in rows[1:]:
        cells = row.find_all(["th", "td"])
        if not cells:
            continue
        label_text = cells[0].get_text(strip=True)
        for target in row_labels:
            # Fuzzy match — label contains the target keyword
            if target.lower() in label_text.lower():
                vals = [_clean_num(c.get_text(strip=True)) for c in cells[1:]]
                result[target] = list(reversed(vals))  # oldest first
                break

    return result


#
# ── Earnings history ──────────────────────────────────────────────────────────

def get_earnings_history(ticker: str) -> Optional[dict]:
    """
    Returns dict:
      {
        "periods":  ["Q1 2022", "Q2 2022", ...],   # up to 8 quarters
        "revenue":  [1.2e9, 1.4e9, ...],
        "eps":      [3.2, 4.1, ...],
        "net_income": [...],
      }
    """
    cache_key = f"earnings:{ticker.upper()}"
    now = time.time()
    if cache_key in _cache and (now - _cache_ts.get(cache_key, 0)) < settings.NGX_PRICE_TTL * 4:
        return _cache[cache_key]

    url  = f"{settings.SOURCE_BASE_URL}/quote/ngx/{ticker.lower()}/financials/?p=quarterly"
    soup = _get_soup(url)
    if not soup:
        return None

    data = _parse_table(soup, ["Revenue", "EPS", "Net Income"])

    # Trim to 8 most-recent quarters
    n = min(8, len(data.get("periods", [])))
    result = {
        "periods":    data["periods"][-n:],
        "revenue":    data.get("Revenue",    [])[-n:],
        "eps":        data.get("EPS",        [])[-n:],
        "net_income": data.get("Net Income", [])[-n:],
    }

    _cache[cache_key]    = result
    _cache_ts[cache_key] = now
    log.info("[Financials] earnings %s → %d quarters", ticker, n)
    return result


# ── Balance sheet trend ───────────────────────────────────────────────────────

def get_balance_sheet(ticker: str) -> Optional[dict]:
    """
    Returns dict:
      {
        "periods":     ["2020", "2021", "2022", "2023"],
        "assets":      [...],
        "liabilities": [...],
        "equity":      [...],
      }
    """
    cache_key = f"balance:{ticker.upper()}"
    now = time.time()
    if cache_key in _cache and (now - _cache_ts.get(cache_key, 0)) < settings.NGX_PRICE_TTL * 4:
        return _cache[cache_key]

    url  = f"{settings.SOURCE_BASE_URL}/quote/ngx/{ticker.lower()}/financials/balance-sheet/"
    soup = _get_soup(url)
    if not soup:
        return None

    data = _parse_table(soup, ["Total Assets", "Total Liabilities", "Shareholders' Equity"])

    # 4 most-recent annual periods
    n = min(4, len(data.get("periods", [])))
    result = {
        "periods":     data["periods"][-n:],
        "assets":      data.get("Total Assets",          [])[-n:],
        "liabilities": data.get("Total Liabilities",     [])[-n:],
        "equity":      data.get("Shareholders' Equity",  [])[-n:],
    }

    _cache[cache_key]    = result
    _cache_ts[cache_key] = now
    log.info("[Financials] balance sheet %s → %d periods", ticker, n)
    return result
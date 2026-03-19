"""
Overview Service
================
Extracts fundamental data and overview metrics from the statistics page.
Data is embedded in a SvelteKit JS blob as {id, value, hover} objects —
the page is JS-rendered so BeautifulSoup sees no tables.
"""

import logging
import re
import time
import requests
from typing import Optional, Dict
from app.config import settings

log = logging.getLogger(__name__)

_overview_cache: Dict = {}
_overview_ts: Dict = {}

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def _parse_hover(hover: str) -> Optional[float]:
    """Convert a hover string like '2,154,563,546,119' or '19.750' or 'n/a' to float."""
    if not hover or hover.strip().lower() in ("n/a", "none", "-", ""):
        return None
    cleaned = hover.replace(",", "").replace("%", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


def _scrape_stats_blob(ticker: str) -> Dict[str, Optional[float]]:
    """
    Fetch /statistics/ and extract all id→hover numeric values
    from the SvelteKit data blob.
    Returns a flat dict: {id_string: float_or_None}
    """
    url = f"{settings.NGX_SOURCE_BASE_URL}/quote/ngx/{ticker.lower()}/statistics/"
    try:
        resp = requests.get(url, headers=_HEADERS, timeout=15)
        resp.raise_for_status()
        text = resp.text
    except Exception as exc:
        log.error("[Stats] fetch failed for %s: %s", ticker, exc)
        return {}

    items = re.findall(
        r'\{id:"(\w+)",title:"[^"]*",value:"[^"]*",hover:"([^"]*)"', text
    )
    return {id_: _parse_hover(hover) for id_, hover in items}


def _scrape_overview(ticker: str) -> Optional[Dict]:
    raw = _scrape_stats_blob(ticker)
    if not raw:
        return None
    return {
        "symbol":        ticker.upper(),
        "market_cap":    raw.get("marketcap"),
        "pe_ratio":      raw.get("pe"),
        "eps":           raw.get("eps"),
        "book_value":    raw.get("bvps"),
        "dividend_yield":raw.get("dividendYield"),
        "roe":           raw.get("roe"),
        "debt_to_equity":raw.get("debtEquity"),
        "current_ratio": raw.get("currentRatio"),
        "gross_margin":  raw.get("grossMargin"),
        "net_margin":    raw.get("profitMargin"),
        "revenue":       raw.get("revenue"),
        "net_income":    raw.get("netinc"),
    }


def get_overview(ticker: str, force_refresh: bool = False) -> Optional[Dict]:
    ticker = ticker.upper()
    now = time.time()
    if not force_refresh and ticker in _overview_cache:
        if (now - _overview_ts.get(ticker, 0)) < settings.NGX_PRICE_TTL:
            return _overview_cache[ticker]
    overview = _scrape_overview(ticker)
    if overview:
        _overview_cache[ticker] = overview
        _overview_ts[ticker] = now
    return overview


def get_overviews(tickers: list) -> Dict[str, Optional[Dict]]:
    return {ticker: get_overview(ticker) for ticker in tickers}


def clear_cache(ticker: Optional[str] = None):
    global _overview_cache, _overview_ts
    if ticker:
        _overview_cache.pop(ticker.upper(), None)
        _overview_ts.pop(ticker.upper(), None)
    else:
        _overview_cache.clear()
        _overview_ts.clear()

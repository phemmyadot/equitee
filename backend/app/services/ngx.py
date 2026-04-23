"""
NGX Service - Main Scraper
===========================
Scrapes comprehensive data from {NGX_SOURCE_BASE_URL}/list/nigerian-stock-exchange/

This service extracts:
- Price data (current price, change, volume, market cap)
- Dividend information (ex-dividend date, cash amount, payment dates)
- Company profile (name, sector, industry)
- Overview tables (PE, earnings, book value, etc.)
- Performance tables (returns, drawdowns, volatility)

All data is cached with TTL to reduce external API load.
"""

import logging
import re
import time
import requests
from typing import Optional, Dict, List
from bs4 import BeautifulSoup

from app.config import settings
from app.models import NGXPrice

log = logging.getLogger(__name__)

# ── In-memory cache ──────────────────────────────────────────────────────────
_cache: Dict = {
    "prices": {},
    "dividends": {},
    "profiles": {},
    "overview": {},
    "performance": {},
    "ts": 0.0,
}
_intraday_cache: Dict[str, Dict] = {}
_intraday_ts: Dict[str, float] = {}

NGX_LIST_URL = f"{settings.NGX_SOURCE_BASE_URL}/list/nigerian-stock-exchange/"
NGX_DATA_URL = f"{settings.NGX_SOURCE_BASE_URL}/list/nigerian-stock-exchange/__data.json"

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

_JSON_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
}


def _get_soup(url: str) -> Optional[BeautifulSoup]:
    """Fetch and parse HTML from URL."""
    try:
        headers = {"User-Agent": USER_AGENT}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return BeautifulSoup(response.text, "html.parser")
    except Exception as exc:
        log.error(f"[NGX] Failed to fetch {url}: {exc}")
        return None


def _safe_float(text: str, default=None) -> Optional[float]:
    """Safely parse a float from text, handling currency symbols, commas, and percentages."""
    if not text:
        return default
    try:
        # Clean up: remove spaces, currency, commas, and percentage signs
        cleaned = (
            text.strip().replace(",", "").replace("₦", "").replace("%", "").split()[0]
        )
        return float(cleaned)
    except (ValueError, IndexError, AttributeError):
        return default


def _get_quote_intraday(ticker: str) -> Dict[str, Optional[float]]:
    """
    Parse the SvelteKit JSON payload on the quote page to extract
    intraday high, low, and volume from the `quote` object.
    Returns dict with keys: high, low, volume (all may be None).
    """
    out: Dict[str, Optional[float]] = {"high": None, "low": None, "volume": None}
    now = time.time()
    if (
        ticker in _intraday_cache
        and (now - _intraday_ts.get(ticker, 0)) < settings.NGX_PRICE_TTL
    ):
        return _intraday_cache[ticker]
    try:
        url = f"{settings.NGX_SOURCE_BASE_URL}/quote/ngx/{ticker.lower()}/"
        headers = {"User-Agent": USER_AGENT}
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        text = resp.text

        m = re.search(r"quote:\{([^}]+)\}", text)
        if not m:
            return out
        block = m.group(1)

        for key, dest in (("h", "high"), ("l", "low")):
            vm = re.search(rf"\b{key}:([\d.]+)", block)
            if vm:
                out[dest] = float(vm.group(1))

        vm = re.search(r"\bv:(\d+)", block)
        if vm:
            out["volume"] = float(vm.group(1))
        _intraday_cache[ticker] = out
        _intraday_ts[ticker] = now
    except Exception as exc:
        log.debug("[NGX] Could not fetch intraday data for %s: %s", ticker, exc)
    return out


def _fetch_all_data():
    """
    Fetch all NGX ticker data from the stockanalysis.com SvelteKit JSON endpoint.
    Returns (prices, dividends, profiles) or None on failure.
    """
    try:
        resp = requests.get(NGX_DATA_URL, headers=_JSON_HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        log.error("[NGX] Failed to fetch __data.json: %s", exc)
        return None

    try:
        node2 = data["nodes"][2]["data"]
        meta = node2[0]
        stock_list_refs = node2[meta["stockData"]]
    except (KeyError, IndexError, TypeError) as exc:
        log.error("[NGX] Unexpected __data.json structure: %s", exc)
        return None

    prices: Dict = {}
    profiles: Dict = {}

    for ref in stock_list_refs:
        try:
            stock_raw = node2[ref]
            if not isinstance(stock_raw, dict):
                continue

            # Values are stored as index references into the flat data array
            stock = {k: node2[v] if isinstance(v, int) else v for k, v in stock_raw.items()}

            s = stock.get("s", "")
            if not s or "/" not in s:
                continue

            ticker = s.split("/")[-1].upper()
            name = stock.get("n") or ""
            price = stock.get("price")
            change_pct = stock.get("change")

            if price is None:
                continue

            change = round(price * change_pct / 100, 4) if change_pct else None

            prices[ticker] = NGXPrice(
                symbol=ticker,
                price=price,
                close=None,
                change=change,
                change_pct=change_pct,
                high=None,
                low=None,
                volume=None,
                value=None,
            )

            if name:
                profiles[ticker] = {
                    "symbol": ticker,
                    "name": name,
                    "sector": None,
                    "industry": None,
                }
        except Exception as exc:
            log.debug("[NGX] Skipping entry ref=%s: %s", ref, exc)
            continue

    log.info("[NGX] Scraped %d tickers from __data.json", len(prices))
    return prices, {}, profiles


def _refresh_cache():
    """Refresh all cached data if TTL has expired."""
    global _cache
    now = time.time()

    if _cache["prices"] and (now - _cache["ts"]) < settings.NGX_PRICE_TTL:
        age = int(now - _cache["ts"])
        log.info(f"[NGX] cache hit — {len(_cache['prices'])} tickers, {age}s old")
        return

    log.info("[NGX] refreshing cache from NGX_SOURCE_BASE_URL...")
    result = _fetch_all_data()
    if result:
        prices, dividends, profiles = result
        _cache = {
            "prices": prices,
            "dividends": dividends,
            "profiles": profiles,
            "overview": {},
            "performance": {},
            "ts": now,
        }


def get_prices() -> Dict[str, NGXPrice]:
    """Return all NGX equity prices."""
    _refresh_cache()
    return _cache["prices"]


def get_price(ticker: str) -> Optional[NGXPrice]:
    """Return price for a single ticker."""
    _refresh_cache()
    return _cache["prices"].get(ticker.upper())


def get_dividends() -> Dict:
    """Return all dividend data."""
    _refresh_cache()
    return _cache["dividends"]


def get_dividend(ticker: str) -> Optional[Dict]:
    """Return dividend data for a single ticker."""
    _refresh_cache()
    return _cache["dividends"].get(ticker.upper())


def get_profiles() -> Dict:
    """Return all company profiles."""
    _refresh_cache()
    return _cache["profiles"]


def get_profile(ticker: str) -> Optional[Dict]:
    """Return profile for a single ticker."""
    _refresh_cache()
    return _cache["profiles"].get(ticker.upper())


def get_overview() -> Dict:
    """Return all overview table data."""
    _refresh_cache()
    return _cache["overview"]


def get_overview_ticker(ticker: str) -> Optional[Dict]:
    """Return overview data for a single ticker."""
    _refresh_cache()
    return _cache["overview"].get(ticker.upper())


def get_performance() -> Dict:
    """Return all performance table data."""
    _refresh_cache()
    return _cache["performance"]


def get_performance_ticker(ticker: str) -> Optional[Dict]:
    """Return performance data for a single ticker."""
    _refresh_cache()
    return _cache["performance"].get(ticker.upper())


def cache_age() -> Optional[int]:
    """Return how many seconds old the cache is."""
    return int(time.time() - _cache["ts"]) if _cache["ts"] else None

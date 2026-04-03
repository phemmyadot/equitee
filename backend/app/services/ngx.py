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

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"


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
    Scrape the NGX list page and extract all price data.
    Intelligently detects columns: ticker, name, price, change, change%, volume
    """
    soup = _get_soup(NGX_LIST_URL)
    if not soup:
        return

    # Find the main data table
    table = soup.find("table")
    if not table:
        log.error("[NGX] No table found on list page")
        return

    prices = {}
    dividends = {}
    profiles = {}

    rows = table.find_all("tr")[1:]  # Skip header row
    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 5:
            continue

        try:
            # Actual table structure from NGX_SOURCE_BASE_URL:
            # [0] No. [1] Symbol(link) [2] Company Name [3] Market Cap [4] Stock Price [5] % Change [6] Revenue

            # Extract ticker from column 1 (contains link)
            ticker_cell = cells[1]
            ticker_link = ticker_cell.find("a")
            if not ticker_link:
                continue

            ticker = ticker_link.text.strip().upper()
            company_name = cells[2].text.strip() if len(cells) > 2 else ""

            # Direct column mapping (no "smart detection" needed - we know the structure)
            price = _safe_float(cells[4].text) if len(cells) > 4 else None

            # % Change is in column 5
            change_pct = None
            if len(cells) > 5:
                text = cells[5].text.strip()
                if text and text != "-":  # Table uses "-" for no data
                    change_pct = _safe_float(text)

            # Calculate change from price and change_pct if needed
            change = None
            if price and change_pct is not None:
                change = (price * change_pct) / 100

            # Volume comes from individual ticker pages (lazy loaded on first request)
            volume = None

            # Store price data with all available fields
            if ticker and price is not None:
                prices[ticker] = NGXPrice(
                    symbol=ticker,
                    price=price,
                    close=None,  # Not available from list page
                    change=change,
                    change_pct=change_pct,
                    high=None,
                    low=None,
                    volume=volume,
                    value=None,
                )

            # Store profile data
            if ticker and company_name:
                profiles[ticker] = {
                    "symbol": ticker,
                    "name": company_name,
                    "sector": None,
                    "industry": None,
                }

        except Exception as e:
            log.warning(f"[NGX] Error parsing row: {e}")
            continue

    log.info(f"[NGX] Scraped {len(prices)} tickers from list page")
    return prices, dividends, profiles


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


def enrich_with_volumes(tickers: List[str]) -> Dict[str, NGXPrice]:
    """
    Return prices for specific tickers with volume data fetched from individual pages.
    Intraday requests are fired in parallel via a thread pool.
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    _refresh_cache()
    tickers = [t.upper() for t in tickers]

    # Only enrich tickers that are actually in the price cache
    valid = [t for t in tickers if t in _cache["prices"]]
    if not valid:
        return {}

    def _fetch(ticker: str):
        return ticker, _get_quote_intraday(ticker)

    intraday_map: Dict[str, Dict] = {}
    with ThreadPoolExecutor(max_workers=min(len(valid), 10)) as ex:
        futures = {ex.submit(_fetch, t): t for t in valid}
        for future in as_completed(futures):
            try:
                t, data = future.result()
                intraday_map[t] = data
            except Exception:
                intraday_map[futures[future]] = {}

    prices = {}
    for ticker in valid:
        price_obj = _cache["prices"][ticker]
        intraday = intraday_map.get(ticker, {})
        prices[ticker] = NGXPrice(
            symbol=price_obj.symbol,
            price=price_obj.price,
            close=price_obj.close,
            change=price_obj.change,
            change_pct=price_obj.change_pct,
            high=intraday.get("high") or price_obj.high,
            low=intraday.get("low") or price_obj.low,
            volume=intraday.get("volume") or price_obj.volume,
            value=price_obj.value,
        )

    return prices

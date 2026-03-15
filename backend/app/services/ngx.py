"""
NGX Service - Main Scraper
===========================
Scrapes comprehensive data from https://stockanalysis.com/list/nigerian-stock-exchange/

This service extracts:
- Price data (current price, change, volume, market cap)
- Dividend information (ex-dividend date, cash amount, payment dates)
- Company profile (name, sector, industry)
- Overview tables (PE, earnings, book value, etc.)
- Performance tables (returns, drawdowns, volatility)

All data is cached with TTL to reduce external API load.
"""

import logging
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

NGX_LIST_URL = f"{settings.SOURCE_BASE_URL}/list/nigerian-stock-exchange/"

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"


def _get_soup(url: str) -> Optional[BeautifulSoup]:
    """Fetch and parse HTML from URL."""
    try:
        headers = {"User-Agent": USER_AGENT}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return BeautifulSoup(response.content, "html.parser")
    except Exception as exc:
        log.error(f"[NGX] Failed to fetch {url}: {exc}")
        return None


def _safe_float(text: str, default=None) -> Optional[float]:
    """Safely parse a float from text, handling currency symbols, commas, and percentages."""
    if not text:
        return default
    try:
        # Clean up: remove spaces, currency, commas, and percentage signs
        cleaned = text.strip().replace(",", "").replace("₦", "").replace("%", "").split()[0]
        return float(cleaned)
    except (ValueError, IndexError, AttributeError):
        return default


def _get_volume_for_ticker(ticker: str) -> Optional[float]:
    """Fetch volume from individual ticker page."""
    try:
        url = f"{settings.SOURCE_BASE_URL}/quote/ngx/{ticker.lower()}/"
        soup = _get_soup(url)
        if not soup:
            return None
        
        # Find the table with Volume data
        tables = soup.find_all("table")
        for table in tables:
            rows = table.find_all("tr")
            if not rows:
                continue
            
            # Check if this is the volume table (first cell contains "Volume")
            for row in rows:
                cells = row.find_all(["td", "th"])
                if len(cells) >= 2:
                    label = cells[0].get_text(strip=True)
                    if label == "Volume":
                        # Found it - extract the volume value
                        value = cells[1].get_text(strip=True)
                        return _safe_float(value)
        
        return None
    except Exception as exc:
        log.debug(f"[NGX] Could not fetch volume for {ticker}: {exc}")
        return None


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
            # Actual table structure from stockanalysis.com:
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

    log.info("[NGX] refreshing cache from stockanalysis.com...")
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
    This is for portfolio holdings only (not all 143 tickers) to avoid excessive requests.
    """
    _refresh_cache()
    prices = {}
    
    for ticker in tickers:
        ticker = ticker.upper()
        price_obj = _cache["prices"].get(ticker)
        
        if price_obj:
            # Fetch volume from individual ticker page
            volume = _get_volume_for_ticker(ticker)
            
            # Create new NGXPrice with volume
            enriched = NGXPrice(
                symbol=price_obj.symbol,
                price=price_obj.price,
                close=price_obj.close,
                change=price_obj.change,
                change_pct=price_obj.change_pct,
                high=price_obj.high,
                low=price_obj.low,
                volume=volume,  # ← Fetched from individual page
                value=price_obj.value,
            )
            prices[ticker] = enriched
    
    return prices
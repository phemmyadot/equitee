"""
Overview Service
================
Extracts fundamental data and overview metrics from NGX_SOURCE_BASE_URL

Returns PE ratio, earnings, book value, ROE, dividend yield, market cap, etc.
"""

import logging
import time
import requests
from typing import Optional, Dict
from bs4 import BeautifulSoup
from app.config import settings

log = logging.getLogger(__name__)

# ── Cache for overview data ──────────────────────────────────────────────────
_overview_cache: Dict = {}
_overview_ts: Dict = {}

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"


def _get_soup(url: str) -> Optional[BeautifulSoup]:
    """Fetch and parse HTML from URL."""
    try:
        headers = {"User-Agent": USER_AGENT}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return BeautifulSoup(response.text, "html.parser")
    except Exception as exc:
        log.error(f"[Overview] Failed to fetch {url}: {exc}")
        return None


def _scrape_overview(ticker: str) -> Optional[Dict]:
    """Scrape fundamental data from the statistics page."""
    url = f"{settings.NGX_SOURCE_BASE_URL}/quote/ngx/{ticker.lower()}/statistics/"
    
    soup = _get_soup(url)
    if not soup:
        return None

    overview = {
        "symbol": ticker.upper(),
        "market_cap": None,
        "pe_ratio": None,
        "eps": None,
        "book_value": None,
        "dividend_yield": None,
        "roe": None,
        "debt_to_equity": None,
        "current_ratio": None,
        "gross_margin": None,
        "net_margin": None,
        "earnings_growth": None,
        "revenue": None,
        "net_income": None,
    }

    # Extract data from all tables on statistics page
    tables = soup.find_all("table")
    for table in tables:
        rows = table.find_all("tr")
        for row in rows:
            cols = row.find_all(["td", "th"])
            if len(cols) >= 2:
                label = cols[0].get_text(strip=True).lower()
                value_text = cols[1].get_text(strip=True)
                
                # Try to parse numeric value
                try:
                    value = value_text.replace("%", "").replace(",", "").replace("T", "").replace("B", "").replace("M", "").strip()
                    value = float(value) if value and value not in ['n/a', '-', 'none'] else None
                except (ValueError, AttributeError):
                    value = None
                
                # Map labels to overview fields (fundamentals)
                if "market cap" in label:
                    overview["market_cap"] = value
                elif "pe ratio" in label and "forward" not in label:
                    overview["pe_ratio"] = value
                elif "eps" in label and "forward" not in label:
                    overview["eps"] = value
                elif "pb ratio" in label or "price to book" in label:
                    overview["book_value"] = value
                elif "dividend" in label and "yield" in label:
                    overview["dividend_yield"] = value
                elif "roe" in label or "return on equity" in label:
                    overview["roe"] = value
                elif "debt" in label and "equity" in label:
                    overview["debt_to_equity"] = value
                elif "current ratio" in label:
                    overview["current_ratio"] = value
                elif "gross margin" in label or "gross profit margin" in label:
                    overview["gross_margin"] = value
                elif "profit margin" in label or ("margin" in label and "net" in label):
                    overview["net_margin"] = value
                elif "revenue" in label and "per" not in label and "growth" not in label:
                    overview["revenue"] = value
                elif "net income" in label and "growth" not in label:
                    overview["net_income"] = value

    log.info(f"[Overview] Scraped overview for {ticker}")
    return overview


def get_overview(ticker: str, force_refresh: bool = False) -> Optional[Dict]:
    """
    Get cached overview data for a ticker, or fetch if cache is expired.
    
    Args:
        ticker: Stock ticker symbol
        force_refresh: Skip cache and fetch fresh data
    
    Returns:
        Dict with overview data or None if fetch fails
    """
    ticker = ticker.upper()
    now = time.time()
    
    # Check cache
    if not force_refresh and ticker in _overview_cache:
        cache_time = _overview_ts.get(ticker, 0)
        if (now - cache_time) < settings.NGX_PRICE_TTL:
            log.info(f"[Overview] cache hit for {ticker}")
            return _overview_cache[ticker]
    
    # Fetch fresh data
    overview = _scrape_overview(ticker)
    if overview:
        _overview_cache[ticker] = overview
        _overview_ts[ticker] = now
    
    return overview


def get_overviews(tickers: list) -> Dict[str, Optional[Dict]]:
    """Get overview data for multiple tickers."""
    return {ticker: get_overview(ticker) for ticker in tickers}


def clear_cache(ticker: Optional[str] = None):
    """Clear overview cache for a ticker or all tickers."""
    global _overview_cache, _overview_ts
    if ticker:
        ticker = ticker.upper()
        _overview_cache.pop(ticker, None)
        _overview_ts.pop(ticker, None)
    else:
        _overview_cache.clear()
        _overview_ts.clear()

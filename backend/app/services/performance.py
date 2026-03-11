"""
Overview Service
================
Extracts fundamental data and overview metrics from stockanalysis.com

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
        return BeautifulSoup(response.content, "html.parser")
    except Exception as exc:
        log.error(f"[Overview] Failed to fetch {url}: {exc}")
        return None


def _scrape_overview(ticker: str) -> Optional[Dict]:
    """Scrape overview/fundamental data for a single ticker."""
    url = f"https://stockanalysis.com/quote/ngx/{ticker.lower()}/"
    
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

    # Look for overview/metrics tables
    tables = soup.find_all("table")
    for table in tables:
        rows = table.find_all("tr")
        for row in rows:
            cols = row.find_all("td")
            if len(cols) >= 2:
                label = cols[0].text.strip().lower()
                value_text = cols[1].text.strip()
                
                # Try to parse numeric value
                try:
                    # Remove common suffixes
                    value = value_text.replace("%", "").replace("B", "").replace("M", "").replace(",", "").strip()
                    value = float(value) if value else None
                except (ValueError, AttributeError):
                    value = value_text
                
                # Map labels to fields
                if "market cap" in label or "market capitalization" in label:
                    overview["market_cap"] = value
                elif "pe ratio" in label:
                    overview["pe_ratio"] = value
                elif "eps" in label or "earnings per share" in label:
                    overview["eps"] = value
                elif "book value" in label:
                    overview["book_value"] = value
                elif "dividend yield" in label:
                    overview["dividend_yield"] = value
                elif "roe" in label or "return on equity" in label:
                    overview["roe"] = value
                elif "debt" in label and "equity" in label:
                    overview["debt_to_equity"] = value

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

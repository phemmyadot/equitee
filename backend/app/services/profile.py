"""
Profile Service
===============
Extracts company profile information from stockanalysis.com

Returns company name, sector, industry, headquarters, description, etc.
"""

import logging
import time
import requests
from typing import Optional, Dict
from bs4 import BeautifulSoup
from app.config import settings

log = logging.getLogger(__name__)

# ── Cache for profiles ────────────────────────────────────────────────────────
_profile_cache: Dict = {}
_profile_ts: Dict = {}

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"


def _get_soup(url: str) -> Optional[BeautifulSoup]:
    """Fetch and parse HTML from URL."""
    try:
        headers = {"User-Agent": USER_AGENT}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return BeautifulSoup(response.content, "html.parser")
    except Exception as exc:
        log.error(f"[Profile] Failed to fetch {url}: {exc}")
        return None


def _scrape_profile(ticker: str) -> Optional[Dict]:
    """Scrape profile data for a single ticker from stockanalysis.com"""
    url = f"https://stockanalysis.com/quote/ngx/{ticker.lower()}/"
    
    soup = _get_soup(url)
    if not soup:
        return None

    profile = {
        "symbol": ticker.upper(),
        "name": None,
        "sector": None,
        "industry": None,
        "website": None,
        "description": None,
        "headquarters": None,
        "founded": None,
        "employees": None,
    }

    # Try to extract company name from page title or heading
    title = soup.find("h1")
    if title:
        profile["name"] = title.text.strip()

    # Look for info boxes or details sections
    info_items = soup.find_all("div", class_="info-item") or soup.find_all("li", class_="info")
    for item in info_items:
        text = item.text.strip().lower()
        value = None
        
        # Try to find the corresponding value
        value_elem = item.find("span", class_="info-value") or item.find("span", class_="value")
        if value_elem:
            value = value_elem.text.strip()
        
        if "sector" in text:
            profile["sector"] = value
        elif "industry" in text:
            profile["industry"] = value
        elif "website" in text or "homepage" in text:
            link = item.find("a")
            if link:
                profile["website"] = link.get("href")

    log.info(f"[Profile] Scraped profile for {ticker}")
    return profile


def get_profile(ticker: str, force_refresh: bool = False) -> Optional[Dict]:
    """
    Get cached profile for a ticker, or fetch if cache is expired.
    
    Args:
        ticker: Stock ticker symbol
        force_refresh: Skip cache and fetch fresh data
    
    Returns:
        Dict with profile data or None if fetch fails
    """
    ticker = ticker.upper()
    now = time.time()
    
    # Check cache
    if not force_refresh and ticker in _profile_cache:
        cache_time = _profile_ts.get(ticker, 0)
        if (now - cache_time) < settings.NGX_PRICE_TTL:
            log.info(f"[Profile] cache hit for {ticker}")
            return _profile_cache[ticker]
    
    # Fetch fresh data
    profile = _scrape_profile(ticker)
    if profile:
        _profile_cache[ticker] = profile
        _profile_ts[ticker] = now
    
    return profile


def get_profiles(tickers: list) -> Dict[str, Optional[Dict]]:
    """Get profiles for multiple tickers."""
    return {ticker: get_profile(ticker) for ticker in tickers}


def clear_cache(ticker: Optional[str] = None):
    """Clear profile cache for a ticker or all tickers."""
    global _profile_cache, _profile_ts
    if ticker:
        ticker = ticker.upper()
        _profile_cache.pop(ticker, None)
        _profile_ts.pop(ticker, None)
    else:
        _profile_cache.clear()
        _profile_ts.clear()

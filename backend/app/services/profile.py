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
    """Scrape profile data from the company page"""
    url = f"https://stockanalysis.com/quote/ngx/{ticker.lower()}/company/"
    
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

    # Extract data from tables on the company page
    tables = soup.find_all("table")
    for table in tables:
        rows = table.find_all("tr")
        for row in rows:
            cols = row.find_all(["td", "th"])
            if len(cols) >= 2:
                label = cols[0].get_text(strip=True).lower()
                value = cols[1].get_text(strip=True)
                
                # Map table cells to profile fields
                if "industry" in label:
                    profile["industry"] = value
                elif "founded" in label or "incorporated" in label:
                    profile["founded"] = value
                elif "employees" in label:
                    profile["employees"] = value
                elif "website" in label or "homepage" in label:
                    # Check if there's a link
                    link = cols[1].find("a")
                    if link:
                        profile["website"] = link.get("href")
                    else:
                        profile["website"] = value
                elif "hq" in label or "headquarters" in label:
                    profile["headquarters"] = value

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

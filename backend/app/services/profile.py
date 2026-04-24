"""
Profile Service
===============
Extracts company profile information from NGX_SOURCE_BASE_URL

Returns company name, sector, industry, headquarters, description, etc.
"""

import logging
import requests
from typing import Optional, Dict
from bs4 import BeautifulSoup
from app.config import settings

log = logging.getLogger(__name__)

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"


def _get_soup(url: str) -> Optional[BeautifulSoup]:
    """Fetch and parse HTML from URL."""
    try:
        headers = {"User-Agent": USER_AGENT}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return BeautifulSoup(response.text, "html.parser")
    except Exception as exc:
        log.error(f"[Profile] Failed to fetch {url}: {exc}")
        return None


def _scrape_profile(ticker: str) -> Optional[Dict]:
    """Scrape profile data from the company page"""
    url = f"{settings.NGX_SOURCE_BASE_URL}/quote/ngx/{ticker.lower()}/company/"

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
        _PAGE_SUFFIXES = (
            " Company Description", " Company Profile", " About",
            " Overview", " Profile", " Description",
        )
        name = title.text.strip()
        for suffix in _PAGE_SUFFIXES:
            if name.endswith(suffix):
                name = name[: -len(suffix)].strip()
                break
        profile["name"] = name

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
                if "sector" in label:
                    profile["sector"] = value
                elif "industry" in label:
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
                elif "description" in label or "about" in label or "overview" in label:
                    profile["description"] = value

    # Fallback: first non-trivial paragraph on the page
    if not profile["description"]:
        for p in soup.find_all("p"):
            text = p.get_text(strip=True)
            if len(text) > 80:
                profile["description"] = text
                break

    log.info(f"[Profile] Scraped profile for {ticker}")
    return profile


def get_profile(ticker: str) -> Optional[Dict]:
    """
    Fetch fresh profile data for a ticker.

    Args:
        ticker: Stock ticker symbol

    Returns:
        Dict with profile data or None if fetch fails
    """
    ticker = ticker.upper()

    # Fetch fresh data
    profile = _scrape_profile(ticker)

    return profile


def get_profiles(tickers: list) -> Dict[str, Optional[Dict]]:
    """Get profiles for multiple tickers."""
    return {ticker: get_profile(ticker) for ticker in tickers}

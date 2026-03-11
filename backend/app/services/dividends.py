"""
NGX Dividend Service
====================
Scrapes dividend data from stockanalysis.com/list/nigerian-stock-exchange/

The list page has a dividend column that shows upcoming dividend info.
Cache TTL: 3600 seconds (1 hour) since dividend data changes infrequently
"""

import logging
import time
import re
from typing import Optional, List
from datetime import datetime

import requests
from bs4 import BeautifulSoup

from app.config import settings
from app.models import DividendInfo

log = logging.getLogger(__name__)

_cache: dict = {"data": {}, "ts": 0.0}
LIST_PAGE_URL = "https://stockanalysis.com/list/nigerian-stock-exchange/"

def _is_currency(text: str) -> bool:
    """Check if text looks like a currency amount"""
    text = text.strip()
    currency_pattern = r'[\$₦]?\s*\d+\.?\d*'
    return bool(re.search(currency_pattern, text))


def _parse_currency_value(text: str) -> Optional[float]:
    """Extract numeric value from currency text like '15.000 NGN'"""
    text = text.strip()
    match = re.search(r'(\d+[\.,]\d+|\d+)', text)
    if match:
        numeric_str = match.group(1).replace(',', '.')
        try:
            return float(numeric_str)
        except ValueError:
            return None
    return None


def _fetch_all_dividends() -> dict[str, Optional[DividendInfo]]:
    """
    Scrape dividend data from the NGX list page.
    Returns dict mapping ticker to DividendInfo (or None if not available).
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        
        response = requests.get(LIST_PAGE_URL, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        tables = soup.find_all('table')
        
        dividends = {}
        
        for table in tables:
            rows = table.find_all('tr')
            if len(rows) < 2:
                continue
            
            # Skip header row
            for row in rows[1:]:
                cells = row.find_all(['td', 'th'])
                if len(cells) < 2:
                    continue
                
                cell_texts = [cell.get_text(strip=True) for cell in cells]
                
                # First cell is usually ticker
                ticker = cell_texts[0] if cell_texts else None
                if not ticker or len(ticker) > 20:  # Filter out invalid tickers
                    continue
                
                # Try to find dividend-related columns
                dividend_info = None
                for i, text in enumerate(cell_texts[1:], 1):
                    if _is_currency(text) and dividend_info is None:
                        # Found a dividend amount, create info object
                        amount = _parse_currency_value(text)
                        if amount:
                            dividend_info = DividendInfo(
                                symbol=ticker,
                                cash_amount=amount,
                                currency="NGN",
                                timestamp=datetime.now().isoformat(),
                            )
                            break
                
                if dividend_info:
                    dividends[ticker] = dividend_info
        
        log.info(f"[Dividends] Found {len(dividends)} tickers with dividend data from list page")
        return dividends
    
    except Exception as exc:
        log.warning(f"[Dividends] Failed to scrape list page: {exc}")
        return {}


def get_dividend(ticker: str) -> Optional[DividendInfo]:
    """
    Get dividend information for a ticker from cache.
    Cache is populated from the list page.
    """
    global _cache
    now = time.time()
    
    # Refresh cache if stale
    if (now - _cache["ts"]) > settings.DIVIDEND_TTL or not _cache["data"]:
        log.info("[Dividends] Refreshing cache from list page")
        _cache["data"] = _fetch_all_dividends()
        _cache["ts"] = now
    
    return _cache["data"].get(ticker.upper())


def _get_tickers_dividends(tickers: list[str]) -> dict[str, Optional[DividendInfo]]:
    """
    Get dividend information for multiple tickers.
    Returns dict mapping ticker to DividendInfo (or None if not found).
    """
    results = {}
    for ticker in tickers:
        results[ticker] = get_dividend(ticker)
    return results


def cache_age() -> Optional[int]:
    """Returns age of cache in seconds, or None if empty"""
    return int(time.time() - _cache["ts"]) if _cache["ts"] else None


def _parse_date_for_sort(date_str: Optional[str]) -> tuple:
    """Parse date string and return sortable tuple (is_future, datetime_obj)"""
    if not date_str:
        return (False, None)
    
    try:
        for fmt in ['%b %d, %Y', '%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d']:
            try:
                dt = datetime.strptime(date_str, fmt)
                is_future = dt > datetime.now()
                return (is_future, dt)
            except ValueError:
                continue
    except:
        pass
    
    return (False, None)


def get_dividends(holdings: List[dict]) -> dict:
    """
    Get dividend summary for portfolio holdings with totals and sorting.
    
    Args:
        holdings: List of dicts with keys: {ticker, name, shares, ...}
    
    Returns:
        {
            "items": [
                {ticker, name, shares, ex_dividend_date, cash_amount, 
                 total_dividend, record_date, pay_date, has_dividend},
                ...
            ],
            "total_expected": float,
            "upcoming_count": int,
            "cache_age": int
        }
    """
    tickers = [h["ticker"] for h in holdings]
    dividends = _get_tickers_dividends(tickers)
    
    rows = []
    total_expected = 0
    upcoming_count = 0
    
    for holding in holdings:
        ticker = holding["ticker"]
        div = dividends.get(ticker)
        shares = holding.get("shares", 0)
        
        has_div = div is not None and div.cash_amount is not None
        if has_div:
            upcoming_count += 1
            total_div = div.cash_amount * shares
            total_expected += total_div
        else:
            total_div = 0
        
        rows.append({
            "ticker": ticker,
            "name": holding.get("name", ""),
            "shares": shares,
            "ex_dividend_date": div.ex_dividend_date if div else None,
            "cash_amount": div.cash_amount if div else None,
            "total_dividend": total_div,
            "record_date": div.record_date if div else None,
            "pay_date": div.pay_date if div else None,
            "has_dividend": has_div,
        })
    
    rows.sort(key=lambda r: (
        not r["has_dividend"],
        _parse_date_for_sort(r["ex_dividend_date"])[1] or datetime.max
    ))
    
    return {
        "items": rows,
        "total_expected": total_expected,
        "upcoming_count": upcoming_count,
        "total_holdings": len(holdings),
        "cache_age": cache_age(),
    }


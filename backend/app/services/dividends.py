"""
Stock Analysis Dividend Scraper Service
========================================
Scrapes upcoming dividend information from SOURCE_BASE_URL

Endpoint:
    {SOURCE_BASE_URL}/quote/ngx/{TICKER}/dividend/
    
Extracts: Ex-Dividend Date, Cash Amount, Record Date, Pay Date
Cache TTL: 3600 seconds (1 hour) since dividend data changes infrequently
"""

import logging
import time
import re
from typing import Optional
from datetime import datetime

try:
    import requests
    from bs4 import BeautifulSoup
    HAS_BEAUTIFULSOUP = True
except ImportError:
    HAS_BEAUTIFULSOUP = False
    import urllib.request

from app.config import settings
from app.models import DividendInfo

log = logging.getLogger(__name__)

_cache: dict = {"data": {}, "ts": 0.0}


def _is_date(text: str) -> bool:
    """Check if text looks like a date (simple heuristic)"""
    text = text.strip()
    # Common date patterns: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Jan 1, 2024, etc.
    date_pattern = r'\d{1,4}[-/]\d{1,2}[-/]\d{1,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}'
    return bool(re.search(date_pattern, text, re.IGNORECASE))


def _is_currency(text: str) -> bool:
    """Check if text looks like a currency amount"""
    text = text.strip()
    # Look for $ or numbers with decimals
    currency_pattern = r'[\$₦]?\s*\d+\.?\d*'
    return bool(re.search(currency_pattern, text))


def _parse_currency_value(text: str) -> Optional[float]:
    """Extract numeric value from currency text like '15.000 NGN'"""
    text = text.strip()
    # Extract just the numeric part, ignoring currency symbols/codes (handles 15.000, 15,000, 15000, etc.)
    match = re.search(r'(\d+[\.,]\d+|\d+)', text)
    if match:
        numeric_str = match.group(1).replace(',', '.')  # Normalize comma to dot
        try:
            return float(numeric_str)
        except ValueError:
            return None
    return None


def _fetch_dividend_beautifulsoup(ticker: str) -> Optional[DividendInfo]:
    """
    Scrape upcoming dividend information using BeautifulSoup.
    Returns the most recent dividend information.
    First row = header, second row = latest dividend data.
    """
    url = f"{settings.SOURCE_BASE_URL}/quote/ngx/{ticker}/dividend/"
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        tables = soup.find_all('table')
        
        for table in tables:
            rows = table.find_all('tr')
            
            # Need at least header row + 1 data row
            if len(rows) < 2:
                continue
            
            # Skip header row (row 0), process first data row (row 1)
            row = rows[1]
            cells = row.find_all(['td', 'th'])
            
            if len(cells) < 4:
                continue
            
            cell_texts = [cell.get_text(strip=True) for cell in cells]
            # Extract dividend fields by column index
            # Table structure: [Ex-Dividend Date, Cash Amount, Record Date, Pay Date]
            ex_div_date = cell_texts[0] if _is_date(cell_texts[0]) else None
            cash_amount = _parse_currency_value(cell_texts[1]) if _is_currency(cell_texts[1]) else None
            record_date = cell_texts[2] if _is_date(cell_texts[2]) else None
            pay_date = cell_texts[3] if _is_date(cell_texts[3]) else None
            # If we found a complete dividend record, return it
            if all([ex_div_date, pay_date, record_date, cash_amount]):
                return DividendInfo(
                    symbol=ticker,
                    ex_dividend_date=ex_div_date,
                    record_date=record_date,
                    pay_date=pay_date,
                    cash_amount=cash_amount,
                    currency="NGN",
                    timestamp=datetime.now().isoformat(),
                )
        
        log.warning(f"[Dividends] {ticker}: could not extract dividend data from table")
        return None

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            log.debug(f"[Dividends] {ticker}: not found (404)")
        else:
            log.warning(f"[Dividends] {ticker} HTTP error {e.response.status_code}")
        return None
    except Exception as exc:
        log.warning(f"[Dividends] {ticker} failed: {exc}")
        return None


def _fetch_dividend_urllib(ticker: str) -> Optional[DividendInfo]:
    """
    Scrape upcoming dividend information using urllib (fallback).
    Returns the most recent dividend information.
    """
    url = f"{settings.SOURCE_BASE_URL}/quote/ngx/{ticker}/dividend/"
    
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    })
    
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode("utf-8", errors="ignore")
        
        # Simple HTML parsing with regex
        # Look for table data
        rows_match = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.DOTALL | re.IGNORECASE)
        
        for row_html in rows_match:
            cells = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row_html, re.DOTALL | re.IGNORECASE)
            cell_texts = [re.sub(r'<[^>]+>', '', cell).strip() for cell in cells]
            
            if len(cell_texts) < 4:
                continue
            
            ex_div_date = None
            cash_amount = None
            record_date = None
            pay_date = None
            
            for text in cell_texts:
                if _is_date(text) and not ex_div_date:
                    ex_div_date = text
                elif _is_currency(text) and not cash_amount:
                    cash_amount = _parse_currency_value(text)
                elif _is_date(text) and ex_div_date and not record_date:
                    record_date = text
                elif _is_date(text) and ex_div_date and record_date and not pay_date:
                    pay_date = text
            
            if all([ex_div_date, pay_date, record_date, cash_amount]):
                return DividendInfo(
                    symbol=ticker,
                    ex_dividend_date=ex_div_date,
                    record_date=record_date,
                    pay_date=pay_date,
                    cash_amount=cash_amount,
                    currency="NGN",
                    timestamp=datetime.now().isoformat(),
                )
        
        log.warning(f"[Dividends] {ticker}: could not extract dividend data")
        return None

    except urllib.error.HTTPError as e:
        if e.code == 404:
            log.debug(f"[Dividends] {ticker}: not found (404)")
        else:
            log.warning(f"[Dividends] {ticker} HTTP error {e.code}")
        return None
    except Exception as exc:
        log.warning(f"[Dividends] {ticker} failed: {exc}")
        return None


def _fetch_dividend(ticker: str) -> Optional[DividendInfo]:
    """
    Scrape upcoming dividend information from SOURCE_BASE_URL
    Uses BeautifulSoup if available, falls back to urllib/regex.
    """
    if HAS_BEAUTIFULSOUP:
        return _fetch_dividend_beautifulsoup(ticker)
    else:
        return _fetch_dividend_urllib(ticker)


def get_dividend(ticker: str) -> Optional[DividendInfo]:
    """
    Get upcoming dividend information for a ticker.
    Uses cache with configurable TTL.
    """
    global _cache
    now = time.time()
    
    # Check if we have cached data and it's not stale
    if (ticker in _cache["data"] and 
        (now - _cache["ts"]) < settings.DIVIDEND_TTL):
        return _cache["data"].get(ticker)
    
    # Fetch fresh data
    log.info(f"[Dividends] fetching {ticker}")
    result = _fetch_dividend(ticker)
    
    if result:
        _cache["data"][ticker] = result
        _cache["ts"] = now
        log.info(f"[Dividends] {ticker} → {result.cash_amount} {result.currency} (ex: {result.ex_dividend_date})")
    else:
        # Cache the absence to avoid hammering the site
        _cache["data"][ticker] = None
        _cache["ts"] = now
    
    return result


def get_dividends(tickers: list[str]) -> dict[str, Optional[DividendInfo]]:
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


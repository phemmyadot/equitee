"""
Performance Service
===================
Extracts historical performance and volatility metrics from stockanalysis.com

Returns returns over various periods, volatility, sharpe ratio, max drawdown, etc.
"""

import logging
import time
import requests
from typing import Optional, Dict
from bs4 import BeautifulSoup
from app.config import settings

log = logging.getLogger(__name__)

# ── Cache for performance data ───────────────────────────────────────────────
_performance_cache: Dict = {}
_performance_ts: Dict = {}

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"


def _get_soup(url: str) -> Optional[BeautifulSoup]:
    """Fetch and parse HTML from URL."""
    try:
        headers = {"User-Agent": USER_AGENT}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return BeautifulSoup(response.content, "html.parser")
    except Exception as exc:
        log.error(f"[Performance] Failed to fetch {url}: {exc}")
        return None


def _scrape_performance(ticker: str) -> Optional[Dict]:
    """Scrape performance and valuation metrics from the statistics page."""
    url = f"https://stockanalysis.com/quote/ngx/{ticker.lower()}/statistics/"
    
    soup = _get_soup(url)
    if not soup:
        return None

    performance = {
        "symbol": ticker.upper(),
        # Price Returns (Phase 1-2)
        "return_1d": None,
        "return_1w": None,
        "return_1m": None,
        "return_3m": None,
        "return_6m": None,
        "return_1y": None,
        "return_ytd": None,
        "volatility": None,
        "sharpe_ratio": None,
        "max_drawdown": None,
        "beta": None,
        "correlation_market": None,
        # 52-Week Price Data (Phase 4)
        "week_52_high": None,
        "week_52_low": None,
        "week_52_change": None,
        # Profitability & Returns (Phase 1-2)
        "operating_margin": None,
        "ebitda_margin": None,
        "fcf_margin": None,
        "pretax_margin": None,
        "roa": None,
        "roic": None,
        "roce": None,
        # Cash Flow (Phase 1-2)
        "free_cash_flow": None,
        "fcf_per_share": None,
        "operating_cash_flow": None,
        "capex": None,
        "fcf_yield": None,
        # Valuation (Phase 1-2)
        "ev_ebitda": None,
        "ev_fcf": None,
        "price_to_book": None,
        "price_to_sales": None,
        # Financial Health (Phase 1-2)
        "interest_coverage": None,
        "debt_ebitda": None,
        "quick_ratio": None,
        "net_debt": None,
        "asset_turnover": None,
        # Growth Metrics (Phase 4)
        "revenue_growth_yoy": None,
        "earnings_growth_yoy": None,
        "fcf_growth_yoy": None,
        "dividend_growth_yoy": None,
        # Quality Scores (Phase 5)
        "piotroski_score": None,
        "altman_zscore": None,
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
                    value = value_text.replace("%", "").replace(",", "").strip()
                    value = float(value) if value and value not in ['n/a', '-', 'none'] else None
                except (ValueError, AttributeError):
                    value = None
                
                # Map labels to performance fields
                if "1 day" in label or "1d return" in label or "1d%" in label:
                    performance["return_1d"] = value
                elif "1 week" in label or "1w" in label or "1w return" in label:
                    performance["return_1w"] = value
                elif "1 month" in label or "1m" in label or "1m return" in label:
                    performance["return_1m"] = value
                elif "3 month" in label or "3m" in label:
                    performance["return_3m"] = value
                elif "6 month" in label or "6m" in label:
                    performance["return_6m"] = value
                elif "1 year" in label or "1y" in label or "1y return" in label or "52-week" in label:
                    # Use 52-week price change as proxy for 1-year return
                    performance["return_1y"] = value
                elif "year to date" in label or "ytd" in label:
                    performance["return_ytd"] = value
                elif "volatility" in label:
                    performance["volatility"] = value
                elif "sharpe" in label:
                    performance["sharpe_ratio"] = value
                elif "max drawdown" in label or "maximum drawdown" in label:
                    performance["max_drawdown"] = value
                elif "beta" in label and "correlation" not in label:
                    performance["beta"] = value
                elif "correlation" in label:
                    performance["correlation_market"] = value
                # Margin metrics
                elif "operating margin" in label or "operating margin %" in label or "ebit margin" in label:
                    performance["operating_margin"] = value
                elif "ebitda margin" in label:
                    performance["ebitda_margin"] = value
                elif "fcf margin" in label or "free cash flow margin" in label:
                    performance["fcf_margin"] = value
                elif "pretax margin" in label or "pretax income margin" in label:
                    performance["pretax_margin"] = value
                # Efficiency metrics
                elif "return on assets" in label or "roa" in label:
                    performance["roa"] = value
                elif "return on invested capital" in label or "roic" in label:
                    performance["roic"] = value
                elif "return on capital employed" in label or "roce" in label:
                    performance["roce"] = value
                elif "asset turnover" in label:
                    performance["asset_turnover"] = value
                # Cash flow metrics
                elif "free cash flow" in label and "margin" not in label and "yield" not in label and "per share" not in label:
                    performance["free_cash_flow"] = value
                elif "fcf per share" in label or "free cash flow per share" in label:
                    performance["fcf_per_share"] = value
                elif "operating cash flow" in label or "operating cash flow" in label:
                    performance["operating_cash_flow"] = value
                elif "capital expenditure" in label or "capex" in label:
                    performance["capex"] = value
                elif "fcf yield" in label:
                    performance["fcf_yield"] = value
                # Enterprise value ratios
                elif "ev / ebitda" in label or "ev/ebitda" in label:
                    performance["ev_ebitda"] = value
                elif "ev / fcf" in label or "ev/fcf" in label:
                    performance["ev_fcf"] = value
                # Financial health
                elif "interest coverage" in label:
                    performance["interest_coverage"] = value
                elif "debt / ebitda" in label or "debt/ebitda" in label:
                    performance["debt_ebitda"] = value
                elif "quick ratio" in label:
                    performance["quick_ratio"] = value
                elif "net debt" in label and "per share" not in label and "net cash" not in label:
                    performance["net_debt"] = value
                # 52-Week metrics (Phase 4)
                elif "52 week high" in label or "52-week high" in label:
                    performance["week_52_high"] = value
                elif "52 week low" in label or "52-week low" in label:
                    performance["week_52_low"] = value
                elif "52 week change" in label or "52-week change" in label:
                    performance["week_52_change"] = value
                # Growth metrics (Phase 4)
                elif "revenue growth" in label and "yoy" in label:
                    performance["revenue_growth_yoy"] = value
                elif "earnings growth" in label and "yoy" in label:
                    performance["earnings_growth_yoy"] = value
                elif "eps growth" in label and "yoy" in label:
                    performance["earnings_growth_yoy"] = value
                elif "fcf growth" in label and "yoy" in label:
                    performance["fcf_growth_yoy"] = value
                elif "dividend growth" in label and "yoy" in label:
                    performance["dividend_growth_yoy"] = value
                # Additional valuation (Phase 4)
                elif "price to book" in label or "price/book" in label or "pb ratio" in label:
                    performance["price_to_book"] = value
                elif "price to sales" in label or "price/sales" in label or "ps ratio" in label:
                    performance["price_to_sales"] = value

    # Calculate Piotroski F-Score if we have financial data (Phase 5)
    if performance.get("roa") and performance.get("operating_cash_flow") and performance.get("free_cash_flow"):
        piotroski = _calculate_piotroski_score(performance)
        if piotroski:
            performance["piotroski_score"] = piotroski
    
    # Calculate Altman Z-Score if we have balance sheet data (Phase 5)
    if performance.get("quick_ratio") and performance.get("debt_ebitda"):
        altman = _calculate_altman_zscore(performance)
        if altman:
            performance["altman_zscore"] = altman

    log.info(f"[Performance] Scraped performance for {ticker}")
    return performance


def _calculate_piotroski_score(perf: Dict) -> Optional[float]:
    """
    Calculate Piotroski F-Score (ranges 0-9).
    Signals financial strength based on 9 fundamental metrics.
    
    Simplified version using available metrics.
    """
    try:
        score = 0
        
        # Profitability metrics (max 5 points)
        if perf.get("roa") and perf["roa"] > 0:
            score += 1  # ROA positive
        if perf.get("operating_cash_flow") and perf["operating_cash_flow"] > 0:
            score += 1  # OCF positive
        if perf.get("free_cash_flow") and perf["free_cash_flow"] > 0:
            score += 1  # FCF positive
        if perf.get("roa") and perf.get("net_margin") and perf["roa"] > 0 and perf["net_margin"] > 0:
            score += 1  # Improving profitability
        
        # Efficiency metrics (max 2 points)
        if perf.get("asset_turnover") and perf["asset_turnover"] > 0.5:
            score += 1  # Good asset efficiency
        if perf.get("roic") and perf["roic"] > 10:
            score += 1  # Strong ROIC
        
        # Leverage/Liquidity (max 2 points)
        if perf.get("quick_ratio") and perf["quick_ratio"] >= 1.0:
            score += 1  # Adequate liquid assets
        if perf.get("debt_ebitda") and perf["debt_ebitda"] <= 2.5:
            score += 1  # Manageable debt
        
        return float(score) if score > 0 else None
    except:
        return None


def _calculate_altman_zscore(perf: Dict) -> Optional[float]:
    """
    Calculate Altman Z-Score (simplified).
    Score < 1.8 = likely bankruptcy, 1.8-3.0 = gray zone, > 3.0 = safe
    
    Simplified using available metrics.
    """
    try:
        z_score = 0.0
        
        # Working Capital / Total Assets (estimated via Quick Ratio)
        if perf.get("quick_ratio"):
            z_score += perf["quick_ratio"] * 1.2
        
        # Retained Earnings / Total Assets (estimated via ROE consistency)
        if perf.get("roe") and perf["roe"] > 10:
            z_score += 0.8
        
        # EBIT / Total Assets (using EBITDA margin as proxy)
        if perf.get("ebitda_margin") and perf["ebitda_margin"] > 0:
            z_score += (perf["ebitda_margin"] / 100) * 3.2
        
        # Market Value / Book Value (using P/E and ROE as proxy)
        if perf.get("roa") and perf["roa"] > 0:
            z_score += 1.0
        
        # Sales / Total Assets (using Asset Turnover)
        if perf.get("asset_turnover") and perf["asset_turnover"] > 0.5:
            z_score += perf["asset_turnover"] * 0.9
        
        return z_score if z_score > 0 else None
    except:
        return None


def get_performance(ticker: str, force_refresh: bool = False) -> Optional[Dict]:
    """
    Get cached performance data for a ticker, or fetch if cache is expired.
    
    Args:
        ticker: Stock ticker symbol
        force_refresh: Skip cache and fetch fresh data
    
    Returns:
        Dict with performance data or None if fetch fails
    """
    ticker = ticker.upper()
    now = time.time()
    
    # Check cache
    if not force_refresh and ticker in _performance_cache:
        cache_time = _performance_ts.get(ticker, 0)
        if (now - cache_time) < settings.NGX_PRICE_TTL:
            log.info(f"[Performance] cache hit for {ticker}")
            return _performance_cache[ticker]
    
    # Fetch fresh data
    performance = _scrape_performance(ticker)
    if performance:
        _performance_cache[ticker] = performance
        _performance_ts[ticker] = now
    
    return performance


def get_performances(tickers: list) -> Dict[str, Optional[Dict]]:
    """Get performance data for multiple tickers."""
    return {ticker: get_performance(ticker) for ticker in tickers}


def clear_cache(ticker: Optional[str] = None):
    """Clear performance cache for a ticker or all tickers."""
    global _performance_cache, _performance_ts
    if ticker:
        ticker = ticker.upper()
        _performance_cache.pop(ticker, None)
        _performance_ts.pop(ticker, None)
    else:
        _performance_cache.clear()
        _performance_ts.clear()

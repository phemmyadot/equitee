"""
Performance Service
===================
Extracts historical performance and volatility metrics from NGX_SOURCE_BASE_URL

Returns returns over various periods, volatility, sharpe ratio, max drawdown, etc.
"""

import logging
import re
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
        return BeautifulSoup(response.text, "html.parser")
    except Exception as exc:
        log.error(f"[Performance] Failed to fetch {url}: {exc}")
        return None


def _fetch_period_returns(ticker: str) -> Dict[str, Optional[float]]:
    """
    Extract period returns from the SvelteKit JSON payload on the quote page.
    The `changes` object contains historical prices (price1m, price3m, price6m,
    priceYTD, price1y) and the `quote` object contains the current price (p).
    Returns are computed as (current - past) / past * 100.
    """
    url = f"{settings.NGX_SOURCE_BASE_URL}/quote/ngx/{ticker.lower()}/"
    out: Dict[str, Optional[float]] = {
        "return_1m": None, "return_3m": None, "return_6m": None,
        "return_ytd": None, "return_1y": None,
        "week_52_high": None, "week_52_low": None,
    }
    try:
        headers = {"User-Agent": USER_AGENT}
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        text = resp.text

        # Extract quote block for current price and 52-week high/low
        quote_m = re.search(r'quote:\{([^}]+)\}', text)
        if not quote_m:
            return out
        quote_block = quote_m.group(1)

        price_m = re.search(r'\bp:([\d.]+)', quote_block)
        if not price_m:
            return out
        current = float(price_m.group(1))

        h52_m = re.search(r'\bh52:([\d.]+)', quote_block)
        l52_m = re.search(r'\bl52:([\d.]+)', quote_block)
        if h52_m:
            out["week_52_high"] = float(h52_m.group(1))
        if l52_m:
            out["week_52_low"] = float(l52_m.group(1))

        # Extract changes block: changes:{price1m:...,price3m:..., ...}
        changes_m = re.search(r'changes:\{([^}]+)\}', text)
        if not changes_m:
            return out
        pairs = dict(re.findall(r'(\w+):([\d.]+)', changes_m.group(1)))

        for field, key in (
            ("return_1m",  "price1m"),
            ("return_3m",  "price3m"),
            ("return_6m",  "price6m"),
            ("return_ytd", "priceYTD"),
            ("return_1y",  "price1y"),
        ):
            if key in pairs:
                past = float(pairs[key])
                if past:
                    out[field] = round((current - past) / past * 100, 2)
    except Exception as exc:
        log.error("[Performance] Failed to fetch period returns for %s: %s", ticker, exc)
    return out


def fetch_chart_history(ticker: str, days: int = 90) -> list[dict]:
    """
    Extract daily close prices from the SvelteKit chart.data payload on the quote page.
    Returns list of {ts, price, change_pct} dicts filtered to the last `days` days.
    """
    from datetime import datetime, timezone, timedelta
    url = f"{settings.NGX_SOURCE_BASE_URL}/quote/ngx/{ticker.lower()}/"
    try:
        headers = {"User-Agent": USER_AGENT}
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        text = resp.text

        # Locate chart block and extract all {c:<price>,t:<unix>} entries
        chart_pos = text.find("chart:")
        if chart_pos == -1:
            return []
        chunk = text[chart_pos: chart_pos + 800_000]
        entries = re.findall(r'\{c:([\d.]+)(?:,o:[\d.]+)?,t:(\d+)\}', chunk)
        if not entries:
            return []

        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        rows, prev = [], None
        for c_str, t_str in entries:
            price = float(c_str)
            ts    = datetime.fromtimestamp(int(t_str), tz=timezone.utc)
            change_pct = round((price - prev) / prev * 100, 4) if prev is not None else None
            prev = price
            if ts < cutoff:
                continue
            rows.append({"ts": ts.date().isoformat(), "price": price, "change_pct": change_pct})

        log.info("[Performance] Scraped %d chart points for %s", len(rows), ticker)
        return rows
    except Exception as exc:
        log.error("[Performance] fetch_chart_history failed for %s: %s", ticker, exc)
        return []


def _scrape_performance(ticker: str) -> Optional[Dict]:
    """Scrape performance and valuation metrics from the statistics page."""
    url = f"{settings.NGX_SOURCE_BASE_URL}/quote/ngx/{ticker.lower()}/statistics/"

    soup = _get_soup(url)
    if not soup:
        return None

    performance = {
        "symbol": ticker.upper(),
        # Price Returns (Phase 1-2)
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
                    value = float(value) if value and value not in ['n/a', '-', 'none', 'nan'] else None
                except (ValueError, AttributeError):
                    value = None

                if value is None:
                    continue

                # Clean label for matching
                label_clean = label.replace("-", " ").replace("/", " ").replace("(", " ").replace(")", " ")

                # Map labels to performance fields - Made more flexible
                if "1 month" in label_clean or "1month" in label_clean or "1m" in label_clean:
                    if "return" in label_clean or "%" in label_clean and "12m" not in label_clean:
                        performance["return_1m"] = value
                elif "3 month" in label_clean or "3month" in label_clean or "3m" in label_clean:
                    performance["return_3m"] = value
                elif "6 month" in label_clean or "6month" in label_clean or "6m" in label_clean:
                    performance["return_6m"] = value
                elif ("1 year" in label_clean or "1year" in label_clean or "52 week" in label_clean or "52week" in label_clean) and "return" in label_clean:
                    performance["return_1y"] = value
                elif "year to date" in label_clean or "ytd" in label_clean:
                    performance["return_ytd"] = value
                elif "volatility" in label and not "correlation" in label:
                    performance["volatility"] = value
                elif "sharpe" in label:
                    performance["sharpe_ratio"] = value
                elif ("max drawdown" in label or "maximum drawdown" in label or "maxdrawdown" in label):
                    performance["max_drawdown"] = value
                elif "beta" in label and "correlation" not in label:
                    performance["beta"] = value
                elif "correlation" in label and "market" in label:
                    performance["correlation_market"] = value
                # Margin metrics
                elif "operating margin" in label_clean:
                    performance["operating_margin"] = value
                elif "ebitda margin" in label_clean or "ebit margin" in label_clean:
                    performance["ebitda_margin"] = value
                elif "fcf margin" in label_clean or "free cash flow margin" in label_clean:
                    performance["fcf_margin"] = value
                elif "pretax margin" in label_clean or "profit before tax" in label_clean:
                    performance["pretax_margin"] = value
                # Efficiency metrics
                elif "return on assets" in label_clean or "roa" in label_clean:
                    performance["roa"] = value
                elif "return on invested capital" in label_clean or "roic" in label_clean:
                    performance["roic"] = value
                elif "return on capital employed" in label_clean or "roce" in label_clean:
                    performance["roce"] = value
                elif "asset turnover" in label_clean or "asseturnover" in label_clean:
                    performance["asset_turnover"] = value
                # Cash flow metrics
                elif "free cash flow" in label_clean and "margin" not in label_clean and "yield" not in label_clean and "per share" not in label_clean:
                    performance["free_cash_flow"] = value
                elif ("fcf per share" in label_clean or "free cash flow per share" in label_clean) and "yield" not in label_clean:
                    performance["fcf_per_share"] = value
                elif "operating cash flow" in label_clean or "operating cf" in label_clean or "ocf" in label_clean:
                    performance["operating_cash_flow"] = value
                elif "capital expenditure" in label_clean or "capex" in label_clean or "cap ex" in label_clean:
                    performance["capex"] = value
                elif "fcf yield" in label_clean or "free cash flow yield" in label_clean:
                    performance["fcf_yield"] = value
                # Enterprise value ratios
                elif "ev" in label_clean and "ebitda" in label_clean:
                    performance["ev_ebitda"] = value
                elif "ev" in label_clean and "fcf" in label_clean:
                    performance["ev_fcf"] = value
                # Valuation ratios
                elif ("price to book" in label_clean or "price book" in label_clean or "pb" in label_clean) and "ratio" in label_clean:
                    performance["price_to_book"] = value
                elif ("price to sales" in label_clean or "price sales" in label_clean or "ps" in label_clean) and "ratio" in label_clean:
                    performance["price_to_sales"] = value
                # Financial health
                elif "interest coverage" in label_clean:
                    performance["interest_coverage"] = value
                elif ("debt" in label_clean and "ebitda" in label_clean):
                    performance["debt_ebitda"] = value
                elif "quick ratio" in label_clean:
                    performance["quick_ratio"] = value
                elif "net debt" in label_clean and "per share" not in label_clean:
                    performance["net_debt"] = value
                # 52-Week metrics
                elif "52" in label_clean and "high" in label_clean:
                    performance["week_52_high"] = value
                elif "52" in label_clean and "low" in label_clean:
                    performance["week_52_low"] = value
                elif ("52" in label_clean or "52 week" in label_clean) and ("change" in label_clean or "%" in label or "return" in label_clean):
                    if "high" not in label_clean and "low" not in label_clean:
                        performance["week_52_change"] = value
                # Growth metrics
                elif "revenue" in label_clean and "growth" in label_clean:
                    performance["revenue_growth_yoy"] = value
                elif ("earnings growth" in label_clean or "eps growth" in label_clean or "net income growth" in label_clean):
                    performance["earnings_growth_yoy"] = value
                elif "fcf growth" in label_clean or "free cash flow growth" in label_clean:
                    performance["fcf_growth_yoy"] = value
                elif "dividend growth" in label_clean:
                    performance["dividend_growth_yoy"] = value

    # Enrich period returns from the quote page (accurate 1m/3m/6m/ytd/1y)
    period_returns = _fetch_period_returns(ticker)
    for field, value in period_returns.items():
        if value is not None and performance.get(field) is None:
            performance[field] = value

    # Fallback: 52-week price change == 1-year return
    if performance.get("week_52_change") is not None and performance.get("return_1y") is None:
        performance["return_1y"] = performance["week_52_change"]

    # Calculate Piotroski F-Score if we have financial data (Phase 5)
    # Make it work with partial data instead of requiring all metrics
    piotroski = _calculate_piotroski_score(performance)
    if piotroski:
        performance["piotroski_score"] = piotroski

    # Calculate Altman Z-Score if we have balance sheet data (Phase 5)
    altman = _calculate_altman_zscore(performance)
    if altman:
        performance["altman_zscore"] = altman

    log.info(f"[Performance] Scraped performance for {ticker}")
    return performance


def _calculate_piotroski_score(perf: Dict) -> Optional[float]:
    """
    Calculate Piotroski F-Score (ranges 0-9).
    Signals financial strength based on 9 fundamental metrics.

    Works with partial data - calculates based on available metrics.
    """
    try:
        score = 0
        count = 0

        # Profitability metrics
        if perf.get("roic") and perf["roic"] > 0:
            score += 1
            count += 1
        if perf.get("roe") and perf["roe"] > 0:
            score += 1
            count += 1
        if perf.get("net_margin") and perf["net_margin"] > 0:
            score += 1
            count += 1

        # Cash flow metrics
        if perf.get("operating_cash_flow") and perf["operating_cash_flow"] > 0:
            score += 1
            count += 1
        if perf.get("free_cash_flow") and perf["free_cash_flow"] > 0:
            score += 1
            count += 1
        if perf.get("fcf_yield") and perf["fcf_yield"] > 0:
            score += 1
            count += 1

        # Efficiency metrics
        if perf.get("asset_turnover") and perf["asset_turnover"] > 0.5:
            score += 1
            count += 1
        if perf.get("roa") and perf["roa"] > 5:
            score += 1
            count += 1

        # Financial health
        if perf.get("quick_ratio") and perf["quick_ratio"] >= 1.0:
            score += 1
            count += 1

        # Return normalized score (0-9)
        if count > 0:
            # Scale to 0-9 based on available metrics
            normalized_score = (score / count) * 9
            return normalized_score

        return None
    except Exception as e:
        log.error(f"[Performance] Failed to calculate Piotroski: {e}")
        return None


def _calculate_altman_zscore(perf: Dict) -> Optional[float]:
    """
    Calculate Altman Z-Score (simplified).
    Score < 1.8 = likely bankruptcy, 1.8-3.0 = gray zone, > 3.0 = safe

    Works with available data - not all factors required.
    """
    try:
        z_score = 0.0

        # X1: Working Capital / Total Assets (estimated via Quick Ratio)
        if perf.get("quick_ratio"):
            z_score += perf["quick_ratio"] * 1.2

        # X2: Retained Earnings / Total Assets (estimated via profitability)
        if perf.get("roe") and perf["roe"] > 10:
            z_score += 0.8
        elif perf.get("net_margin") and perf["net_margin"] > 10:
            z_score += 0.6

        # X3: EBIT / Total Assets (using margins as proxy)
        if perf.get("ebitda_margin") and perf["ebitda_margin"] > 0:
            z_score += (perf["ebitda_margin"] / 100) * 3.2
        elif perf.get("operating_margin") and perf["operating_margin"] > 0:
            z_score += (perf["operating_margin"] / 100) * 2.8

        # X4: Market Value / Book Value (using ROE as proxy for profitability)
        if perf.get("roa") and perf["roa"] > 0:
            z_score += 1.0
        elif perf.get("roic") and perf["roic"] > 0:
            z_score += 0.9

        # X5: Sales / Total Assets (using Asset Turnover)
        if perf.get("asset_turnover") and perf["asset_turnover"] > 0.5:
            z_score += perf["asset_turnover"] * 0.9

        # Debt adjustment - penalize high debt
        if perf.get("debt_ebitda") and perf["debt_ebitda"] > 4:
            z_score -= 0.5

        return max(0.5, z_score) if z_score > 0 else None
    except Exception as e:
        log.error(f"[Performance] Failed to calculate Altman: {e}")
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

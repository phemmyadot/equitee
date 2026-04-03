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
from app.config import settings
from app.services.performance import _scrape_stats_blob

log = logging.getLogger(__name__)

# ── Cache for performance data ───────────────────────────────────────────────
_performance_cache: Dict = {}
_performance_ts: Dict = {}

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"


def _fetch_period_returns(ticker: str) -> Dict[str, Optional[float]]:
    """
    Extract period returns from the SvelteKit JSON payload on the quote page.
    The `changes` object contains historical prices (price1m, price3m, price6m,
    priceYTD, price1y) and the `quote` object contains the current price (p).
    Returns are computed as (current - past) / past * 100.
    """
    url = f"{settings.NGX_SOURCE_BASE_URL}/quote/ngx/{ticker.lower()}/"
    out: Dict[str, Optional[float]] = {
        "return_1m": None,
        "return_3m": None,
        "return_6m": None,
        "return_ytd": None,
        "return_1y": None,
        "week_52_high": None,
        "week_52_low": None,
    }
    try:
        headers = {"User-Agent": USER_AGENT}
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        text = resp.text

        # Extract quote block for current price and 52-week high/low
        quote_m = re.search(r"quote:\{([^}]+)\}", text)
        if not quote_m:
            return out
        quote_block = quote_m.group(1)

        price_m = re.search(r"\bp:([\d.]+)", quote_block)
        if not price_m:
            return out
        current = float(price_m.group(1))

        h52_m = re.search(r"\bh52:([\d.]+)", quote_block)
        l52_m = re.search(r"\bl52:([\d.]+)", quote_block)
        if h52_m:
            out["week_52_high"] = float(h52_m.group(1))
        if l52_m:
            out["week_52_low"] = float(l52_m.group(1))

        # Extract changes block: changes:{price1m:...,price3m:..., ...}
        changes_m = re.search(r"changes:\{([^}]+)\}", text)
        if not changes_m:
            return out
        pairs = dict(re.findall(r"(\w+):([\d.]+)", changes_m.group(1)))

        for field, key in (
            ("return_1m", "price1m"),
            ("return_3m", "price3m"),
            ("return_6m", "price6m"),
            ("return_ytd", "priceYTD"),
            ("return_1y", "price1y"),
        ):
            if key in pairs:
                past = float(pairs[key])
                if past:
                    out[field] = round((current - past) / past * 100, 2)
    except Exception as exc:
        log.error(
            "[Performance] Failed to fetch period returns for %s: %s", ticker, exc
        )
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
        chunk = text[chart_pos : chart_pos + 800_000]
        entries = re.findall(r"\{c:([\d.]+)(?:,o:[\d.]+)?,t:(\d+)\}", chunk)
        if not entries:
            return []

        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        rows, prev = [], None
        for c_str, t_str in entries:
            price = float(c_str)
            ts = datetime.fromtimestamp(int(t_str), tz=timezone.utc)
            change_pct = (
                round((price - prev) / prev * 100, 4) if prev is not None else None
            )
            prev = price
            if ts < cutoff:
                continue
            rows.append(
                {"ts": ts.date().isoformat(), "price": price, "change_pct": change_pct}
            )

        log.info("[Performance] Scraped %d chart points for %s", len(rows), ticker)
        return rows
    except Exception as exc:
        log.error("[Performance] fetch_chart_history failed for %s: %s", ticker, exc)
        return []


def _calculate_from_history(ticker: str) -> dict:
    """Derive volatility, Sharpe, max drawdown, RSI-14, MA-50, MA-200 from price history."""
    import math

    # Prefer the daily_price_history table (history page scraper, up to 400 days)
    try:
        from app.services.history import get_ticker_prices_from_db

        history = get_ticker_prices_from_db(ticker, days=400)
    except Exception:
        history = []
    # Fall back to live chart scrape if DB returned nothing
    if not history:
        history = fetch_chart_history(ticker, days=400)
    prices = [r["price"] for r in history if r.get("price")]
    changes = [r["change_pct"] for r in history if r.get("change_pct") is not None]
    if len(changes) < 20:
        return {}

    daily_returns = [c / 100 for c in changes]
    n_r = len(daily_returns)
    mean_r = sum(daily_returns) / n_r
    var = sum((r - mean_r) ** 2 for r in daily_returns) / max(n_r - 1, 1)
    std_day = math.sqrt(var) if var > 0 else 0
    result: dict = {}

    if std_day > 0:
        result["volatility"] = round(std_day * math.sqrt(252) * 100, 2)
        # Nigerian T-bill risk-free rate ≈ 18 % (2024-2025)
        rf_daily = 0.18 / 252
        result["sharpe_ratio"] = round(
            (mean_r - rf_daily) / std_day * math.sqrt(252), 3
        )

    if prices:
        peak, max_dd = prices[0], 0.0
        for p in prices:
            if p > peak:
                peak = p
            dd = (peak - p) / peak * 100 if peak > 0 else 0
            if dd > max_dd:
                max_dd = dd
        result["max_drawdown"] = round(-max_dd, 2)  # negative = drawdown

    # RSI-14 (Wilder's simple average over last 14 periods)
    if len(prices) >= 15:
        deltas = [prices[i] - prices[i - 1] for i in range(1, len(prices))]
        last14 = deltas[-14:]
        avg_gain = sum(max(d, 0) for d in last14) / 14
        avg_loss = sum(max(-d, 0) for d in last14) / 14
        if avg_loss == 0:
            result["rsi_14"] = 100.0
        else:
            rs = avg_gain / avg_loss
            result["rsi_14"] = round(100 - 100 / (1 + rs), 1)

    # Simple moving averages
    if len(prices) >= 50:
        result["ma_50"] = round(sum(prices[-50:]) / 50, 2)
    if len(prices) >= 200:
        result["ma_200"] = round(sum(prices[-200:]) / 200, 2)
    if "ma_50" in result and "ma_200" in result:
        result["golden_cross"] = result["ma_50"] > result["ma_200"]

    return result


def _calculate_growth_metrics(ticker: str) -> dict:
    """Calculate YoY revenue, earnings and FCF growth from stored quarterly history."""
    from app.services.financials import get_earnings_history, get_cash_flows

    result: dict = {}
    try:
        earn = get_earnings_history(ticker)
        if earn and earn.get("periods"):
            rev = earn.get("revenue", [])
            ni = earn.get("net_income", [])

            def _yoy(arr):
                if len(arr) >= 8:
                    ttm = [v for v in arr[-4:] if v is not None]
                    prior = [v for v in arr[-8:-4] if v is not None]
                    if len(ttm) == 4 and len(prior) == 4:
                        t, p = sum(ttm), sum(prior)
                        if p != 0:
                            return round((t - p) / abs(p) * 100, 2)
                if (
                    len(arr) >= 5
                    and arr[-1] is not None
                    and arr[-5] is not None
                    and arr[-5] != 0
                ):
                    return round((arr[-1] - arr[-5]) / abs(arr[-5]) * 100, 2)
                return None

            result["revenue_growth_yoy"] = _yoy(rev)
            result["earnings_growth_yoy"] = _yoy(ni)

    except Exception as exc:
        log.warning("[Performance] growth calc failed for %s: %s", ticker, exc)

    # FCF growth
    try:
        from app.services.financials import get_cash_flows

        cf = get_cash_flows(ticker)
        if cf and cf.get("periods"):
            fcf = cf.get("fcf", [])
            if len(fcf) >= 8:
                ttm = [v for v in fcf[-4:] if v is not None]
                prior = [v for v in fcf[-8:-4] if v is not None]
                if len(ttm) == 4 and len(prior) == 4:
                    t, p = sum(ttm), sum(prior)
                    if p != 0:
                        result["fcf_growth_yoy"] = round((t - p) / abs(p) * 100, 2)
            elif (
                len(fcf) >= 5
                and fcf[-1] is not None
                and fcf[-5] is not None
                and fcf[-5] != 0
            ):
                result["fcf_growth_yoy"] = round(
                    (fcf[-1] - fcf[-5]) / abs(fcf[-5]) * 100, 2
                )
    except Exception as exc:
        log.warning("[Performance] FCF growth calc failed for %s: %s", ticker, exc)

    return {k: v for k, v in result.items() if v is not None}


def _scrape_performance(ticker: str) -> Optional[Dict]:
    """Extract performance and valuation metrics from the statistics page JS blob."""
    raw = _scrape_stats_blob(ticker)
    if not raw:
        return None

    # netcash positive = net cash surplus; invert for net_debt convention
    netcash = raw.get("netcash")
    net_debt = -netcash if netcash is not None else None

    performance: Dict = {
        "symbol": ticker.upper(),
        # Risk
        "beta": raw.get("beta"),
        "volatility": None,  # not on statistics page
        "sharpe_ratio": None,  # not on statistics page
        "max_drawdown": None,  # not on statistics page
        # 52-week (high/low come from quote page via _fetch_period_returns)
        "week_52_high": None,
        "week_52_low": None,
        "week_52_change": raw.get("ch1y"),
        # Margins
        "operating_margin": raw.get("operatingMargin"),
        "ebitda_margin": raw.get("ebitdaMargin"),
        "fcf_margin": raw.get("fcfMargin"),
        "pretax_margin": raw.get("pretaxMargin"),
        # Returns on capital
        "roa": raw.get("roa"),
        "roic": raw.get("roic"),
        "roce": raw.get("roce"),
        # Cash flow
        "free_cash_flow": raw.get("fcf"),
        "fcf_per_share": raw.get("fcfps"),
        "operating_cash_flow": raw.get("ncfo"),
        "capex": raw.get("capex"),
        "fcf_yield": raw.get("fcfYield"),
        # Valuation
        "ev_ebitda": raw.get("evEbitda"),
        "ev_fcf": raw.get("evFcf"),
        "price_to_book": raw.get("pb"),
        "price_to_sales": raw.get("ps"),
        # Financial health
        "interest_coverage": raw.get("interestCoverage"),
        "debt_ebitda": raw.get("debtEbitda"),
        "quick_ratio": raw.get("quickRatio"),
        "net_debt": net_debt,
        "asset_turnover": raw.get("assetturnover"),
        # Growth
        "revenue_growth_yoy": raw.get("revenueGrowth"),
        "earnings_growth_yoy": raw.get("epsGrowth"),
        "fcf_growth_yoy": raw.get("fcfGrowth"),
        "dividend_growth_yoy": raw.get("dividendGrowth"),
        # Quality scores — use site values; fall back to calculated below
        "piotroski_score": raw.get("fScore"),
        "altman_zscore": raw.get("zScore"),
        # Period returns filled in by _fetch_period_returns
        "return_1m": None,
        "return_3m": None,
        "return_6m": None,
        "return_ytd": None,
        "return_1y": None,
    }

    # Enrich period returns + 52w high/low from the quote page
    period_returns = _fetch_period_returns(ticker)
    for field, value in period_returns.items():
        if value is not None:
            performance[field] = value

    # Fallback: 52-week price change as 1y return
    if (
        performance.get("week_52_change") is not None
        and performance.get("return_1y") is None
    ):
        performance["return_1y"] = performance["week_52_change"]

    # Calculated fallbacks when site doesn't provide scores
    if performance["piotroski_score"] is None:
        performance["piotroski_score"] = _calculate_piotroski_score(performance)
    if performance["altman_zscore"] is None:
        performance["altman_zscore"] = _calculate_altman_zscore(performance)

    # ── Derived metrics — fill blanks using available figures ─────────────────

    # EBITDA Margin: for financial companies the site returns n/a; operating
    # income ≈ EBITDA (minimal D&A), so use operating_margin as proxy.
    if performance.get("ebitda_margin") is None and performance.get("operating_margin"):
        performance["ebitda_margin"] = performance["operating_margin"]

    # Enterprise Value components
    market_cap = raw.get("marketcap")
    net_debt_val = performance.get("net_debt")  # negative = net cash
    ev = (
        (market_cap + net_debt_val)
        if (market_cap is not None and net_debt_val is not None)
        else None
    )

    # EV / FCF
    if performance.get("ev_fcf") is None and ev is not None:
        fcf = raw.get("fcf")
        if fcf and fcf != 0:
            performance["ev_fcf"] = round(ev / fcf, 2)

    # EV / EBITDA — use ebitda_margin (now filled if op_margin was available)
    if performance.get("ev_ebitda") is None and ev is not None:
        revenue = raw.get("revenue")
        ebitda_margin = performance.get("ebitda_margin")
        if revenue and ebitda_margin:
            ebitda = ebitda_margin / 100 * revenue
            if ebitda > 0:
                performance["ev_ebitda"] = round(ev / ebitda, 2)

    # Asset Turnover = Revenue / Total Assets;  Total Assets = Net Income / ROA
    if performance.get("asset_turnover") is None:
        roa = performance.get("roa")
        rev = raw.get("revenue")
        netinc = raw.get("netinc")
        if roa and roa > 0 and rev and netinc and netinc > 0:
            total_assets = netinc / (roa / 100)
            performance["asset_turnover"] = round(rev / total_assets, 4)

    # ROIC = Net Income / Invested Capital;  IC = Equity + Net Debt
    # When net cash > equity (IC negative), fall back to equity alone (= ROE).
    if performance.get("roic") is None:
        roe = raw.get("roe")
        netinc = raw.get("netinc")
        if roe and roe > 0 and netinc:
            equity = netinc / (roe / 100)
            if equity > 0:
                ic = equity + (net_debt_val or 0)
                if ic > 0:
                    performance["roic"] = round(netinc / ic * 100, 2)
                else:
                    # Net-cash position: IC is negative; use equity only
                    performance["roic"] = round(roe, 2)

    # ROCE = EBIT / Capital Employed;  CE ≈ Equity for financials
    if performance.get("roce") is None:
        op_margin = performance.get("operating_margin")
        rev = raw.get("revenue")
        roe = raw.get("roe")
        netinc = raw.get("netinc")
        if op_margin and rev and roe and roe > 0 and netinc:
            ebit = op_margin / 100 * rev
            equity = netinc / (roe / 100)
            if equity > 0:
                performance["roce"] = round(ebit / equity * 100, 2)

    # Volatility, Sharpe, Max Drawdown from price history
    for k, v in _calculate_from_history(ticker).items():
        if performance.get(k) is None:
            performance[k] = v

    # Revenue / Earnings / FCF growth from stored quarterly data
    for k, v in _calculate_growth_metrics(ticker).items():
        if performance.get(k) is None:
            performance[k] = v

    log.info("[Performance] Scraped %s from JS blob", ticker)
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
        # If derived data (growth, technicals) is still missing — likely because
        # financials or chart history weren't scraped yet — use a short TTL so
        # the next request retries rather than serving stale Nones for the full cycle.
        _RETRY_TTL = 90  # seconds
        incomplete = all(
            performance.get(f) is None
            for f in ("revenue_growth_yoy", "earnings_growth_yoy", "rsi_14", "ma_50")
        )
        _performance_ts[ticker] = (
            now - (settings.NGX_PRICE_TTL - _RETRY_TTL) if incomplete else now
        )

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

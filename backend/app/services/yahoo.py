"""
Yahoo Finance Service
=====================
Fetches real-time US stock prices and fundamentals from Yahoo Finance public APIs.

Endpoints used:
  Chart (price + history): https://query1.finance.yahoo.com/v8/finance/chart/{ticker}
  Fundamentals:            https://query1.finance.yahoo.com/v10/finance/quoteSummary/{ticker}

No API key required.
"""

import json
import logging
import time
import urllib.request
from datetime import datetime, timezone
from typing import Optional

from app.config import settings
from app.models import USPrice

log = logging.getLogger(__name__)

# ── Price cache ────────────────────────────────────────────────────────────────
_cache: dict = {"data": {}, "ts": 0.0}

# ── Fundamentals cache (per-ticker, 4-hour TTL) ────────────────────────────────
_fund_cache: dict[str, dict] = {}
FUND_TTL = 4 * 3600  # 4 hours

# ── Price history cache (per ticker+range, 15-min TTL) ─────────────────────────
_hist_cache: dict[str, dict] = {}
HIST_TTL = 900  # 15 minutes

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json",
}


def _req(url: str, timeout: int = 10):
    r = urllib.request.Request(url, headers=_HEADERS)
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8", errors="ignore"))


# ── Price ──────────────────────────────────────────────────────────────────────

def _fetch_ticker(ticker: str) -> Optional[USPrice]:
    url = settings.YAHOO_API.format(ticker=ticker)
    try:
        meta = _req(url)["chart"]["result"][0]["meta"]

        price = meta.get("regularMarketPrice") or meta.get("currentPrice")
        close = meta.get("previousClose") or meta.get("chartPreviousClose")

        if price is None:
            log.warning(f"[Yahoo] {ticker}: no price in response")
            return None

        price = float(price)
        close = float(close) if close else None
        change = round(price - close, 4) if close else None
        change_pct = (
            round(change / close * 100, 4)
            if (close and close != 0 and change is not None)
            else None
        )

        return USPrice(
            symbol=ticker,
            price=price,
            close=close,
            change=change,
            change_pct=change_pct,
            high=meta.get("regularMarketDayHigh"),
            low=meta.get("regularMarketDayLow"),
            volume=meta.get("regularMarketVolume"),
            currency=meta.get("currency", "USD"),
            name=meta.get("shortName") or meta.get("longName"),
        )

    except Exception as exc:
        log.warning(f"[Yahoo] {ticker} failed: {exc}")
        return None


def get_price(ticker: str) -> Optional[USPrice]:
    """Get price for a single US ticker."""
    result = get_prices([ticker])
    return result.get(ticker)


def get_prices(tickers: list[str]) -> dict[str, USPrice]:
    """
    Return prices for all requested tickers.
    Only re-fetches tickers that are absent or whose cache is stale.
    """
    global _cache
    now = time.time()
    stale = [
        t
        for t in tickers
        if t not in _cache["data"] or (now - _cache["ts"]) > settings.US_PRICE_TTL
    ]

    if stale:
        log.info(f"[Yahoo] fetching {len(stale)} tickers: {stale}")
        for ticker in stale:
            result = _fetch_ticker(ticker)
            if result:
                _cache["data"][ticker] = result
                log.info(f"[Yahoo] {ticker} → ${result.price}")
        _cache["ts"] = now

    return _cache["data"]


def cache_age() -> Optional[int]:
    return int(time.time() - _cache["ts"]) if _cache["ts"] else None


# ── Fundamentals ───────────────────────────────────────────────────────────────

def _rv(obj: dict, key: str):
    """Extract raw numeric value from Yahoo's {raw: X, fmt: Y} wrapper."""
    v = obj.get(key)
    if v is None:
        return None
    if isinstance(v, dict):
        return v.get("raw")
    return v


def get_fundamentals(ticker: str) -> Optional[dict]:
    """
    Fetch fundamentals from Yahoo quoteSummary.
    Returns a dict with 'profile', 'overview', and 'performance' sub-dicts
    matching the TickerFullResponse shape used by the NGX profile endpoint.
    Cached for FUND_TTL seconds.
    """
    now = time.time()
    cached = _fund_cache.get(ticker)
    if cached and (now - cached["ts"]) < FUND_TTL:
        return cached["data"]

    modules = "summaryProfile,defaultKeyStatistics,financialData,summaryDetail"
    url = f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{ticker}?modules={modules}"
    try:
        body = _req(url, timeout=12)
        result = (body.get("quoteSummary", {}).get("result") or [None])[0]
        if not result:
            log.warning(f"[Yahoo fundamentals] {ticker}: empty result")
            return None
    except Exception as exc:
        log.warning(f"[Yahoo fundamentals] {ticker} failed: {exc}")
        return None

    sp = result.get("summaryProfile") or {}
    ks = result.get("defaultKeyStatistics") or {}
    fd = result.get("financialData") or {}
    sd = result.get("summaryDetail") or {}

    # ── Profile ────────────────────────────────────────────────────────────
    profile = {
        "symbol": ticker,
        "name": None,  # filled by price endpoint
        "sector": sp.get("sector"),
        "industry": sp.get("industry"),
        "website": sp.get("website"),
        "description": sp.get("longBusinessSummary"),
        "headquarters": f"{sp.get('city', '')}, {sp.get('country', '')}".strip(", ") or None,
        "founded": None,
        "employees": str(sp["fullTimeEmployees"]) if sp.get("fullTimeEmployees") else None,
    }

    def pct(key_obj, key):
        """Extract a Yahoo decimal fraction and convert to percentage (0.35 → 35)."""
        v = _rv(key_obj, key)
        return round(v * 100, 4) if v is not None else None

    # ── Overview (fundamentals) ────────────────────────────────────────────
    mc = _rv(sd, "marketCap") or _rv(ks, "enterpriseValue")
    overview = {
        "market_cap": mc,
        "pe_ratio": _rv(sd, "trailingPE") or _rv(ks, "forwardPE"),
        "eps": _rv(ks, "trailingEps"),
        "dividend_yield": pct(sd, "dividendYield"),   # 0.0047 → 0.47 %
        "roe": pct(fd, "returnOnEquity"),              # 1.47  → 147 %
        "debt_to_equity": _rv(fd, "debtToEquity"),    # already %-like (195)
        "book_value": _rv(ks, "bookValue"),
        "current_ratio": _rv(fd, "currentRatio"),
        "gross_margin": pct(fd, "grossMargins"),       # 0.458 → 45.8 %
        "net_margin": pct(fd, "profitMargins"),        # 0.231 → 23.1 %
        "revenue": _rv(fd, "totalRevenue"),
        "net_income": _rv(fd, "netIncomeToCommon"),
        # Extra fields useful for US signal + display
        "forward_pe": _rv(sd, "forwardPE"),
        "payout_ratio": pct(sd, "payoutRatio"),        # 0.15 → 15 %
        "dividend_rate": _rv(sd, "dividendRate"),
        "quick_ratio": _rv(fd, "quickRatio"),
        "operating_margin": pct(fd, "operatingMargins"),
        "ebitda_margin": pct(fd, "ebitdaMargins"),
        "total_cash": _rv(fd, "totalCash"),
        "total_debt": _rv(fd, "totalDebt"),
        "free_cash_flow": _rv(fd, "freeCashflow"),
        "operating_cash_flow": _rv(fd, "operatingCashflow"),
        "recommendation": fd.get("recommendationKey"),
        "analyst_count": _rv(fd, "numberOfAnalystOpinions"),
        "target_mean": _rv(fd, "targetMeanPrice"),
        "target_high": _rv(fd, "targetHighPrice"),
        "target_low": _rv(fd, "targetLowPrice"),
        "enterprise_value": _rv(ks, "enterpriseValue"),
        "ev_ebitda": _rv(ks, "enterpriseToEbitda"),
        "ev_revenue": _rv(ks, "enterpriseToRevenue"),
        "price_to_book": _rv(ks, "priceToBook"),
        "shares_outstanding": _rv(ks, "sharesOutstanding"),
        "revenue_growth": pct(fd, "revenueGrowth"),    # 0.04 → 4 %
        "earnings_growth": pct(fd, "earningsGrowth"),  # 0.10 → 10 %
        "roa": pct(fd, "returnOnAssets"),              # 0.22 → 22 %
    }

    # ── Performance (returns / technical) ─────────────────────────────────
    w52h = _rv(sd, "fiftyTwoWeekHigh") or _rv(ks, "fiftyTwoWeekHigh")
    w52l = _rv(sd, "fiftyTwoWeekLow") or _rv(ks, "fiftyTwoWeekLow")
    performance = {
        "beta": _rv(ks, "beta"),
        "week_52_high": w52h,
        "week_52_low": w52l,
        "week_52_change": pct(ks, "52WeekChange"),     # 0.35 → 35 %
        "ma_50": _rv(sd, "fiftyDayAverage"),
        "ma_200": _rv(sd, "twoHundredDayAverage"),
        "return_1y": pct(ks, "52WeekChange"),          # same as week_52_change
    }

    data = {"profile": profile, "overview": overview, "performance": performance}
    _fund_cache[ticker] = {"data": data, "ts": now}
    log.info(f"[Yahoo fundamentals] {ticker} cached")
    return data


# ── Price history ──────────────────────────────────────────────────────────────

def get_price_history(ticker: str, days: int = 90) -> list[dict]:
    """
    Return daily closing prices for `ticker` over the last `days` days.
    Each entry: {"ts": "YYYY-MM-DD", "price": float, "change_pct": float | None}
    Cached for HIST_TTL seconds.
    """
    key = f"{ticker}:{days}"
    now = time.time()
    cached = _hist_cache.get(key)
    if cached and (now - cached["ts"]) < HIST_TTL:
        return cached["data"]

    range_str = "3mo" if days <= 90 else "6mo" if days <= 180 else "1y"
    url = f"{settings.YAHOO_API.format(ticker=ticker)}?interval=1d&range={range_str}"
    try:
        body = _req(url, timeout=12)
        result = body["chart"]["result"][0]
        timestamps = result.get("timestamp") or []
        closes = (result.get("indicators", {}).get("quote") or [{}])[0].get("close") or []
    except Exception as exc:
        log.warning(f"[Yahoo history] {ticker} failed: {exc}")
        return []

    rows = []
    prev_close = None
    for ts, close in zip(timestamps, closes):
        if close is None:
            prev_close = None
            continue
        date_str = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
        change_pct = (
            round((close - prev_close) / prev_close * 100, 4)
            if prev_close and prev_close != 0
            else None
        )
        rows.append({"ts": date_str, "price": round(close, 4), "change_pct": change_pct})
        prev_close = close

    # Trim to requested days
    rows = rows[-days:] if len(rows) > days else rows

    _hist_cache[key] = {"data": rows, "ts": now}
    return rows

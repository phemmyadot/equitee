"""
Yahoo Finance Service
=====================
Fetches real-time US stock prices and fundamentals from Yahoo Finance.

Endpoints used:
  Chart (price + history): https://query1.finance.yahoo.com/v8/finance/chart/{ticker}
  Fundamentals:            yfinance library (handles crumb/cookie auth automatically)

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

    for ticker in tickers:
        result = _fetch_ticker(ticker)
        if result:
            _cache["data"][ticker] = result
            log.info(f"[Yahoo] {ticker} → ${result.price}")
    _cache["ts"] = now

    return _cache["data"]


def cache_age() -> Optional[int]:
    return int(time.time() - _cache["ts"]) if _cache["ts"] else None


# ── Fundamentals ───────────────────────────────────────────────────────────────

def get_fundamentals(ticker: str) -> Optional[dict]:
    """
    Fetch fundamentals via the yfinance library (handles Yahoo auth automatically).
    Returns a dict with 'profile', 'overview', and 'performance' sub-dicts.
    Cached for FUND_TTL seconds.
    """
    now = time.time()
    cached = _fund_cache.get(ticker)
    if cached and (now - cached["ts"]) < FUND_TTL:
        return cached["data"]

    try:
        import yfinance as yf
        info = yf.Ticker(ticker).info or {}
    except Exception as exc:
        log.warning(f"[Yahoo fundamentals] {ticker} failed: {exc}")
        return None

    if not info or info.get("trailingPE") is None and info.get("marketCap") is None:
        log.warning(f"[Yahoo fundamentals] {ticker}: empty or stub info")

    def _pct(key: str) -> Optional[float]:
        """Convert a decimal fraction to percentage (0.35 → 35.0)."""
        v = info.get(key)
        return round(float(v) * 100, 4) if v is not None else None

    def _val(key: str):
        v = info.get(key)
        return float(v) if v is not None else None

    def _ex_date() -> Optional[str]:
        ts = info.get("exDividendDate")
        if not ts:
            return None
        try:
            return datetime.fromtimestamp(int(ts), tz=timezone.utc).strftime("%Y-%m-%d")
        except Exception:
            return None

    city = info.get("city") or ""
    country = info.get("country") or ""
    hq = f"{city}, {country}".strip(", ") or None

    profile = {
        "symbol": ticker,
        "name": info.get("longName") or info.get("shortName"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "website": info.get("website"),
        "description": info.get("longBusinessSummary"),
        "headquarters": hq,
        "founded": None,
        "employees": str(info["fullTimeEmployees"]) if info.get("fullTimeEmployees") else None,
    }

    overview = {
        "market_cap": _val("marketCap"),
        "pe_ratio": _val("trailingPE"),
        "eps": _val("trailingEps"),
        "dividend_yield": _pct("dividendYield"),      # 0.007 → 0.7 %
        "roe": _pct("returnOnEquity"),                 # 0.25 → 25 %
        "debt_to_equity": _val("debtToEquity"),
        "book_value": _val("bookValue"),
        "current_ratio": _val("currentRatio"),
        "gross_margin": _pct("grossMargins"),
        "net_margin": _pct("profitMargins"),
        "revenue": _val("totalRevenue"),
        "net_income": _val("netIncomeToCommon"),
        "forward_pe": _val("forwardPE"),
        "payout_ratio": _pct("payoutRatio"),
        "dividend_rate": _val("dividendRate"),
        "ex_dividend_date": _ex_date(),
        "quick_ratio": _val("quickRatio"),
        "operating_margin": _pct("operatingMargins"),
        "ebitda_margin": _pct("ebitdaMargins"),
        "total_cash": _val("totalCash"),
        "total_debt": _val("totalDebt"),
        "free_cash_flow": _val("freeCashflow"),
        "operating_cash_flow": _val("operatingCashflow"),
        "recommendation": info.get("recommendationKey"),
        "analyst_count": _val("numberOfAnalystOpinions"),
        "target_mean": _val("targetMeanPrice"),
        "target_high": _val("targetHighPrice"),
        "target_low": _val("targetLowPrice"),
        "enterprise_value": _val("enterpriseValue"),
        "ev_ebitda": _val("enterpriseToEbitda"),
        "ev_revenue": _val("enterpriseToRevenue"),
        "price_to_book": _val("priceToBook"),
        "shares_outstanding": _val("sharesOutstanding"),
        "revenue_growth": _pct("revenueGrowth"),
        "earnings_growth": _pct("earningsGrowth"),
        "roa": _pct("returnOnAssets"),
    }

    performance = {
        "beta": _val("beta"),
        "week_52_high": _val("fiftyTwoWeekHigh"),
        "week_52_low": _val("fiftyTwoWeekLow"),
        "week_52_change": _pct("fiftyTwoWeekChange"),  # fraction → %
        "ma_50": _val("fiftyDayAverage"),
        "ma_200": _val("twoHundredDayAverage"),
        "return_1y": _pct("fiftyTwoWeekChange"),
    }

    data = {
        "profile": profile,
        "overview": overview,
        "performance": performance,
        "financial_currency": info.get("financialCurrency"),
    }
    _fund_cache[ticker] = {"data": data, "ts": now}
    log.info(f"[Yahoo fundamentals] {ticker} cached via yfinance")
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

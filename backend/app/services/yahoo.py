"""
Yahoo Finance Price Service
============================
Fetches real-time US stock prices using Yahoo Finance's public chart API.

Endpoint:
    GET https://query1.finance.yahoo.com/v8/finance/chart/{ticker}

No API key required. Cache TTL is short (default 2 min) since data is real-time.
"""

import json
import logging
import time
import urllib.request
from typing import Optional

from app.config import settings
from app.models import USPrice

log = logging.getLogger(__name__)

_cache: dict = {"data": {}, "ts": 0.0}


def _fetch_ticker(ticker: str) -> Optional[USPrice]:
    url = settings.YAHOO_API.format(ticker=ticker)
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            meta = json.loads(r.read().decode("utf-8", errors="ignore"))["chart"][
                "result"
            ][0]["meta"]

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
        )

    except Exception as exc:
        log.warning(f"[Yahoo] {ticker} failed: {exc}")
        return None


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

"""
NGX Price Service (BACKUP - Original version)
==============================================
Fetches all equity prices from the NGX doclib REST API.

Endpoint:
    GET https://doclib.ngxgroup.com/REST/api/statistics/equities/
        ?market=&sector=&orderby=&pageSize=300&pageNo=0

Notes:
    - The endpoint uses a self-signed / incomplete cert chain → SSL verification
      is disabled specifically for this host.
    - Data is 30-min delayed; we cache for NGX_PRICE_TTL seconds (default 15 min).
    - Multiple response shapes are handled (bare array, {"d": [...]}, etc.)
"""

import json
import logging
import time
import ssl
import urllib.request
from typing import Optional

from app.config import settings
from app.models import NGXPrice

log = logging.getLogger(__name__)

# ── SSL context: skip verification only for the NGX doclib host ───────────────
_SSL_UNVERIFIED = ssl.create_default_context()
_SSL_UNVERIFIED.check_hostname = False
_SSL_UNVERIFIED.verify_mode    = ssl.CERT_NONE

# ── In-memory cache ───────────────────────────────────────────────────────────
_cache: dict = {"data": {}, "ts": 0.0}

# ── Field name variants seen across NGX API versions ─────────────────────────
_SYMBOL_KEYS  = ("SYMBOL","Symbol","symbol","Ticker","TICKER")
_PRICE_KEYS   = ("PRICE","Price","price","LAST_PRICE","LastPrice",
                 "CLOSE_PRICE","ClosePrice","CurrentPrice","CURRENT_PRICE")
_CLOSE_KEYS   = ("CLOSE","Close","close","PREV_CLOSE","PrevClose",
                 "PREVIOUS_CLOSE","YesterdayPrice","YESTERDAY_PRICE")
_CHANGE_KEYS  = ("CHANGE","Change","change","PRICE_CHANGE","PriceChange")
_PCT_KEYS     = ("PERCENT_CHANGE","PercentChange","percent_change","PCT_CHANGE",
                 "ChangePercent","CHANGE_PERCENT","PERC_CHANGE","%CHANGE")
_HIGH_KEYS    = ("HIGH","High","high","DAY_HIGH","DayHigh")
_LOW_KEYS     = ("LOW","Low","low","DAY_LOW","DayLow")
_VOL_KEYS     = ("VOLUME","Volume","volume","TOTAL_VOLUME","TotalVolume",
                 "QTY_TRADED","TradeVolume")
_VALUE_KEYS   = ("VALUE","Value","value","TOTAL_VALUE","TotalValue",
                 "TRADE_VALUE","ValueTraded")


def _pick(rec: dict, keys: tuple) -> Optional[float]:
    for k in keys:
        v = rec.get(k)
        if v is not None and v != "":
            try:
                return float(str(v).replace(",", ""))
            except (ValueError, TypeError):
                pass
    return None


def _pick_str(rec: dict, keys: tuple) -> Optional[str]:
    for k in keys:
        v = rec.get(k)
        if v:
            return str(v).strip()
    return None


def _normalise(rec: dict) -> Optional[NGXPrice]:
    """Map a raw API record to an NGXPrice model. Returns None if unusable."""
    symbol = _pick_str(rec, _SYMBOL_KEYS)
    price  = _pick(rec, _PRICE_KEYS)
    if not symbol or price is None:
        return None

    close  = _pick(rec, _CLOSE_KEYS)
    change = _pick(rec, _CHANGE_KEYS)
    pct    = _pick(rec, _PCT_KEYS)

    # Derive missing fields where possible
    if change is None and close is not None:
        change = round(price - close, 4)
    if pct is None and close and close != 0 and change is not None:
        pct = round(change / close * 100, 4)

    return NGXPrice(
        symbol     = symbol,
        price      = price,
        close      = close,
        change     = change,
        change_pct = pct,
        high       = _pick(rec, _HIGH_KEYS),
        low        = _pick(rec, _LOW_KEYS),
        volume     = _pick(rec, _VOL_KEYS),
        value      = _pick(rec, _VALUE_KEYS),
    )


def _extract_records(data) -> list:
    """Extract the list of records from any supported response shape."""
    if isinstance(data, list):
        return data
    for key in ("d", "data", "result", "items", "equities", "Data"):
        if key in data and isinstance(data[key], list):
            return data[key]
    # Fall back to first list value found
    return next((v for v in data.values() if isinstance(v, list) and v), [])


def _fetch_page(page: int) -> list:
    url = (
        f"{settings.NGX_API_BASE}"
        f"?market=&sector=&orderby="
        f"&pageSize={settings.NGX_PAGE_SIZE}&pageNo={page}"
    )
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept":     "application/json",
        "Referer":    "https://ngxgroup.com/",
        "Origin":     "https://ngxgroup.com",
    })
    with urllib.request.urlopen(req, timeout=12, context=_SSL_UNVERIFIED) as r:
        return _extract_records(json.loads(r.read().decode("utf-8", errors="ignore")))


def get_prices() -> dict[str, NGXPrice]:
    """
    Return all NGX equity prices, using cache when fresh.
    Falls back to stale cache if the API is unreachable.
    """
    global _cache
    now = time.time()

    if _cache["data"] and (now - _cache["ts"]) < settings.NGX_PRICE_TTL:
        age = int(now - _cache["ts"])
        log.info(f"[NGX] cache hit — {len(_cache['data'])} tickers, {age}s old")
        return _cache["data"]

    log.info("[NGX] fetching from doclib.ngxgroup.com...")
    prices: dict[str, NGXPrice] = {}
    page = 0

    try:
        while True:
            records = _fetch_page(page)
            if not records:
                break

            for rec in records:
                n = _normalise(rec)
                if n and n.symbol not in prices:
                    prices[n.symbol] = n

            log.info(f"[NGX] page {page}: {len(records)} records")
            if len(records) < settings.NGX_PAGE_SIZE:
                break
            page += 1

        if not prices:
            raise ValueError("API returned 0 parseable records")

        log.info(f"[NGX] total tickers fetched: {len(prices)}")
        _cache = {"data": prices, "ts": now}
        return prices

    except Exception as exc:
        log.error(f"[NGX] fetch failed: {exc}")
        if _cache["data"]:
            log.warning("[NGX] returning stale cache")
            return _cache["data"]
        return {}


def cache_age() -> Optional[int]:
    return int(time.time() - _cache["ts"]) if _cache["ts"] else None

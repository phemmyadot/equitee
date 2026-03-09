"""
FX Rate Service — USD/NGN
==========================
Tries three free sources in order. Falls back to env var if all fail.

Source priority:
    1. open.er-api.com     — free JSON API, no key needed
    2. Google Finance      — scrape search result
    3. Wise public rates   — public endpoint
    4. USDNGN_FALLBACK     — value from .env (last resort)
"""

import json
import logging
import re
import time
import urllib.request
import urllib.parse
from typing import Optional

from app.config import settings

log = logging.getLogger(__name__)

_cache: dict = {"rate": None, "source": None, "ts": 0.0}

_RATE_MIN = 500
_RATE_MAX = 5000


def _http_get(url: str, timeout: int = 8) -> str:
    req = urllib.request.Request(url, headers={
        "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept":          "application/json, text/html, */*",
        "Accept-Language": "en-US,en;q=0.9",
    })
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", errors="ignore")


def _valid(rate: Optional[float]) -> bool:
    return rate is not None and _RATE_MIN < rate < _RATE_MAX


def _try_er_api() -> Optional[float]:
    try:
        data = json.loads(_http_get("https://open.er-api.com/v6/latest/USD"))
        rate = float(data["rates"]["NGN"])
        if _valid(rate):
            log.info(f"[FX] exchangerate-api → {rate}")
            return rate
    except Exception as exc:
        log.warning(f"[FX] exchangerate-api failed: {exc}")
    return None


def _try_google_finance() -> Optional[float]:
    try:
        q    = urllib.parse.quote("USD to NGN exchange rate")
        html = _http_get(f"https://www.google.com/search?q={q}&hl=en&gl=us", timeout=10)
        for pat in [
            r"([\d,]+\.?\d*)\s*Nigerian Naira",
            r"1 US Dollar\s*=\s*([\d,]+\.?\d*)\s*Nigerian",
        ]:
            m = re.search(pat, html, re.IGNORECASE)
            if m:
                rate = float(m.group(1).replace(",", ""))
                if _valid(rate):
                    log.info(f"[FX] google-finance → {rate}")
                    return rate
    except Exception as exc:
        log.warning(f"[FX] google-finance failed: {exc}")
    return None


def _try_wise() -> Optional[float]:
    try:
        data = json.loads(_http_get("https://wise.com/rates/live?source=USD&target=NGN"))
        rate = float(data["value"])
        if _valid(rate):
            log.info(f"[FX] wise → {rate}")
            return rate
    except Exception as exc:
        log.warning(f"[FX] wise failed: {exc}")
    return None


_SOURCES = [
    ("exchangerate-api", _try_er_api),
    ("google-finance",   _try_google_finance),
    ("wise",             _try_wise),
]


def get_rate() -> dict:
    """
    Return current USD/NGN rate with source metadata.
    Returns cached value if still fresh.
    """
    global _cache
    now = time.time()

    if _cache["rate"] and (now - _cache["ts"]) < settings.FX_TTL:
        return _cache

    for name, fn in _SOURCES:
        rate = fn()
        if rate:
            _cache = {"rate": rate, "source": name, "ts": now}
            return _cache

    # All sources failed — use fallback
    log.warning(f"[FX] all sources failed — using fallback {settings.USDNGN_FALLBACK}")
    _cache = {"rate": settings.USDNGN_FALLBACK, "source": "fallback (.env)", "ts": now}
    return _cache
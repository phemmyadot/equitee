"""
News Service
============
NGX  → Nairametrics RSS search  (nairametrics.com/?s={name}&feed=rss2)
US   → Yahoo Finance search API

Results are cached 30 minutes per ticker.
Only called for deep (Sonnet) analyses.
"""

from __future__ import annotations

import logging
import time
import urllib.request
import urllib.parse
import json
import xml.etree.ElementTree as ET
from typing import Optional

log = logging.getLogger(__name__)

_TTL = 1800  # 30 min
_cache: dict[str, tuple[float, list[dict]]] = {}

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "*/*",
}


# ── NGX: Nairametrics RSS ─────────────────────────────────────────────────────

def _nairametrics(query: str, count: int = 3) -> list[dict]:
    url = (
        f"https://nairametrics.com/?s={urllib.parse.quote(query)}&feed=rss2"
    )
    req = urllib.request.Request(url, headers=_HEADERS)
    with urllib.request.urlopen(req, timeout=6) as r:
        raw = r.read()

    root = ET.fromstring(raw)
    items = root.findall(".//item")
    results = []
    for item in items[:count]:
        title = (item.findtext("title") or "").strip()
        pub = (item.findtext("pubDate") or "").strip()
        if not title:
            continue
        # Parse age
        age_str = ""
        try:
            from email.utils import parsedate_to_datetime
            dt = parsedate_to_datetime(pub)
            age_h = int((time.time() - dt.timestamp()) / 3600)
            age_str = f"{age_h}h ago" if age_h < 168 else ""
        except Exception:
            pass
        results.append({"title": title, "publisher": "Nairametrics", "age": age_str})
    return results


# ── US: Yahoo Finance search ──────────────────────────────────────────────────

def _yahoo_finance(query: str, count: int = 3) -> list[dict]:
    url = (
        f"https://query2.finance.yahoo.com/v1/finance/search"
        f"?q={urllib.parse.quote(query)}&newsCount={count}&quotesCount=0"
        f"&enableFuzzyQuery=false&enableNavLinks=false"
    )
    req = urllib.request.Request(url, headers=_HEADERS)
    with urllib.request.urlopen(req, timeout=5) as r:
        data = json.loads(r.read())
    results = []
    for item in data.get("news", [])[:count]:
        title = (item.get("title") or "").strip()
        publisher = (item.get("publisher") or "").strip()
        ts = item.get("providerPublishTime", 0)
        if not title:
            continue
        age_h = int((time.time() - ts) / 3600) if ts else None
        age_str = f"{age_h}h ago" if age_h is not None and age_h < 168 else ""
        results.append({"title": title, "publisher": publisher, "age": age_str})
    return results


# ── Public API ────────────────────────────────────────────────────────────────

def fetch_news(ticker: str, name: str, market: str, n: int = 3) -> list[dict]:
    key = f"{market}:{ticker}"
    cached = _cache.get(key)
    if cached and time.time() - cached[0] < _TTL:
        return cached[1]

    try:
        if market == "ngx":
            # Search by company name — tickers alone yield nothing on Nairametrics
            results = _nairametrics(name, count=n)
        else:
            results = _yahoo_finance(ticker, count=n)
    except Exception as e:
        log.warning("News fetch failed for %s (%s): %s", ticker, market, e)
        results = []

    _cache[key] = (time.time(), results)
    return results


def fetch_news_for_holdings(
    holdings: list[dict],
    market: str,
    top_n: int = 3,
    headlines_per: int = 3,
) -> dict[str, list[dict]]:
    """Fetch news for the top_n holdings by equity value. Returns {ticker: headlines}."""
    equity_key = "equity_ngn" if market == "ngx" else "equity_usd"
    ranked = sorted(holdings, key=lambda h: h.get(equity_key, 0), reverse=True)[:top_n]
    result: dict[str, list[dict]] = {}
    for h in ranked:
        result[h["ticker"]] = fetch_news(h["ticker"], h.get("name", h["ticker"]), market, n=headlines_per)
    return result

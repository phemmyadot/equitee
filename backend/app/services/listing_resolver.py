"""
Listing Resolver
================
Some NGX-listed stocks are secondary listings (e.g. SEPLAT → London).
Their /statistics/ and /financials/ pages return 404 on the NGX path;
the real data lives on the primary exchange path (e.g. /quote/lon/SEPL/).

This module detects the correct base URL once per ticker and caches it
so only one extra HTTP request is ever made per ticker per process lifetime.
"""

import logging
import re
import requests
from typing import Optional

from app.config import settings

log = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# Cache: ticker → resolved base URL (e.g. "https://.../quote/lon/SEPL/")
_resolved: dict[str, str] = {}


def resolve_quote_base(ticker: str) -> str:
    """
    Return the base quote URL for a ticker.

    For normal NGX stocks: NGX_SOURCE_BASE_URL/quote/ngx/{ticker}/
    For dual-listed stocks: NGX_SOURCE_BASE_URL/quote/{exchange}/{primary_ticker}/

    The result is cached per process so resolution only happens once per ticker.
    """
    key = ticker.upper()
    if key in _resolved:
        return _resolved[key]

    ngx_base = f"{settings.NGX_SOURCE_BASE_URL.rstrip('/')}/quote/ngx/{ticker.lower()}/"

    # Quick probe: does the NGX statistics page exist?
    try:
        probe = requests.head(
            ngx_base + "statistics/", headers=_HEADERS, timeout=8, allow_redirects=True
        )
        if probe.status_code == 200:
            _resolved[key] = ngx_base
            return ngx_base
    except Exception:
        pass

    # Statistics page missing — scrape the NGX quote page for a main-listing link
    try:
        resp = requests.get(ngx_base, headers=_HEADERS, timeout=10)
        if resp.status_code == 200:
            match = re.search(
                r'href="(/quote/(?!ngx)[a-z]+/[A-Z0-9]+/)"', resp.text
            )
            if match:
                alt = settings.NGX_SOURCE_BASE_URL.rstrip("/") + match.group(1)
                log.info("[Resolver] %s → main listing %s", ticker, alt)
                _resolved[key] = alt
                return alt
    except Exception as exc:
        log.warning("[Resolver] %s: detection failed: %s", ticker, exc)

    # Fallback: use NGX path (will 404 on scrape, returning empty data)
    _resolved[key] = ngx_base
    return ngx_base

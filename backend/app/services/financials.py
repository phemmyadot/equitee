"""
Financials Service
==================
  - Earnings history: NGX_SOURCE_BASE_URL /financials/?p=quarterly
                      → Revenue, EPS, Net Income  (quarterly)
  - Balance sheet:    NGX_SOURCE_BASE_URL /financials/balance-sheet/
                      → Assets, Liabilities, Equity  (annual)

The pages are SvelteKit apps that embed financial data as a JSON blob inside
a <script> tag.  We extract the `financialData:{...}` object with regex instead
of parsing an HTML table (which is JS-rendered and invisible to BeautifulSoup).
"""

import json
import logging
import re
import time
from datetime import datetime, timezone
from typing import Optional
import requests

from app.config import settings
from app.db.engine import SessionLocal
from app.db import crud

log = logging.getLogger(__name__)

_cache:    dict = {}
_cache_ts: dict = {}

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


# ── helpers ───────────────────────────────────────────────────────────────────

def _fetch_text(url: str) -> Optional[str]:
    try:
        r = requests.get(url, headers=_HEADERS, timeout=15)
        r.raise_for_status()
        return r.text
    except Exception as exc:
        log.warning("[Financials] fetch failed %s: %s", url, exc)
        return None


def _extract_js_array(text: str, key: str) -> list:
    """
    Extract a named array from the embedded JS financialData blob.
    e.g. key='revenue' → [521342000000, 453347000000, ...]
    Data comes newest-first from the source.

    Handles JS quirks that are not valid JSON:
      - leading-dot floats:  .840  →  0.840
      - negative leading-dot: -.5  → -0.5
    """
    m = re.search(rf'\b{re.escape(key)}:\[([^\]]*)\]', text)
    if not m or not m.group(1).strip():
        return []
    raw = m.group(1)
    # Fix leading-dot floats (e.g. .84 → 0.84, -.84 → -0.84)
    raw = re.sub(r'(?<![0-9])(\.)([0-9])', r'0.\2', raw)
    raw = re.sub(r'(-)(0\.)([0-9])', r'-0.\3', raw)
    try:
        return json.loads(f'[{raw}]')
    except json.JSONDecodeError:
        return []


def _oldest_first(lst: list, n: int) -> list:
    """Take up to n items from the front (newest-first source) and reverse."""
    return list(reversed(lst[:n]))


def _has_data(result: dict) -> bool:
    """Return False if every value in all numeric arrays is None (stale/empty cache)."""
    for key in ("revenue", "eps", "net_income", "assets", "liabilities", "equity"):
        arr = result.get(key, [])
        if any(v is not None for v in arr):
            return True
    return False


# ── Earnings history ──────────────────────────────────────────────────────────

def get_earnings_history(ticker: str) -> Optional[dict]:
    """
    Returns dict (oldest → newest):
      {
        "periods":    ["Q1 2022", "Q2 2022", ...],   # up to 8 quarters
        "revenue":    [1.2e9, 1.4e9, ...],
        "eps":        [3.2, 4.1, ...],
        "net_income": [...],
      }
    """
    cache_key = f"earnings:{ticker.upper()}"
    now = time.time()

    # L1 — in-memory
    if cache_key in _cache and (now - _cache_ts.get(cache_key, 0)) < settings.FINANCIALS_TTL:
        return _cache[cache_key]

    # L2 — database
    db = SessionLocal()
    try:
        row = crud.get_financials_cache(db, ticker.upper(), "earnings")
        if row is not None:
            age = (datetime.now(timezone.utc) - row.fetched_at).total_seconds()
            result = crud.financials_row_to_dict(row)
            if age < settings.FINANCIALS_TTL and _has_data(result):
                _cache[cache_key]    = result
                _cache_ts[cache_key] = now
                log.debug("[Financials] earnings %s from DB (age %.0fs)", ticker, age)
                return result

        # Scrape — extract JSON blob from embedded JS
        url  = f"{settings.NGX_SOURCE_BASE_URL}/quote/ngx/{ticker.lower()}/financials/?p=quarterly"
        text = _fetch_text(url)
        if not text:
            return None

        fiscal_year    = _extract_js_array(text, "fiscalYear")
        fiscal_quarter = _extract_js_array(text, "fiscalQuarter")
        revenue        = _extract_js_array(text, "revenue")
        eps            = _extract_js_array(text, "epsBasic")
        net_income     = _extract_js_array(text, "netinc")

        if not fiscal_year:
            log.warning("[Financials] earnings %s: financialData not found in page", ticker)
            return None

        periods = [f"{q} {y}" for q, y in zip(fiscal_quarter, fiscal_year)]
        n = min(8, len(periods))

        result = {
            "periods":    _oldest_first(periods,    n),
            "revenue":    _oldest_first(revenue,    n),
            "eps":        _oldest_first(eps,        n),
            "net_income": _oldest_first(net_income, n),
        }

        crud.upsert_financials_cache(db, ticker.upper(), "earnings", result)
        _cache[cache_key]    = result
        _cache_ts[cache_key] = now
        log.info("[Financials] earnings %s → %d quarters", ticker, n)
        return result

    finally:
        db.close()


# ── Balance sheet ─────────────────────────────────────────────────────────────

def get_balance_sheet(ticker: str) -> Optional[dict]:
    """
    Returns dict (oldest → newest):
      {
        "periods":     ["2020", "2021", "2022", "2023"],
        "assets":      [...],
        "liabilities": [...],
        "equity":      [...],
      }
    """
    cache_key = f"balance:{ticker.upper()}"
    now = time.time()

    # L1 — in-memory
    if cache_key in _cache and (now - _cache_ts.get(cache_key, 0)) < settings.FINANCIALS_TTL:
        return _cache[cache_key]

    # L2 — database
    db = SessionLocal()
    try:
        row = crud.get_financials_cache(db, ticker.upper(), "balance")
        if row is not None:
            age = (datetime.now(timezone.utc) - row.fetched_at).total_seconds()
            result = crud.financials_row_to_dict(row)
            if age < settings.FINANCIALS_TTL and _has_data(result):
                _cache[cache_key]    = result
                _cache_ts[cache_key] = now
                log.debug("[Financials] balance sheet %s from DB (age %.0fs)", ticker, age)
                return result

        # Scrape
        url  = f"{settings.NGX_SOURCE_BASE_URL}/quote/ngx/{ticker.lower()}/financials/balance-sheet/"
        text = _fetch_text(url)
        if not text:
            return None

        fiscal_year   = _extract_js_array(text, "fiscalYear")
        assets        = _extract_js_array(text, "assets")
        liabilities   = _extract_js_array(text, "liabilitiesBank")
        equity        = _extract_js_array(text, "equity")

        if not fiscal_year:
            log.warning("[Financials] balance sheet %s: financialData not found in page", ticker)
            return None

        # Annual periods only (balance sheet is yearly) — deduplicate by fiscal year
        seen: set = set()
        idx: list = []
        for i, y in enumerate(fiscal_year):
            if y not in seen:
                seen.add(y)
                idx.append(i)

        n = min(4, len(idx))
        idx = idx[:n]   # newest first, then reverse

        result = {
            "periods":     list(reversed([fiscal_year[i]   for i in idx])),
            "assets":      list(reversed([assets[i]        for i in idx if i < len(assets)])),
            "liabilities": list(reversed([liabilities[i]   for i in idx if i < len(liabilities)])),
            "equity":      list(reversed([equity[i]        for i in idx if i < len(equity)])),
        }

        crud.upsert_financials_cache(db, ticker.upper(), "balance", result)
        _cache[cache_key]    = result
        _cache_ts[cache_key] = now
        log.info("[Financials] balance sheet %s → %d periods", ticker, n)
        return result

    finally:
        db.close()

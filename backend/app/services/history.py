"""
History Scraper Service
=======================
Fetches daily OHLCV price history from the stockanalysis.com /history/ page
and stores it in the daily_price_history table.

Primary source  : /quote/ngx/{ticker}/history/   (SvelteKit JS blob)
Fallback source : fetch_chart_history() from overview.py (quote page chart data)

The scraper checks the most recent date already stored and only re-fetches
when the stored data is stale (older than today for market hours, or missing).
"""

import logging
import re
import time
import requests
from datetime import date, timedelta
from typing import Optional

from app.config import settings
from app.db.engine import SessionLocal

log = logging.getLogger(__name__)

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
_HEADERS = {
    "User-Agent": _USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# In-memory flag to avoid re-scraping a ticker that already failed in this
# process lifetime (prevents hammering 404 pages on every /full request).
_no_history_page: set[str] = set()


def _scrape_history_page(ticker: str) -> list[dict]:
    """
    Fetch /quote/ngx/{ticker}/history/ and parse the SvelteKit data blob.

    The page embeds OHLCV data as an array of objects in the JS payload:
      data:[{a:<adj>,c:<close>,h:<high>,l:<low>,o:<open>,t:"YYYY-MM-DD",v:<volume>,ch:<chg_pct>},...]

    Returns list of dicts: [{date, close, open, high, low, volume, change_pct}]
    sorted oldest → newest, or [] if the page is missing or unparseable.
    """
    if ticker.upper() in _no_history_page:
        return []

    url = f"{settings.NGX_SOURCE_BASE_URL}/quote/ngx/{ticker.lower()}/history/"
    try:
        resp = requests.get(url, headers=_HEADERS, timeout=20)
        if resp.status_code == 404:
            log.info("[History] No history page for %s (404)", ticker)
            _no_history_page.add(ticker.upper())
            return []
        resp.raise_for_status()
        text = resp.text
    except Exception as exc:
        log.error("[History] Fetch failed for %s: %s", ticker, exc)
        return []

    # Find all OHLCV object literals in the SvelteKit payload.
    # Each entry looks like: {a:810,c:810,h:810,l:810,o:810,t:"2026-03-18",v:75235190,ch:0}
    raw_objects = re.findall(r'\{[^{}]*?t:"(\d{4}-\d{2}-\d{2})"[^{}]*?\}', text)
    if not raw_objects:
        log.warning("[History] Could not find date entries for %s", ticker)
        _no_history_page.add(ticker.upper())
        return []

    # Re-scan to grab full object bodies for key-value parsing
    full_objects = re.findall(r'\{([^{}]*?t:"\d{4}-\d{2}-\d{2}"[^{}]*?)\}', text)
    if not full_objects:
        _no_history_page.add(ticker.upper())
        return []

    def _parse_obj(body: str) -> dict:
        """Extract all key:(numeric or quoted-string) pairs from a JS object body."""
        result = {}
        for k, v in re.findall(r'(\w+):(-?[\d.]+|"[^"]*")', body):
            result[k] = v.strip('"')
        return result

    def _f(d: dict, key: str) -> Optional[float]:
        v = d.get(key)
        if v is None or v == "":
            return None
        try:
            return float(v)
        except ValueError:
            return None

    rows = []
    for body in full_objects:
        d = _parse_obj(body)
        date_s = d.get("t")
        if not date_s or not re.match(r"\d{4}-\d{2}-\d{2}", date_s):
            continue
        close_val = _f(d, "c")
        if close_val is None:
            continue
        rows.append(
            {
                "date": date_s,
                "close": close_val,
                "open": _f(d, "o"),
                "high": _f(d, "h"),
                "low": _f(d, "l"),
                "volume": _f(d, "v"),
                "change_pct": _f(d, "ch"),
                "source": "history",
            }
        )

    rows.sort(key=lambda r: r["date"])
    log.info("[History] Scraped %d rows for %s from history page", len(rows), ticker)
    return rows


def _fallback_chart_rows(ticker: str, days: int = 400) -> list[dict]:
    """Use fetch_chart_history as fallback and convert to daily_price_history format."""
    from app.services.overview import fetch_chart_history

    chart_rows = fetch_chart_history(ticker, days=days)
    result = []
    for r in chart_rows:
        result.append(
            {
                "date": r["ts"][:10],
                "close": r.get("price"),
                "open": None,
                "high": None,
                "low": None,
                "volume": None,
                "change_pct": r.get("change_pct"),
                "source": "chart",
            }
        )
    return result


def refresh_ticker_history(ticker: str, force: bool = False) -> int:
    """
    Ensure the daily_price_history table is up to date for this ticker.

    Logic:
    1. If the latest stored date is already today, skip (already current).
    2. Scrape the history page for new rows (dates after latest stored).
    3. If the history page returned data AND the oldest stored date is less
       than 400 days back, backfill older dates from the chart scraper so
       that volatility/MA calculations have a full dataset immediately.
    4. If the history page returned nothing, fall back entirely to the chart
       scraper (covers tickers whose history page returns 404).

    Returns the total number of rows upserted.
    """
    from app.db.crud import (
        get_latest_daily_date,
        get_oldest_daily_date,
        upsert_daily_price_rows,
    )

    t = ticker.upper()
    today = date.today().isoformat()

    with SessionLocal() as db:
        latest = get_latest_daily_date(db, t)

        if not force and latest and latest >= today:
            log.debug("[History] %s already current (latest=%s)", t, latest)
            return 0

        total = 0

        # ── Step 1: scrape history page for recent rows ────────────────────
        history_rows = _scrape_history_page(t)
        new_rows = [r for r in history_rows if not latest or r["date"] > latest]
        if new_rows:
            total += upsert_daily_price_rows(db, t, new_rows)

        # ── Step 2: backfill older data from chart scraper ─────────────────
        # Only needed when the history page provided data (i.e. page exists)
        # and we don't yet have 400 days of history.
        if history_rows:
            oldest = get_oldest_daily_date(db, t)
            cutoff = (date.today() - timedelta(days=395)).isoformat()
            if oldest and oldest > cutoff:
                chart_rows = _fallback_chart_rows(t, days=400)
                older_rows = [r for r in chart_rows if r["date"] < oldest]
                if older_rows:
                    log.info(
                        "[History] Backfilling %d older rows for %s (oldest was %s)",
                        len(older_rows),
                        t,
                        oldest,
                    )
                    total += upsert_daily_price_rows(db, t, older_rows)

        # ── Step 3: full fallback when history page returned nothing ───────
        if not history_rows:
            chart_rows = _fallback_chart_rows(t, days=400)
            new_chart = [r for r in chart_rows if not latest or r["date"] > latest]
            if new_chart:
                total += upsert_daily_price_rows(db, t, new_chart)

        if total == 0:
            log.info("[History] No new rows for %s", t)
        return total


def get_ticker_prices_from_db(ticker: str, days: int = 400) -> list[dict]:
    """
    Return daily price rows from DB for the given ticker and day window.
    Triggers a refresh if data is stale. Returns list of {ts, price, change_pct}.
    """
    from app.db.crud import get_daily_price_history, get_latest_daily_date

    t = ticker.upper()

    # Refresh if stale (non-blocking best-effort — errors logged, not raised)
    try:
        refresh_ticker_history(t)
    except Exception as exc:
        log.warning("[History] refresh failed for %s: %s", t, exc)

    with SessionLocal() as db:
        return get_daily_price_history(db, t, days)

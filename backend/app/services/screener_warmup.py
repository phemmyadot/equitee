"""
Screener Cache Warm-up
======================
Runs once per calendar day (gated by _last_warmup_date) in a background
daemon thread.  Fetches overview, performance, and profile for every NGX
ticker so the screener shows full fundamentals for all stocks, not just
the ones the user has personally viewed.

Called from main.py lifespan on startup.
"""

from __future__ import annotations

import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date

log = logging.getLogger(__name__)

_last_warmup_date: date | None = None
_warmup_lock = threading.Lock()

# Throttle: max concurrent scrapers and pause between each to avoid rate limiting
_MAX_WORKERS = 5
_SLEEP_BETWEEN_TICKERS = 0.3  # seconds


def _fetch_one(ticker: str) -> str:
    """Fetch overview + performance + profile for a single ticker."""
    from app.services.performance import get_overview
    from app.services.overview import get_performance
    from app.services.profile import get_profile

    try:
        get_overview(ticker)
    except Exception as exc:
        log.debug("[Warmup] overview failed for %s: %s", ticker, exc)

    time.sleep(_SLEEP_BETWEEN_TICKERS)

    try:
        get_performance(ticker)
    except Exception as exc:
        log.debug("[Warmup] performance failed for %s: %s", ticker, exc)

    time.sleep(_SLEEP_BETWEEN_TICKERS)

    try:
        get_profile(ticker)
    except Exception as exc:
        log.debug("[Warmup] profile failed for %s: %s", ticker, exc)

    return ticker


def warm_screener(force: bool = False) -> None:
    """
    Populate the per-ticker fundamentals caches for every NGX ticker.
    Skips if already run today unless force=True.
    """
    global _last_warmup_date
    today = date.today()

    with _warmup_lock:
        if not force and _last_warmup_date == today:
            log.info("[Warmup] already ran today (%s) — skipping", today)
            return
        _last_warmup_date = today

    from app.services.ngx import get_prices
    tickers = list(get_prices().keys())
    if not tickers:
        log.warning("[Warmup] no NGX tickers available — aborting")
        return

    log.info("[Warmup] starting screener cache warm-up for %d tickers", len(tickers))
    t0 = time.time()
    done = 0

    with ThreadPoolExecutor(max_workers=_MAX_WORKERS) as pool:
        futures = {pool.submit(_fetch_one, t): t for t in tickers}
        for fut in as_completed(futures):
            done += 1
            if done % 20 == 0:
                log.info("[Warmup] %d / %d tickers done", done, len(tickers))

    elapsed = int(time.time() - t0)
    log.info("[Warmup] screener warm-up complete — %d tickers in %ds", len(tickers), elapsed)


def start_background_warmup() -> None:
    """Kick off warm_screener() in a daemon thread so startup is not blocked."""
    t = threading.Thread(target=warm_screener, daemon=True, name="screener-warmup")
    t.start()

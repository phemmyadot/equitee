"""
Watchlist Router
================
GET    /api/watchlist             — list watched tickers with full ticker data
POST   /api/watchlist/{ticker}    — add ticker to watchlist
DELETE /api/watchlist/{ticker}    — remove ticker from watchlist
GET    /api/watchlist/check/{ticker} — is this ticker on the watchlist?
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy.orm import Session

from app.db.engine import get_db
from app.db.models import User
from app.db.crud import (
    get_watchlist, watchlist_has,
    add_to_watchlist, remove_from_watchlist,
)
from app.auth.dependencies import get_current_user

from app.services.profile     import get_profile as _get_profile
from app.services import ngx          as _ngx_service
from app.services import prices       as _prices_service
from app.services import performance  as _overview_service
from app.services import overview     as _performance_service

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


def _safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception:
        return None


def _fetch_ticker_full(ticker: str) -> dict[str, Any]:
    """Fetch price + profile + overview + performance in parallel (same as /full)."""
    with ThreadPoolExecutor(max_workers=3) as ex:
        f_profile  = ex.submit(_safe, _get_profile, ticker)
        f_overview = ex.submit(_safe, _overview_service.get_overview, ticker)
        f_perf     = ex.submit(_safe, _performance_service.get_performance, ticker)
        f_price    = ex.submit(_safe, _prices_service.get_price, ticker)
        f_intraday = ex.submit(_safe, _ngx_service._get_quote_intraday, ticker)

    profile_raw = f_profile.result()
    ov_raw      = f_overview.result()
    perf_raw    = f_perf.result()
    pd          = f_price.result()
    intraday    = f_intraday.result() or {}

    price_out = None
    if pd:
        price_out = {
            "symbol":     ticker,
            "price":      intraday.get("price") or pd.price,
            "change":     intraday.get("change") or pd.change,
            "change_pct": intraday.get("change_pct") or pd.change_pct,
            "volume":     intraday.get("volume") or pd.volume,
        }

    return {
        "ticker":      ticker,
        "price":       price_out,
        "profile":     profile_raw,
        "overview":    ov_raw,
        "performance": perf_raw,
        "cached_at":   None,
    }


# ── Response models ────────────────────────────────────────────────────────────

class WatchlistItem(BaseModel):
    ticker:           str
    market:           str
    added_at:         str
    added_price:      Optional[float] = None
    since_added_pct:  Optional[float] = None
    price:            Optional[dict[str, Any]] = None
    profile:          Optional[dict[str, Any]] = None
    overview:         Optional[dict[str, Any]] = None
    performance:      Optional[dict[str, Any]] = None


class WatchlistResponse(BaseModel):
    items: list[WatchlistItem]
    count: int


class WatchCheckResponse(BaseModel):
    ticker:     str
    watching:   bool


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/check/{ticker}", response_model=WatchCheckResponse)
def check_watchlist(
    ticker:       str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    return WatchCheckResponse(
        ticker   = ticker.upper(),
        watching = watchlist_has(db, current_user.id, ticker),
    )


@router.get("", response_model=WatchlistResponse)
def list_watchlist(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    rows = get_watchlist(db, current_user.id)
    if not rows:
        return WatchlistResponse(items=[], count=0)

    # Fetch all tickers in parallel (one thread per ticker, max 10)
    tickers = [r.ticker for r in rows]
    row_map = {r.ticker: r for r in rows}

    with ThreadPoolExecutor(max_workers=min(len(tickers), 10)) as ex:
        futures = {ex.submit(_fetch_ticker_full, t): t for t in tickers}
        results: dict[str, dict] = {}
        from concurrent.futures import as_completed
        for future in as_completed(futures):
            t = futures[future]
            results[t] = future.result()

    items = []
    for r in rows:
        td = results.get(r.ticker, {})
        current_price: float | None = (td.get("price") or {}).get("price")
        # Backfill added_price for rows that pre-date this feature
        if r.added_price is None and current_price:
            r.added_price = current_price
            db.flush()
        since_added_pct: float | None = None
        if r.added_price and current_price:
            since_added_pct = round((current_price - r.added_price) / r.added_price * 100, 2)
        items.append(WatchlistItem(
            ticker           = r.ticker,
            market           = r.market,
            added_at         = r.added_at.isoformat(),
            added_price      = r.added_price,
            since_added_pct  = since_added_pct,
            price            = td.get("price"),
            profile          = td.get("profile"),
            overview         = td.get("overview"),
            performance      = td.get("performance"),
        ))

    db.commit()
    return WatchlistResponse(items=items, count=len(items))


@router.post("/{ticker}", status_code=201)
def add_watch(
    ticker:       str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    t = ticker.upper()
    if watchlist_has(db, current_user.id, t):
        raise HTTPException(status_code=409, detail=f"{t} is already on your watchlist")
    pd = _safe(_prices_service.get_price, t)
    added_price: float | None = pd.price if pd else None
    row = add_to_watchlist(db, current_user.id, t, added_price=added_price)
    return {"ticker": row.ticker, "market": row.market, "added_at": row.added_at.isoformat()}


@router.delete("/{ticker}", status_code=200)
def remove_watch(
    ticker:       str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    t = ticker.upper()
    removed = remove_from_watchlist(db, current_user.id, t)
    if not removed:
        raise HTTPException(status_code=404, detail=f"{t} not found on your watchlist")
    return {"ticker": t, "removed": True}

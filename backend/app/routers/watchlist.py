"""
Watchlist Router
================
GET    /api/watchlist             — list watched tickers with full ticker data
POST   /api/watchlist/{ticker}    — add ticker to watchlist
DELETE /api/watchlist/{ticker}    — remove ticker from watchlist
GET    /api/watchlist/check/{ticker} — is this ticker on the watchlist?
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Any
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy.orm import Session

from app.db.engine import get_db
from app.db.models import User
from app.db.crud import (
    get_watchlist,
    add_to_watchlist,
    remove_from_watchlist,
    check_and_trigger_alerts,
    get_alerts,
    get_daily_price_history,
    watchlist_has,
)
from app.auth.dependencies import get_current_user

from app.services import ngx_job as _ngx_job
from app.services import yahoo as _yahoo_service

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


def _safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception:
        return None


def _fetch_ticker_full(ticker: str, market: str = "NGX") -> dict[str, Any]:
    """Return price + profile + overview + performance for a ticker. NGX reads from DB."""
    if market == "US":
        with ThreadPoolExecutor(max_workers=2) as ex:
            f_price = ex.submit(_safe, _yahoo_service.get_price, ticker)
            f_fund = ex.submit(_safe, _yahoo_service.get_fundamentals, ticker)
        pd = f_price.result()
        fund = f_fund.result() or {}

        price_out = None
        if pd:
            price_out = {
                "symbol": ticker,
                "price": pd.price,
                "change": pd.change,
                "change_pct": pd.change_pct,
                "volume": pd.volume,
                "currency": pd.currency,
            }

        prof = fund.get("profile") or {}
        if pd and pd.name and not prof.get("name"):
            prof = {**prof, "name": pd.name}

        return {
            "ticker": ticker,
            "price": price_out,
            "profile": prof or None,
            "overview": fund.get("overview"),
            "performance": fund.get("performance"),
            "cached_at": None,
        }

    # NGX path — read everything from DB cache
    row = _ngx_job.get_ticker(ticker)
    if not row:
        return {"ticker": ticker, "price": None, "profile": None, "overview": None, "performance": None, "cached_at": None}

    price_out = None
    if row.get("price") is not None:
        price_out = {
            "symbol": ticker,
            "price": row["price"],
            "change": row["change"],
            "change_pct": row["change_pct"],
            "volume": row["volume"],
            "high": row["high"],
            "low": row["low"],
        }

    profile_out = {k: row.get(k) for k in ("name", "sector", "industry", "description", "website", "headquarters", "founded", "employees")} if row.get("name") else None

    overview_out = {k: row.get(k) for k in ("market_cap", "pe_ratio", "eps", "book_value", "dividend_yield", "roe", "roa", "debt_to_equity", "current_ratio", "gross_margin", "net_margin", "revenue", "net_income")} if row.get("market_cap") else None

    performance_out = {k: row.get(k) for k in ("beta", "week_52_high", "week_52_low", "week_52_change", "return_1y", "return_ytd", "return_1m", "return_3m", "return_6m", "volatility", "sharpe_ratio", "max_drawdown", "rsi_14", "ma_50", "ma_200", "golden_cross", "piotroski_score", "altman_zscore")} if row.get("week_52_high") else None

    return {
        "ticker": ticker,
        "price": price_out,
        "profile": profile_out,
        "overview": overview_out,
        "performance": performance_out,
        "cached_at": row.get("fundamentals_updated_at"),
    }


# ── Response models ────────────────────────────────────────────────────────────


class SparklinePoint(BaseModel):
    ts: str
    price: Optional[float] = None
    change_pct: Optional[float] = None


class WatchlistItem(BaseModel):
    ticker: str
    market: str
    added_at: str
    added_price: Optional[float] = None
    since_added_pct: Optional[float] = None
    price: Optional[dict[str, Any]] = None
    profile: Optional[dict[str, Any]] = None
    overview: Optional[dict[str, Any]] = None
    performance: Optional[dict[str, Any]] = None


class TriggeredAlert(BaseModel):
    id: int
    ticker: str
    market: str
    threshold_price: float
    direction: str
    triggered_at: Optional[str] = None
    note: Optional[str] = None


class AlertOut(BaseModel):
    id: int
    ticker: str
    market: str
    threshold_price: float
    direction: str
    is_active: bool
    triggered_at: Optional[str] = None
    note: Optional[str] = None
    created_at: str


class WatchlistResponse(BaseModel):
    items: list[WatchlistItem]
    count: int
    triggered_alerts: list[TriggeredAlert] = []
    alerts: list[AlertOut] = []
    last_updated: Optional[str] = None
    price_histories: dict[str, list[SparklinePoint]] = {}


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get("", response_model=WatchlistResponse)
def list_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = get_watchlist(db, current_user.id)
    if not rows:
        all_alerts = get_alerts(db, current_user.id)
        alerts_out = [
            AlertOut(
                id=a.id, ticker=a.ticker, market=a.market,
                threshold_price=a.threshold_price, direction=a.direction,
                is_active=a.is_active,
                triggered_at=a.triggered_at.isoformat() if a.triggered_at else None,
                note=a.note, created_at=a.created_at.isoformat(),
            )
            for a in all_alerts
        ]
        return WatchlistResponse(items=[], count=0, alerts=alerts_out, last_updated=(_ngx_job.last_updated().isoformat() if _ngx_job.last_updated() else None))

    # Separate NGX and US tickers for optimized batch loading
    row_map = {r.ticker: r for r in rows}
    ngx_tickers = [r.ticker for r in rows if r.market.upper() == "NGX"]
    us_tickers = [r.ticker for r in rows if r.market.upper() == "US"]

    # Batch-load NGX tickers from cache (1 query, not per-ticker)
    ngx_cache = {}
    if ngx_tickers:
        ngx_all = _ngx_job.get_all()
        ngx_cache = {t["ticker"]: t for t in ngx_all if t["ticker"] in [ut.upper() for ut in ngx_tickers]}

    # Fetch US tickers in parallel (increased workers from 10 to 20)
    results: dict[str, dict] = {}
    if us_tickers:
        with ThreadPoolExecutor(max_workers=min(len(us_tickers), 20)) as ex:
            futures = {ex.submit(_fetch_ticker_full, t, "US"): t for t in us_tickers}
            from concurrent.futures import as_completed
            for future in as_completed(futures):
                t = futures[future]
                results[t] = future.result()

    # Fetch NGX tickers in parallel (but use cache first for faster response)
    if ngx_tickers:
        def _fetch_ngx_with_cache(ticker):
            cached = ngx_cache.get(ticker.upper())
            if cached:
                return {
                    "ticker": ticker,
                    "price": {
                        "symbol": ticker,
                        "price": cached.get("price"),
                        "change": cached.get("change"),
                        "change_pct": cached.get("change_pct"),
                        "volume": cached.get("volume"),
                        "high": cached.get("high"),
                        "low": cached.get("low"),
                    } if cached.get("price") else None,
                    "profile": {k: cached.get(k) for k in ("name", "sector", "industry", "description", "website", "headquarters", "founded", "employees")} if cached.get("name") else None,
                    "overview": {k: cached.get(k) for k in ("market_cap", "pe_ratio", "eps", "book_value", "dividend_yield", "roe", "roa", "debt_to_equity", "current_ratio", "gross_margin", "net_margin", "revenue", "net_income")} if cached.get("market_cap") else None,
                    "performance": {k: cached.get(k) for k in ("beta", "week_52_high", "week_52_low", "week_52_change", "return_1y", "return_ytd", "return_1m", "return_3m", "return_6m", "volatility", "sharpe_ratio", "max_drawdown", "rsi_14", "ma_50", "ma_200", "golden_cross", "piotroski_score", "altman_zscore")} if cached.get("week_52_high") else None,
                    "cached_at": cached.get("cached_at"),
                }
            return _fetch_ticker_full(ticker, "NGX")

        with ThreadPoolExecutor(max_workers=min(len(ngx_tickers), 10)) as ex:
            futures = {ex.submit(_fetch_ngx_with_cache, t): t for t in ngx_tickers}
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
            since_added_pct = round(
                (current_price - r.added_price) / r.added_price * 100, 2
            )
        items.append(
            WatchlistItem(
                ticker=r.ticker,
                market=r.market,
                added_at=r.added_at.isoformat(),
                added_price=r.added_price,
                since_added_pct=since_added_pct,
                price=td.get("price"),
                profile=td.get("profile"),
                overview=td.get("overview"),
                performance=td.get("performance"),
            )
        )

    # ── Passive alert check ───────────────────────────────────────────────────
    ticker_prices: dict[str, float | None] = {}
    for r in rows:
        price_val = (results.get(r.ticker) or {}).get("price") or {}
        ticker_prices[r.ticker] = price_val.get("price") if isinstance(price_val, dict) else None

    newly_triggered = check_and_trigger_alerts(db, current_user.id, ticker_prices)

    # Also collect alerts that were already triggered (not yet seen by UI)
    all_alerts = get_alerts(db, current_user.id)
    triggered_out = [
        TriggeredAlert(
            id=a.id,
            ticker=a.ticker,
            market=a.market,
            threshold_price=a.threshold_price,
            direction=a.direction,
            triggered_at=a.triggered_at.isoformat() if a.triggered_at else None,
            note=a.note,
        )
        for a in all_alerts
        if not a.is_active and a.triggered_at is not None
    ]

    alerts_out = [
        AlertOut(
            id=a.id,
            ticker=a.ticker,
            market=a.market,
            threshold_price=a.threshold_price,
            direction=a.direction,
            is_active=a.is_active,
            triggered_at=a.triggered_at.isoformat() if a.triggered_at else None,
            note=a.note,
            created_at=a.created_at.isoformat(),
        )
        for a in all_alerts
    ]

    # ── Price histories for NGX sparklines (from DB, no extra HTTP calls) ────
    price_histories: dict[str, list[SparklinePoint]] = {}
    for r in rows:
        if r.market == "NGX":
            try:
                ph_rows = get_daily_price_history(db, r.ticker, 90)
                price_histories[r.ticker] = [
                    SparklinePoint(ts=row["ts"], price=row.get("price"), change_pct=row.get("change_pct"))
                    for row in ph_rows
                ]
            except Exception:
                price_histories[r.ticker] = []

    db.commit()
    return WatchlistResponse(
        items=items,
        count=len(items),
        triggered_alerts=triggered_out,
        alerts=alerts_out,
        last_updated=(_ngx_job.last_updated().isoformat() if _ngx_job.last_updated() else None),
        price_histories=price_histories,
    )


@router.post("/{ticker}", status_code=201)
def add_watch(
    ticker: str,
    market: str = Query("NGX", pattern="^(NGX|US)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t = ticker.upper()
    if watchlist_has(db, current_user.id, t):
        raise HTTPException(status_code=409, detail=f"{t} is already on your watchlist")
    if market == "US":
        pd = _safe(_yahoo_service.get_price, t)
    else:
        pd = _safe(_ngx_job.get_price, t)
    if pd is None:
        raise HTTPException(status_code=404, detail=f"{t} not found on {market}")
    added_price: float | None = pd.price
    row = add_to_watchlist(db, current_user.id, t, market=market, added_price=added_price)
    return {
        "ticker": row.ticker,
        "market": row.market,
        "added_at": row.added_at.isoformat(),
    }


@router.delete("/{ticker}", status_code=200)
def remove_watch(
    ticker: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t = ticker.upper()
    removed = remove_from_watchlist(db, current_user.id, t)
    if not removed:
        raise HTTPException(status_code=404, detail=f"{t} not found on your watchlist")
    return {"ticker": t, "removed": True}

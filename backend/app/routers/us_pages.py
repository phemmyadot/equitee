"""
US Page Endpoints
=================
GET /api/us/home      — US portfolio home: KPIs + stocks + sectors + meta
GET /api/us/{ticker}  — US ticker all-in-one: price + profile + overview + performance
                        + price_history + is_watching in a single request
"""

import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.engine import get_db
from app.db.models import User
from app.db.crud import watchlist_has
from app.auth.dependencies import get_current_user
from app.services import yahoo as _yahoo
from app.services.portfolio import (
    build_stock_rows, build_sectors, load_holdings_from_db, _US_AVG_CPI, _sum,
)
from app.models import StockRow, SectorRow, USKPIs

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/us", tags=["us-pages"])


# ── Response models ────────────────────────────────────────────────────────────

class UsHomeMeta(BaseModel):
    prices_live: int
    prices_total: int
    price_source: str
    price_age: Optional[int] = None


class UsHomeResponse(BaseModel):
    kpis: USKPIs
    stocks: list[StockRow]
    sectors: list[SectorRow]
    meta: UsHomeMeta


class UsTickerPrice(BaseModel):
    price: Optional[float] = None
    change: Optional[float] = None
    change_pct: Optional[float] = None
    volume: Optional[float] = None


class UsTickerPriceHistory(BaseModel):
    dates: list[str]
    close: list[Optional[float]]
    change_pct: list[Optional[float]]


class UsTickerResponse(BaseModel):
    ticker: str
    price: Optional[UsTickerPrice] = None
    profile: Optional[dict[str, Any]] = None
    overview: Optional[dict[str, Any]] = None
    performance: Optional[dict[str, Any]] = None
    price_history: Optional[UsTickerPriceHistory] = None
    is_watching: bool = False


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/home", response_model=UsHomeResponse)
def us_home(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    holdings = load_holdings_from_db(db, current_user.id)
    us_tickers = [h["ticker"] for h in holdings["us"]]
    us_prices = _yahoo.get_prices(us_tickers)

    stocks = build_stock_rows(holdings["us"], us_prices, "yahoo", avg_cpi=_US_AVG_CPI)
    sectors = build_sectors(stocks)

    equity = _sum(stocks, "CurrentEquity")
    cost = _sum(stocks, "RemainingCost")
    unrealized = _sum(stocks, "UnrealizedPL")
    ret_pct = (unrealized / cost * 100) if cost else 0

    kpis = USKPIs(
        equity=equity,
        cost=cost,
        gain=unrealized,
        return_pct=ret_pct,
        positions=sum(1 for s in stocks if s.IsActive),
    )

    return UsHomeResponse(
        kpis=kpis,
        stocks=stocks,
        sectors=sectors,
        meta=UsHomeMeta(
            prices_live=sum(1 for s in stocks if s.LivePrice is not None),
            prices_total=len(stocks),
            price_source="Yahoo Finance",
            price_age=_yahoo.cache_age(),
        ),
    )


@router.get("/{ticker}", response_model=UsTickerResponse)
def us_ticker(
    ticker: str,
    days: int = 90,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t = ticker.upper()

    def _safe(fn, *args):
        try:
            return fn(*args)
        except Exception as e:
            log.warning("us_ticker _safe %s: %s", fn.__name__, e)
            return None

    with ThreadPoolExecutor(max_workers=3) as ex:
        f_price = ex.submit(_safe, _yahoo.get_price, t)
        f_fund = ex.submit(_safe, _yahoo.get_fundamentals, t)
        f_hist = ex.submit(_safe, _yahoo.get_price_history, t, days)

    pd = f_price.result()
    fund = f_fund.result() or {}
    hist_rows = f_hist.result() or []

    price_out = None
    if pd:
        price_out = UsTickerPrice(
            price=pd.price,
            change=pd.change,
            change_pct=pd.change_pct,
            volume=pd.volume,
        )

    prof = dict(fund.get("profile") or {})
    if pd and pd.name and not prof.get("name"):
        prof["name"] = pd.name

    hist_out = None
    if hist_rows:
        hist_out = UsTickerPriceHistory(
            dates=[r["ts"] for r in hist_rows],
            close=[r["price"] for r in hist_rows],
            change_pct=[r["change_pct"] for r in hist_rows],
        )

    is_watching = watchlist_has(db, current_user.id, t)

    return UsTickerResponse(
        ticker=t,
        price=price_out,
        profile=prof or None,
        overview=fund.get("overview"),
        performance=fund.get("performance"),
        price_history=hist_out,
        is_watching=is_watching,
    )

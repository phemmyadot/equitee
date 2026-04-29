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
from app.db.crud import watchlist_has, get_price_history, get_cash_balance
from app.auth.dependencies import get_current_user
from app.services import yahoo as _yahoo
from app.services.portfolio import (
    build_stock_rows, build_sectors, load_holdings_from_db, _US_AVG_CPI, _sum,
)
from app.models import StockRow, SectorRow, USKPIs

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/us", tags=["us-pages"])


# ── Response models ────────────────────────────────────────────────────────────

class SparklinePoint(BaseModel):
    ts: str
    price: Optional[float] = None
    change_pct: Optional[float] = None


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
    price_histories: dict[str, list[SparklinePoint]] = {}
    div_payout: Optional[float] = None


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
    us_holdings = holdings["us"]
    us_tickers = [h["ticker"] for h in us_holdings]
    us_prices = _yahoo.get_prices(us_tickers)

    stocks = build_stock_rows(us_holdings, us_prices, "yahoo", avg_cpi=_US_AVG_CPI)
    sectors = build_sectors(stocks)

    # Fetch fundamentals in parallel and embed into stock rows
    fund_map: dict[str, dict] = {}
    if us_tickers:
        futures: dict[str, Any] = {}
        with ThreadPoolExecutor(max_workers=min(len(us_tickers), 10)) as ex:
            for t in us_tickers:
                futures[t] = ex.submit(_yahoo.get_fundamentals, t)
        for t, f in futures.items():
            try:
                fund_map[t] = f.result() or {}
            except Exception:
                fund_map[t] = {}

    for row in stocks:
        f = fund_map.get(row.Ticker) or {}
        ov = f.get("overview") or {}
        perf = f.get("performance") or {}
        row.PeRatio = ov.get("pe_ratio")
        row.Roe = ov.get("roe")
        row.Eps = ov.get("eps")
        row.BookValue = ov.get("book_value")
        row.DividendYield = ov.get("dividend_yield")
        row.Beta = perf.get("beta")
        row.Ma50 = perf.get("ma_50")
        row.Ma200 = perf.get("ma_200")
        row.Week52High = perf.get("week_52_high")
        row.Week52Low = perf.get("week_52_low")

    equity = _sum(stocks, "CurrentEquity")
    cost = _sum(stocks, "RemainingCost")
    unrealized = _sum(stocks, "UnrealizedPL")
    ret_pct = (unrealized / cost * 100) if cost else 0

    # Realized P/L: closed US positions + partial realized on active holdings
    sold = holdings.get("sold", [])
    us_realized = (
        sum(float(s["realized_pl"]) for s in sold if (s.get("market") or "").upper() == "US") +
        sum(float(h.get("realized_pl", 0)) for h in us_holdings)
    )

    cash = get_cash_balance(db, current_user.id)
    cash_balance_ngn = round(float(cash.get("ngn") or 0), 2)

    # Annual dividend payout from US holdings
    div_payout: Optional[float] = None
    dp_total = sum(
        float(h["shares"]) * float(ov_r)
        for h in us_holdings
        if (ov_r := (fund_map.get(h["ticker"]) or {}).get("overview", {}).get("dividend_rate"))
    )
    if dp_total > 0:
        div_payout = round(dp_total, 2)

    kpis = USKPIs(
        equity=equity,
        cost=cost,
        gain=unrealized,
        return_pct=ret_pct,
        positions=sum(1 for s in stocks if s.CurrentEquity is not None),
        realized_pl=round(us_realized, 2),
        cash_balance_ngn=cash_balance_ngn,
    )

    price_histories: dict[str, list[SparklinePoint]] = {}
    if us_holdings:
        from app.db.crud import get_price_history_batch
        batch_data = get_price_history_batch(db, us_tickers, 90, current_user.id)
        for t in us_tickers:
            rows = batch_data.get(t.upper(), [])
            price_histories[t] = [
                SparklinePoint(ts=r["ts"], price=r.get("price"), change_pct=r.get("change_pct"))
                for r in rows
            ]

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
        price_histories=price_histories,
        div_payout=div_payout,
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

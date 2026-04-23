"""
NGX Page Endpoints
==================
GET /api/ngx/home         — NGX portfolio home: holdings + KPIs + sectors + fundamentals + div_payout
GET /api/ngx/advanced     — NGX advanced: holdings + fundamentals + waterfall + sectors (no KPIs)
GET /api/ngx/{ticker}     — NGX profile all-in-one: replaces 6 separate profile calls
"""

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.engine import get_db
from app.db.models import User
from app.auth.dependencies import get_current_user
from app.services import ngx_job, fx as fx_service, dividends as dividends_service
from app.models import DividendInfo
from app.services.portfolio import (
    build_stock_rows,
    build_sectors,
    compute_hhi,
    load_holdings_from_db,
    _NGX_AVG_CPI,
    _safe,
    _sum,
)
from app.models import StockRow, SectorRow, NGXKPIs, CombinedKPIs, WaterfallData
from app.db.crud import (
    get_cash_balance,
    should_write_snapshot,
    write_snapshot,
    get_correlation_matrix,
    get_portfolio_analytics,
    get_active_holdings,
    get_daily_price_history,
)
from app.config import settings

_INDEX_TICKER = "NGXASI"


def _cumulative_return(rows: list[dict]):
    if len(rows) < 2:
        return None
    first = rows[0].get("price")
    last = rows[-1].get("price")
    if first and last and first > 0:
        return round((last / first - 1) * 100, 2)
    result = 1.0
    for r in rows:
        chg = r.get("change_pct")
        if chg is not None:
            result *= 1 + chg / 100
    return round((result - 1) * 100, 2) if result != 1.0 else None

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ngx", tags=["ngx-pages"])


# ── Response models ────────────────────────────────────────────────────────────

class NgxHomeMeta(BaseModel):
    usdngn: float
    hhi: float
    hhi_label: str
    prices_live: int
    prices_total: int
    price_age: Optional[int] = None
    last_updated: Optional[str] = None


class SparklinePoint(BaseModel):
    ts: str
    price: Optional[float] = None
    change_pct: Optional[float] = None


class NgxHomeResponse(BaseModel):
    holdings: list[StockRow]
    kpis: NGXKPIs
    combined_kpis: CombinedKPIs
    sectors: list[SectorRow]
    meta: NgxHomeMeta
    div_payout: Optional[float] = None
    price_histories: dict[str, list[SparklinePoint]] = {}


class AdvancedCorrelation(BaseModel):
    tickers: list[str]
    matrix: list[list[float]]
    days: int


class AdvancedAnalytics(BaseModel):
    max_drawdown_pct: Optional[float] = None
    sharpe: Optional[float] = None
    data_points: int
    days: int


class AdvancedRelativeStrengthItem(BaseModel):
    ticker: str
    stock_return: Optional[float] = None
    index_return: Optional[float] = None
    rs_pct: Optional[float] = None
    outperform: Optional[bool] = None


class AdvancedRelativeStrength(BaseModel):
    days: int
    index_ticker: str
    has_index_data: bool
    items: list[AdvancedRelativeStrengthItem]


class NgxAdvancedResponse(BaseModel):
    holdings: list[StockRow]
    waterfall: WaterfallData
    sectors: list[SectorRow]
    div_payout: Optional[float] = None
    last_updated: Optional[str] = None
    correlation: Optional[AdvancedCorrelation] = None
    analytics: Optional[AdvancedAnalytics] = None
    relative_strength: Optional[AdvancedRelativeStrength] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _embed_fundamentals(rows: list[StockRow], cache: dict) -> list[StockRow]:
    """Inject NGX fundamentals from cache dict into each StockRow in-place."""
    for row in rows:
        c = cache.get(row.Ticker) or {}
        row.PeRatio = c.get("pe_ratio")
        row.Roe = c.get("roe")
        row.Eps = c.get("eps")
        row.BookValue = c.get("book_value")
        row.DividendYield = c.get("dividend_yield")
        row.Beta = c.get("beta")
        row.Ma50 = c.get("ma_50")
        row.Ma200 = c.get("ma_200")
        row.Week52High = c.get("week_52_high")
        row.Week52Low = c.get("week_52_low")
        row.Rsi14 = c.get("rsi_14")
        row.PiotroskiScore = c.get("piotroski_score")
        row.AltmanZscore = c.get("altman_zscore")
    return rows


def _div_payout(ngx_holdings: list[dict], cache: dict) -> Optional[float]:
    """Sum shares × dividend_amount from cache for held tickers."""
    total = 0.0
    found = False
    for h in ngx_holdings:
        row = cache.get(h["ticker"]) or {}
        amt = row.get("dividend_amount")
        if amt:
            total += float(h["shares"]) * float(amt)
            found = True
    return round(total, 2) if found else None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/home", response_model=NgxHomeResponse)
def ngx_home(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        fx = fx_service.get_rate()
        usdngn = fx["rate"]
        ngx_prices = ngx_job.get_prices_dict()
        holdings = load_holdings_from_db(db, current_user.id)
        ngx_h = holdings["ngx"]

        ngx_stocks = build_stock_rows(ngx_h, ngx_prices, "ngx", usdngn=usdngn, avg_cpi=_NGX_AVG_CPI)

        # Embed fundamentals from DB cache
        cache_rows = {r["ticker"]: r for r in ngx_job.get_all() if r.get("ticker")}
        _embed_fundamentals(ngx_stocks, cache_rows)

        # KPIs
        ngx_equity = _sum(ngx_stocks, "CurrentEquity")
        ngx_cost   = _sum(ngx_stocks, "RemainingCost")
        ngx_unreal = _sum(ngx_stocks, "UnrealizedPL")
        ngx_ret    = (ngx_unreal / ngx_cost * 100) if ngx_cost else 0

        ngx_partial_realized = sum(float(h.get("realized_pl", 0)) for h in ngx_h)
        from app.db.crud import get_closed_positions
        sold = get_closed_positions(db, current_user.id)
        ngx_realized = sum(float(s.realized_pl) for s in sold if s.market.upper() == "NGX") + ngx_partial_realized

        cash = get_cash_balance(db, current_user.id)

        # Combined KPIs (currency exposure)
        from app.services import yahoo as yahoo_service
        us_holdings = holdings["us"]
        us_tickers = [h["ticker"] for h in us_holdings]
        us_prices = yahoo_service.get_prices(us_tickers)
        from app.services.portfolio import build_stock_rows as _bsr
        us_stocks = _bsr(us_holdings, us_prices, "yahoo")
        us_equity = _sum(us_stocks, "CurrentEquity")
        us_cost   = _sum(us_stocks, "RemainingCost")

        ngx_usd = ngx_equity / usdngn if usdngn else 0
        ngx_cost_usd = ngx_cost / usdngn if usdngn else 0
        ngx_usd_return_pct = (ngx_usd / ngx_cost_usd - 1) * 100 if ngx_cost_usd else 0
        _ngx_base  = ngx_usd if ngx_usd > 0 else ngx_cost_usd
        _us_base   = us_equity if us_equity > 0 else us_cost
        _total_base = _ngx_base + _us_base
        ngx_pct = _ngx_base / _total_base * 100 if _total_base else None
        us_pct  = _us_base  / _total_base * 100 if _total_base else None

        # Portfolio snapshot
        total_usd = ngx_usd + us_equity
        if should_write_snapshot(db, settings.NGX_PRICE_TTL, current_user.id):
            price_rows = [
                {"ticker": s.Ticker, "market": "ngx", "price": s.LivePrice, "change_pct": s.LiveChangePct}
                for s in ngx_stocks
            ] + [
                {"ticker": s.Ticker, "market": "us", "price": s.LivePrice, "change_pct": s.LiveChangePct}
                for s in us_stocks
            ]
            write_snapshot(db, user_id=current_user.id, ngx_equity=ngx_equity, ngx_cost=ngx_cost,
                           us_equity=us_equity, us_cost=us_cost, usdngn=usdngn, total_usd=total_usd,
                           price_rows=price_rows)

        hhi = compute_hhi(ngx_stocks)
        hhi_label = "LOW" if hhi < 1000 else ("MODERATE" if hhi < 1800 else "HIGH")

        # Sparkline data for all holdings (90d, from DB — no extra HTTP calls)
        price_histories: dict[str, list[SparklinePoint]] = {}
        for h in ngx_h:
            t = h["ticker"]
            try:
                rows = get_daily_price_history(db, t, 90)
                price_histories[t] = [
                    SparklinePoint(ts=r["ts"], price=r.get("price"), change_pct=r.get("change_pct"))
                    for r in rows
                ]
            except Exception:
                price_histories[t] = []

        return NgxHomeResponse(
            holdings=ngx_stocks,
            kpis=NGXKPIs(
                equity=round(ngx_equity, 2),
                cost=round(ngx_cost, 2),
                gain=round(ngx_unreal, 2),
                return_pct=round(ngx_ret, 2),
                realized_pl=round(ngx_realized, 2),
                total_cost=round(ngx_cost, 2),
                positions=len(ngx_stocks),
                cash_balance_ngn=round(cash.get("ngn") or 0.0, 2),
            ),
            combined_kpis=CombinedKPIs(
                ngx_usd=round(ngx_usd, 2),
                us_usd=round(us_equity, 2),
                total_usd=round(total_usd, 2),
                ngx_cost_usd=round(ngx_cost_usd, 2),
                ngx_usd_return_pct=round(ngx_usd_return_pct, 2),
                ngx_pct=round(ngx_pct, 1) if ngx_pct is not None else None,
                us_pct=round(us_pct, 1) if us_pct is not None else None,
            ),
            sectors=build_sectors(ngx_stocks),
            meta=NgxHomeMeta(
                usdngn=round(usdngn, 2),
                hhi=round(hhi, 1),
                hhi_label=hhi_label,
                prices_live=sum(1 for s in ngx_stocks if s.PriceSource == "ngx"),
                prices_total=len(ngx_stocks),
                price_age=ngx_job.cache_age(),
                last_updated=(ts.isoformat() if (ts := ngx_job.last_updated()) else None),
            ),
            div_payout=_div_payout(ngx_h, cache_rows),
            price_histories=price_histories,
        )
    except Exception:
        log.exception("Error building NGX home response")
        raise HTTPException(status_code=500, detail="Failed to load NGX home data")


@router.get("/advanced", response_model=NgxAdvancedResponse)
def ngx_advanced(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        fx = fx_service.get_rate()
        usdngn = fx["rate"]
        ngx_prices = ngx_job.get_prices_dict()
        holdings = load_holdings_from_db(db, current_user.id)
        ngx_h = holdings["ngx"]

        ngx_stocks = build_stock_rows(ngx_h, ngx_prices, "ngx", usdngn=usdngn, avg_cpi=_NGX_AVG_CPI)

        cache_rows = {r["ticker"]: r for r in ngx_job.get_all() if r.get("ticker")}
        _embed_fundamentals(ngx_stocks, cache_rows)

        ngx_equity = _sum(ngx_stocks, "CurrentEquity")
        ngx_cost   = _sum(ngx_stocks, "RemainingCost")
        ngx_unreal = _sum(ngx_stocks, "UnrealizedPL")

        ngx_partial_realized = sum(float(h.get("realized_pl", 0)) for h in ngx_h)
        from app.db.crud import get_closed_positions
        sold = get_closed_positions(db, current_user.id)
        ngx_realized = sum(float(s.realized_pl) for s in sold if s.market.upper() == "NGX") + ngx_partial_realized

        # Correlation (90d)
        corr_out: Optional[AdvancedCorrelation] = None
        try:
            tickers = [s.Ticker for s in ngx_stocks]
            if len(tickers) >= 2:
                corr = get_correlation_matrix(db, tickers=tickers, days=90)
                corr_out = AdvancedCorrelation(
                    tickers=corr["tickers"], matrix=corr["matrix"], days=90
                )
        except Exception:
            log.warning("Could not compute correlation for advanced page")

        # Analytics (180d)
        analytics_out: Optional[AdvancedAnalytics] = None
        try:
            anl = get_portfolio_analytics(db, user_id=current_user.id, days=180)
            analytics_out = AdvancedAnalytics(
                max_drawdown_pct=anl["max_drawdown_pct"],
                sharpe=anl["sharpe"],
                data_points=anl["data_points"],
                days=180,
            )
        except Exception:
            log.warning("Could not compute analytics for advanced page")

        # Relative strength (90d)
        rs_out: Optional[AdvancedRelativeStrength] = None
        try:
            from app.services.history import refresh_ticker_history
            try:
                refresh_ticker_history(_INDEX_TICKER)
            except Exception:
                pass
            index_rows = get_daily_price_history(db, _INDEX_TICKER, 90)
            index_ret = _cumulative_return(index_rows)
            has_index = index_ret is not None
            active_holdings = get_active_holdings(db, market="ngx", user_id=current_user.id)
            rs_items: list[AdvancedRelativeStrengthItem] = []
            for h in active_holdings:
                rows = get_daily_price_history(db, h.ticker, 90)
                stock_ret = _cumulative_return(rows)
                rs = (
                    round(stock_ret - index_ret, 2)
                    if (stock_ret is not None and index_ret is not None)
                    else None
                )
                rs_items.append(AdvancedRelativeStrengthItem(
                    ticker=h.ticker,
                    stock_return=stock_ret,
                    index_return=index_ret,
                    rs_pct=rs,
                    outperform=(rs > 0) if rs is not None else None,
                ))
            rs_items.sort(key=lambda x: (x.rs_pct is None, -(x.rs_pct or 0)))
            rs_out = AdvancedRelativeStrength(
                days=90,
                index_ticker=_INDEX_TICKER,
                has_index_data=has_index,
                items=rs_items,
            )
        except Exception:
            log.warning("Could not compute relative strength for advanced page")

        return NgxAdvancedResponse(
            holdings=ngx_stocks,
            waterfall=WaterfallData(
                total_cost=round(ngx_cost, 2),
                realized_pl=round(ngx_realized, 2),
                unrealized_pl=round(ngx_unreal, 2),
                current_equity=round(ngx_equity, 2),
            ),
            sectors=build_sectors(ngx_stocks),
            div_payout=_div_payout(ngx_h, cache_rows),
            last_updated=(ts.isoformat() if (ts := ngx_job.last_updated()) else None),
            correlation=corr_out,
            analytics=analytics_out,
            relative_strength=rs_out,
        )
    except Exception:
        log.exception("Error building NGX advanced response")
        raise HTTPException(status_code=500, detail="Failed to load NGX advanced data")


# ── Response models for GET /api/ngx/{ticker} ─────────────────────────────────

class NgxTickerPrice(BaseModel):
    price: Optional[float] = None
    change: Optional[float] = None
    change_pct: Optional[float] = None
    volume: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None


class NgxTickerProfile(BaseModel):
    name: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    headquarters: Optional[str] = None
    founded: Optional[str] = None
    employees: Optional[str] = None


class NgxTickerOverview(BaseModel):
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    eps: Optional[float] = None
    book_value: Optional[float] = None
    dividend_yield: Optional[float] = None
    roe: Optional[float] = None
    roa: Optional[float] = None
    debt_to_equity: Optional[float] = None
    current_ratio: Optional[float] = None
    gross_margin: Optional[float] = None
    net_margin: Optional[float] = None
    revenue: Optional[float] = None
    net_income: Optional[float] = None


class NgxTickerPerformance(BaseModel):
    beta: Optional[float] = None
    week_52_high: Optional[float] = None
    week_52_low: Optional[float] = None
    week_52_change: Optional[float] = None
    return_1y: Optional[float] = None
    return_ytd: Optional[float] = None
    return_1m: Optional[float] = None
    return_3m: Optional[float] = None
    return_6m: Optional[float] = None
    volatility: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    rsi_14: Optional[float] = None
    ma_50: Optional[float] = None
    ma_200: Optional[float] = None
    golden_cross: Optional[bool] = None
    piotroski_score: Optional[float] = None
    altman_zscore: Optional[float] = None


class NgxTickerPriceHistory(BaseModel):
    dates: list[str]
    close: list[Optional[float]]
    change_pct: list[Optional[float]]


class NgxTickerEarnings(BaseModel):
    periods: list[str]
    revenue: list[Optional[float]]
    eps: list[Optional[float]]
    net_income: list[Optional[float]]


class NgxTickerBalanceSheet(BaseModel):
    periods: list[str]
    assets: list[Optional[float]]
    liabilities: list[Optional[float]]
    equity: list[Optional[float]]


class NgxTickerCashFlows(BaseModel):
    periods: list[str]
    capex: list[Optional[float]]
    fcf: list[Optional[float]]
    net_debt: list[Optional[float]]


class NgxTickerResponse(BaseModel):
    ticker: str
    price: Optional[NgxTickerPrice] = None
    profile: Optional[NgxTickerProfile] = None
    overview: Optional[NgxTickerOverview] = None
    performance: Optional[NgxTickerPerformance] = None
    dividend: Optional[DividendInfo] = None
    price_history: Optional[NgxTickerPriceHistory] = None
    earnings: Optional[NgxTickerEarnings] = None
    balance_sheet: Optional[NgxTickerBalanceSheet] = None
    cash_flows: Optional[NgxTickerCashFlows] = None
    is_watching: bool = False
    last_updated: Optional[str] = None


@router.get("/{ticker}", response_model=NgxTickerResponse)
def ngx_ticker(
    ticker: str,
    days: int = Query(default=90, ge=7, le=400),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """All-in-one NGX ticker profile. Replaces 6 separate profile endpoint calls."""
    from app.db.crud import (
        get_daily_price_history,
        watchlist_has,
    )
    from app.services.history import refresh_ticker_history
    from app.services.financials import get_earnings_history, get_balance_sheet, get_cash_flows
    from app.services.dividends import get_dividend

    t = ticker.upper()
    row = ngx_job.get_ticker(t)

    def _fetch_price_history():
        try:
            refresh_ticker_history(t)
        except Exception:
            pass
        from app.db.engine import SessionLocal as _SL
        with _SL() as s:
            return get_daily_price_history(s, t, days)

    def _fetch_financials():
        return {
            "earnings": get_earnings_history(t),
            "balance_sheet": get_balance_sheet(t),
            "cash_flows": get_cash_flows(t),
        }

    with ThreadPoolExecutor(max_workers=2) as ex:
        f_hist = ex.submit(_fetch_price_history)
        f_fin = ex.submit(_fetch_financials)
        price_rows = f_hist.result()
        financials = f_fin.result()

    # Price
    price_out = None
    if row and row.get("price") is not None:
        price_out = NgxTickerPrice(
            price=row.get("price"),
            change=row.get("change"),
            change_pct=row.get("change_pct"),
            volume=row.get("volume"),
            high=row.get("high"),
            low=row.get("low"),
        )

    # Profile
    profile_out = None
    if row and row.get("name"):
        profile_out = NgxTickerProfile(
            name=row.get("name"),
            sector=row.get("sector"),
            industry=row.get("industry"),
            description=row.get("description"),
            website=row.get("website"),
            headquarters=row.get("headquarters"),
            founded=row.get("founded"),
            employees=row.get("employees"),
        )

    # Overview
    overview_out = None
    if row and row.get("market_cap") is not None:
        overview_out = NgxTickerOverview(
            market_cap=row.get("market_cap"),
            pe_ratio=row.get("pe_ratio"),
            eps=row.get("eps"),
            book_value=row.get("book_value"),
            dividend_yield=row.get("dividend_yield"),
            roe=row.get("roe"),
            roa=row.get("roa"),
            debt_to_equity=row.get("debt_to_equity"),
            current_ratio=row.get("current_ratio"),
            gross_margin=row.get("gross_margin"),
            net_margin=row.get("net_margin"),
            revenue=row.get("revenue"),
            net_income=row.get("net_income"),
        )

    # Performance
    perf_out = None
    if row and row.get("week_52_high") is not None:
        perf_out = NgxTickerPerformance(
            beta=row.get("beta"),
            week_52_high=row.get("week_52_high"),
            week_52_low=row.get("week_52_low"),
            week_52_change=row.get("week_52_change"),
            return_1y=row.get("return_1y"),
            return_ytd=row.get("return_ytd"),
            return_1m=row.get("return_1m"),
            return_3m=row.get("return_3m"),
            return_6m=row.get("return_6m"),
            volatility=row.get("volatility"),
            sharpe_ratio=row.get("sharpe_ratio"),
            max_drawdown=row.get("max_drawdown"),
            rsi_14=row.get("rsi_14"),
            ma_50=row.get("ma_50"),
            ma_200=row.get("ma_200"),
            golden_cross=row.get("golden_cross"),
            piotroski_score=row.get("piotroski_score"),
            altman_zscore=row.get("altman_zscore"),
        )

    # Price history
    hist_out = None
    if price_rows:
        hist_out = NgxTickerPriceHistory(
            dates=[r["ts"][:10] for r in price_rows],
            close=[r["price"] for r in price_rows],
            change_pct=[r["change_pct"] for r in price_rows],
        )

    # Earnings
    earn = financials.get("earnings")
    earn_out = None
    if earn and earn.get("periods"):
        earn_out = NgxTickerEarnings(
            periods=earn["periods"],
            revenue=earn["revenue"],
            eps=earn["eps"],
            net_income=earn["net_income"],
        )

    # Balance sheet
    bs = financials.get("balance_sheet")
    bs_out = None
    if bs and bs.get("periods"):
        bs_out = NgxTickerBalanceSheet(
            periods=bs["periods"],
            assets=bs["assets"],
            liabilities=bs["liabilities"],
            equity=bs["equity"],
        )

    # Cash flows
    cf = financials.get("cash_flows")
    cf_out = None
    if cf and cf.get("periods"):
        cf_out = NgxTickerCashFlows(
            periods=cf["periods"],
            capex=cf["capex"],
            fcf=cf["fcf"],
            net_debt=cf["net_debt"],
        )

    # Dividend
    div_out = get_dividend(t)

    # Watchlist
    is_watching = watchlist_has(db, current_user.id, t)

    last_ts = ngx_job.last_updated()
    return NgxTickerResponse(
        ticker=t,
        price=price_out,
        profile=profile_out,
        overview=overview_out,
        performance=perf_out,
        dividend=div_out,
        price_history=hist_out,
        earnings=earn_out,
        balance_sheet=bs_out,
        cash_flows=cf_out,
        is_watching=is_watching,
        last_updated=last_ts.isoformat() if last_ts else None,
    )

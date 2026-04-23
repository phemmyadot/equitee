"""
Combined Page Endpoint
======================
GET /api/combined  — cross-market view: NGX + US KPIs, stocks, sectors, FX meta
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.engine import get_db
from app.db.models import User
from app.auth.dependencies import get_current_user
from app.services import yahoo as _yahoo_service
from app.services import ngx_job as _ngx_job
from app.services import fx as _fx_service
from app.services.portfolio import (
    build_stock_rows, build_sectors, compute_hhi, load_holdings_from_db,
    _NGX_AVG_CPI, _US_AVG_CPI, _sum,
)
from app.models import StockRow, SectorRow, NGXKPIs, USKPIs, CombinedKPIs

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/combined", tags=["combined-pages"])


class CombinedMeta(BaseModel):
    usdngn: float
    fx_source: str
    hhi: float
    hhi_label: str


class CombinedResponse(BaseModel):
    ngx_kpis: NGXKPIs
    us_kpis: USKPIs
    combined_kpis: CombinedKPIs
    meta: CombinedMeta
    ngx_stocks: list[StockRow]
    us_stocks: list[StockRow]


@router.get("", response_model=CombinedResponse)
def combined_home(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        fx = _fx_service.get_rate()
        usdngn = fx["rate"]

        holdings = load_holdings_from_db(db, current_user.id)
        ngx_prices = _ngx_job.get_prices_dict()
        us_tickers = [h["ticker"] for h in holdings["us"]]
        us_prices = _yahoo_service.get_prices(us_tickers)

        ngx_stocks = build_stock_rows(holdings["ngx"], ngx_prices, "ngx", usdngn=usdngn, avg_cpi=_NGX_AVG_CPI)
        us_stocks = build_stock_rows(holdings["us"], us_prices, "yahoo", avg_cpi=_US_AVG_CPI)

        ngx_equity = _sum(ngx_stocks, "CurrentEquity")
        ngx_cost = _sum(ngx_stocks, "RemainingCost")
        ngx_unreal = _sum(ngx_stocks, "UnrealizedPL")
        ngx_ret = (ngx_unreal / ngx_cost * 100) if ngx_cost else 0

        us_equity = _sum(us_stocks, "CurrentEquity")
        us_cost = _sum(us_stocks, "RemainingCost")
        us_unreal = _sum(us_stocks, "UnrealizedPL")
        us_ret = (us_unreal / us_cost * 100) if us_cost else 0

        ngx_usd = ngx_equity / usdngn if usdngn else 0
        us_usd = us_equity
        total_usd = ngx_usd + us_usd
        ngx_cost_usd = ngx_cost / usdngn if usdngn else 0
        ngx_usd_return_pct = (ngx_usd / ngx_cost_usd - 1) * 100 if ngx_cost_usd else 0

        _ngx_base = ngx_usd if ngx_usd > 0 else ngx_cost_usd
        _us_base = us_usd if us_usd > 0 else us_cost
        _total = _ngx_base + _us_base
        ngx_pct = _ngx_base / _total * 100 if _total else None
        us_pct = _us_base / _total * 100 if _total else None

        all_stocks = ngx_stocks + us_stocks
        hhi = compute_hhi(all_stocks)
        hhi_label = "Concentrated" if hhi > 2500 else "Moderate" if hhi > 1500 else "Diversified"

        return CombinedResponse(
            ngx_kpis=NGXKPIs(
                equity=ngx_equity,
                cost=ngx_cost,
                gain=ngx_unreal,
                return_pct=ngx_ret,
                realized_pl=0,
                total_cost=ngx_cost,
                positions=sum(1 for s in ngx_stocks if s.IsActive),
                cash_balance_ngn=0,
            ),
            us_kpis=USKPIs(
                equity=us_equity,
                cost=us_cost,
                gain=us_unreal,
                return_pct=us_ret,
                positions=sum(1 for s in us_stocks if s.IsActive),
            ),
            combined_kpis=CombinedKPIs(
                ngx_usd=ngx_usd,
                us_usd=us_usd,
                total_usd=total_usd,
                ngx_cost_usd=ngx_cost_usd,
                ngx_usd_return_pct=ngx_usd_return_pct,
                ngx_pct=ngx_pct,
                us_pct=us_pct,
            ),
            meta=CombinedMeta(
                usdngn=usdngn,
                fx_source=fx.get("source", ""),
                hhi=round(hhi, 1),
                hhi_label=hhi_label,
            ),
            ngx_stocks=ngx_stocks,
            us_stocks=us_stocks,
        )
    except Exception:
        log.exception("combined_home failed")
        raise HTTPException(status_code=500, detail="Failed to load combined data")

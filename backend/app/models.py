"""
Pydantic response models.
Typed contracts between backend and frontend.
"""

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


# ── Price models ─────────────────────────────────────────────────────────────

class NGXPrice(BaseModel):
    symbol:     str
    price:      float
    close:      Optional[float] = None
    change:     Optional[float] = None
    change_pct: Optional[float] = None
    high:       Optional[float] = None
    low:        Optional[float] = None
    volume:     Optional[float] = None
    value:      Optional[float] = None


class USPrice(BaseModel):
    symbol:     str
    price:      float
    close:      Optional[float] = None
    change:     Optional[float] = None
    change_pct: Optional[float] = None
    high:       Optional[float] = None
    low:        Optional[float] = None
    volume:     Optional[float] = None
    currency:   str = "USD"


class NGXPricesResponse(BaseModel):
    count:   int
    age_sec: int
    source:  str
    prices:  dict[str, NGXPrice]


class USPricesResponse(BaseModel):
    count:   int
    age_sec: int
    source:  str
    prices:  dict[str, USPrice]


# ── Dividend models ──────────────────────────────────────────────────────────

class DividendInfo(BaseModel):
    symbol:            str
    ex_dividend_date:  Optional[str] = None
    record_date:       Optional[str] = None
    pay_date:          Optional[str] = None
    cash_amount:       Optional[float] = None
    currency:          str = "NGN"
    timestamp:         Optional[str] = None


class DividendsResponse(BaseModel):
    count:   int
    age_sec: int
    source:  str
    dividends: dict[str, Optional[DividendInfo]]


class DividendSummaryItem(BaseModel):
    ticker:             str
    name:               str
    shares:             float
    ex_dividend_date:   Optional[str] = None
    cash_amount:        Optional[float] = None
    total_dividend:     float = 0.0
    record_date:        Optional[str] = None
    pay_date:           Optional[str] = None
    has_dividend:       bool = False


class DividendSummary(BaseModel):
    items:              list[DividendSummaryItem]
    total_expected:     float
    upcoming_count:     int
    total_holdings:     int
    cache_age:          Optional[int] = None


# ── FX model ─────────────────────────────────────────────────────────────────

class FXResponse(BaseModel):
    rate:   float
    source: str
    ts:     float


# ── Portfolio models ──────────────────────────────────────────────────────────

class StockRow(BaseModel):
    Stock:           str
    Ticker:          str
    Sector:          str
    Shares:          float
    AvgCost:         Optional[float] = None
    RemainingCost:   Optional[float] = None
    CurrentEquity:   Optional[float] = None
    UnrealizedPL:    Optional[float] = None
    RealizedPL:      float = 0.0
    TotalPL:         Optional[float] = None
    ReturnPct:       Optional[float] = None
    OriginalCost:    Optional[float] = None
    LivePrice:       Optional[float] = None
    LiveChange:      Optional[float] = None
    LiveChangePct:   Optional[float] = None
    DayHigh:         Optional[float] = None
    DayLow:          Optional[float] = None
    Volume:          Optional[float] = None
    PriceSource:     str = "no-data"


class SectorRow(BaseModel):
    Sector:  str
    Equity:  float
    GainPct: float
    Count:   int


class SoldRow(BaseModel):
    Stock:      str
    Ticker:     str
    Market:     str
    RealizedPL: float


class NGXKPIs(BaseModel):
    equity:      float
    cost:        float
    gain:        float
    return_pct:  float
    realized_pl: float
    total_cost:  float
    positions:   int


class USKPIs(BaseModel):
    equity:     float
    cost:       float
    gain:       float
    return_pct: float
    positions:  int


class CombinedKPIs(BaseModel):
    ngx_usd:   float
    us_usd:    float
    total_usd: float


class WaterfallData(BaseModel):
    total_cost:     float
    realized_pl:    float
    unrealized_pl:  float
    current_equity: float


class Meta(BaseModel):
    usdngn:           float
    fx_source:        str
    hhi:              float
    hhi_label:        str
    ngx_price_source: str
    us_price_source:  str
    ngx_prices_live:  int
    ngx_prices_total: int
    us_prices_live:   int
    us_prices_total:  int
    ngx_price_age:    Optional[int] = None
    us_price_age:     Optional[int] = None


class PortfolioDataResponse(BaseModel):
    meta:          Meta
    ngx_kpis:      NGXKPIs
    us_kpis:       USKPIs
    combined_kpis: CombinedKPIs
    ngx_stocks:    list[StockRow]
    ngx_sold:      list[SoldRow]
    ngx_sectors:   list[SectorRow]
    us_stocks:     list[StockRow]
    us_sectors:    list[SectorRow]
    waterfall:     WaterfallData
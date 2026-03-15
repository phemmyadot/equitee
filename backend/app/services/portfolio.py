"""
Portfolio Service
=================
Loads holdings from the database, merges with live prices,
and computes all derived values (P&L, return %, sectors, KPIs, HHI).

Holdings are seeded from portfolio.json on first run (see app/db/seed.py).
After that the DB is the sole source of truth for tickers.
"""

import math
import logging
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.db.crud import (
    get_active_holdings,
    get_closed_positions,
    should_write_snapshot,
    write_snapshot,
)
from app.models import (
    StockRow, SectorRow, SoldRow,
    NGXKPIs, USKPIs, CombinedKPIs, WaterfallData, Meta,
    PortfolioDataResponse,
)
from app.config import settings

log = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════════════════════════

def _safe(v: Any) -> Optional[float]:
    """Coerce to float, returning None for NaN / Inf / None."""
    if v is None:
        return None
    try:
        f = float(v)
        return None if (math.isnan(f) or math.isinf(f)) else round(f, 4)
    except (TypeError, ValueError):
        return None


def _sum(rows: list[StockRow], key: str) -> float:
    return sum(getattr(r, key) or 0 for r in rows)


# ══════════════════════════════════════════════════════════════════════════════
# Data loader — DB-backed
# ══════════════════════════════════════════════════════════════════════════════

def load_holdings_from_db(db: Session, user_id: int) -> dict:
    """
    Return holdings dict scoped to user in the shape the rest of the service expects:
      { "ngx": [...], "us": [...], "sold": [...] }
    """
    ngx  = [h.to_dict() for h in get_active_holdings(db, "ngx", user_id)]
    us   = [h.to_dict() for h in get_active_holdings(db, "us",  user_id)]
    sold = [
        {
            "ticker":      c.ticker,
            "name":        c.name,
            "market":      c.market,
            "realized_pl": c.realized_pl,
        }
        for c in get_closed_positions(db, user_id)
    ]
    return {"ngx": ngx, "us": us, "sold": sold}


# ══════════════════════════════════════════════════════════════════════════════
# Stock row builder
# ══════════════════════════════════════════════════════════════════════════════

def build_stock_rows(holdings: list[dict], prices: dict,
                     price_source_label: str) -> list[StockRow]:
    rows = []
    for h in holdings:
        ticker     = h["ticker"]
        shares     = float(h["shares"])
        cost_ps    = float(h["avg_cost"])
        total_cost = shares * cost_ps

        p          = prices.get(ticker)
        price      = p.price if p else None
        equity     = _safe(price * shares)      if price is not None else None
        unreal     = _safe(equity - total_cost) if equity is not None else None
        ret_pct    = _safe(unreal / total_cost * 100) if (
                         unreal is not None and total_cost) else None

        rows.append(StockRow(
            Stock         = h["name"],
            Ticker        = ticker,
            Sector        = h.get("sector", ""),
            Shares        = shares,
            AvgCost       = _safe(cost_ps),
            RemainingCost = _safe(total_cost),
            CurrentEquity = equity,
            UnrealizedPL  = unreal,
            RealizedPL    = 0.0,
            TotalPL       = unreal,
            ReturnPct     = ret_pct,
            OriginalCost  = _safe(total_cost),
            LivePrice     = _safe(price),
            LiveChange    = _safe(p.change)      if p else None,
            LiveChangePct = _safe(p.change_pct)  if p else None,
            DayHigh       = _safe(p.high)        if p else None,
            DayLow        = _safe(p.low)         if p else None,
            Volume        = _safe(p.volume)      if p else None,
            PriceSource   = price_source_label   if price is not None else "no-data",
        ))
    return rows


# ══════════════════════════════════════════════════════════════════════════════
# Sector aggregator
# ══════════════════════════════════════════════════════════════════════════════

def build_sectors(stocks: list[StockRow]) -> list[SectorRow]:
    sectors: dict[str, dict] = {}
    for s in stocks:
        sec  = s.Sector or "Other"
        eq   = s.CurrentEquity or 0
        cost = s.RemainingCost or 0
        if sec not in sectors:
            sectors[sec] = {"equity": 0.0, "cost": 0.0, "count": 0}
        sectors[sec]["equity"] += eq
        sectors[sec]["cost"]   += cost
        sectors[sec]["count"]  += 1

    result = []
    for sec, v in sectors.items():
        gain_pct = (v["equity"] - v["cost"]) / v["cost"] * 100 if v["cost"] else 0
        result.append(SectorRow(
            Sector  = sec,
            Equity  = round(v["equity"], 2),
            GainPct = round(gain_pct, 4),
            Count   = v["count"],
        ))
    return sorted(result, key=lambda x: -x.Equity)


# ══════════════════════════════════════════════════════════════════════════════
# HHI (Herfindahl–Hirschman Index)
# ══════════════════════════════════════════════════════════════════════════════

def compute_hhi(stocks: list[StockRow]) -> float:
    total = sum(s.CurrentEquity or 0 for s in stocks)
    if total == 0:
        return 0.0
    return sum(
        ((s.CurrentEquity or 0) / total) ** 2
        for s in stocks
    ) * 10000


# ══════════════════════════════════════════════════════════════════════════════
# Main assembler
# ══════════════════════════════════════════════════════════════════════════════

def build_portfolio_response(
    ngx_prices:    dict,
    us_prices:     dict,
    fx:            dict,
    ngx_price_age: Optional[int],
    us_price_age:  Optional[int],
    db:            Session,
    user_id:       int,
) -> PortfolioDataResponse:

    usdngn   = fx["rate"]
    holdings = load_holdings_from_db(db, user_id)

    ngx_stocks = build_stock_rows(holdings["ngx"], ngx_prices, "stockanalysis")
    us_stocks  = build_stock_rows(holdings["us"],  us_prices,  "yahoo")

    sold = [
        SoldRow(
            Stock      = s["name"],
            Ticker     = s["ticker"],
            Market     = s["market"].upper(),
            RealizedPL = float(s["realized_pl"]),
        )
        for s in holdings.get("sold", [])
    ]
    ngx_realized = sum(s.RealizedPL for s in sold if s.Market == "NGX")

    # ── KPIs ─────────────────────────────────────────────────────────────────
    ngx_equity = _sum(ngx_stocks, "CurrentEquity")
    ngx_cost   = _sum(ngx_stocks, "RemainingCost")
    ngx_unreal = _sum(ngx_stocks, "UnrealizedPL")
    ngx_ret    = (ngx_unreal / ngx_cost * 100) if ngx_cost else 0

    us_equity  = _sum(us_stocks, "CurrentEquity")
    us_cost    = _sum(us_stocks, "RemainingCost")
    us_unreal  = _sum(us_stocks, "UnrealizedPL")
    us_ret     = (us_unreal / us_cost * 100) if us_cost else 0

    ngx_usd    = ngx_equity / usdngn if usdngn else 0
    total_usd  = ngx_usd + us_equity

    # ── Snapshot (write at most once per NGX_PRICE_TTL seconds per user) ─────
    if should_write_snapshot(db, settings.NGX_PRICE_TTL, user_id):
        price_rows = [
            {"ticker": s.Ticker, "market": "ngx",
             "price": s.LivePrice, "change_pct": s.LiveChangePct}
            for s in ngx_stocks
        ] + [
            {"ticker": s.Ticker, "market": "us",
             "price": s.LivePrice, "change_pct": s.LiveChangePct}
            for s in us_stocks
        ]
        write_snapshot(
            db,
            user_id    = user_id,
            ngx_equity = ngx_equity,
            ngx_cost   = ngx_cost,
            us_equity  = us_equity,
            us_cost    = us_cost,
            usdngn     = usdngn,
            total_usd  = total_usd,
            price_rows = price_rows,
        )

    # ── HHI ──────────────────────────────────────────────────────────────────
    hhi       = compute_hhi(ngx_stocks)
    hhi_label = "LOW" if hhi < 1000 else ("MODERATE" if hhi < 1800 else "HIGH")

    return PortfolioDataResponse(
        meta = Meta(
            usdngn           = round(usdngn, 2),
            fx_source        = fx["source"],
            hhi              = round(hhi, 1),
            hhi_label        = hhi_label,
            ngx_price_source = "",
            us_price_source  = "Yahoo Finance",
            ngx_prices_live  = sum(1 for s in ngx_stocks if s.PriceSource == "stockanalysis"),
            ngx_prices_total = len(ngx_stocks),
            us_prices_live   = sum(1 for s in us_stocks  if s.PriceSource == "yahoo"),
            us_prices_total  = len(us_stocks),
            ngx_price_age    = ngx_price_age,
            us_price_age     = us_price_age,
        ),
        ngx_kpis = NGXKPIs(
            equity      = round(ngx_equity, 2),
            cost        = round(ngx_cost, 2),
            gain        = round(ngx_unreal, 2),
            return_pct  = round(ngx_ret, 2),
            realized_pl = round(ngx_realized, 2),
            total_cost  = round(ngx_cost, 2),
            positions   = len(ngx_stocks),
        ),
        us_kpis = USKPIs(
            equity     = round(us_equity, 4),
            cost       = round(us_cost, 4),
            gain       = round(us_unreal, 4),
            return_pct = round(us_ret, 2),
            positions  = len(us_stocks),
        ),
        combined_kpis = CombinedKPIs(
            ngx_usd   = round(ngx_usd, 2),
            us_usd    = round(us_equity, 2),
            total_usd = round(total_usd, 2),
        ),
        ngx_stocks  = ngx_stocks,
        ngx_sold    = sold,
        ngx_sectors = build_sectors(ngx_stocks),
        us_stocks   = us_stocks,
        us_sectors  = build_sectors(us_stocks),
        waterfall   = WaterfallData(
            total_cost     = round(ngx_cost, 2),
            realized_pl    = round(ngx_realized, 2),
            unrealized_pl  = round(ngx_unreal, 2),
            current_equity = round(ngx_equity, 2),
        ),
    )
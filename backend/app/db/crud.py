"""
CRUD helpers.
All database reads and writes live here — no raw SQL anywhere else in the app.
All functions accept a SQLAlchemy Session as their first argument.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.db.models import Holding, ClosedPosition, PortfolioSnapshot, PriceHistory

log = logging.getLogger(__name__)


# ── Holdings ──────────────────────────────────────────────────────────────────

def get_active_holdings(db: Session, market: str) -> list[Holding]:
    """Return all active holdings for a given market ('ngx' or 'us')."""
    stmt = (
        select(Holding)
        .where(Holding.market == market, Holding.is_active == True)
        .order_by(Holding.ticker)
    )
    return list(db.scalars(stmt).all())


def get_all_active_holdings(db: Session) -> list[Holding]:
    stmt = select(Holding).where(Holding.is_active == True).order_by(Holding.market, Holding.ticker)
    return list(db.scalars(stmt).all())


def upsert_holding(db: Session, ticker: str, market: str, **kwargs) -> Holding:
    """Update existing holding or insert a new one."""
    stmt = select(Holding).where(Holding.ticker == ticker, Holding.market == market)
    obj  = db.scalars(stmt).first()
    if obj is None:
        obj = Holding(ticker=ticker, market=market, **kwargs)
        db.add(obj)
    else:
        for k, v in kwargs.items():
            setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


# ── Holdings — settings CRUD ──────────────────────────────────────────────────

def get_holding_by_id(db: Session, holding_id: int) -> Optional[Holding]:
    return db.get(Holding, holding_id)


def create_holding(
    db: Session, ticker: str, name: str, market: str,
    shares: float, avg_cost: float, sector: str,
) -> Holding:
    obj = Holding(
        ticker    = ticker.upper(),
        name      = name,
        market    = market.lower(),
        shares    = shares,
        avg_cost  = avg_cost,
        sector    = sector,
        is_active = True,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    log.info("Created holding %s (%s)", obj.ticker, obj.market)
    return obj


def update_holding(
    db: Session, holding_id: int,
    name: Optional[str]     = None,
    sector: Optional[str]   = None,
    avg_cost: Optional[float] = None,
    shares: Optional[float]   = None,
) -> Optional[Holding]:
    obj = db.get(Holding, holding_id)
    if obj is None:
        return None
    if name     is not None: obj.name     = name
    if sector   is not None: obj.sector   = sector
    if avg_cost is not None: obj.avg_cost = avg_cost
    if shares   is not None: obj.shares   = shares
    db.commit()
    db.refresh(obj)
    return obj


def delete_holding(db: Session, holding_id: int) -> bool:
    """Hard delete — removes all DB rows for this holding."""
    obj = db.get(Holding, holding_id)
    if obj is None:
        return False
    db.delete(obj)
    db.commit()
    log.info("Deleted holding id=%d (%s)", holding_id, obj.ticker)
    return True


def add_shares(
    db: Session, holding_id: int,
    new_shares: float, buy_price: float,
) -> Optional[Holding]:
    """
    Buy more of an existing position.
    Recalculates weighted avg_cost and adds to share count.
    """
    obj = db.get(Holding, holding_id)
    if obj is None:
        return None
    old_cost_basis  = obj.shares * obj.avg_cost
    new_cost_basis  = new_shares * buy_price
    total_shares    = obj.shares + new_shares
    obj.avg_cost    = (old_cost_basis + new_cost_basis) / total_shares
    obj.shares      = total_shares
    obj.is_active   = True
    db.commit()
    db.refresh(obj)
    log.info("Added %.4f shares to %s @ %.4f → new avg %.4f",
             new_shares, obj.ticker, buy_price, obj.avg_cost)
    return obj


def record_sale(
    db: Session, holding_id: int,
    shares_sold: float, sale_price: float,
) -> tuple[Optional[Holding], Optional[ClosedPosition]]:
    """
    Sell shares_sold units at sale_price.
    - Computes realized P&L = (sale_price - avg_cost) * shares_sold
    - Reduces holding.shares by shares_sold
    - If shares reach 0, marks holding is_active=False and creates ClosedPosition
    - If partial sale, holding stays active with reduced share count
    Returns (updated_holding, closed_position_or_None)
    """
    obj = db.get(Holding, holding_id)
    if obj is None:
        return None, None

    shares_sold  = min(shares_sold, obj.shares)   # can't sell more than held
    realized_pl  = (sale_price - obj.avg_cost) * shares_sold
    obj.shares   = round(obj.shares - shares_sold, 8)

    closed = None
    if obj.shares <= 1e-8:
        obj.shares    = 0.0
        obj.is_active = False
        closed = ClosedPosition(
            ticker      = obj.ticker,
            name        = obj.name,
            market      = obj.market,
            realized_pl = round(realized_pl, 4),
        )
        db.add(closed)
        log.info("Full sale: %s → realized P/L %.4f", obj.ticker, realized_pl)
    else:
        log.info("Partial sale: %s sold %.4f shares → %.4f remaining, P/L %.4f",
                 obj.ticker, shares_sold, obj.shares, realized_pl)

    db.commit()
    if closed:
        db.refresh(closed)
    db.refresh(obj)
    return obj, closed


# ── Closed positions — settings read ─────────────────────────────────────────

def get_all_holdings(db: Session) -> list[Holding]:
    """Return ALL holdings (active + inactive) for the settings page."""
    stmt = select(Holding).order_by(Holding.market, Holding.ticker)
    return list(db.scalars(stmt).all())


def get_closed_positions(db: Session) -> list[ClosedPosition]:
    stmt = select(ClosedPosition).order_by(desc(ClosedPosition.closed_at))
    return list(db.scalars(stmt).all())


def insert_closed_position(db: Session, ticker: str, name: str,
                            market: str, realized_pl: float) -> ClosedPosition:
    obj = ClosedPosition(ticker=ticker, name=name, market=market, realized_pl=realized_pl)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ── Snapshots ─────────────────────────────────────────────────────────────────

def get_latest_snapshot_ts(db: Session) -> Optional[datetime]:
    """Return timestamp of the most recent snapshot, or None."""
    stmt = select(PortfolioSnapshot.ts).order_by(desc(PortfolioSnapshot.ts)).limit(1)
    return db.scalars(stmt).first()


def should_write_snapshot(db: Session, ttl_seconds: int) -> bool:
    """
    Return True if no snapshot exists, or the most recent one is older than ttl_seconds.
    Prevents writing a new snapshot on every single API call.
    """
    latest = get_latest_snapshot_ts(db)
    if latest is None:
        return True
    # Make latest tz-aware if needed
    if latest.tzinfo is None:
        latest = latest.replace(tzinfo=timezone.utc)
    age = (datetime.now(timezone.utc) - latest).total_seconds()
    return age >= ttl_seconds


def write_snapshot(
    db:            Session,
    ngx_equity:    float,
    ngx_cost:      float,
    us_equity:     float,
    us_cost:       float,
    usdngn:        float,
    total_usd:     float,
    price_rows:    list[dict],          # [{"ticker", "market", "price", "change_pct"}]
) -> PortfolioSnapshot:
    """
    Insert a new portfolio snapshot and all per-ticker price rows atomically.
    """
    snap = PortfolioSnapshot(
        ts             = datetime.now(timezone.utc),
        ngx_equity_ngn = round(ngx_equity, 2),
        ngx_cost_ngn   = round(ngx_cost,   2),
        us_equity_usd  = round(us_equity,  4),
        us_cost_usd    = round(us_cost,    4),
        usdngn         = round(usdngn,     4),
        total_usd      = round(total_usd,  4),
    )
    db.add(snap)
    db.flush()   # get snap.id before committing

    for row in price_rows:
        db.add(PriceHistory(
            snapshot_id = snap.id,
            ticker      = row["ticker"],
            market      = row["market"],
            price       = row.get("price"),
            change_pct  = row.get("change_pct"),
        ))

    db.commit()
    log.info("Snapshot #%d written (%d prices)", snap.id, len(price_rows))
    return snap


# ── History queries ───────────────────────────────────────────────────────────

def get_portfolio_history(db: Session, days: int = 90) -> list[PortfolioSnapshot]:
    """Return snapshots for the last N days, oldest first."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    stmt  = (
        select(PortfolioSnapshot)
        .where(PortfolioSnapshot.ts >= since)
        .order_by(PortfolioSnapshot.ts)
    )
    return list(db.scalars(stmt).all())


def get_price_history(db: Session, ticker: str, days: int = 90) -> list[dict]:
    """Return price history for a single ticker, oldest first."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    stmt  = (
        select(PriceHistory, PortfolioSnapshot.ts)
        .join(PortfolioSnapshot, PriceHistory.snapshot_id == PortfolioSnapshot.id)
        .where(
            PriceHistory.ticker == ticker.upper(),
            PortfolioSnapshot.ts >= since,
        )
        .order_by(PortfolioSnapshot.ts)
    )
    return [
        {
            "ts":         row.ts.isoformat(),
            "price":      row.PriceHistory.price,
            "change_pct": row.PriceHistory.change_pct,
        }
        for row in db.execute(stmt).all()
    ]
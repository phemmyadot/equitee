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


# ── Closed positions ──────────────────────────────────────────────────────────

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
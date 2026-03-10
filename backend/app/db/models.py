"""
ORM table definitions.
These are SQLAlchemy models — completely separate from the Pydantic models
in app/models.py which are the API response contracts.
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Integer, String, Float, Boolean,
    DateTime, ForeignKey, Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.engine import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ── holdings ─────────────────────────────────────────────────────────────────

class Holding(Base):
    """Active and historical positions. Source of truth for tickers."""
    __tablename__ = "holdings"

    id:         Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker:     Mapped[str]      = mapped_column(String,  nullable=False)
    name:       Mapped[str]      = mapped_column(String,  nullable=False)
    market:     Mapped[str]      = mapped_column(String,  nullable=False)   # 'ngx' | 'us'
    shares:     Mapped[float]    = mapped_column(Float,   nullable=False)
    avg_cost:   Mapped[float]    = mapped_column(Float,   nullable=False)
    sector:     Mapped[str]      = mapped_column(String,  nullable=False, default="")
    is_active:  Mapped[bool]     = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    __table_args__ = (
        Index("ix_holdings_market_active", "market", "is_active"),
        Index("ix_holdings_ticker",        "ticker"),
    )

    def to_dict(self) -> dict:
        return {
            "ticker":   self.ticker,
            "name":     self.name,
            "shares":   self.shares,
            "avg_cost": self.avg_cost,
            "sector":   self.sector,
        }


# ── closed_positions ──────────────────────────────────────────────────────────

class ClosedPosition(Base):
    """Immutable record of exited positions and their realised P&L."""
    __tablename__ = "closed_positions"

    id:          Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker:      Mapped[str]      = mapped_column(String,  nullable=False)
    name:        Mapped[str]      = mapped_column(String,  nullable=False)
    market:      Mapped[str]      = mapped_column(String,  nullable=False)   # 'ngx' | 'us'
    realized_pl: Mapped[float]    = mapped_column(Float,   nullable=False)   # local currency
    closed_at:   Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    __table_args__ = (
        Index("ix_closed_market", "market"),
    )


# ── portfolio_snapshots ───────────────────────────────────────────────────────

class PortfolioSnapshot(Base):
    """
    One row written per /api/data call (rate-limited by NGX_PRICE_TTL).
    Backbone of all historical charts.
    """
    __tablename__ = "portfolio_snapshots"

    id:              Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    ts:              Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    # Values at snapshot time
    ngx_equity_ngn:  Mapped[float]   = mapped_column(Float, nullable=False, default=0.0)
    ngx_cost_ngn:    Mapped[float]   = mapped_column(Float, nullable=False, default=0.0)
    us_equity_usd:   Mapped[float]   = mapped_column(Float, nullable=False, default=0.0)
    us_cost_usd:     Mapped[float]   = mapped_column(Float, nullable=False, default=0.0)
    usdngn:          Mapped[float]   = mapped_column(Float, nullable=False, default=0.0)
    total_usd:       Mapped[float]   = mapped_column(Float, nullable=False, default=0.0)

    # Relationship to per-ticker prices
    prices: Mapped[list["PriceHistory"]] = relationship(
        "PriceHistory",
        back_populates="snapshot",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_snapshots_ts", "ts"),
    )


# ── price_history ─────────────────────────────────────────────────────────────

class PriceHistory(Base):
    """
    One row per ticker per snapshot.
    Powers per-stock price charts and sparklines.
    """
    __tablename__ = "price_history"

    id:          Mapped[int]   = mapped_column(Integer, primary_key=True, autoincrement=True)
    snapshot_id: Mapped[int]   = mapped_column(Integer, ForeignKey("portfolio_snapshots.id", ondelete="CASCADE"), nullable=False)
    ticker:      Mapped[str]   = mapped_column(String,  nullable=False)
    market:      Mapped[str]   = mapped_column(String,  nullable=False)
    price:       Mapped[float] = mapped_column(Float,   nullable=True)
    change_pct:  Mapped[float] = mapped_column(Float,   nullable=True)

    snapshot: Mapped["PortfolioSnapshot"] = relationship("PortfolioSnapshot", back_populates="prices")

    __table_args__ = (
        Index("ix_price_history_ticker_snapshot", "ticker", "snapshot_id"),
    )
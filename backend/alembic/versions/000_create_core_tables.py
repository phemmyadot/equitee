"""Create core portfolio tables: holdings, closed_positions, portfolio_snapshots, price_history

Revision ID: 000
Revises: 001
Create Date: 2026-03-17

These tables were previously created via Base.metadata.create_all() at startup.
This migration makes them explicit so a fresh PostgreSQL database is fully
provisioned by `alembic upgrade head` alone.

user_id columns are intentionally omitted here — migration 002 adds them.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "000"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "holdings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("ticker", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("market", sa.String(), nullable=False),
        sa.Column("shares", sa.Float(), nullable=False),
        sa.Column("avg_cost", sa.Float(), nullable=False),
        sa.Column("sector", sa.String(), nullable=False, server_default=""),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_holdings_market_active", "holdings", ["market", "is_active"])
    op.create_index("ix_holdings_ticker", "holdings", ["ticker"])

    op.create_table(
        "closed_positions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("ticker", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("market", sa.String(), nullable=False),
        sa.Column("realized_pl", sa.Float(), nullable=False),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_closed_market", "closed_positions", ["market"])

    op.create_table(
        "portfolio_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("ts", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ngx_equity_ngn", sa.Float(), nullable=False, server_default="0"),
        sa.Column("ngx_cost_ngn", sa.Float(), nullable=False, server_default="0"),
        sa.Column("us_equity_usd", sa.Float(), nullable=False, server_default="0"),
        sa.Column("us_cost_usd", sa.Float(), nullable=False, server_default="0"),
        sa.Column("usdngn", sa.Float(), nullable=False, server_default="0"),
        sa.Column("total_usd", sa.Float(), nullable=False, server_default="0"),
    )
    op.create_index("ix_snapshots_ts", "portfolio_snapshots", ["ts"])

    op.create_table(
        "price_history",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "snapshot_id",
            sa.Integer(),
            sa.ForeignKey("portfolio_snapshots.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("ticker", sa.String(), nullable=False),
        sa.Column("market", sa.String(), nullable=False),
        sa.Column("price", sa.Float(), nullable=True),
        sa.Column("change_pct", sa.Float(), nullable=True),
    )
    op.create_index(
        "ix_price_history_ticker_snapshot", "price_history", ["ticker", "snapshot_id"]
    )


def downgrade() -> None:
    op.drop_table("price_history")
    op.drop_table("portfolio_snapshots")
    op.drop_table("closed_positions")
    op.drop_table("holdings")

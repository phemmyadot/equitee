"""Add daily_price_history table for per-ticker OHLCV from history page scraper

Revision ID: 005
Revises: 004
Create Date: 2026-03-19
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Table may already exist if created manually before this migration was added.
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "daily_price_history" not in inspector.get_table_names():
        op.create_table(
            "daily_price_history",
            sa.Column("id",         sa.Integer(),  nullable=False),
            sa.Column("ticker",     sa.String(),   nullable=False),
            sa.Column("date",       sa.String(),   nullable=False),
            sa.Column("close",      sa.Float(),    nullable=True),
            sa.Column("open",       sa.Float(),    nullable=True),
            sa.Column("high",       sa.Float(),    nullable=True),
            sa.Column("low",        sa.Float(),    nullable=True),
            sa.Column("volume",     sa.Float(),    nullable=True),
            sa.Column("change_pct", sa.Float(),    nullable=True),
            sa.Column("source",     sa.String(),   nullable=False, server_default="history"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("ticker", "date", name="uq_daily_price_history_ticker_date"),
        )
        op.create_index("ix_daily_price_history_ticker_date", "daily_price_history", ["ticker", "date"])


def downgrade() -> None:
    op.drop_index("ix_daily_price_history_ticker_date", table_name="daily_price_history")
    op.drop_table("daily_price_history")

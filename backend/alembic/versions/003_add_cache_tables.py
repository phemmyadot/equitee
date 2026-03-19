"""Add dividend_cache and financials_cache tables

Revision ID: 003
Revises: 002
Create Date: 2026-03-19
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "dividend_cache",
        sa.Column("id",               sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("ticker",           sa.String(),  nullable=False, unique=True),
        sa.Column("fetched_at",       sa.DateTime(timezone=True), nullable=False),
        sa.Column("symbol",           sa.String(),  nullable=False),
        sa.Column("ex_dividend_date", sa.String(),  nullable=True),
        sa.Column("record_date",      sa.String(),  nullable=True),
        sa.Column("pay_date",         sa.String(),  nullable=True),
        sa.Column("cash_amount",      sa.Float(),   nullable=True),
        sa.Column("currency",         sa.String(),  nullable=False, server_default="NGN"),
        sa.Column("dividend_ts",      sa.String(),  nullable=True),
    )
    op.create_index("ix_dividend_cache_ticker", "dividend_cache", ["ticker"])

    op.create_table(
        "financials_cache",
        sa.Column("id",         sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("ticker",     sa.String(),  nullable=False),
        sa.Column("cache_type", sa.String(),  nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("periods",    sa.JSON(),    nullable=False),
        sa.Column("col_a",      sa.JSON(),    nullable=False),
        sa.Column("col_b",      sa.JSON(),    nullable=False),
        sa.Column("col_c",      sa.JSON(),    nullable=False),
        sa.UniqueConstraint("ticker", "cache_type", name="uq_financials_cache_ticker_type"),
    )
    op.create_index("ix_financials_cache_ticker_type", "financials_cache", ["ticker", "cache_type"])


def downgrade() -> None:
    op.drop_index("ix_financials_cache_ticker_type", table_name="financials_cache")
    op.drop_table("financials_cache")
    op.drop_index("ix_dividend_cache_ticker", table_name="dividend_cache")
    op.drop_table("dividend_cache")

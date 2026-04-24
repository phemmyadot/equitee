"""Add extended metrics columns to ngx_ticker_cache

Revision ID: 016
Revises: 015
Create Date: 2026-04-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None

NEW_COLS = [
    ("operating_margin", sa.Float),
    ("fcf_margin", sa.Float),
    ("roic", sa.Float),
    ("roce", sa.Float),
    ("operating_cash_flow", sa.Float),
    ("free_cash_flow", sa.Float),
    ("capex_ttm", sa.Float),
    ("fcf_per_share", sa.Float),
    ("fcf_yield", sa.Float),
    ("quick_ratio", sa.Float),
    ("net_debt", sa.Float),
    ("interest_coverage", sa.Float),
    ("debt_ebitda", sa.Float),
    ("asset_turnover", sa.Float),
    ("revenue_growth_yoy", sa.Float),
    ("earnings_growth_yoy", sa.Float),
    ("fcf_growth_yoy", sa.Float),
    ("dividend_growth_yoy", sa.Float),
]


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing = {c["name"] for c in inspector.get_columns("ngx_ticker_cache")}
    for col_name, col_type in NEW_COLS:
        if col_name not in existing:
            op.add_column(
                "ngx_ticker_cache",
                sa.Column(col_name, col_type, nullable=True),
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing = {c["name"] for c in inspector.get_columns("ngx_ticker_cache")}
    for col_name, _ in NEW_COLS:
        if col_name in existing:
            op.drop_column("ngx_ticker_cache", col_name)

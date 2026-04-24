"""Add valuation ratio columns to ngx_ticker_cache

Revision ID: 018
Revises: 017
Create Date: 2026-04-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "018"
down_revision = "017"
branch_labels = None
depends_on = None

NEW_COLS = [
    ("price_to_book", sa.Float),
    ("price_to_sales", sa.Float),
    ("ev_ebitda", sa.Float),
    ("ev_fcf", sa.Float),
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

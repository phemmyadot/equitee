"""Add dividend_updated_at to ngx_ticker_cache

Revision ID: 015
Revises: 014
Create Date: 2026-04-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    cols = {c["name"] for c in inspector.get_columns("ngx_ticker_cache")}

    if "dividend_updated_at" not in cols:
        op.add_column(
            "ngx_ticker_cache",
            sa.Column("dividend_updated_at", sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    cols = {c["name"] for c in inspector.get_columns("ngx_ticker_cache")}

    if "dividend_updated_at" in cols:
        op.drop_column("ngx_ticker_cache", "dividend_updated_at")

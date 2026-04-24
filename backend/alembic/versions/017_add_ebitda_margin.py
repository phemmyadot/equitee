"""Add ebitda_margin column to ngx_ticker_cache

Revision ID: 017
Revises: 016
Create Date: 2026-04-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "017"
down_revision = "016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    cols = {c["name"] for c in inspector.get_columns("ngx_ticker_cache")}
    if "ebitda_margin" not in cols:
        op.add_column(
            "ngx_ticker_cache",
            sa.Column("ebitda_margin", sa.Float, nullable=True),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    cols = {c["name"] for c in inspector.get_columns("ngx_ticker_cache")}
    if "ebitda_margin" in cols:
        op.drop_column("ngx_ticker_cache", "ebitda_margin")

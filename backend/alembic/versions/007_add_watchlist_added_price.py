"""Add added_price column to watchlist

Revision ID: 007
Revises: 006
Create Date: 2026-03-26
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "watchlist" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("watchlist")]
        if "added_price" not in cols:
            op.add_column(
                "watchlist", sa.Column("added_price", sa.Float(), nullable=True)
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "watchlist" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("watchlist")]
        if "added_price" in cols:
            op.drop_column("watchlist", "added_price")

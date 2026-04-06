"""Add purchase_date to holdings

Revision ID: 009
Revises: 008
Create Date: 2026-04-06
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    cols = [c["name"] for c in inspector.get_columns("holdings")]
    if "purchase_date" not in cols:
        # Default to created_at so existing rows get a sensible value
        op.add_column(
            "holdings",
            sa.Column(
                "purchase_date",
                sa.Date(),
                nullable=True,
            ),
        )
        # Backfill existing rows from created_at
        op.execute("UPDATE holdings SET purchase_date = DATE(created_at)")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    cols = [c["name"] for c in inspector.get_columns("holdings")]
    if "purchase_date" in cols:
        op.drop_column("holdings", "purchase_date")

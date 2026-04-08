"""Add commission column to sale_events

Revision ID: 013
Revises: 012
Create Date: 2026-04-08
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "013"
down_revision = "012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    cols = [c["name"] for c in inspector.get_columns("sale_events")]
    if "commission" not in cols:
        op.add_column(
            "sale_events",
            sa.Column("commission", sa.Float(), nullable=False, server_default="0.0"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    cols = [c["name"] for c in inspector.get_columns("sale_events")]
    if "commission" in cols:
        op.drop_column("sale_events", "commission")

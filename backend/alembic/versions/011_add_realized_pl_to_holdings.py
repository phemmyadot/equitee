"""Add realized_pl to holdings

Revision ID: 011
Revises: 010
Create Date: 2026-04-08
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    cols = [c["name"] for c in inspector.get_columns("holdings")]
    if "realized_pl" not in cols:
        op.add_column(
            "holdings",
            sa.Column("realized_pl", sa.Float(), nullable=False, server_default="0.0"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    cols = [c["name"] for c in inspector.get_columns("holdings")]
    if "realized_pl" in cols:
        op.drop_column("holdings", "realized_pl")

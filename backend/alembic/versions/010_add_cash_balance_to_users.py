"""Add cash_balance_ngn and cash_balance_usd to users

Revision ID: 010
Revises: 009
Create Date: 2026-04-08
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    cols = [c["name"] for c in inspector.get_columns("users")]
    if "cash_balance_ngn" not in cols:
        op.add_column(
            "users",
            sa.Column("cash_balance_ngn", sa.Float(), nullable=False, server_default="0.0"),
        )
    if "cash_balance_usd" not in cols:
        op.add_column(
            "users",
            sa.Column("cash_balance_usd", sa.Float(), nullable=False, server_default="0.0"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    cols = [c["name"] for c in inspector.get_columns("users")]
    if "cash_balance_ngn" in cols:
        op.drop_column("users", "cash_balance_ngn")
    if "cash_balance_usd" in cols:
        op.drop_column("users", "cash_balance_usd")

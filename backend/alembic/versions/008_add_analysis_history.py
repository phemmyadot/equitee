"""Add analysis_history table

Revision ID: 008
Revises: 007
Create Date: 2026-04-03
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "analysis_history" not in inspector.get_table_names():
        op.create_table(
            "analysis_history",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column(
                "user_id",
                sa.Integer(),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.Column("scope", sa.String(), nullable=False),
            sa.Column("depth", sa.String(), nullable=False),
            sa.Column("model_used", sa.String(), nullable=False),
            sa.Column("summary", sa.String(), nullable=True),
            sa.Column("full_response", sa.Text(), nullable=True),
            sa.Column("context_hash", sa.String(), nullable=True),
            sa.Column("tokens_used", sa.Integer(), nullable=True),
        )
        op.create_index(
            "ix_analysis_history_user_id", "analysis_history", ["user_id"]
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "analysis_history" in inspector.get_table_names():
        op.drop_index("ix_analysis_history_user_id", table_name="analysis_history")
        op.drop_table("analysis_history")

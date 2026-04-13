"""Add parent_id and follow_up_question to analysis_history

Revision ID: 014
Revises: 013
Create Date: 2026-04-13
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    cols = {c["name"] for c in inspector.get_columns("analysis_history")}

    if "parent_id" not in cols:
        op.add_column(
            "analysis_history",
            sa.Column(
                "parent_id",
                sa.Integer(),
                sa.ForeignKey("analysis_history.id", ondelete="CASCADE"),
                nullable=True,
            ),
        )
    if "follow_up_question" not in cols:
        op.add_column(
            "analysis_history",
            sa.Column("follow_up_question", sa.Text(), nullable=True),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    cols = {c["name"] for c in inspector.get_columns("analysis_history")}

    if "follow_up_question" in cols:
        op.drop_column("analysis_history", "follow_up_question")
    if "parent_id" in cols:
        op.drop_column("analysis_history", "parent_id")

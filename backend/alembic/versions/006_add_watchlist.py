"""Add watchlist table

Revision ID: 006
Revises: 005
Create Date: 2026-03-19
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "watchlist" not in inspector.get_table_names():
        op.create_table(
            "watchlist",
            sa.Column("id",       sa.Integer(),                      nullable=False),
            sa.Column("user_id",  sa.Integer(),                      nullable=False),
            sa.Column("ticker",   sa.String(),                       nullable=False),
            sa.Column("market",   sa.String(),  server_default="NGX", nullable=False),
            sa.Column("added_at", sa.DateTime(timezone=True),        nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id", "ticker", name="uq_watchlist_user_ticker"),
        )
        op.create_index("ix_watchlist_user_id", "watchlist", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_watchlist_user_id", table_name="watchlist")
    op.drop_table("watchlist")

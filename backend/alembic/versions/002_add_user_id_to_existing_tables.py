"""Add user_id to holdings, closed_positions, portfolio_snapshots

Revision ID: 002
Revises: 001
Create Date: 2026-03-15

All existing rows are assigned user_id=1 (the first admin created by ensure_first_admin).
Note: ForeignKey constraint omitted from column definition — SQLite does not enforce FK
constraints at the column level during batch ALTER TABLE. Referential integrity is
enforced by application code.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "000"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("holdings") as batch_op:
        batch_op.add_column(
            sa.Column("user_id", sa.Integer(), nullable=False, server_default="1")
        )
        batch_op.create_index(
            "ix_holdings_user_market_active", ["user_id", "market", "is_active"]
        )

    with op.batch_alter_table("closed_positions") as batch_op:
        batch_op.add_column(
            sa.Column("user_id", sa.Integer(), nullable=False, server_default="1")
        )
        batch_op.create_index("ix_closed_user_market", ["user_id", "market"])

    with op.batch_alter_table("portfolio_snapshots") as batch_op:
        batch_op.add_column(
            sa.Column("user_id", sa.Integer(), nullable=False, server_default="1")
        )
        batch_op.create_index("ix_snapshots_user_ts", ["user_id", "ts"])


def downgrade() -> None:
    with op.batch_alter_table("portfolio_snapshots") as batch_op:
        batch_op.drop_index("ix_snapshots_user_ts")
        batch_op.drop_column("user_id")

    with op.batch_alter_table("closed_positions") as batch_op:
        batch_op.drop_index("ix_closed_user_market")
        batch_op.drop_column("user_id")

    with op.batch_alter_table("holdings") as batch_op:
        batch_op.drop_index("ix_holdings_user_market_active")
        batch_op.drop_column("user_id")

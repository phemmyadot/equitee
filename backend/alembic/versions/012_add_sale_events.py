"""Add sale_events table (backfill full closes from closed_positions)

Revision ID: 012
Revises: 011
Create Date: 2026-04-08
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text

revision = "012"
down_revision = "011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if "sale_events" not in inspector.get_table_names():
        op.create_table(
            "sale_events",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("holding_id", sa.Integer(), sa.ForeignKey("holdings.id", ondelete="SET NULL"), nullable=True),
            sa.Column("ticker", sa.String(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("market", sa.String(), nullable=False),
            sa.Column("shares_sold", sa.Float(), nullable=False),
            sa.Column("sale_price", sa.Float(), nullable=False),
            sa.Column("proceeds", sa.Float(), nullable=False),
            sa.Column("realized_pl", sa.Float(), nullable=False),
            sa.Column("fully_closed", sa.Boolean(), nullable=False, server_default="false"),
            sa.Column("sold_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_sale_events_user_id", "sale_events", ["user_id"])
        op.create_index("ix_sale_events_user_sold_at", "sale_events", ["user_id", "sold_at"])

        # Backfill: import all fully-closed positions as sale_events.
        # We don't have shares_sold or sale_price in closed_positions, so we
        # synthesise them: shares_sold = 0 (unknown), sale_price = 0 (unknown),
        # proceeds = realized_pl + cost_basis (also unknown) → set to 0.
        # realized_pl is preserved. fully_closed = true.
        bind.execute(text("""
            INSERT INTO sale_events
                (user_id, holding_id, ticker, name, market,
                 shares_sold, sale_price, proceeds, realized_pl, fully_closed, sold_at)
            SELECT
                cp.user_id,
                h.id,
                cp.ticker,
                cp.name,
                cp.market,
                0.0,
                0.0,
                0.0,
                cp.realized_pl,
                true,
                cp.closed_at
            FROM closed_positions cp
            LEFT JOIN holdings h
              ON h.ticker = cp.ticker
             AND h.user_id = cp.user_id
             AND h.is_active = false
        """))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "sale_events" in inspector.get_table_names():
        op.drop_index("ix_sale_events_user_sold_at", table_name="sale_events")
        op.drop_index("ix_sale_events_user_id", table_name="sale_events")
        op.drop_table("sale_events")

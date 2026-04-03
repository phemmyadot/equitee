"""Add col_d to financials_cache for net_cash field

Revision ID: 004
Revises: 003
Create Date: 2026-03-19
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("financials_cache", sa.Column("col_d", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("financials_cache", "col_d")

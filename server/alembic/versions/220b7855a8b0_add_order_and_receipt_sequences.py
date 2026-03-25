"""Add order and receipt sequences

Revision ID: 220b7855a8b0
Revises: 470671bb3887
Create Date: 2026-03-25 18:28:33.968920

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '220b7855a8b0'
down_revision: Union[str, Sequence[str], None] = '470671bb3887'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE SEQUENCE IF NOT EXISTS order_number_seq")
    op.execute("CREATE SEQUENCE IF NOT EXISTS receipt_number_seq")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP SEQUENCE IF EXISTS order_number_seq")
    op.execute("DROP SEQUENCE IF EXISTS receipt_number_seq")

"""add_hsn_gst_display_ids

Revision ID: 54f2d08390ab
Revises: e82286e5f970
Create Date: 2026-03-21 03:20:31.434909

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import secrets
import string
from datetime import datetime, timezone


# revision identifiers, used by Alembic.
revision: str = '54f2d08390ab'
down_revision: Union[str, Sequence[str], None] = 'e82286e5f970'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _nanoid(prefix, length=4):
    alpha = string.ascii_uppercase + string.digits
    return f"{prefix}-{''.join(secrets.choice(alpha) for _ in range(length))}"


def upgrade() -> None:
    # ── 1. NanoID display_id columns (nullable first, then backfill) ───────
    for table in ('inquiry_groups', 'quote_versions', 'tickets'):
        op.add_column(table, sa.Column('display_id', sa.String(), nullable=True))

    # Backfill existing rows
    conn = op.get_bind()
    prefix_map = {'inquiry_groups': 'INQ', 'quote_versions': 'QTV', 'tickets': 'TKT'}
    for table, prefix in prefix_map.items():
        rows = conn.execute(sa.text(f"SELECT id FROM {table} WHERE display_id IS NULL")).fetchall()
        for row in rows:
            conn.execute(
                sa.text(f"UPDATE {table} SET display_id = :did WHERE id = :id"),
                {"did": _nanoid(prefix), "id": row[0]}
            )

    # Now make NOT NULL and add unique index
    for table in ('inquiry_groups', 'quote_versions', 'tickets'):
        op.alter_column(table, 'display_id', nullable=False)
        op.create_index(op.f(f'ix_{table}_display_id'), table, ['display_id'], unique=True)

    # ── 2. Sequence-based columns (nullable, backfilled) ──────────────────
    op.execute(sa.text("CREATE SEQUENCE IF NOT EXISTS order_number_seq"))
    op.execute(sa.text("CREATE SEQUENCE IF NOT EXISTS receipt_number_seq"))

    op.add_column('orders', sa.Column('order_number', sa.String(), nullable=True))
    op.add_column('transactions', sa.Column('receipt_number', sa.String(), nullable=True))

    year = datetime.now(timezone.utc).year
    orders = conn.execute(sa.text("SELECT id FROM orders WHERE order_number IS NULL ORDER BY created_at")).fetchall()
    for row in orders:
        seq = conn.execute(sa.text("SELECT nextval('order_number_seq')")).scalar()
        conn.execute(
            sa.text("UPDATE orders SET order_number = :num WHERE id = :id"),
            {"num": f"ORD-{year}-{seq:04d}", "id": row[0]}
        )
    txns = conn.execute(sa.text("SELECT id FROM transactions WHERE receipt_number IS NULL ORDER BY created_at")).fetchall()
    for row in txns:
        seq = conn.execute(sa.text("SELECT nextval('receipt_number_seq')")).scalar()
        conn.execute(
            sa.text("UPDATE transactions SET receipt_number = :num WHERE id = :id"),
            {"num": f"REC-{year}-{seq:04d}", "id": row[0]}
        )

    op.create_index(op.f('ix_orders_order_number'), 'orders', ['order_number'], unique=True)
    op.create_index(op.f('ix_transactions_receipt_number'), 'transactions', ['receipt_number'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_transactions_receipt_number'), table_name='transactions')
    op.drop_column('transactions', 'receipt_number')
    op.drop_index(op.f('ix_orders_order_number'), table_name='orders')
    op.drop_column('orders', 'order_number')
    for table in ('tickets', 'quote_versions', 'inquiry_groups'):
        op.drop_index(op.f(f'ix_{table}_display_id'), table_name=table)
        op.drop_column(table, 'display_id')
    op.execute(sa.text("DROP SEQUENCE IF EXISTS order_number_seq"))
    op.execute(sa.text("DROP SEQUENCE IF EXISTS receipt_number_seq"))

"""initial_schema

Revision ID: 470671bb3887
Revises: 
Create Date: 2026-03-23 17:23:50.328012

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '470671bb3887'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # 1. Users (Master table)
    op.create_table('users',
    sa.Column('id', sa.Uuid(), server_default=sa.text('uuidv7()'), nullable=False),
    sa.Column('profile_picture', sa.String(), nullable=True),
    sa.Column('name', sa.String(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('password', sa.String(), nullable=True),
    sa.Column('phone', sa.String(), nullable=True),
    sa.Column('admin', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('token_version', sa.Integer(), nullable=False),
    sa.Column('email_bounced', sa.Boolean(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. Independent Categorization Tables
    op.create_table('products',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('slug', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('cover_image', sa.String(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_products_slug'), 'products', ['slug'], unique=True)

    op.create_table('services',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('slug', sa.String(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('cover_image', sa.String(), nullable=True),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name'),
    sa.UniqueConstraint('slug')
    )
    op.create_index(op.f('ix_services_id'), 'services', ['id'], unique=False)

    op.create_table('email_logs',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('recipient', sa.String(), nullable=False),
    sa.Column('subject', sa.String(), nullable=False),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('message_id', sa.String(), nullable=True),
    sa.Column('inquiry_id', sa.Uuid(), nullable=True),
    sa.Column('sent_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('metadata', sa.JSON(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_email_logs_inquiry_id'), 'email_logs', ['inquiry_id'], unique=False)
    op.create_index(op.f('ix_email_logs_message_id'), 'email_logs', ['message_id'], unique=True)
    op.create_index(op.f('ix_email_logs_recipient'), 'email_logs', ['recipient'], unique=False)
    op.create_index(op.f('ix_email_logs_status'), 'email_logs', ['status'], unique=False)

    # 3. Inquiry/Quote (Circular Dependencies)
    op.create_table('inquiry_groups',
    sa.Column('id', sa.Uuid(), server_default=sa.text('uuidv7()'), nullable=False),
    sa.Column('display_id', sa.String(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('active_quote_id', sa.Uuid(), nullable=True),
    sa.Column('quote_email_status', sa.String(), nullable=True),
    sa.Column('admin_notes', sa.Text(), nullable=True),
    sa.Column('is_offline', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inquiry_groups_display_id'), 'inquiry_groups', ['display_id'], unique=True)
    op.create_index(op.f('ix_inquiry_groups_status'), 'inquiry_groups', ['status'], unique=False)
    op.create_index(op.f('ix_inquiry_groups_user_id'), 'inquiry_groups', ['user_id'], unique=False)

    op.create_table('quote_versions',
    sa.Column('id', sa.Uuid(), server_default=sa.text('uuidv7()'), nullable=False),
    sa.Column('display_id', sa.String(), nullable=False),
    sa.Column('inquiry_id', sa.Uuid(), nullable=False),
    sa.Column('version', sa.Integer(), nullable=False),
    sa.Column('created_by', sa.Uuid(), nullable=False),
    sa.Column('total_price', sa.Float(), nullable=False),
    sa.Column('tax_amount', sa.Float(), nullable=True),
    sa.Column('shipping_amount', sa.Float(), nullable=True),
    sa.Column('discount_amount', sa.Float(), nullable=True),
    sa.Column('valid_until', sa.DateTime(timezone=True), nullable=False),
    sa.Column('admin_notes', sa.Text(), nullable=True),
    sa.Column('milestones', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('line_items', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['inquiry_id'], ['inquiry_groups.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quote_versions_display_id'), 'quote_versions', ['display_id'], unique=True)
    op.create_index(op.f('ix_quote_versions_inquiry_id'), 'quote_versions', ['inquiry_id'], unique=False)

    # Add circular FK later
    op.create_foreign_key(None, 'inquiry_groups', 'quote_versions', ['active_quote_id'], ['id'])

    # 4. Message & Notification Tables
    op.create_table('inquiry_messages',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('inquiry_group_id', sa.Uuid(), nullable=False),
    sa.Column('sender_id', sa.Uuid(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('file_urls', sa.ARRAY(sa.String()), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['inquiry_group_id'], ['inquiry_groups.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inquiry_messages_inquiry_group_id'), 'inquiry_messages', ['inquiry_group_id'], unique=False)

    op.create_table('notifications',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('is_read', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('metadata', sa.JSON(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)

    # 5. Business Logic Tables (Orders, Sub-Products, Services)
    op.create_table('orders',
    sa.Column('id', sa.Uuid(), server_default=sa.text('uuidv7()'), nullable=False),
    sa.Column('order_number', sa.String(), nullable=True),
    sa.Column('inquiry_id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('total_amount', sa.Double(), nullable=False),
    sa.Column('tax_amount', sa.Double(), nullable=True),
    sa.Column('shipping_amount', sa.Double(), nullable=True),
    sa.Column('discount_amount', sa.Double(), nullable=True),
    sa.Column('amount_paid', sa.Double(), nullable=True),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('payment_gateway_order_id', sa.String(), nullable=True),
    sa.Column('admin_notes', sa.String(), nullable=True),
    sa.Column('is_offline', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['inquiry_id'], ['inquiry_groups.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_orders_order_number'), 'orders', ['order_number'], unique=True)
    op.create_index(op.f('ix_orders_payment_gateway_order_id'), 'orders', ['payment_gateway_order_id'], unique=True)

    op.create_table('sub_products',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('product_id', sa.Integer(), nullable=False),
    sa.Column('slug', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('base_price', sa.Double(), nullable=False),
    sa.Column('minimum_quantity', sa.Integer(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('type', sa.String(), nullable=False),
    sa.Column('config_schema', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('images', sa.ARRAY(sa.String()), nullable=True),
    sa.Column('hsn_code', sa.String(), nullable=True),
    sa.Column('cgst_rate', sa.Double(), nullable=True),
    sa.Column('sgst_rate', sa.Double(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sub_products_slug'), 'sub_products', ['slug'], unique=True)

    op.create_table('sub_services',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('service_id', sa.Integer(), nullable=True),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('slug', sa.String(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('minimum_quantity', sa.Integer(), nullable=True),
    sa.Column('price_per_unit', sa.Float(), nullable=True),
    sa.Column('images', sa.ARRAY(sa.String()), nullable=True),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('hsn_code', sa.String(), nullable=True),
    sa.Column('cgst_rate', sa.Float(), nullable=True),
    sa.Column('sgst_rate', sa.Float(), nullable=True),
    sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('slug')
    )
    op.create_index(op.f('ix_sub_services_id'), 'sub_services', ['id'], unique=False)

    op.create_table('tickets',
    sa.Column('id', sa.Uuid(), server_default=sa.text('uuidv7()'), nullable=False),
    sa.Column('display_id', sa.String(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('subject', sa.String(length=300), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('priority', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tickets_display_id'), 'tickets', ['display_id'], unique=True)
    op.create_index(op.f('ix_tickets_user_id'), 'tickets', ['user_id'], unique=False)

    # 6. Detail Tables (Inquiry Items, Milestones, Reviews, Messages)
    op.create_table('inquiry_items',
    sa.Column('id', sa.Uuid(), server_default=sa.text('uuidv7()'), nullable=False),
    sa.Column('group_id', sa.Uuid(), nullable=False),
    sa.Column('product_id', sa.Integer(), nullable=True),
    sa.Column('subproduct_id', sa.Integer(), nullable=True),
    sa.Column('service_id', sa.Integer(), nullable=True),
    sa.Column('subservice_id', sa.Integer(), nullable=True),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.Column('selected_options', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('images', sa.ARRAY(sa.String()), nullable=True),
    sa.Column('line_item_price', sa.Integer(), nullable=True),
    sa.Column('estimated_price', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['group_id'], ['inquiry_groups.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
    sa.ForeignKeyConstraint(['service_id'], ['services.id'], ),
    sa.ForeignKeyConstraint(['subproduct_id'], ['sub_products.id'], ),
    sa.ForeignKeyConstraint(['subservice_id'], ['sub_services.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inquiry_items_group_id'), 'inquiry_items', ['group_id'], unique=False)

    op.create_table('order_milestones',
    sa.Column('id', sa.Uuid(), server_default=sa.text('uuidv7()'), nullable=False),
    sa.Column('order_id', sa.Uuid(), nullable=False),
    sa.Column('label', sa.String(), nullable=False),
    sa.Column('percentage', sa.Double(), nullable=False),
    sa.Column('amount', sa.Double(), nullable=False),
    sa.Column('order_index', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('order_id', 'order_index', name='uix_order_milestone_index')
    )

    op.create_table('reviews',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('product_id', sa.Integer(), nullable=True),
    sa.Column('service_id', sa.Integer(), nullable=True),
    sa.Column('rating', sa.Integer(), nullable=False),
    sa.Column('comment', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('is_verified', sa.Boolean(), nullable=True),
    sa.CheckConstraint('rating >= 1 AND rating <= 5', name='valid_rating_range'),
    sa.ForeignKeyConstraint(['product_id'], ['sub_products.id'], ),
    sa.ForeignKeyConstraint(['service_id'], ['sub_services.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('ticket_messages',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('ticket_id', sa.Uuid(), nullable=False),
    sa.Column('sender_id', sa.Uuid(), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('is_read', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['ticket_id'], ['tickets.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ticket_messages_ticket_id'), 'ticket_messages', ['ticket_id'], unique=False)

    op.create_table('wishlists',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('sub_product_id', sa.Integer(), nullable=True),
    sa.Column('sub_service_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.CheckConstraint('(sub_product_id IS NOT NULL) OR (sub_service_id IS NOT NULL)', name='check_single_whishlist_item'),
    sa.ForeignKeyConstraint(['sub_product_id'], ['sub_products.id'], ),
    sa.ForeignKeyConstraint(['sub_service_id'], ['sub_services.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'sub_product_id', name='uq_user_subproduct_wishlist'),
    sa.UniqueConstraint('user_id', 'sub_service_id', name='uq_user_subservice_wishlist')
    )
    op.create_index(op.f('ix_wishlists_id'), 'wishlists', ['id'], unique=False)

    op.create_table('payment_declarations',
    sa.Column('id', sa.Uuid(), server_default=sa.text('uuidv7()'), nullable=False),
    sa.Column('order_id', sa.Uuid(), nullable=False),
    sa.Column('milestone_id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('payment_mode', sa.String(), nullable=False),
    sa.Column('utr_number', sa.String(), nullable=True),
    sa.Column('screenshot_url', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('rejection_reason', sa.String(), nullable=True),
    sa.Column('reviewed_by', sa.Uuid(), nullable=True),
    sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['milestone_id'], ['order_milestones.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('utr_number')
    )

    op.create_table('transactions',
    sa.Column('id', sa.Uuid(), server_default=sa.text('uuidv7()'), nullable=False),
    sa.Column('receipt_number', sa.String(), nullable=True),
    sa.Column('order_id', sa.Uuid(), nullable=False),
    sa.Column('milestone_id', sa.Uuid(), nullable=False),
    sa.Column('amount', sa.Double(), nullable=False),
    sa.Column('payment_mode', sa.String(), nullable=False),
    sa.Column('gateway_payment_id', sa.String(), nullable=True),
    sa.Column('notes', sa.String(), nullable=True),
    sa.Column('recorded_by_admin', sa.Uuid(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['milestone_id'], ['order_milestones.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['recorded_by_admin'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('gateway_payment_id')
    )
    op.create_index(op.f('ix_transactions_receipt_number'), 'transactions', ['receipt_number'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_transactions_receipt_number'), table_name='transactions')
    op.drop_table('transactions')
    op.drop_table('payment_declarations')
    op.drop_index(op.f('ix_wishlists_id'), table_name='wishlists')
    op.drop_table('wishlists')
    op.drop_index(op.f('ix_ticket_messages_ticket_id'), table_name='ticket_messages')
    op.drop_table('ticket_messages')
    op.drop_table('reviews')
    op.drop_table('order_milestones')
    op.drop_index(op.f('ix_inquiry_items_group_id'), table_name='inquiry_items')
    op.drop_table('inquiry_items')
    op.drop_index(op.f('ix_tickets_user_id'), table_name='tickets')
    op.drop_index(op.f('ix_tickets_display_id'), table_name='tickets')
    op.drop_table('tickets')
    op.drop_index(op.f('ix_sub_services_id'), table_name='sub_services')
    op.drop_table('sub_services')
    op.drop_index(op.f('ix_sub_products_slug'), table_name='sub_products')
    op.drop_table('sub_products')
    op.drop_index(op.f('ix_orders_payment_gateway_order_id'), table_name='orders')
    op.drop_index(op.f('ix_orders_order_number'), table_name='orders')
    op.drop_table('orders')
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_table('notifications')
    op.drop_index(op.f('ix_inquiry_messages_inquiry_group_id'), table_name='inquiry_messages')
    op.drop_table('inquiry_messages')
    op.create_foreign_key(None, 'inquiry_groups', 'quote_versions', ['active_quote_id'], ['id'])
    op.drop_index(op.f('ix_quote_versions_inquiry_id'), table_name='quote_versions')
    op.drop_index(op.f('ix_quote_versions_display_id'), table_name='quote_versions')
    op.drop_table('quote_versions')
    op.drop_index(op.f('ix_inquiry_groups_user_id'), table_name='inquiry_groups')
    op.drop_index(op.f('ix_inquiry_groups_status'), table_name='inquiry_groups')
    op.drop_index(op.f('ix_inquiry_groups_display_id'), table_name='inquiry_groups')
    op.drop_table('inquiry_groups')
    op.drop_index(op.f('ix_email_logs_status'), table_name='email_logs')
    op.drop_index(op.f('ix_email_logs_recipient'), table_name='email_logs')
    op.drop_index(op.f('ix_email_logs_message_id'), table_name='email_logs')
    op.drop_index(op.f('ix_email_logs_inquiry_id'), table_name='email_logs')
    op.drop_table('email_logs')
    op.drop_index(op.f('ix_services_id'), table_name='services')
    op.drop_table('services')
    op.drop_index(op.f('ix_products_slug'), table_name='products')
    op.drop_table('products')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')

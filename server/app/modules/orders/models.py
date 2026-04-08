from sqlalchemy import ForeignKey, Column, String, DateTime, func, Numeric, Uuid, Integer, text, UniqueConstraint, Sequence, event, Boolean, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.core.database import Base

# PostgreSQL sequences for human-readable serial numbers
order_number_seq  = Sequence("order_number_seq")
receipt_number_seq = Sequence("receipt_number_seq")

class Order(Base):
    __tablename__ = 'orders'
    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    order_number = Column(String, unique=True, nullable=True, index=True)  # ORD-2026-0001
    inquiry_id = Column(Uuid, ForeignKey('inquiry_groups.id'), nullable=False)
    user_id = Column(Uuid, ForeignKey('users.id'), nullable=False)
    
    total_amount = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0.0)
    shipping_amount = Column(Numeric(10, 2), default=0.0)
    discount_amount = Column(Numeric(10, 2), default=0.0)
    amount_paid = Column(Numeric(10, 2), default=0.0) # Cache: Sum of related Transactions
    status = Column(String, default='WAITING_PAYMENT')
    split_type = Column(String, default='HALF')  # FULL, HALF, CUSTOM — prevents accidental overwrite
    is_custom_milestone_requested = Column(Boolean, default=False, nullable=False)
    payment_gateway_order_id = Column(String, nullable=True, unique=True, index=True)
    admin_notes = Column(String, nullable=True)
    is_offline = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('ix_orders_inquiry_id', 'inquiry_id'),
        Index('ix_orders_user_id', 'user_id'),
        Index('ix_orders_status', 'status'),
    )

    # Relationships
    user = relationship("User")
    milestones = relationship("OrderMilestone", back_populates="order", cascade="all, delete-orphan", order_by="OrderMilestone.order_index")
    transactions = relationship("Transaction", back_populates="order")
    declarations = relationship("PaymentDeclaration", back_populates="order")
    
    @property
    def user_name(self):
        return self.user.name if self.user else None
        
    @property
    def user_email(self):
        return self.user.email if self.user else None


class OrderMilestone(Base):
    __tablename__ = 'order_milestones'
    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    order_id = Column(Uuid, ForeignKey('orders.id', ondelete="CASCADE"), nullable=False, index=True)
    split_type = Column(String, nullable=False, default='HALF')
    
    label = Column(String, nullable=False) # e.g., "Advance (50%)", "Dispatch (50%)"
    percentage = Column(Numeric(10, 2), nullable=False) # Source of truth
    amount = Column(Numeric(10, 2), nullable=False) # Derived cache
    order_index = Column(Integer, nullable=False) 
    
    status = Column(String, default='UNPAID') # UNPAID, PENDING (declaration submitted), PAID
    paid_at = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)  # Optional scheduled payment date
    
    # Ensure milestone sequence is unique per order and split_type
    __table_args__ = (UniqueConstraint('order_id', 'split_type', 'order_index', name='uix_order_milestone_split_index'),)
    
    order = relationship("Order", back_populates="milestones")
    transactions = relationship("Transaction", back_populates="milestone")
    declarations = relationship("PaymentDeclaration", back_populates="milestone")


class Transaction(Base):
    """Immutable ledger of actual, confirmed payments."""
    __tablename__ = 'transactions'
    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    receipt_number = Column(String, unique=True, nullable=True, index=True)  # REC-2026-0001
    order_id = Column(Uuid, ForeignKey('orders.id', ondelete="RESTRICT"), nullable=False, index=True)
    milestone_id = Column(Uuid, ForeignKey('order_milestones.id', ondelete="RESTRICT"), nullable=False, index=True)
    
    amount = Column(Numeric(10, 2), nullable=False)
    payment_mode = Column(String, nullable=False)
    gateway_payment_id = Column(String, unique=True, nullable=True) # Null for manual UPI
    notes = Column(String, nullable=True)
    
    recorded_by_admin = Column(Uuid, ForeignKey('users.id'), nullable=True) # Who approved the manual payment
    created_at = Column(DateTime(timezone=True), server_default=func.now()) # Never updated
    
    order = relationship("Order", back_populates="transactions")
    milestone = relationship("OrderMilestone", back_populates="transactions")


class PaymentDeclaration(Base):
    __tablename__ = 'payment_declarations'
    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    order_id = Column(Uuid, ForeignKey('orders.id', ondelete="CASCADE"), nullable=False, index=True)
    milestone_id = Column(Uuid, ForeignKey('order_milestones.id', ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Uuid, ForeignKey('users.id'), nullable=False, index=True)

    payment_mode = Column(String, nullable=False)
    utr_number = Column(String, unique=True, nullable=True)
    screenshot_url = Column(String, nullable=True)

    status = Column(String, default='PENDING')
    rejection_reason = Column(String, nullable=True)

    reviewed_by = Column(Uuid, ForeignKey('users.id'), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="declarations")
    milestone = relationship("OrderMilestone", back_populates="declarations")

    @property
    def order_number(self):
        return self.order.order_number if self.order else None

    @property
    def milestone_label(self):
        """Include percentage for better context (e.g., 'Advance (50%)')"""
        if self.milestone:
            return f"{self.milestone.label} ({self.milestone.percentage}%)"
        return None


# These are "before_insert" events on ORM models. In SQLAlchemy 2.x with async,
# the `connection` parameter in ORM events is a sync connection proxy, so
# connection.execute(Sequence) works correctly inside ORM events even with async sessions.
# The key fix: use connection.execute(Sequence) properly — it returns a scalar directly.

@event.listens_for(Order, "before_insert")
def _set_order_number(mapper, connection, target):
    if not target.order_number:
        seq_val = connection.execute(order_number_seq)
        year = datetime.now(timezone.utc).year
        target.order_number = f"ORD-{year}-{seq_val:04d}"


@event.listens_for(Transaction, "before_insert")
def _set_receipt_number(mapper, connection, target):
    if not target.receipt_number:
        seq_val = connection.execute(receipt_number_seq)
        year = datetime.now(timezone.utc).year
        target.receipt_number = f"REC-{year}-{seq_val:04d}"
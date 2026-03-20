from sqlalchemy import ForeignKey, Column, String, DateTime, func, Double, Uuid, Integer, text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base

class Order(Base):
    __tablename__ = 'orders'
    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    inquiry_id = Column(Uuid, ForeignKey('inquiry_groups.id'), nullable=False)
    user_id = Column(Uuid, ForeignKey('users.id'), nullable=False)
    
    total_amount = Column(Double, nullable=False)
    amount_paid = Column(Double, default=0.0) # Cache: Sum of related Transactions
    status = Column(String, default='WAITING_PAYMENT')
    payment_gateway_order_id = Column(String, nullable=True, unique=True, index=True)
    admin_notes = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    milestones = relationship("OrderMilestone", back_populates="order", cascade="all, delete-orphan", order_by="OrderMilestone.order_index")
    transactions = relationship("Transaction", back_populates="order")
    declarations = relationship("PaymentDeclaration", back_populates="order")


class OrderMilestone(Base):
    __tablename__ = 'order_milestones'
    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    order_id = Column(Uuid, ForeignKey('orders.id', ondelete="CASCADE"), nullable=False)
    
    label = Column(String, nullable=False) # e.g., "Advance (50%)", "Dispatch (50%)"
    percentage = Column(Double, nullable=False) # Source of truth
    amount = Column(Double, nullable=False) # Derived cache
    order_index = Column(Integer, nullable=False) 
    
    status = Column(String, default='UNPAID') # UNPAID, PENDING (declaration submitted), PAID
    paid_at = Column(DateTime(timezone=True), nullable=True)
    
    # Ensure milestone sequence is unique per order
    __table_args__ = (UniqueConstraint('order_id', 'order_index', name='uix_order_milestone_index'),)
    
    order = relationship("Order", back_populates="milestones")
    transactions = relationship("Transaction", back_populates="milestone")
    declarations = relationship("PaymentDeclaration", back_populates="milestone")


class Transaction(Base):
    """Immutable ledger of actual, confirmed payments."""
    __tablename__ = 'transactions'
    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    order_id = Column(Uuid, ForeignKey('orders.id', ondelete="RESTRICT"), nullable=False)
    milestone_id = Column(Uuid, ForeignKey('order_milestones.id', ondelete="RESTRICT"), nullable=False) 
    
    amount = Column(Double, nullable=False) # Positive for payment, negative for refund
    payment_mode = Column(String, nullable=False) # ONLINE, UPI_MANUAL, BANK_TRANSFER
    gateway_payment_id = Column(String, unique=True, nullable=True) # Null for manual UPI
    notes = Column(String, nullable=True)
    
    recorded_by_admin = Column(Uuid, ForeignKey('users.id'), nullable=True) # Who approved the manual payment
    created_at = Column(DateTime(timezone=True), server_default=func.now()) # Never updated
    
    order = relationship("Order", back_populates="transactions")
    milestone = relationship("OrderMilestone", back_populates="transactions")


class PaymentDeclaration(Base):
    __tablename__ = 'payment_declarations'
    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    order_id = Column(Uuid, ForeignKey('orders.id', ondelete="CASCADE"), nullable=False)
    milestone_id = Column(Uuid, ForeignKey('order_milestones.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(Uuid, ForeignKey('users.id'), nullable=False)

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
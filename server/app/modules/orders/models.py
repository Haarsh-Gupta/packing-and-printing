from datetime import datetime
from sqlalchemy import ForeignKey, Column, String, DateTime, func, Double, Uuid, Boolean, Integer, text
from sqlalchemy.orm import relationship

from app.core.database import Base

class Order(Base):
    __tablename__ = 'orders'
    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    inquiry_id = Column(Uuid, ForeignKey('inquiry_groups.id'), nullable=False)
    user_id = Column(Uuid, ForeignKey('users.id'), nullable=False)
    total_amount = Column(Double, nullable=False)
    amount_paid = Column(Double, default=0.0)
    status = Column(String, default='WAITING_PAYMENT')
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    milestones = relationship("OrderMilestone", back_populates="order", cascade="all, delete-orphan", order_by="OrderMilestone.order_index")
    transactions = relationship("Transaction", back_populates="order", cascade="all, delete-orphan")


class OrderMilestone(Base):
    __tablename__ = 'order_milestones'
    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    order_id = Column(Uuid, ForeignKey('orders.id'), nullable=False)
    
    label = Column(String, nullable=False) 
    amount = Column(Double, nullable=False)
    percentage = Column(Double, nullable=False)
    order_index = Column(Integer, nullable=False) # 1, 2, or 3 for sequence
    
    is_paid = Column(Boolean, default=False)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    
    # For manual QR/UPI verification
    verification_id = Column(String, nullable=True) # UTR number
    verification_status = Column(String, default="PENDING") # PENDING, VERIFYING, APPROVED, REJECTED
    
    order = relationship("Order", back_populates="milestones")
    transactions = relationship("Transaction", back_populates="milestone")


class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    order_id = Column(Uuid, ForeignKey('orders.id'), nullable=False)
    milestone_id = Column(Uuid, ForeignKey('order_milestones.id'), nullable=False) # Link to specific milestone
    
    amount = Column(Double, nullable=False)
    payment_mode = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    gateway_payment_id = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="transactions")
    milestone = relationship("OrderMilestone", back_populates="transactions")
from datetime import datetime
from sqlalchemy import ForeignKey , Column , Integer , String , DateTime, Boolean, func , Float
from sqlalchemy.orm import relationship

from app.core.database import Base


class Order(Base):
    __tablename__ = 'orders'
    id = Column(Integer, primary_key=True, autoincrement=True)
    inquiry_id = Column(Integer, ForeignKey('inquiries.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    total_amount = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    status = Column(String, default='WAITING_PAYMENT')
    payment_gateway_order_id = Column(String, nullable=True)  # e.g. razorpay order_id
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    # user = relationship("User", back_populates="orders")
    # inquiry = relationship("Inquiry", back_populates="order", uselist=False)
    # transactions = relationship("Transaction", back_populates="order", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    amount = Column(Float, nullable=False)
    payment_mode = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    gateway_payment_id = Column(String, nullable=True)   # e.g. razorpay payment_id
    gateway_signature = Column(String, nullable=True)     # e.g. razorpay signature
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    # order = relationship("Order", back_populates="transactions")
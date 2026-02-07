from datetime import datetime
from sqlalchemy import ForeignKey , Column , Integer , String , DateTime, Boolean, func , Float
from sqlalchemy.orm import relationship

from app.core.database import Base

# from ..products.models import Inquiry
# from ..users.models import User

class Order(Base):
    __tablename__ = 'orders'
    id = Column(Integer, primary_key=True)
    # inquiry_id = Column(Integer, ForeignKey('inquiries.id'))  # Uncomment when Inquiry model is enabled
    user_id = Column(Integer, ForeignKey('users.id'))
    total_amount = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    status = Column(String, default='WAITING_PAYMENT')
    
    # user = relationship("User", back_populates="orders")

class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'))
    amount = Column(Float, nullable=False)
    payment_mode = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
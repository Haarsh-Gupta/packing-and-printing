from datetime import datetime
from sqlalchemy import Column , Integer , String , DateTime, Boolean, func
from sqlalchemy.orm import relationship

from app.core.database import Base

# from ..products.models import Inquiry
# from ..orders.models import Order


class User(Base):
    __tablename__ = "users"
    id = Column(Integer , primary_key = True , nullable = False , autoincrement = True)
    profile_picture = Column(String , nullable = True , default = "")
    name = Column(String , nullable = True)
    email = Column(String , nullable = False , index=True , unique=True)
    password = Column(String , nullable = False)
    phone = Column(String , nullable = True)
    admin = Column(Boolean , nullable = False , default = False)
    created_at = Column(DateTime(timezone = True) , server_default=func.now())

    inquiries = relationship("Inquiry", back_populates="user")
    # orders = relationship("Order", back_populates="user")

    def __repr__(self):
        return f"User(id={self.id}, name={self.name}, email={self.email}, phone={self.phone}, admin={self.admin}, created_at={self.created_at})"
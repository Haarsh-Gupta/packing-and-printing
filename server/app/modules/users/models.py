from datetime import datetime
from sqlalchemy import Column , Integer , String , DateTime, Boolean, func , Uuid , text
from sqlalchemy.orm import relationship

from app.core.database import Base

# from ..products.models import Inquiry
# from ..orders.models import Order


class User(Base):
    __tablename__ = "users"
    id = Column(Uuid , primary_key = True , nullable = False, server_default=text("uuidv7()"))
    profile_picture = Column(String , nullable = True , default = "")
    name = Column(String , nullable = True)
    email = Column(String , nullable = False , index=True , unique=True)
    password = Column(String , nullable = True)
    phone = Column(String , nullable = True)
    admin = Column(Boolean , nullable = False , default = False)
    created_at = Column(DateTime(timezone = True) , server_default=func.now())
    token_version = Column(Integer , nullable = False , default = 1)

    inquiry_groups = relationship("InquiryGroup", back_populates="user")
    # orders = relationship("Order", back_populates="user")

    def __repr__(self):
        return f"User(id={self.id}, name={self.name}, email={self.email}, phone={self.phone}, admin={self.admin}, created_at={self.created_at})"
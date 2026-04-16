from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, func, Uuid, text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.core.database import Base


class AddressType(str, PyEnum):
    BILLING = "BILLING"
    SHIPPING = "SHIPPING"


class User(Base):
    __tablename__ = "users"
    id = Column(Uuid , primary_key = True , nullable = False, server_default=text("uuidv7()"))
    profile_picture = Column(String , nullable = True , default = "")

    name = Column(String , nullable = True)
    email = Column(String , nullable = False , index=True , unique=True)
    phone = Column(String , nullable = True)
    password = Column(String , nullable = True)

    gstin = Column(String(15) , nullable = True)

    is_active = Column(Boolean , nullable = False , default = True)
    is_phone_verified = Column(Boolean, nullable=False, default=False)
    admin = Column(Boolean , nullable = False , default = False)
    created_at = Column(DateTime(timezone = True) , server_default=func.now())
    token_version = Column(Integer , nullable = False , default = 1)
    email_bounced = Column(Boolean, nullable = False, default = False)

    inquiry_groups = relationship("InquiryGroup", back_populates="user")
    orders = relationship("Order", back_populates="user")
    wishlists = relationship("Wishlist", back_populates="user")
    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self):
        return f"User(id={self.id}, name={self.name}, email={self.email}, phone={self.phone}, admin={self.admin}, created_at={self.created_at})"


class Address(Base):
    __tablename__ = "addresses"
    id = Column(Uuid , primary_key = True , nullable = False, server_default=text("uuidv7()"))
    user_id = Column(Uuid , ForeignKey("users.id") , nullable = False)
    address_type = Column(SAEnum(AddressType) , nullable = False)

    address_line_1 = Column(String(200) , nullable = False)
    address_line_2 = Column(String(200) , nullable = True)
    city = Column(String(100) , nullable = False)
    state = Column(String(100) , nullable = False)
    pincode = Column(String(6) , nullable = False)

    user = relationship("User" , back_populates="addresses")

    def __repr__(self):
        return f"Address(id={self.id}, user_id={self.user_id}, type={self.address_type}, city={self.city}, state={self.state}, pincode={self.pincode})"
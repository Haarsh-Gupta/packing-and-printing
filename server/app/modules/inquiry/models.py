from datetime import datetime
from sqlalchemy import Column, Integer, Double, String, DateTime, ForeignKey, Text, func , ARRAY, Uuid, text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base

class InquiryGroup(Base):
    """
    The Parent Container (The RFQ Cart).
    This holds the overall status, total price, and links to the user.
    """
    __tablename__ = 'inquiry_groups'
    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    user_id = Column(Uuid, ForeignKey('users.id'), nullable=False)
    status = Column(String, default='PENDING', nullable=False)

    # Total price of all items combined (Set by Admin)
    total_quoted_price = Column(Double, nullable=True)
    admin_notes = Column(Text, nullable=True)
    quoted_at = Column(DateTime(timezone=True), nullable=True)
    quote_valid_until = Column(DateTime(timezone=True), nullable=True)


    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="inquiry_groups")
    
    # One-to-Many link to the items in this quote. 
    # cascade ensures if the group is deleted, the items are deleted too.
    items = relationship("InquiryItem", back_populates="group", cascade="all, delete-orphan")
    
    # Messages happen at the group level (discussing the whole quote)
    messages = relationship("InquiryMessage", back_populates="group", cascade="all, delete-orphan")

    def __repr__(self):
        return f"InquiryGroup(id={self.id}, user_id={self.user_id}, status={self.status}, items={len(self.items)})"
    

class InquiryItem(Base):
    """
    Inquiry model - represents a user's product inquiry/request.
    Admin reviews and sends a quotation with pricing.
    """
    __tablename__ = 'inquiry_items'
    
    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    group_id = Column(Uuid, ForeignKey('inquiry_groups.id'), nullable=False)

    #product or the service
    product_id = Column(Integer, ForeignKey('products.id'), nullable=True)
    subproduct_id = Column(Integer, ForeignKey('sub_products.id'), nullable=True)
    #service and service variant
    service_id = Column(Integer, ForeignKey('services.id'), nullable=True)
    subservice_id = Column(Integer, ForeignKey('sub_service.id'), nullable=True)
    
    quantity = Column(Integer, nullable=False)
    
    # Stores the user's selected options as JSON
    # Example: {"binding_type": "spiral", "pages": 200, "paper_quality": "premium"}
    selected_options = Column(JSONB, nullable=True)
    
    # Additional notes/requirements from user
    notes = Column(Text, nullable=True)
    images = Column(ARRAY(String) , nullable = True)
    
    # Admin sets these after reviewing the inquiry
    line_item_price = Column(Double, nullable=True)

    
    # Relationships
    group = relationship("InquiryGroup", back_populates="items")
    product = relationship("Product", lazy="selectin")
    sub_product = relationship("SubProduct", back_populates="inquiry_items", lazy="selectin")
    service = relationship("Service", lazy="selectin")
    sub_service = relationship("SubService", lazy="selectin")

    @property
    def product_name(self):
        return self.product.name if self.product else None

    @property
    def subproduct_name(self):
        return self.sub_product.name if self.sub_product else None

    @property
    def service_name(self):
        return self.service.name if self.service else None

    @property
    def subservice_name(self):
        return self.sub_service.name if self.sub_service else None

    def __repr__(self):
        return f"InquiryItem(id={self.id}, group_id={self.group_id}, product_id={self.product_id}, subproduct_id={self.subproduct_id}, service_id={self.service_id}, subservice_id={self.subservice_id})"


class InquiryMessage(Base):
    """
    Message model - represents a single message in an inquiry thread.
    Can be from User or Admin.
    """
    __tablename__ = 'inquiry_messages'

    id = Column(Integer, primary_key=True, autoincrement=True)
    inquiry_group_id = Column(Uuid, ForeignKey('inquiry_groups.id'), nullable=False)
    sender_id = Column(Uuid, ForeignKey('users.id'), nullable=False)
    
    content = Column(Text, nullable=False)
    file_urls = Column(ARRAY(String), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    group = relationship("InquiryGroup", back_populates="messages")
    sender = relationship("User")
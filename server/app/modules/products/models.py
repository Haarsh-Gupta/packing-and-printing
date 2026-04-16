from sqlalchemy import Column, Integer, String, DateTime, Boolean, func, Double, ARRAY, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base

class Product(Base):
    """Level 1: The Main Category (e.g., 'Corporate Diaries', 'Corrugated Boxes')"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    cover_image = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sub_products = relationship("SubProduct", back_populates="product", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self):
        return f"Product(id={self.id}, name={self.name})"


class SubProduct(Base):
    """Level 2: The Specific Variation (e.g., 'PU Leather Diary', 'Wiro Bound Diary')"""
    __tablename__ = "sub_products"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    
    slug = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    base_price = Column(Double, nullable=False)
    minimum_quantity = Column(Integer, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    
    type = Column(String, default="product", nullable=True) # changed nullable to true
    
    # Level 3: The Options (Reusing your awesome JSON schema!)
    config_schema = Column(JSONB, nullable=False)
    images = Column(ARRAY(String), nullable=True)
    
    # Printify-style display content
    features = Column(JSONB, nullable=True)
    specifications = Column(JSONB, nullable=True)
    
    # Taxation
    hsn_code  = Column(String, nullable=True)   # Optional HSN/SAC code
    # cgst_rate = Column(Double, default=0.0)     # e.g. 9.0 for 9%
    # sgst_rate = Column(Double, default=0.0)     # e.g. 9.0 for 9%
    # igst_rate = Column(Double, default=0.0)     # e.g. 18.0 for 18%
    # cess_rate = Column(Double, default=0.0)
    gst_rate = Column(Double, default=18.0)
    unit      = Column(String, default="Nos")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    product = relationship("Product", back_populates="sub_products")
    # Make sure to update 'template' to 'sub_product' in your inquiry models later!
    inquiry_items = relationship("InquiryItem", back_populates="sub_product")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self):
        return f"SubProduct(id={self.id}, name={self.name}, product_id={self.product_id})"
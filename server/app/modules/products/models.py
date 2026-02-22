from datetime import datetime
from sqlalchemy import Column , Integer , String , DateTime, Boolean, func , Double , ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from typing import List

from app.core.database import Base

class ProductTemplate(Base):
    __tablename__ = "product_templates"
    id = Column(Integer , primary_key = True , nullable = False , autoincrement = True)
    slug = Column(String , nullable = False)
    name = Column(String , nullable = False)
    base_price = Column(Double , nullable = False)
    minimum_quantity = Column(Integer , nullable = False)
    is_active = Column(Boolean , nullable = False , default = True)
    
    # New field: 'product' or 'service'
    type = Column(String, default="product", nullable=False)
    
    config_schema = Column(JSONB , nullable = False)

    created_at = Column(DateTime(timezone = True) , server_default=func.now())

    images = Column(ARRAY(String) , nullable = True)
    
    inquiries = relationship("Inquiry", back_populates="template")

    def __repr__(self):
        return f"Product(id={self.id}, name={self.name}, base_price={self.base_price}, config_schema={self.config_schema})"

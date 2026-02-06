from datetime import datetime
from sqlalchemy import Column , Integer , String , DateTime, Boolean, func , Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from ...db.database import Base

class ProductTemplate(Base):
    __tablename__ = "product_templates"
    id = Column(Integer , primary_key = True , nullable = False , autoincrement = True)
    slug = Column(String , nullable = False)
    name = Column(String , nullable = False)
    base_price = Column(Float , nullable = False)
    minimum_quantity = Column(Integer , nullable = False)
    
    config_schema = Column(JSONB , nullable = False)

    inquiries = relationship("Inquiry", back_populates="template")

    def __repr__(self):
        return f"Product(id={self.id}, name={self.name}, base_price={self.base_price}, config_schema={self.config_schema})"


# class Inquiry(Base):
#     __tablename__ = 'inquiries'
    
#     id = Column(Integer, primary_key=True)
#     user_id = Column(Integer, ForeignKey('users.id'))
#     template_id = Column(Integer, ForeignKey('product_templates.id'))
    
#     quantity = Column(Integer, nullable=False)
    
#     # Stores the simple dictionary of user choices
#     selected_options = Column(JSONB, nullable=False) 
    
#     status = Column(String, default='PENDING') # PENDING, QUOTED
#     quoted_price = Column(Float, nullable=True) # Set by Admin later
    
#     template = relationship("ProductTemplate", back_populates="inquiries")
#     user = relationship("User", back_populates="inquiries")
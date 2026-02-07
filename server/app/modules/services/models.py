from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)     
    slug = Column(String, unique=True) 
    is_active = Column(Boolean, default=True)

    variants = relationship("ServiceVariant", back_populates="service")

class ServiceVariant(Base):
    __tablename__ = "service_variants"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id")) 
    name = Column(String, nullable=False) 
    base_price = Column(Float, default=0.0)       
    price_per_unit = Column(Float, default=0.0)
    description = Column(String, nullable=True)

    service = relationship("Service", back_populates="variants")
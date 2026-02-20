from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float , DateTime , func 
from sqlalchemy.orm import relationship
from app.core.database import Base

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)     
    slug = Column(String, unique=True) 
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone = True) , server_default=func.now())

    variants = relationship("ServiceVariant", back_populates="service", lazy="selectin")

class ServiceVariant(Base):
    __tablename__ = "service_variants"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE")) 
    name = Column(String, nullable=False) 
    slug = Column(String, unique=True, nullable=True)
    base_price = Column(Float, default=0.0)       
    price_per_unit = Column(Float, default=0.0)
    description = Column(String, nullable=True)

    service = relationship("Service", back_populates="variants")
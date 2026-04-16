from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float , DateTime , ARRAY, func 
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)     
    slug = Column(String, unique=True) 
    is_active = Column(Boolean, default=True)
    cover_image = Column(String, nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone = True) , server_default=func.now())

    sub_services = relationship("SubService", back_populates="service", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self):
        return f"Service(id={self.id}, name={self.name})"

class SubService(Base):
    __tablename__ = "sub_services"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE")) 
    name = Column(String, nullable=False) 
    slug = Column(String, unique=True, nullable=True)
    is_active = Column(Boolean, default=True)
    minimum_quantity = Column(Integer, default=1)       
    price_per_unit = Column(Float, default=0.0)
    images = Column(ARRAY(String), nullable=True)
    description = Column(String, nullable=True)

    type = Column(String, default="service", nullable=True)

    # Printify-style display content
    features = Column(JSONB, nullable=True)
    specifications = Column(JSONB, nullable=True)

    # Taxation
    hsn_code  = Column(String, nullable=True)
    # cgst_rate = Column(Float, default=0.0)
    # sgst_rate = Column(Float, default=0.0)
    # igst_rate = Column(Float, default=0.0)
    # cess_rate = Column(Float, default=0.0)
    gst_rate = Column(Float, default=18.0)
    unit      = Column(String, default="Nos")

    service = relationship("Service", back_populates="sub_services")
    reviews = relationship("Review", back_populates="service", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self):
        return f"SubService(id={self.id}, name={self.name}, service_id={self.service_id})"
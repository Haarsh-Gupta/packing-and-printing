from sqlalchemy import Column , Integer , String
from sqlalchemy.orm import relationship

from ...db.database import Base

class Service(Base):
    __tablename__ = "services"
    id = Column(Integer , primary_key = True , nullable = False , autoincrement = True)
    name = Column(String , nullable = False)
    description = Column(String , nullable = True)
    
    relationship("ServiceType", back_populates="service")

    def __repr__(self):
        return f"Service(id={self.id}, name={self.name}, description={self.description})"

class ServiceType(Base):
    __tablename__ = "service_types"
    id = Column(Integer , primary_key = True , nullable = False , autoincrement = True)
    service_id = Column(Integer , nullable = False , foreign_key = "services.id")
    name = Column(String , nullable = False)
    description = Column(String , nullable = True)
    minimum_quantity = Column(Integer , nullable = False , default = 1)
    unit_price = Column(Integer , nullable = False)

    relationship("Service", back_populates="services")

    def __repr__(self):
        return f"ServiceType(id={self.id}, name={self.name}, description={self.description})"
    
    
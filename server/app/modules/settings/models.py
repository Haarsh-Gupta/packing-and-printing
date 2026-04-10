from sqlalchemy import Column, Integer, String, Boolean, text
from app.core.database import Base

class SiteSettings(Base):
    __tablename__ = "site_settings"
    id = Column(Integer, primary_key=True) 

    # Company Profile
    company_name = Column(String, default="My Company")
    company_address = Column(String, default="")
    company_state_code = Column(String, default="07") # Delhi by default
    company_gstin = Column(String, nullable=True)
    company_pan = Column(String, nullable=True)
    bank_details = Column(String, nullable=True)

    # Shipping Config
    shipping_is_taxable = Column(Boolean, default=True)

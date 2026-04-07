from sqlalchemy import Column, String, Integer, Text
from app.core.database import Base

class SEOConfig(Base):
    __tablename__ = "seo_configs"

    id = Column(Integer, primary_key=True, index=True)
    # The exact URL path (e.g., "/", "/about", "/contact")
    path = Column(String, unique=True, index=True, nullable=False) 
    
    # Standard SEO
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    keywords = Column(Text, nullable=True) # Stored as comma-separated string
    
    # Open Graph / Social Sharing
    og_image = Column(String, nullable=True) 
    og_title = Column(String, nullable=True)
    og_description = Column(Text, nullable=True)
    
    # Advanced SEO
    canonical_url = Column(String, nullable=True)

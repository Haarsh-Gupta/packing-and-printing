from pydantic import BaseModel
from typing import Optional

class SEOConfigBase(BaseModel):
    path: str
    title: str
    description: Optional[str] = None
    keywords: Optional[str] = None
    og_image: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    canonical_url: Optional[str] = None

class SEOConfigCreate(SEOConfigBase):
    pass

class SEOConfigUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    keywords: Optional[str] = None
    og_image: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    canonical_url: Optional[str] = None

class SEOConfigResponse(SEOConfigBase):
    id: int

    class Config:
        from_attributes = True

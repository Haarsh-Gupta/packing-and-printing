from warnings import _OptionError
from pydantic import BaseModel, Field , model_validator
from typing import Optional, List
from slugify import slugify

# --- SHARED PROPERTIES ---
class ServiceVariantBase(BaseModel):
    name: str = Field(..., description="Name of the service variant")
    slug: Optional[str] = Field(None, description="URL-friendly identifier")
    base_price: float = Field(..., description="Base price (setup cost)")
    price_per_unit: float = Field(..., description="Price per unit")
    description: Optional[str] = Field(None, description="Description")

    @model_validator(mode="after")
    def generate_slug(self):
        if self.slug is None:
            self.slug = slugify(self.name).lower()
        else:
            self.slug = slugify(self.slug).lower()
        return self

# --- CREATE (All fields required) ---
class ServiceVariantCreate(ServiceVariantBase):
    pass

# --- UPDATE (All fields OPTIONAL) ---
# This allows you to send {"price_per_unit": 12.0} without sending the name again.
class ServiceVariantUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    base_price: Optional[float] = None
    price_per_unit: Optional[float] = None
    description: Optional[str] = None

# --- RESPONSE (Database ID included) ---
class ServiceVariantResponse(ServiceVariantBase):
    id: int
    service_id: int

    class Config:
        from_attributes = True

# -------------------------------------------

class ServiceBase(BaseModel):
    name: str = Field(..., description="Name of the service category")
    slug: Optional[str] = Field(None, description="URL-friendly identifier")
    is_active: bool = Field(True, description="Is the service active")

    @model_validator(mode="after")
    def generate_slug(self):
        if self.slug is None:
            slug = slugify(self.name)
        else:
            slug = slugify(self.slug)
        
        self.slug = slug.lower()
        return self

    

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    is_active: Optional[bool] = None

class ServiceResponse(ServiceBase):
    id: int
    # This magic line lets you fetch a Service and see all its options inside it!
    variants: List[ServiceVariantResponse] = []

    class Config:
        from_attributes = True
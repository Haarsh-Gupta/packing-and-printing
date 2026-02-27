from pydantic import BaseModel, Field , model_validator, ConfigDict
from typing import Optional, List
from slugify import slugify


class SubServiceBase(BaseModel):
    name: str = Field(..., description="Name of the service variant")
    slug: Optional[str] = Field(None, description="URL-friendly identifier")
    service_id: int = Field(...,description="Parent service ID (for responses)")
    base_price: float = Field(..., description="Base price (setup cost)")
    price_per_unit: float = Field(..., description="Price per unit")
    description: Optional[str] = Field(None, description="Description")
    images: Optional[List[str]] = Field(None, description="List of image URLs")
    is_active: bool = Field(True, description="Is the service variant active")


    @model_validator(mode="after")
    def generate_slug(self):
        if self.slug is None:
            self.slug = slugify(self.name).lower()
        else:
            self.slug = slugify(self.slug).lower()
        return self

# --- CREATE (All fields required) ---
class SubServiceCreate(SubServiceBase):
    pass

# --- UPDATE (All fields OPTIONAL) ---
# This allows you to send {"price_per_unit": 12.0} without sending the name again.
class SubServiceUpdate(BaseModel):
    service_id: int = None
    name: Optional[str] = None
    slug: Optional[str] = None
    base_price: Optional[float] = None
    price_per_unit: Optional[float] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None

# --- RESPONSE (Database ID included) ---
class SubServiceResponse(SubServiceBase):
    id: int
    service_id: int

    model_config = ConfigDict(from_attributes=True)

# -------------------------------------------

class ServiceBase(BaseModel):
    name: str = Field(..., description="Name of the service category")
    slug: Optional[str] = Field(None, description="URL-friendly identifier")
    is_active: bool = Field(True, description="Is the service active")
    cover_image: Optional[str] = Field(None, description="Cover image")

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
    cover_image: Optional[str] = None

class ServiceResponse(ServiceBase):
    id: int
    # This magic line lets you fetch a Service and see all its options inside it!
    sub_services: List[SubServiceResponse] = []

    model_config = ConfigDict(from_attributes=True)
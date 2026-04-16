from pydantic import BaseModel, Field , model_validator, ConfigDict
from typing import Optional, List, Dict, Any
from slugify import slugify


class SubServiceBase(BaseModel):
    name: str = Field(..., description="Name of the service variant")
    slug: Optional[str] = Field(None, description="URL-friendly identifier")
    service_id: int = Field(...,description="Parent service ID (for responses)")
    minimum_quantity: int = Field(..., description="Minimum quantity required")
    price_per_unit: float = Field(..., description="Price per unit")
    description: Optional[str] = Field(None, description="Description")
    images: Optional[List[str]] = Field(None, description="List of image URLs")
    is_active: bool = Field(True, description="Is the service variant active")
    hsn_code: Optional[str] = Field(None, description="HSN/SAC code")
    gst_rate: Optional[float] = Field(18.0, description="GST percentage (5, 12, 18, or 28)")
    unit: Optional[str] = Field("Nos", description="Unit of measurement")
    features: Optional[List[Dict[str, Any]]] = Field(None, description="Features list with icons")
    specifications: Optional[List[Dict[str, Any]]] = Field(None, description="Specifications list")

    @model_validator(mode="after")
    def generate_slug(self):
        if self.slug is None:
            self.slug = slugify(self.name).lower()
        else:
            self.slug = slugify(self.slug).lower()
        return self

# --- CREATE (All fields required) ---
class SubServiceCreate(SubServiceBase):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Softcover Binding",
                "service_id": 1,
                "minimum_quantity": 10,
                "price_per_unit": 2.5,
                "description": "Standard softcover binding with durable glue.",
                "images": ["https://example.com/softcover.jpg"],
                "is_active": True
            }
        }
    )

# --- UPDATE (All fields OPTIONAL) ---
# This allows you to send {"price_per_unit": 12.0} without sending the name again.
class SubServiceUpdate(BaseModel):
    service_id: int = None
    name: Optional[str] = None
    slug: Optional[str] = None
    minimum_quantity: Optional[int] = None
    price_per_unit: Optional[float] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None
    hsn_code: Optional[str] = None
    gst_rate: Optional[float] = None
    unit: Optional[str] = None
    features: Optional[List[Dict[str, Any]]] = None
    specifications: Optional[List[Dict[str, Any]]] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "base_price": 55.0,
                "price_per_unit": 3.0,
                "is_active": True
            }
        }
    )

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
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Book Binding Services",
                "is_active": True,
                "cover_image": "https://example.com/binding-cover.jpg"
            }
        }
    )

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    is_active: Optional[bool] = None
    cover_image: Optional[str] = None

    @model_validator(mode="after")
    def generate_slug(self):
        if self.name and not self.slug:
            self.slug = slugify(self.name).lower()
        elif self.slug:
            self.slug = slugify(self.slug).lower()
        return self

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Premium Book Binding Services",
                "is_active": False
            }
        }
    )

class ServiceResponse(ServiceBase):
    id: int
    # This magic line lets you fetch a Service and see all its options inside it!
    sub_services: List[SubServiceResponse] = []

    model_config = ConfigDict(from_attributes=True)
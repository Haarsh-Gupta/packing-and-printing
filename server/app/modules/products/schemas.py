from typing import List, Optional, Literal, Union, Dict, Any
from pydantic import BaseModel, Field, model_validator
from slugify import slugify
from enum import Enum
from datetime import datetime

#1 Options schemas
class Selection(str, Enum):
    DROPDOWN = "dropdown"
    RADIO = "radio"
    NUMBER_INPUT = "number_input"
    TEXT_INPUT = "text_input"

class Option(BaseModel):
    label: str
    value: str
    price_mod: float = 0.0
    
class FormSection(BaseModel):
    key: str
    label: str
    type: Selection
    options: Optional[List[Option]] = None 
    min_val: Optional[int] = None
    max_val: Optional[int] = None
    price_per_unit: Optional[float] = 0.0

class ProductConfigSchema(BaseModel):
    sections: List[FormSection]


#2 Subproducts: => as (ProductTemplate)
class SubProductCreate(BaseModel):
    product_id: int = Field(..., description="ID of the parent product")
    slug: Optional[str] = None
    name: str
    description: Optional[str] = None
    type: str = "product"
    base_price: float = Field(..., ge=0)
    minimum_quantity: int = Field(..., ge=1)
    images: Optional[List[str]] = None
    config_schema: ProductConfigSchema
    is_active: bool = True

    @model_validator(mode="after")
    def validate_config_schema(self):
        if self.config_schema:
            for section in self.config_schema.sections:
                if section.type in [Selection.DROPDOWN, Selection.RADIO] and not section.options:
                    raise ValueError(f"Options are required for {section.type} type")

        self.slug = slugify(self.slug) if self.slug else slugify(self.name)
        return self

class SubProductUpdate(BaseModel):
    slug: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[float] = Field(None, ge=0)
    minimum_quantity: Optional[int] = Field(None, ge=1)
    images: Optional[List[str]] = None
    config_schema: Optional[ProductConfigSchema] = None
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def validate_update(self):
        if self.config_schema:
            for section in self.config_schema.sections:
                if section.type in [Selection.DROPDOWN, Selection.RADIO] and not section.options:
                    raise ValueError(f"Options are required for {section.type} type")

        if self.name and not self.slug:
            self.slug = slugify(self.name)
        elif self.slug:
            self.slug = slugify(self.slug)
        return self

class SubProductResponse(SubProductCreate):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True



# 3. PARENT PRODUCT SCHEMAS

class ProductCreate(BaseModel):
    slug: Optional[str] = None
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True

    @model_validator(mode="after")
    def generate_slug(self):
        self.slug = slugify(self.slug) if self.slug else slugify(self.name)
        return self

class ProductUpdate(BaseModel):
    slug: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def generate_slug(self):
        if self.name and not self.slug:
            self.slug = slugify(self.name)
        elif self.slug:
            self.slug = slugify(self.slug)
        return self

class ProductResponse(ProductCreate):
    id: int
    created_at: datetime
    # This automatically includes all subproducts when fetching a parent product!
    sub_products: List[SubProductResponse] = [] 

    class Config:
        from_attributes = True
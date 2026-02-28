from typing import List, Optional
from pydantic import BaseModel, Field, model_validator
from slugify import slugify
from enum import Enum
from datetime import datetime
from fastapi import FastAPI

app = FastAPI(title="Product Customization API")


# =========================================================
# 1️⃣ OPTIONS & CONFIG SCHEMAS
# =========================================================

class Selection(str, Enum):
    DROPDOWN = "dropdown"
    RADIO = "radio"
    NUMBER_INPUT = "number_input"
    TEXT_INPUT = "text_input"


class Option(BaseModel):
    label: str
    value: str
    price_mod: float = 0.0

    model_config = {
        "json_schema_extra": {
            "example": {
                "label": "Large",
                "value": "L",
                "price_mod": 20
            }
        }
    }


class FormSection(BaseModel):
    key: str
    label: str
    type: Selection
    options: Optional[List[Option]] = None
    min_val: Optional[int] = None
    max_val: Optional[int] = None
    price_per_unit: Optional[float] = 0.0

    model_config = {
        "json_schema_extra": {
            "example": {
                "key": "size",
                "label": "Select Size",
                "type": "dropdown",
                "options": [
                    {"label": "Small", "value": "S", "price_mod": 0},
                    {"label": "Medium", "value": "M", "price_mod": 0},
                    {"label": "Large", "value": "L", "price_mod": 20}
                ]
            }
        }
    }


class ProductConfigSchema(BaseModel):
    sections: List[FormSection]

    model_config = {
        "json_schema_extra": {
            "example": {
                "sections": [
                    {
                        "key": "size",
                        "label": "Select Size",
                        "type": "dropdown",
                        "options": [
                            {"label": "Small", "value": "S", "price_mod": 0},
                            {"label": "Large", "value": "L", "price_mod": 20}
                        ]
                    }
                ]
            }
        }
    }


# =========================================================
# 2️⃣ SUB PRODUCT SCHEMAS
# =========================================================

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
                    raise ValueError(f"Options required for {section.type}")

        self.slug = slugify(self.slug) if self.slug else slugify(self.name)
        return self

    model_config = {
        "json_schema_extra": {
            "example": {
                "product_id": 1,
                "name": "Premium Cotton T-Shirt",
                "description": "Soft breathable cotton t-shirt.",
                "base_price": 499.0,
                "minimum_quantity": 10,
                "images": [
                    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
                    "https://images.unsplash.com/photo-1503341504253-dff4815485f1"
                ],
                "config_schema": {
                    "sections": [
                        {
                            "key": "size",
                            "label": "Select Size",
                            "type": "dropdown",
                            "options": [
                                {"label": "Small", "value": "S", "price_mod": 0},
                                {"label": "Large", "value": "L", "price_mod": 20}
                            ]
                        },
                        {
                            "key": "custom_text",
                            "label": "Custom Text",
                            "type": "text_input"
                        }
                    ]
                },
                "is_active": True
            }
        }
    }


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
                    raise ValueError(f"Options required for {section.type}")

        if self.name and not self.slug:
            self.slug = slugify(self.name)
        elif self.slug:
            self.slug = slugify(self.slug)
        return self


class SubProductResponse(SubProductCreate):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# =========================================================
# 3️⃣ PARENT PRODUCT SCHEMAS
# =========================================================

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

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Custom Printed T-Shirts",
                "description": "High quality customizable cotton t-shirts.",
                "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
                "is_active": True
            }
        }
    }


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
    sub_products: List[SubProductResponse] = []

    model_config = {"from_attributes": True}


# =========================================================
# 4️⃣ DEMO ENDPOINTS
# =========================================================

@app.post("/products", response_model=ProductResponse)
def create_product(product: ProductCreate):
    return {
        "id": 1,
        "created_at": datetime.utcnow(),
        "sub_products": [],
        **product.model_dump()
    }


@app.post("/sub-products", response_model=SubProductResponse)
def create_sub_product(sub_product: SubProductCreate):
    return {
        "id": 101,
        "created_at": datetime.utcnow(),
        **sub_product.model_dump()
    }
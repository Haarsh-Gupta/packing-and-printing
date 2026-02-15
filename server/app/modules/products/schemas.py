from typing import List, Optional, Literal, Union, Dict, Any
from pydantic import BaseModel, Field, validator , model_validator
from slugify import slugify


class Option(BaseModel):
    """Represents a single choice: e.g., 'Thermal Lamination'"""
    label: str                   # What the user sees: "Thermal Matte"
    value: str                   # What DB stores: "thermal_matte"
    price_mod: float = 0.0       # Added cost: +5.00
    
class FormSection(BaseModel):
    """Represents a dropdown or input field in the form"""
    key: str                     # e.g., "binding_type"
    label: str                   # e.g., "Select Binding Style"
    type: Literal['dropdown', 'radio', 'number_input', 'text_input']
    
    # Validation: 'options' is required for dropdown/radio, but not for inputs
    options: Optional[List[Option]] = None 
    min_val: Optional[int] = None # For number inputs (e.g., min 50 pages)
    max_val: Optional[int] = None
    price_per_unit: Optional[float] = 0.0 # Cost per page

class ProductConfigSchema(BaseModel):
    """The master JSON structure stored in product_templates.config_schema"""
    sections: List[FormSection]

# --- API Request/Response Schemas ---

class ProductTemplateCreate(BaseModel):
    slug: Optional[str] = None
    name: str
    base_price: float = Field(..., ge=0)
    minimum_quantity: Optional[int] = Field(..., ge=1)
    images : Optional[List[str]] = None
    config_schema: ProductConfigSchema # The complex JSON structure

    @model_validator(mode="after")
    def validate_config_schema(self):
        if self.config_schema:
            for section in self.config_schema.sections:
                if section.type in ["dropdown", "radio"] and not section.options:
                    raise ValueError(f"Options are required for {section.type} type")

        if self.slug is None:
            self.slug = slugify(self.name)
        else:
            self.slug = slugify(self.slug)

        return self

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Premium Corporate Diary 2026",
                "base_price": 250.0,
                "minimum_quantity": 50,
                "config_schema": {
                    "sections": [
                        {
                            "key": "size",
                            "label": "Select Diary Size",
                            "type": "dropdown",
                            "options": [
                                { "label": "A5 (Standard)", "value": "a5", "price_mod": 0.0 },
                                { "label": "A4 (Executive)", "value": "a4", "price_mod": 100.0 },
                                { "label": "B5 (Compact)", "value": "b5", "price_mod": -20.0 }
                            ]
                        },
                        {
                            "key": "cover_style",
                            "label": "Cover Material",
                            "type": "radio",
                            "options": [
                                { "label": "Faux Leather (PU)", "value": "pu_leather", "price_mod": 0.0 },
                                { "label": "Hardbound Paper", "value": "hardbound", "price_mod": -50.0 },
                                { "label": "Premium Genuine Leather", "value": "genuine_leather", "price_mod": 450.0 }
                            ]
                        },
                        {
                            "key": "total_pages",
                            "label": "Number of Pages",
                            "type": "number_input",
                            "min_val": 100,
                            "max_val": 500,
                            "price_per_unit": 0.5
                        },
                        {
                            "key": "embossing_text",
                            "label": "Company Name for Embossing",
                            "type": "text_input"
                        }
                    ]
                }
            }
        }

class ProductTemplateUpdate(BaseModel):
    slug: Optional[str] = None
    name: Optional[str] = None
    base_price: Optional[float] = Field(..., ge=0)
    minimum_quantity: Optional[int] = Field(..., ge=1)
    images : Optional[List[str]] = None
    config_schema: Optional[ProductConfigSchema] = None
    is_active : Optional[bool] = True

    @model_validator(mode="after")
    def validate_config_schema(self):
        if self.config_schema:
            for section in self.config_schema.sections:
                if section.type in ["dropdown", "radio"] and not section.options:
                    raise ValueError(f"Options are required for {section.type} type")

        if self.slug is None:
            self.slug = slugify(self.name)
        else:
            self.slug = slugify(self.slug)

        if self.slug is None and self.name is None and self.base_price is None and self.minimum_quantity is None and self.config_schema is None:
            raise ValueError("At least one field must be provided")

        return self


class ProductTemplateResponse(ProductTemplateCreate):
    id: int
    is_active: bool

    class Config:
        from_attributes = True 

from datetime import datetime
from typing import Dict, Union, Optional, List
from enum import Enum
from pydantic import BaseModel, Field, model_validator, ConfigDict


# --- Enums ---
class InquiryStatus(str, Enum):
    PENDING = "PENDING"
    QUOTED = "QUOTED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


# ==========================================
# 1. CREATE SCHEMAS (Data sent BY the user)
# ==========================================

class InquiryItemCreate(BaseModel):
    """Schema for a single product added to the quote cart"""
    template_id: Optional[int] = None
    service_id: Optional[int] = None
    variant_id: Optional[int] = None
    quantity: int = Field(..., gt=0, description="Must be greater than 0")
    selected_options: Dict[str, Union[str, int, float]]
    notes: Optional[str] = None
    images: Optional[List[str]] = None

    @model_validator(mode="after")
    def check_template_or_service(self):
        if not self.template_id and not self.service_id:
            raise ValueError("Either template_id or service_id must be provided")
        if self.service_id and not self.variant_id:
            raise ValueError("variant_id must be provided when service_id is provided")
        return self


class InquiryGroupCreate(BaseModel):
    """Schema for submitting the entire cart as one quotation request"""
    # Notice we don't ask for user_id here. 
    # user_id should be extracted securely from the JWT token in your FastAPI route.
    items: List[InquiryItemCreate] = Field(..., min_length=1, description="Cart must contain at least one item")


class InquiryMessageCreate(BaseModel):
    """Schema for posting a message in the inquiry thread"""
    content: str
    file_urls: Optional[List[str]] = None


# ==========================================
# 2. UPDATE & ADMIN SCHEMAS
# ==========================================

class InquiryQuotationItem(BaseModel):
    """Admin schema for pricing individual line items"""
    item_id: int
    line_item_price: float = Field(..., ge=0)


class InquiryQuotation(BaseModel):
    """Schema for admin sending a quotation for the entire group"""
    total_quoted_price: float = Field(..., gt=0, description="Total combined price")
    admin_notes: Optional[str] = None
    valid_for_days: int = Field(7, gt=0, description="How many days is this quote valid?")
    line_items: Optional[List[InquiryQuotationItem]] = None # Optional breakdown


class InquiryStatusUpdate(BaseModel):
    """Schema for updating inquiry status (user accepting/rejecting)"""
    status: InquiryStatus


# ==========================================
# 3. RESPONSE SCHEMAS (Data sent TO the user)
# ==========================================

class InquiryMessageResponse(BaseModel):
    """Base response schema for a message"""
    id: int
    inquiry_group_id: int
    sender_id: int
    content: str
    file_urls: Optional[List[str]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InquiryItemResponse(BaseModel):
    """Base response schema for a single item in the cart"""
    id: int
    inquiry_group_id: int
    template_id: Optional[int] = None
    service_id: Optional[int] = None
    variant_id: Optional[int] = None
    quantity: int
    selected_options: Dict[str, Union[str, int, float]]
    notes: Optional[str] = None
    images: Optional[List[str]] = None
    line_item_price: Optional[float] = None
    
    # These can be populated by SQLAlchemy hybrid properties or manual joins
    template_name: Optional[str] = None
    service_name: Optional[str] = None
    variant_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class InquiryGroupResponse(BaseModel):
    """Detailed response schema for the entire Inquiry Group (Cart)"""
    id: int
    user_id: int
    status: InquiryStatus
    total_quoted_price: Optional[float] = None
    admin_notes: Optional[str] = None
    quoted_at: Optional[datetime] = None
    quote_valid_until: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    items: List[InquiryItemResponse] = []
    messages: List[InquiryMessageResponse] = []

    model_config = ConfigDict(from_attributes=True)


class InquiryGroupListResponse(BaseModel):
    """Lightweight response schema for listing all inquiries on the dashboard"""
    id: int
    user_id: int
    status: InquiryStatus
    total_quoted_price: Optional[float] = None
    created_at: datetime
    item_count: int = 0 

    model_config = ConfigDict(from_attributes=True)
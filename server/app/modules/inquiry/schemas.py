from datetime import datetime
from typing import Dict, Union, Optional, List
from uuid import UUID
from enum import Enum
from pydantic import BaseModel, Field, model_validator, ConfigDict, computed_field
from app.modules.orders.schemas import PaymentSplitType


# --- Enums ---
class InquiryStatus(str, Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    QUOTED = "QUOTED"
    NEGOTIATION = "NEGOTIATION"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"

# State machine defining the valid workflows for Users vs Admins
USER_ALLOWED_TRANSITIONS = {
    InquiryStatus.PENDING: [InquiryStatus.CANCELLED],
    InquiryStatus.UNDER_REVIEW: [InquiryStatus.CANCELLED],
    InquiryStatus.QUOTED: [InquiryStatus.ACCEPTED, InquiryStatus.REJECTED, InquiryStatus.NEGOTIATION, InquiryStatus.CANCELLED],
    InquiryStatus.NEGOTIATION: [InquiryStatus.ACCEPTED, InquiryStatus.REJECTED, InquiryStatus.CANCELLED],
    InquiryStatus.ACCEPTED: [InquiryStatus.CANCELLED],
    InquiryStatus.REJECTED: [],
    InquiryStatus.CANCELLED: [],
    InquiryStatus.EXPIRED: []
}

ADMIN_ALLOWED_TRANSITIONS = {
    InquiryStatus.PENDING: [InquiryStatus.UNDER_REVIEW, InquiryStatus.REJECTED, InquiryStatus.CANCELLED],
    InquiryStatus.UNDER_REVIEW: [InquiryStatus.PENDING, InquiryStatus.REJECTED, InquiryStatus.CANCELLED],
    InquiryStatus.QUOTED: [InquiryStatus.NEGOTIATION, InquiryStatus.EXPIRED, InquiryStatus.CANCELLED, InquiryStatus.REJECTED],
    InquiryStatus.NEGOTIATION: [InquiryStatus.CANCELLED, InquiryStatus.REJECTED], 
    InquiryStatus.EXPIRED: [InquiryStatus.PENDING, InquiryStatus.CANCELLED], 
    InquiryStatus.ACCEPTED: [InquiryStatus.CANCELLED], 
    InquiryStatus.REJECTED: [InquiryStatus.PENDING], 
    InquiryStatus.CANCELLED: [InquiryStatus.PENDING]
}


# ==========================================
# 1. CREATE SCHEMAS (Data sent BY the user)
# ==========================================

class InquiryItemBase(BaseModel):
    """Schema for a single product added to the quote cart"""
    product_id: Optional[int] = None
    subproduct_id: Optional[int] = None

    service_id: Optional[int] = None
    subservice_id: Optional[int] = None

    quantity: Optional[int] = Field(None, gt=0, description="Must be greater than 0")
    selected_options: Optional[Dict[str, Union[str, int, float, bool, None]]] = None
    notes: Optional[str] = None
    images: Optional[List[str]] = None

    @model_validator(mode="after")
    def check_product_or_service(self):
        if not self.product_id and not self.service_id:
            raise ValueError("Either product_id or service_id must be provided")
        if self.service_id and self.subservice_id is None:
            raise ValueError(f"subservice_id is required for service_id {self.service_id}")
        
        if self.product_id and not self.selected_options:
            raise ValueError("selected_options are required for product inquiries")
        
        if self.service_id and self.selected_options:
            raise ValueError("selected_options should not be provided for service inquiries")
        
        return self
    
class InquiryItemCreate(InquiryItemBase):
    """Schema for each item when submitting the entire cart"""
    pass

class InquiryItemUpdate(BaseModel):
    """Schema for updating an existing item in the cart"""
    quantity: Optional[int] = Field(None, gt=0, description="Must be greater than 0")
    selected_options: Optional[Dict[str, Union[str, int, float, bool, None]]] = None
    notes: Optional[str] = None
    images: Optional[List[str]] = None

class InquiryGroupCreate(BaseModel):
    """Schema for submitting the entire cart as one quotation request"""
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
    item_id: UUID
    line_item_price: float = Field(..., ge=0)


class InquiryQuotation(BaseModel):
    """Schema for admin sending a quotation for the entire group"""
    total_quoted_price: float = Field(..., gt=0, description="Total combined price")
    admin_notes: Optional[str] = None
    valid_for_days: int = Field(7, gt=0, description="How many days is this quote valid?")
    line_items: Optional[List[InquiryQuotationItem]] = None # Optional breakdown


class InquiryStatusUpdate(BaseModel):
    """Schema for updating inquiry status (used by both, evaluated against state machine map)"""
    status: InquiryStatus
    split_type: Optional[PaymentSplitType] = None
    custom_percentages: Optional[List[float]] = None

class AdminPricingCalculatorRequest(BaseModel):
    """Schema for computing custom pricing bypassing database lookups"""
    is_service: bool = False
    base_price: float = Field(0.0, description="Base price for product or price_per_unit for service")
    quantity: int = Field(1, gt=0)
    config_schema: Optional[Dict] = None
    selected_options: Optional[Dict] = None


# ==========================================
# 3. RESPONSE SCHEMAS (Data sent TO the user)
# ==========================================

class InquiryMessageResponse(BaseModel):
    """Base response schema for a message"""
    id: int
    inquiry_group_id: UUID
    sender_id: UUID
    content: str
    file_urls: Optional[List[str]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InquiryItemResponse(InquiryItemBase):
    """Base response schema for a single item in the cart"""
    id: UUID
    inquiry_group_id: Optional[UUID] = None
    quantity: int
    line_item_price: Optional[float] = None
    
    # These can be populated by SQLAlchemy hybrid properties or manual joins
    product_name: Optional[str] = None
    subproduct_name: Optional[str] = None
    service_name: Optional[str] = None
    subservice_name: Optional[str] = None
    estimated_price: float

    @computed_field
    @property
    def total_estimated_price(self) -> float:
        return self.quantity * self.estimated_price if self.estimated_price is not None else 0.0

    @computed_field
    @property
    def total_quoted_price(self) -> Optional[float]:
        if self.line_item_price is not None:
            return self.quantity * float(self.line_item_price)
        return None

    model_config = ConfigDict(from_attributes=True)



class InquiryGroupResponse(BaseModel):
    """Detailed response schema for the entire Inquiry Group (Cart)"""
    id: UUID
    user_id: UUID
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

    @computed_field
    @property
    def total_estimated_price_of_inquiry(self) -> Optional[float]:
        total = 0
        for item in self.items:
            total += item.total_estimated_price
        return total


class InquiryGroupListResponse(BaseModel):
    """Lightweight response schema for listing all inquiries on the dashboard"""
    id: UUID
    user_id: UUID
    status: InquiryStatus
    total_quoted_price: Optional[float] = None
    created_at: datetime
    item_count: int = 0 

    model_config = ConfigDict(from_attributes=True)

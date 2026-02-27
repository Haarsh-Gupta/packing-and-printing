from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum

# ==================== Enums ====================
class PaymentMode(str, Enum):
    CASH = "CASH"
    UPI = "UPI"
    CARD = "CARD"
    BANK_TRANSFER = "BANK_TRANSFER"
    CHEQUE = "CHEQUE"
    ONLINE = "ONLINE"

class Status(str, Enum):
    WAITING_PAYMENT = "WAITING_PAYMENT"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"
    PROCESSING = "PROCESSING"
    READY = "READY"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class PaymentSplitType(str, Enum):
    FULL = "FULL"           # 100%
    HALF = "HALF"           # 50/50
    CUSTOM_30 = "CUSTOM_30" # 30/30/40

# ==================== Transaction & Milestone Schemas ====================
class TransactionCreate(BaseModel):
    milestone_id: UUID
    amount: float = Field(..., gt=0)
    payment_mode: PaymentMode
    notes: Optional[str] = None
    gateway_payment_id: Optional[str] = None # UTR or Razorpay ID

class TransactionResponse(BaseModel):
    id: UUID
    order_id: UUID
    milestone_id: UUID
    amount: float
    payment_mode: PaymentMode
    created_at: datetime
    class Config:
        from_attributes = True

class OrderMilestoneResponse(BaseModel):
    id: UUID
    order_id: UUID
    label: str
    amount: float
    percentage: float
    order_index: int
    is_paid: bool
    paid_at: Optional[datetime] = None
    verification_status: str
    class Config:
        from_attributes = True

# ==================== Order Schemas ====================
class OrderCreate(BaseModel):
    inquiry_id: UUID
    split_type: PaymentSplitType = PaymentSplitType.HALF # Admin chooses this when converting to order

class OrderUpdate(BaseModel):
    status: Status

class OrderResponse(BaseModel):
    id: UUID
    inquiry_id: UUID
    user_id: UUID
    total_amount: float
    amount_paid: float
    status: Status
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    milestones: List[OrderMilestoneResponse] = []
    transactions: List[TransactionResponse] = []
    class Config:
        from_attributes = True

class OrderListResponse(BaseModel):
    id: UUID
    inquiry_id: UUID
    user_id: UUID
    total_amount: float
    amount_paid: float
    status: Status
    created_at: datetime
    class Config:
        from_attributes = True
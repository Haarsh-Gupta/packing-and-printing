"""
Order schemas — all validation lives here, never in routes.

Rules enforced at schema level:
- Percentage sums
- Min/max milestone counts
- Split type constraints per actor (user vs admin)
- Declaration amount bounds
- Required fields per payment mode
"""

from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, model_validator, ConfigDict
from enum import Enum


# ── Enums ────────────────────────────────────────────────────────────────────

class PaymentMode(str, Enum):
    CASH          = "CASH"
    UPI_MANUAL    = "UPI_MANUAL"
    BANK_TRANSFER = "BANK_TRANSFER"
    CHEQUE        = "CHEQUE"
    ONLINE        = "ONLINE"


class OrderStatus(str, Enum):
    WAITING_PAYMENT = "WAITING_PAYMENT"
    PARTIALLY_PAID  = "PARTIALLY_PAID"
    PAID            = "PAID"
    PROCESSING      = "PROCESSING"
    READY           = "READY"
    COMPLETED       = "COMPLETED"
    CANCELLED       = "CANCELLED"


class MilestoneStatus(str, Enum):
    UNPAID   = "UNPAID"
    PENDING  = "PENDING"
    PAID     = "PAID"
    REFUNDED = "REFUNDED"


class DeclarationStatus(str, Enum):
    PENDING  = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class PaymentSplitType(str, Enum):
    FULL   = "FULL"
    HALF   = "HALF"
    CUSTOM = "CUSTOM"


# ── Milestone definition ──────────────────────────────────────────────────────

class MilestoneDefinition(BaseModel):
    """One milestone in a CUSTOM split."""
    label: str = Field(..., min_length=2, max_length=80)
    percentage: float = Field(..., gt=0, le=100)
    due_date: Optional[datetime] = None


# ── Order creation ────────────────────────────────────────────────────────────

class OrderCreate(BaseModel):
    """
    Created when inquiry is accepted by user.
    User picks FULL or HALF only — CUSTOM is admin-only at creation.
    """
    inquiry_id: UUID
    split_type: PaymentSplitType = PaymentSplitType.HALF

    @model_validator(mode="after")
    def user_cannot_create_custom(self) -> "OrderCreate":
        if self.split_type == PaymentSplitType.CUSTOM:
            raise ValueError(
                "CUSTOM split is not allowed at order creation. "
                "Choose FULL or HALF. Admin can set custom milestones after creation."
            )
        return self


# ── User milestone switch ─────────────────────────────────────────────────────

class UserMilestoneSwitchRequest(BaseModel):
    """
    User switches active milestones.
    No payment must have been made yet.
    """
    split_type: PaymentSplitType


# ── Admin milestone create / regenerate ──────────────────────────────────────

class AdminMilestoneCreateRequest(BaseModel):
    """
    Admin creates or regenerates milestones.
    Admin can use FULL, HALF, or CUSTOM.

    CUSTOM rules:
    - milestones list required
    - 2 to 5 milestones
    - percentages sum to exactly 100 (±0.01 tolerance for float)
    - labels must be unique within the list

    FULL / HALF rules:
    - milestones must NOT be provided
    """
    split_type: PaymentSplitType
    milestones: Optional[List[MilestoneDefinition]] = Field(
        None,
        description="Required for CUSTOM only.",
    )

    @model_validator(mode="after")
    def validate_split(self) -> "AdminMilestoneCreateRequest":
        t = self.split_type

        if t in (PaymentSplitType.FULL, PaymentSplitType.HALF):
            if self.milestones:
                raise ValueError(
                    f"Do not provide milestones when split_type is {t.value}. "
                    "They are generated automatically."
                )

        if t == PaymentSplitType.CUSTOM:
            if not self.milestones:
                raise ValueError(
                    "milestones list is required when split_type is CUSTOM."
                )

            count = len(self.milestones)
            if count < 2:
                raise ValueError(
                    f"CUSTOM split requires at least 2 milestones. Got {count}."
                )
            if count > 5:
                raise ValueError(
                    f"CUSTOM split allows a maximum of 5 milestones. Got {count}."
                )

            total = sum(m.percentage for m in self.milestones)
            if abs(total - 100.0) > 0.01:
                raise ValueError(
                    f"Milestone percentages must sum to 100. "
                    f"Got {total:.4f} (off by {abs(total - 100.0):.4f})."
                )

            labels = [m.label.strip().lower() for m in self.milestones]
            if len(labels) != len(set(labels)):
                raise ValueError("Each milestone must have a unique label.")

        return self


# ── Admin offline manual order creation ──────────────────────────────────────

class AdminOfflineOrderCreateItem(BaseModel):
    product_id: Optional[int] = None
    sub_product_id: Optional[int] = None
    service_id: Optional[int] = None
    sub_service_id: Optional[int] = None
    name: str = Field(..., description="Fallback generic name for custom offline items")
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)

class AdminOfflineOrderCreateRequest(BaseModel):
    """Payload to atomically create Inquiry, Quote, and Order for manual entries."""
    user_id: UUID
    items: List[AdminOfflineOrderCreateItem] = Field(..., min_length=1)
    tax_amount: float = Field(default=0.0, ge=0)
    shipping_amount: float = Field(default=0.0, ge=0)
    discount_amount: float = Field(default=0.0, ge=0)
    
    split_type: PaymentSplitType
    milestones: Optional[List[MilestoneDefinition]] = Field(
        None, description="Required only if split_type is CUSTOM."
    )

    @model_validator(mode="after")
    def validate_split(self) -> "AdminOfflineOrderCreateRequest":
        t = self.split_type
        if t in (PaymentSplitType.FULL, PaymentSplitType.HALF) and self.milestones:
            raise ValueError(f"Do not provide milestones when split_type is {t.value}.")
        if t == PaymentSplitType.CUSTOM:
            if not self.milestones or len(self.milestones) < 2:
                raise ValueError("CUSTOM split requires at least 2 milestones.")
            total = sum(m.percentage for m in self.milestones)
            if abs(total - 100.0) > 0.01:
                raise ValueError(f"Milestones must sum to 100. Got {total:.4f}.")
            labels = [m.label.strip().lower() for m in self.milestones]
            if len(labels) != len(set(labels)):
                raise ValueError("Each milestone must have a unique label.")
        return self


# ── Admin record payment ──────────────────────────────────────────────────────

class AdminRecordPaymentRequest(BaseModel):
    """
    Admin records a confirmed offline payment.
    Only for: CASH, BANK_TRANSFER, CHEQUE.
    ONLINE → use verify endpoint.
    UPI_MANUAL → use declaration approval flow.
    CHEQUE → notes required (cheque number).
    """
    milestone_id: UUID
    amount: float = Field(..., gt=0)
    payment_mode: PaymentMode
    notes: Optional[str] = Field(None, max_length=500)

    @model_validator(mode="after")
    def validate_mode(self) -> "AdminRecordPaymentRequest":
        if self.payment_mode == PaymentMode.ONLINE:
            raise ValueError(
                "Use POST /payments/verify for online payments."
            )
        if self.payment_mode == PaymentMode.UPI_MANUAL:
            raise ValueError(
                "UPI payments go through the declaration approval flow. "
                "Approve the declaration instead of recording manually."
            )
        if self.payment_mode == PaymentMode.CHEQUE and not self.notes:
            raise ValueError(
                "notes is required for CHEQUE payments — include the cheque number."
            )
        return self


# ── Admin order status update ─────────────────────────────────────────────────

class OrderStatusUpdate(BaseModel):
    """
    Admin moves order through fulfilment stages.
    Financial statuses (WAITING_PAYMENT, PARTIALLY_PAID, PAID)
    are system-derived and cannot be set manually.
    """
    status: OrderStatus
    admin_notes: Optional[str] = Field(None, max_length=500)

    _ADMIN_SETTABLE = {
        OrderStatus.PROCESSING,
        OrderStatus.READY,
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
    }

    @model_validator(mode="after")
    def validate_admin_status(self) -> "OrderStatusUpdate":
        if self.status not in self._ADMIN_SETTABLE:
            raise ValueError(
                f"'{self.status.value}' is set automatically by the payment system. "
                f"Admin can only set: "
                f"{', '.join(s.value for s in self._ADMIN_SETTABLE)}."
            )
        return self


# ── Payment declaration ───────────────────────────────────────────────────────

class PaymentDeclarationCreate(BaseModel):
    """
    User declares a UPI or bank transfer payment.
    UTR optional — SMS parser fills it automatically.
    CASH and CHEQUE are admin-only, not allowed here.
    ONLINE is auto-verified, not allowed here.
    """
    milestone_id: UUID
    payment_mode: PaymentMode = PaymentMode.UPI_MANUAL
    utr_number: Optional[str] = Field(None, min_length=6, max_length=50)
    screenshot_url: Optional[str] = None

    @model_validator(mode="after")
    def validate_declaration(self) -> "PaymentDeclarationCreate":
        disallowed = {
            PaymentMode.ONLINE:   "Online payments are auto-verified. Use POST /payments/verify.",
            PaymentMode.CASH:     "Cash payments are recorded by admin only.",
            PaymentMode.CHEQUE:   "Cheque payments are recorded by admin only.",
        }
        if self.payment_mode in disallowed:
            raise ValueError(disallowed[self.payment_mode])

        if self.utr_number:
            cleaned = self.utr_number.strip().upper()
            if not cleaned.isalnum():
                raise ValueError("UTR number must contain only letters and digits.")
            self.utr_number = cleaned

        return self


class PaymentDeclarationReview(BaseModel):
    """
    Admin approves or rejects a user's payment declaration.
    rejection_reason mandatory when rejecting — user must be told why.
    """
    is_approved: bool
    rejection_reason: Optional[str] = Field(None, max_length=500)

    @model_validator(mode="after")
    def validate_review(self) -> "PaymentDeclarationReview":
        if not self.is_approved and not self.rejection_reason:
            raise ValueError(
                "rejection_reason is required when rejecting. "
                "The user needs to know why their payment was rejected."
            )
        if self.is_approved and self.rejection_reason:
            raise ValueError("Do not provide rejection_reason when approving.")
        return self


# ── Online payment ────────────────────────────────────────────────────────────

class CreatePaymentSessionRequest(BaseModel):
    order_id: UUID
    milestone_id: Optional[UUID] = None


class VerifyPaymentRequest(BaseModel):
    """
    session_id is OUR Redis key.
    We look up gateway_order_id from Redis — never from the client.
    """
    session_id: str = Field(..., min_length=1)
    gateway_payment_id: str = Field(..., min_length=1)
    gateway_signature: str = Field(..., min_length=1)


# ── Responses ─────────────────────────────────────────────────────────────────

class PaymentDeclarationResponse(BaseModel):
    id: UUID
    order_id: UUID
    milestone_id: UUID
    user_id: UUID
    payment_mode: PaymentMode
    utr_number: Optional[str]
    screenshot_url: Optional[str]
    status: DeclarationStatus
    rejection_reason: Optional[str]
    created_at: datetime
    reviewed_at: Optional[datetime]
    order_number: Optional[str] = None
    milestone_label: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TransactionResponse(BaseModel):
    id: UUID
    receipt_number: Optional[str] = None
    order_id: UUID
    milestone_id: UUID
    amount: float
    payment_mode: PaymentMode
    gateway_payment_id: Optional[str]
    notes: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderMilestoneResponse(BaseModel):
    id: UUID
    order_id: UUID
    split_type: str
    label: str
    amount: float
    percentage: float
    order_index: int
    status: MilestoneStatus
    paid_at: Optional[datetime]
    due_date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PaymentSessionResponse(BaseModel):
    session_id: str
    gateway_order_id: str
    amount_paise: int
    currency: str = "INR"
    razorpay_key_id: str
    order_id: UUID
    milestone_id: UUID
    milestone_label: str


class OrderResponse(BaseModel):
    id: UUID
    order_number: Optional[str] = None
    inquiry_id: UUID
    user_id: UUID
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    product_name: Optional[str] = None
    image_url: Optional[str] = None
    total_amount: float
    tax_amount: Optional[float] = 0.0
    shipping_amount: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    amount_paid: float
    status: OrderStatus
    split_type: Optional[str] = None
    is_custom_milestone_requested: bool = False
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    milestones: List[OrderMilestoneResponse] = []
    transactions: List[TransactionResponse] = []
    declarations: List[PaymentDeclarationResponse] = []

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def filter_and_sort_milestones(self) -> "OrderResponse":
        if self.milestones and self.split_type:
            # Only return milestones that match the current split_type of the order
            self.milestones = [m for m in self.milestones if m.split_type == self.split_type]
            self.milestones.sort(key=lambda m: m.order_index)
        return self


class OrderListResponse(BaseModel):
    id: UUID
    order_number: Optional[str] = None
    inquiry_id: UUID
    user_id: UUID
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    product_name: Optional[str] = None
    image_url: Optional[str] = None
    total_amount: float
    tax_amount: Optional[float] = 0.0
    shipping_amount: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    amount_paid: float
    status: OrderStatus
    split_type: Optional[str] = None
    is_custom_milestone_requested: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminRefundRequest(BaseModel):
    """
    Admin issues a refund against a paid milestone.
    Amount must be positive — stored as negative in Transaction.
    Cannot exceed what was paid on the milestone.
    """
    milestone_id: UUID
    amount: float = Field(..., gt=0)
    reason: str = Field(..., min_length=5, max_length=500)
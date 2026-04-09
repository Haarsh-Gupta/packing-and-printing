"""
Admin-facing order routes.

Admins can:
  - View all orders
  - Create / regenerate milestones (FULL, HALF, CUSTOM)
  - Record offline payments (cash, bank, cheque)
  - Review payment declarations (approve / reject)
  - View all pending declarations
  - Update order status (PROCESSING, READY, SHIPPED, DELIVERED, CANCELLED)
"""

import asyncio
import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.auth import get_current_admin_user
from app.modules.users.models import User
from app.core.messaging import get_dispatcher
from app.modules.orders.models import Order, PaymentDeclaration
from app.modules.orders.schemas import (
    OrderStatus, DeclarationStatus,
    AdminMilestoneCreateRequest,
    AdminRecordPaymentRequest,
    OrderStatusUpdate,
    PaymentDeclarationReview,
    PaymentDeclarationResponse,
    TransactionResponse,
    OrderResponse,
    OrderListResponse,
    AdminRefundRequest,
    AdminOfflineOrderCreateRequest,
    InvoiceDataPayload,
    InvoiceDataResponse,
)
from app.modules.orders.service.order import OrderService
from app.modules.orders.service.payment import PaymentService
from app.core.email.templates.order_status import render_order_status_email
from app.core.email.templates.payment_declaration import render_declaration_review_email
from app.core.email.templates.payment_recorded import render_payment_recorded_email

logger = logging.getLogger(__name__)
router = APIRouter()


from app.core.task_registry import fire

def _fire_sse(user_id: str, event: str, data: dict) -> None:
    from app.core.sse import sse_manager
    fire(sse_manager.publish(user_id, event, data))

def _fire_admin_sse(event: str, data: dict) -> None:
    from app.core.sse import sse_manager
    fire(sse_manager.publish_to_admins(event, data))

# ── Order listing ─────────────────────────────────────────────────────────────

@router.get("/all", response_model=list[OrderListResponse])
async def list_all_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status_filter: Optional[OrderStatus] = Query(None),
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    svc = OrderService(db)
    return await svc.get_all_orders(
        status_filter=status_filter,
        skip=skip,
        limit=limit,
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    svc = OrderService(db)
    order = await svc.get_order(order_id)
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return order


@router.post("/offline", response_model=OrderResponse)
async def create_offline_order(
    payload: AdminOfflineOrderCreateRequest,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually creates an offline order directly from the dashboard.
    Bypasses standard client-side 4-step Inquiry process.
    """
    svc = OrderService(db)
    
    try:
        order = await svc.create_offline_order(payload, admin.id)
    except Exception as e:
        logger.error(f"Error creating offline order: {e}")
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
        
    await db.commit()
    
    _fire_admin_sse("admin_order_created_offline", {
        "order_id": str(order.id),
        "admin": str(admin.id),
    })

    return order


# ── Milestone management ──────────────────────────────────────────────────────

@router.post("/{order_id}/milestones", response_model=OrderResponse)
async def create_or_regenerate_milestones(
    order_id: UUID,
    payload: AdminMilestoneCreateRequest,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin creates or regenerates milestones for an order.
    Supports FULL, HALF, and CUSTOM (2–5 milestones, percentages sum to 100).
    Blocked if any payment has been made or a declaration is pending.

    Example CUSTOM payload:
    {
        "split_type": "CUSTOM",
        "milestones": [
            {"label": "Advance", "percentage": 30},
            {"label": "Mid-production", "percentage": 40},
            {"label": "Before dispatch", "percentage": 30}
        ]
    }
    """
    svc = OrderService(db)
    order = await svc.get_order(order_id)

    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    try:
        await svc.regenerate_milestones(order, payload)
    except ValueError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))

    await db.commit()

    _fire_sse(str(order.user_id), "milestones_updated", {
        "order_id": str(order_id),
        "message": "Admin has updated your payment schedule.",
    })

    return await svc.get_order(order_id)


# ── Offline payment recording ─────────────────────────────────────────────────

@router.post("/{order_id}/payments", response_model=TransactionResponse)
async def record_payment(
    order_id: UUID,
    payload: AdminRecordPaymentRequest,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin records a confirmed offline payment.
    Allowed modes: CASH, BANK_TRANSFER, CHEQUE.
    ONLINE → use /payments/verify.
    UPI_MANUAL → approve a declaration instead.
    """
    svc = PaymentService(db)
    order = await svc.record_admin_payment(order_id, payload, admin.id)
    await db.commit()

    # Reload to get the transaction we just created
    refreshed = await OrderService(db).get_order(order_id)
    latest_txn = sorted(refreshed.transactions, key=lambda t: t.created_at)[-1]

    _notify_payment_recorded(order, latest_txn.amount, admin)

    return latest_txn


# ── Declaration management ────────────────────────────────────────────────────


@router.get("/declarations/all", response_model=list[PaymentDeclarationResponse])
async def list_all_declarations(
    status_filter: Optional[DeclarationStatus] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all payment declarations across all orders with optional status filter.
    """
    from sqlalchemy.orm import selectinload
    stmt = select(PaymentDeclaration).options(
        selectinload(PaymentDeclaration.order),
        selectinload(PaymentDeclaration.milestone)
    )
    if status_filter:
        stmt = stmt.where(PaymentDeclaration.status == status_filter)
    
    stmt = stmt.order_by(PaymentDeclaration.created_at.desc()).offset(skip).limit(limit)
    
    declarations = list((await db.execute(stmt)).scalars().all())
    return declarations


@router.get("/declarations/pending", response_model=list[PaymentDeclarationResponse])
async def get_pending_declarations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    All pending UPI/bank declarations across all orders.
    Oldest first (FIFO) — admin works through the queue in order.
    """
    from sqlalchemy.orm import selectinload
    declarations = list((await db.execute(
        select(PaymentDeclaration)
        .options(
            selectinload(PaymentDeclaration.order),
            selectinload(PaymentDeclaration.milestone)
        )
        .where(PaymentDeclaration.status == DeclarationStatus.PENDING)
        .order_by(PaymentDeclaration.created_at.asc())
        .offset(skip)
        .limit(limit)
    )).scalars().all())
    return declarations


@router.get("/declarations/{declaration_id}", response_model=PaymentDeclarationResponse)
async def get_declaration(
    declaration_id: UUID,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve details of a single payment declaration."""
    from sqlalchemy.orm import selectinload
    stmt = (
        select(PaymentDeclaration)
        .options(
            selectinload(PaymentDeclaration.order),
            selectinload(PaymentDeclaration.milestone)
        )
        .where(PaymentDeclaration.id == declaration_id)
    )
    declaration = (await db.execute(stmt)).scalar_one_or_none()
    if not declaration:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Declaration not found")
    return declaration



@router.get("/{order_id}/declarations", response_model=list[PaymentDeclarationResponse])
async def get_order_declarations(
    order_id: UUID,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """All declarations for a specific order (all statuses)."""
    from sqlalchemy.orm import selectinload
    declarations = list((await db.execute(
        select(PaymentDeclaration)
        .options(
            selectinload(PaymentDeclaration.order),
            selectinload(PaymentDeclaration.milestone)
        )
        .where(PaymentDeclaration.order_id == order_id)
        .order_by(PaymentDeclaration.created_at.desc())
    )).scalars().all())

    return declarations


@router.patch(
    "/{order_id}/declarations/{declaration_id}/review",
    response_model=OrderResponse,
)
async def review_declaration(
    order_id: UUID,
    declaration_id: UUID,
    payload: PaymentDeclarationReview,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Approve or reject a user's UPI/bank payment declaration.

    Approve:
    {
        "is_approved": true
    }

    Reject:
    {
        "is_approved": false,
        "rejection_reason": "UTR not found in bank statement"
    }

    On approval: Transaction created, milestone marked PAID automatically.
    On rejection: Milestone reset to UNPAID, user notified.
    """
    svc = PaymentService(db)
    order = await svc.review_declaration(declaration_id, payload, admin.id)
    await db.commit()

    refreshed_order = await OrderService(db).get_order(order_id)

    if payload.is_approved:
        _fire_sse(str(refreshed_order.user_id), "payment_approved", {
            "order_id": str(order_id),
            "order_number": refreshed_order.order_number,
            "declaration_id": str(declaration_id),
            "message": f"Your payment for order {refreshed_order.order_number} has been verified.",
        })
        _notify_declaration_approved(refreshed_order, admin)
    else:
        _fire_sse(str(refreshed_order.user_id), "payment_rejected", {
            "order_id": str(order_id),
            "order_number": refreshed_order.order_number,
            "declaration_id": str(declaration_id),
            "reason": payload.rejection_reason,
            "message": f"Your payment for order {refreshed_order.order_number} was rejected.",
        })
        _notify_declaration_rejected(refreshed_order, payload.rejection_reason)

    return refreshed_order


# ── Order status ──────────────────────────────────────────────────────────────

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    payload: OrderStatusUpdate,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Move order through fulfilment stages.
    Allowed: PROCESSING, READY, SHIPPED, DELIVERED, CANCELLED.
    Financial statuses are set automatically — schema rejects them here.
    """
    svc = OrderService(db)
    order = await svc.get_order(order_id)

    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    old_status = order.status

    try:
        await svc.transition_status(
            order,
            payload.status,
            actor="admin",
            admin_notes=payload.admin_notes,
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))

    await db.commit()

    refreshed_order = await svc.get_order(order_id)

    _fire_sse(str(refreshed_order.user_id), "order_status_changed", {
        "order_id": str(order_id),
        "old_status": old_status.value if hasattr(old_status, 'value') else old_status,
        "new_status": payload.status.value if hasattr(payload.status, 'value') else payload.status,
    })
    _notify_status_change(refreshed_order, old_status, payload.status, admin)

    return refreshed_order


# ── Invoice data management ───────────────────────────────────────────────────

@router.get("/{order_id}/invoice-data", response_model=InvoiceDataResponse)
async def get_invoice_data(
    order_id: UUID,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the saved invoice_data for an order, or auto-generates defaults
    from inquiry items if not yet configured.
    """
    from sqlalchemy.orm import selectinload
    from app.modules.inquiry.models import InquiryGroup, InquiryItem

    svc = OrderService(db)
    order = await svc.get_order(order_id)
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    order_total = float(order.total_amount) if order.total_amount is not None else 0.0

    if order.invoice_data:
        # Already configured — return as-is
        items = order.invoice_data.get("items", [])
        items_total = sum(
            float(it.get("unit_price", 0)) * float(it.get("quantity", 1))
            for it in items
        )
        return InvoiceDataResponse(
            invoice_data=order.invoice_data,
            is_configured=True,
            order_total=order_total,
            items_total=round(items_total, 2),
        )

    # Auto-generate defaults from inquiry items
    inquiry = (await db.execute(
        select(InquiryGroup)
        .options(
            selectinload(InquiryGroup.items).selectinload(InquiryItem.sub_product),
            selectinload(InquiryGroup.items).selectinload(InquiryItem.sub_service),
        )
        .where(InquiryGroup.id == order.inquiry_id)
    )).scalar_one_or_none()

    auto_items = []
    if inquiry:
        item_count = len(inquiry.items) or 1
        for itm in inquiry.items:
            sp = itm.sub_product
            ss = itm.sub_service
            source = sp or ss
            name = (sp.name if sp else ss.name if ss else "Custom item")
            qty = itm.quantity or 1
            line_price = float(itm.line_item_price) if itm.line_item_price is not None else 0.0

            auto_items.append({
                "item_id": str(itm.id),
                "description": name,
                "quantity": qty,
                "unit_price": round(line_price / qty, 2) if qty > 0 and line_price > 0 else 0.0,
                "hsn_sac": getattr(source, "hsn_code", "") or "" if source else "",
                "cgst_rate": float(getattr(source, "cgst_rate", 0) or 0) if source else 0.0,
                "sgst_rate": float(getattr(source, "sgst_rate", 0) or 0) if source else 0.0,
                "igst_rate": float(getattr(source, "igst_rate", 0) or 0) if source else 0.0,
                "cess_rate": float(getattr(source, "cess_rate", 0) or 0) if source else 0.0,
                "discount_amount": 0.0,
                "discount_type": None,
                "discount_value": 0.0,
                "unit": getattr(source, "unit", None) if source else None,
            })

    items_total = sum(it["unit_price"] * it["quantity"] for it in auto_items)

    has_zeros = any(it["unit_price"] == 0 for it in auto_items)
    warning = None
    if has_zeros:
        warning = (
            "Per-item prices are missing. Please fill in unit prices for each item. "
            "The total of all items should match the order total of "
            f"₹{order_total:,.2f} (before tax/shipping adjustments)."
        )
    elif abs(items_total - order_total) > 1:
        warning = (
            f"Item total (₹{items_total:,.2f}) doesn't match order total (₹{order_total:,.2f}). "
            "Please adjust unit prices."
        )

    auto_data = {
        "items": auto_items,
        "shipping_amount": float(order.shipping_amount) if order.shipping_amount is not None else 0.0,
        "shipping_gst_rate": 0.0,
        "place_of_supply": order.place_of_supply or "",
        "reverse_charge": order.reverse_charge or False,
        "remarks": "BEING GOODS SALES",
    }

    return InvoiceDataResponse(
        invoice_data=auto_data,
        is_configured=False,
        order_total=order_total,
        items_total=round(items_total, 2),
        warning=warning,
    )


@router.put("/{order_id}/invoice-data", response_model=InvoiceDataResponse)
async def save_invoice_data(
    order_id: UUID,
    payload: InvoiceDataPayload,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Save admin-curated invoice presentation data.
    Validates that line items total roughly matches order total.
    """
    svc = OrderService(db)
    order = await svc.get_order(order_id)
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    order_total = float(order.total_amount) if order.total_amount is not None else 0.0
    items_total = sum(it.unit_price * it.quantity - it.discount_amount for it in payload.items)
    
    # Calculate taxes from items
    tax_total = 0.0
    for it in payload.items:
        taxable = it.unit_price * it.quantity - it.discount_amount
        tax_total += taxable * (it.cgst_rate + it.sgst_rate + it.igst_rate + it.cess_rate) / 100

    # Grand total = items + tax + shipping (+ shipping tax) - we allow some tolerance
    shipping_tax = payload.shipping_amount * payload.shipping_gst_rate / 100 if payload.shipping_gst_rate > 0 else 0
    computed_grand = round(items_total + tax_total + payload.shipping_amount + shipping_tax, 2)
    
    # Tolerance: allow ±₹2 rounding difference
    if abs(computed_grand - order_total) > 2:
        logger.warning(
            f"Invoice data grand total (₹{computed_grand:,.2f}) differs from "
            f"order total (₹{order_total:,.2f}) for order {order_id}. Saving anyway."
        )

    # Serialize and save
    invoice_dict = payload.model_dump()
    order.invoice_data = invoice_dict
    
    # Also update compliance fields on the order
    order.place_of_supply = payload.place_of_supply
    order.reverse_charge = payload.reverse_charge
    order.shipping_amount = payload.shipping_amount
    
    await db.commit()

    return InvoiceDataResponse(
        invoice_data=invoice_dict,
        is_configured=True,
        order_total=order_total,
        items_total=round(items_total, 2),
    )


@router.get("/{order_id}/invoice-preview")
async def preview_invoice(
    order_id: UUID,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a preview PDF using the saved invoice_data.
    Falls back to default behavior if invoice_data is not set.
    """
    import os
    import tempfile
    from fastapi.responses import FileResponse
    from fastapi.concurrency import run_in_threadpool
    from sqlalchemy.orm import selectinload
    from app.modules.orders.service.invoice_generator import generate_simple_invoice
    from app.modules.settings.models import SiteSettings

    svc = OrderService(db)
    order = await svc.get_order(order_id)
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    # Build items from invoice_data or warn
    if order.invoice_data:
        items = order.invoice_data.get("items", [])
        inv_meta = order.invoice_data
    else:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Invoice data not configured. Please save invoice data first."
        )

    order_num_str = order.order_number or str(order_id)[:8].upper()
    if order.status in ("PAID", "PARTIALLY_PAID", "COMPLETED"):
        invoice_number = order.invoice_number or order_num_str.replace("ORD", "INV", 1)
    else:
        invoice_number = f"PROFORMA-{order_num_str}"

    settings = (await db.execute(select(SiteSettings))).scalar_one_or_none()
    logo_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        "static", "logo.png"
    )

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        filepath = tmp.name

    await run_in_threadpool(
        generate_simple_invoice,
        filepath,
        {
            "invoice_number": invoice_number,
            "invoice_date": order.created_at,
            "order_data": {
                "order_id": order_num_str,
                "status": order.status,
                "order_date": order.created_at.strftime("%d %b %Y"),
                "total_amount": float(order.total_amount) if order.total_amount is not None else 0.0,
                "tax_amount": float(order.tax_amount) if order.tax_amount is not None else 0.0,
                "shipping_amount": float(inv_meta.get("shipping_amount", 0)),
                "shipping_gst_rate": float(inv_meta.get("shipping_gst_rate", 0)),
                "order_discount": float(order.discount_amount) if order.discount_amount is not None else 0.0,
                "amount_paid": float(order.amount_paid) if order.amount_paid is not None else 0.0,
                "place_of_supply": inv_meta.get("place_of_supply", ""),
                "reverse_charge": inv_meta.get("reverse_charge", False),
                "remarks": inv_meta.get("remarks", "BEING GOODS SALES"),
                "milestones": [
                    {
                        "label": m.label,
                        "percentage": float(m.percentage),
                        "amount": float(m.amount),
                        "status": m.status,
                    }
                    for m in sorted(
                        [ms for ms in order.milestones if ms.split_type == order.split_type],
                        key=lambda x: x.order_index
                    )
                ] if getattr(order, 'milestones', None) else [],
            },
            "company_info": {
                "name": settings.company_name if settings else "My Company",
                "address": settings.company_address if settings else "",
                "phone": getattr(settings, 'company_phone', '') if settings else "",
                "email": getattr(settings, 'company_email', '') if settings else "",
                "gstin": settings.company_gstin if settings else None,
                "pan": settings.company_pan if settings else None,
                "bank_details": settings.bank_details if settings else None,
                "website": getattr(settings, 'company_website', None) if settings else None,
            },
            "customer_info": {
                "name": order.user.name or "Customer",
                "email": order.user.email,
                "phone": order.user.phone or "",
                "address": order.user.address or "",
                "place_of_supply": inv_meta.get("place_of_supply") or (
                    (order.user.address or "").split(",")[-1].strip() if order.user.address else "Undetermined"
                ),
            },
            "items": items,
            "logo_path": logo_path,
        }
    )

    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=f"Preview_{invoice_number}.pdf",
    )


# ── Notification helpers ──────────────────────────────────────────────────────




_background_tasks: set[asyncio.Task] = set()

def _log_task_error(task: asyncio.Task, event: str) -> None:
    if not task.cancelled() and task.exception():
        logger.error(f"SSE publish failed for '{event}': {task.exception()}")


def _notify_payment_recorded(order: Order, amount: float, admin: User) -> None:
    async def _send():
        try:
            user = order.user
            if not user:
                return
            dispatcher = get_dispatcher()
            await dispatcher.dispatch(
                to_email=user.email,
                to_phone=getattr(user, "phone", None),
                subject=f"Payment recorded - Order {order.order_number}",
                body_html=render_payment_recorded_email(
                    order_number=order.order_number,
                    amount=amount,
                    balance=order.total_amount - order.amount_paid,
                    user_name=user.name,
                ),
                body_text=(
                    f"Payment of ₹{amount:,.2f} recorded for Order {order.order_number}. "
                    f"Balance: ₹{order.total_amount - order.amount_paid:,.2f}"
                ),
                sse_admin_event="admin_payment_recorded",
                sse_admin_data={
                    "order_id": str(order.id),
                    "order_number": order.order_number,
                    "amount": amount,
                    "admin": str(admin.id),
                },
            )
        except Exception as e:
            logger.error(f"Payment recorded notification failed: {e}")
            
    task = asyncio.create_task(_send())
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)


def _notify_declaration_approved(order: Order, admin: User) -> None:
    async def _send():
        try:
            user = order.user
            if not user:
                return
            dispatcher = get_dispatcher()
            await dispatcher.dispatch(
                to_email=user.email,
                to_phone=getattr(user, "phone", None),
                subject=f"Payment verified - Order {order.order_number}",
                body_html=render_declaration_review_email(
                    order_number=order.order_number,
                    is_approved=True,
                    order_status=order.status.value if hasattr(order.status, 'value') else order.status,
                    user_name=user.name,
                ),
                body_text=f"Your payment for Order {order.order_number} has been verified. Order status: {order.status.value if hasattr(order.status, 'value') else order.status}",
            )
        except Exception as e:
            logger.error(f"Declaration approved notification failed: {e}")
            
    task = asyncio.create_task(_send())
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)


def _notify_declaration_rejected(order: Order, reason: str) -> None:
    async def _send():
        try:
            user = order.user
            if not user:
                return
            dispatcher = get_dispatcher()
            await dispatcher.dispatch(
                to_email=user.email,
                to_phone=getattr(user, "phone", None),
                subject=f"Payment verification failed - Order {order.order_number}",
                body_html=render_declaration_review_email(
                    order_number=order.order_number,
                    is_approved=False,
                    reason=reason,
                    user_name=user.name,
                ),
                body_text=f"Payment for Order {order.order_number} not verified. Reason: {reason}",
            )
        except Exception as e:
            logger.error(f"Declaration rejected notification failed: {e}")
            
    task = asyncio.create_task(_send())
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)


def _notify_status_change(
    order: Order,
    old_status: OrderStatus,
    new_status: OrderStatus,
    admin: User,
) -> None:
    async def _send():
        try:
            user = order.user
            if not user:
                return
            dispatcher = get_dispatcher()
            await dispatcher.dispatch(
                to_email=user.email,
                to_phone=getattr(user, "phone", None),
                subject=f"Order Update - {order.order_number} - {new_status.value if hasattr(new_status, 'value') else new_status}",
                body_html=render_order_status_email(
                    order_number=order.order_number,
                    new_status=new_status.value if hasattr(new_status, 'value') else new_status,
                    user_name=user.name,
                    admin_notes=order.admin_notes,
                ),
                body_text=(
                    f"Order {order.order_number} status: {new_status.value if hasattr(new_status, 'value') else new_status}. "
                    f"{order.admin_notes or ''}"
                ),
                sse_admin_event="admin_order_status_changed",
                sse_admin_data={
                    "order_id": str(order.id),
                    "order_number": order.order_number,
                    "old": old_status.value if hasattr(old_status, 'value') else old_status,
                    "new": new_status.value if hasattr(new_status, 'value') else new_status,
                },
            )
        except Exception as e:
            logger.error(f"Status change notification failed: {e}")
            
    task = asyncio.create_task(_send())
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)



@router.post("/{order_id}/milestones/{milestone_id}/refund", response_model=OrderResponse)
async def issue_refund(
    order_id: UUID,
    milestone_id: UUID,
    payload: AdminRefundRequest,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Issue a refund against a paid milestone.
    Creates a negative transaction. Milestone may revert to UNPAID.
    Amount cannot exceed what was paid on the milestone.
    """
    svc = PaymentService(db)
    order = await svc.issue_refund(
        order_id=order_id,
        milestone_id=milestone_id,
        amount=payload.amount,
        reason=payload.reason,
        admin_id=admin.id,
    )
    await db.commit()

    _fire_sse(str(order.user_id), "refund_issued", {
        "order_id": str(order_id),
        "milestone_id": str(milestone_id),
        "amount": payload.amount,
        "reason": payload.reason,
    })

    return await OrderService(db).get_order(order_id)
"""
User-facing order routes.

Every route:
  1. Auth check
  2. Call service
  3. Commit
  4. Fire SSE (fire-and-forget)
  5. Return response

No business logic. No if/else on order state. All of that is in services.
"""

import asyncio
import logging
import os
import tempfile
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, status
from fastapi.responses import FileResponse
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.config import settings
from app.modules.auth.auth import get_current_user
from app.modules.auth.schemas import TokenData
from app.modules.orders.models import Order
from app.modules.orders.schemas import (
    UserMilestoneSwitchRequest,
    PaymentDeclarationCreate,
    PaymentDeclarationResponse,
    OrderResponse,
    OrderListResponse,
    OrderStatus
)
from app.modules.orders.service.order import OrderService
from app.modules.orders.service.payment import PaymentService
from app.modules.orders.service.invoice_generator import generate_simple_invoice
from app.modules.orders.service.qr_generator import generate_upi_qr
from app.modules.notifications.service import NotificationService

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Orders ────────────────────────────────────────────────────────────────────

@router.get("/my", response_model=list[OrderListResponse])
async def get_my_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[OrderStatus] = Query(None),
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = OrderService(db)
    return await svc.get_user_orders(
        current_user.id,
        status_filter=status_filter,
        skip=skip,
        limit=limit,
    )


@router.get("/my/{order_id}", response_model=OrderResponse)
async def get_my_order(
    order_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = OrderService(db)
    order = await svc.get_order(order_id)

    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your order")

    return order


@router.patch("/my/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = OrderService(db)
    order = await svc.get_order(order_id)

    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your order")

    try:
        await svc.transition_status(order, OrderStatus.CANCELLED, actor="user")
    except ValueError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))

    await db.commit()
    _fire_sse(str(current_user.id), "order_cancelled", {"order_id": str(order_id)})
    return await svc.get_order(order_id)


# ── Milestone switch ──────────────────────────────────────────────────────────

@router.patch("/my/{order_id}/milestones", response_model=OrderResponse)
async def switch_milestones(
    order_id: UUID,
    payload: UserMilestoneSwitchRequest,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Switch between FULL and HALF split.
    Only allowed before any payment is made.
    CUSTOM is admin-only — schema rejects it here.
    """
    svc = OrderService(db)
    order = await svc.get_order(order_id)

    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your order")

    try:
        await svc.switch_milestones_user(order, payload.split_type)
    except ValueError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))

    await db.commit()
    _fire_sse(str(current_user.id), "milestones_updated", {"order_id": str(order_id)})
    return await svc.get_order(order_id)




# ── UPI QR ────────────────────────────────────────────────────────────────────

@router.get("/my/{order_id}/milestones/{milestone_id}/qr")
async def get_payment_qr(
    order_id: UUID,
    milestone_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a UPI QR code for a specific milestone.
    UPI ID always comes from settings — never from client.
    Zero cost — bypasses Razorpay entirely.
    """
    if not settings.company_upi_id:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "UPI payments are not configured",
        )

    svc = OrderService(db)
    order = await svc.get_order(order_id)

    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your order")

    milestone = next((m for m in order.milestones if m.id == milestone_id), None)
    if not milestone:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Milestone not found")
    if milestone.status == "PAID":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Milestone already paid")

    qr_base64 = generate_upi_qr(
        upi_id=settings.company_upi_id,
        name=settings.company_name,
        amount=milestone.amount,
        transaction_note=f"Order {str(order_id)[:8].upper()} {milestone.label}",
    )

    return {
        "order_id": str(order_id),
        "milestone_id": str(milestone_id),
        "milestone_label": milestone.label,
        "amount": milestone.amount,
        "upi_id": settings.company_upi_id,
        "qr_code": f"data:image/png;base64,{qr_base64}",
    }


# ── Payment declaration ───────────────────────────────────────────────────────

@router.post(
    "/my/{order_id}/declarations",
    response_model=PaymentDeclarationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_payment_declaration(
    order_id: UUID,
    payload: PaymentDeclarationCreate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    User declares they've paid via UPI or bank transfer.
    Creates a pending declaration for admin to review.
    UTR is optional — screenshot is the primary proof.
    """
    svc = PaymentService(db)
    declaration = await svc.submit_declaration(
        order_id=order_id,
        milestone_id=payload.milestone_id,
        user_id=current_user.id,
        utr_number=payload.utr_number,
        screenshot_url=payload.screenshot_url,
    )
    # Fetch order_number for notification
    order_stmt = select(Order.order_number).where(Order.id == order_id)
    order_number = (await db.execute(order_stmt)).scalar_one_or_none()

    await NotificationService.notify_admins(
        db,
        title="Payment Declared",
        message=f"Submitted a payment declaration for Order #{order_number or str(order_id)[:8].upper()}.",
        metadata={"type": "payment_declared", "id": str(order_id)},
        sender_name=current_user.name,
        is_admin=current_user.admin
    )
    await db.commit()

    _fire_admin_sse("admin_declaration_submitted", {
        "order_id": str(order_id),
        "declaration_id": str(declaration.id),
        "user_id": str(current_user.id),
    })

    return declaration


@router.get(
    "/my/{order_id}/declarations",
    response_model=list[PaymentDeclarationResponse],
)
async def get_my_declarations(
    order_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """User views their declarations for an order."""
    svc = OrderService(db)
    order = await svc.get_order(order_id)

    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your order")

    return order.declarations


# ── Invoice ───────────────────────────────────────────────────────────────────

@router.get("/my/{order_id}/invoice")
async def get_invoice(
    order_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate PDF invoice.
    Temp file deleted after response via BackgroundTasks.
    """
    from app.modules.inquiry.models import InquiryGroup, InquiryItem

    stmt = (
        select(Order)
        .options(
            selectinload(Order.user),
            selectinload(Order.transactions),
            selectinload(Order.milestones),
        )
        .where(Order.id == order_id)
    )
    order = (await db.execute(stmt)).scalar_one_or_none()

    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    if order.user_id != current_user.id and not current_user.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")

    inquiry_stmt = (
        select(InquiryGroup)
        .options(
            selectinload(InquiryGroup.items).selectinload(InquiryItem.sub_product)
        )
        .where(InquiryGroup.id == order.inquiry_id)
    )
    inquiry = (await db.execute(inquiry_stmt)).scalar_one_or_none()

    items = []
    if inquiry:
        for itm in inquiry.items:
            # Determine the source entity (sub_product or sub_service) for HSN/GST
            sp = itm.sub_product
            ss = itm.sub_service
            source = sp or ss  # whichever is populated

            name = (sp.name if sp else ss.name if ss else "Custom item")
            qty = itm.quantity or 1
            total = float(itm.line_item_price or 0)
            options = itm.selected_options or {}
            variant = options.pop("variant_name", None) if isinstance(options, dict) else None

            # Build specs string from remaining selected_options
            specs_parts = []
            if isinstance(options, dict):
                for k, v in options.items():
                    if v not in (None, "", False):
                        specs_parts.append(f"{k}: {v}")
            specs = " · ".join(specs_parts) if specs_parts else ""

            items.append({
                "description": name,
                "quantity": qty,
                "unit_price": round(total / qty, 2) if qty > 0 else 0,
                "total": total,
                "variant": variant,
                "specs": specs,
                "hsn_sac": getattr(source, "hsn_code", "") or "",
                "cgst_rate": float(getattr(source, "cgst_rate", 0) or 0),
                "sgst_rate": float(getattr(source, "sgst_rate", 0) or 0),
                "igst_rate": float(getattr(source, "cgst_rate", 0) or 0) + float(getattr(source, "sgst_rate", 0) or 0),
            })

    # Logo path: configurable via env or placed in server/static/logo.png
    logo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "static", "logo.png")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        filepath = tmp.name

    await run_in_threadpool(
        generate_simple_invoice,
        filepath,
        {
            "invoice_number": f"INV-{order.order_number or str(order_id)[:8].upper()}",
            "invoice_date": order.created_at,
            "order_data": {
                "order_id": order.order_number or str(order_id)[:8].upper(),
                "status": order.status,
                "order_date": order.created_at.strftime("%d %b %Y"),
                "total_amount": float(order.total_amount or 0),
                "tax_amount": float(order.tax_amount or 0),
                "shipping_amount": float(order.shipping_amount or 0),
                "order_discount": float(order.discount_amount or 0),
                "amount_paid": float(order.amount_paid or 0),
            },
            "company_info": {
                "name": settings.company_name,
                "address": settings.company_address,
                "phone": settings.company_phone,
                "email": settings.company_email,
                "gstin": settings.company_gstin or None,
                "website": settings.company_website or None,
            },
            "customer_info": {
                "name": order.user.name or "Customer",
                "email": order.user.email,
                "phone": order.user.phone or "",
                "address": "",
            },
            "items": items,
            "logo_path": logo_path,
        }
    )

    # Delete temp file after response is fully sent
    background_tasks.add_task(os.unlink, filepath)

    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=f"invoice_{str(order_id)[:8]}.pdf",
    )


# ── SSE helpers ───────────────────────────────────────────────────────────────

_background_tasks = set()

def _fire_sse(user_id: str, event: str, data: dict) -> None:
    from app.core.sse import sse_manager
    task = asyncio.create_task(sse_manager.publish(user_id, event, data))
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)
    task.add_done_callback(lambda t: _log_task_error(t, event))


def _fire_admin_sse(event: str, data: dict) -> None:
    from app.core.sse import sse_manager
    task = asyncio.create_task(sse_manager.publish_to_admins(event, data))
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)
    task.add_done_callback(lambda t: _log_task_error(t, event))


def _log_task_error(task: asyncio.Task, event: str) -> None:
    if not task.cancelled() and task.exception():
        logger.error(f"SSE publish failed for '{event}': {task.exception()}")
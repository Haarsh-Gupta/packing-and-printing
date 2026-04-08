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
)
from app.modules.orders.service.order import OrderService
from app.modules.orders.service.payment import PaymentService

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
        "old_status": old_status.value,
        "new_status": payload.status.value,
    })
    _notify_status_change(refreshed_order, old_status, payload.status, admin)

    return refreshed_order


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
                body_html=f"""
                    <p>Hi {user.name or 'Customer'},</p>
                    <p>A payment of <strong>₹{amount:,.2f}</strong> has been
                    recorded for your Order <strong>{order.order_number}</strong>.</p>
                    <p>Balance remaining:
                    <strong>₹{order.total_amount - order.amount_paid:,.2f}</strong></p>
                """,
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
                body_html=f"""
                    <p>Hi {user.name or 'Customer'},</p>
                    <p>Your payment for Order <strong>{order.order_number}</strong> has been verified and recorded.</p>
                    <p>Order status: <strong>{order.status.value if hasattr(order.status, 'value') else order.status}</strong></p>
                """,
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
                body_html=f"""
                    <p>Hi {user.name or 'Customer'},</p>
                    <p>Your payment declaration for Order <strong>{order.order_number}</strong> was not verified.</p>
                    <p><strong>Reason:</strong> {reason}</p>
                    <p>Please contact us if you believe this is an error.</p>
                """,
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
                body_html=f"""
                    <p>Hi {user.name or 'Customer'},</p>
                    <p>Your Order <strong>{order.order_number}</strong> status has been updated to
                    <strong>{new_status.value if hasattr(new_status, 'value') else new_status}</strong>.</p>
                    {f'<p>{order.admin_notes}</p>' if order.admin_notes else ''}
                """,
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
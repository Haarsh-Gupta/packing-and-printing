import tempfile
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.core.database import get_db
from app.core.config import settings
from app.modules.auth.auth import get_current_user
from app.modules.auth.schemas import TokenData
from app.modules.inquiry.models import InquiryGroup, InquiryItem
from app.modules.orders.models import Order, Transaction, OrderMilestone
from app.modules.orders.schemas import (
    OrderResponse, OrderListResponse, TransactionResponse
)

from .utils.qr_generator import generate_upi_qr
from .utils.invoice_generator import generate_simple_invoice

router = APIRouter()


# ==================== FETCH ROUTES ====================

@router.get("/my", response_model=list[OrderListResponse])
async def get_my_orders(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all orders for the current user.
    """
    stmt = select(Order).where(Order.user_id == current_user.id)

    if status_filter:
        stmt = stmt.where(Order.status == status_filter.upper())

    stmt = stmt.offset(skip).limit(limit).order_by(Order.created_at.desc())

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/my/{order_id}", response_model=OrderResponse)
async def get_my_order(
    order_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get specific order with its milestones and transactions.
    """
    stmt = select(Order).options(
        selectinload(Order.transactions),
        selectinload(Order.milestones)
    ).where(Order.id == order_id, Order.user_id == current_user.id)
    
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/{order_id}/payments", response_model=list[TransactionResponse])
async def get_order_payments(
    order_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all payment transactions for an order"""
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.user_id != current_user.id and not current_user.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these transactions"
        )
    
    stmt = select(Transaction).where(Transaction.order_id == order_id).order_by(Transaction.created_at.desc())
    result = await db.execute(stmt)
    
    return result.scalars().all()


# ==================== QR CODE GENERATION ====================

@router.get("/{order_id}/payment-qr")
async def generate_payment_qr_code(
    order_id: UUID,
    upi_id: str = Query(..., description="UPI ID for payment"),
    payee_name: str = Query(..., description="Payee name"),
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate UPI QR code for order payment
    """
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.user_id != current_user.id and not current_user.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to generate QR for this order"
        )
    
    due_amount = order.total_amount - order.amount_paid
    
    if due_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already fully paid"
        )
    
    qr_base64 = generate_upi_qr(
        upi_id=upi_id,
        name=payee_name,
        amount=due_amount,
        transaction_note=f"Order #{order_id} Payment"
    )
    
    return {
        "order_id": order_id,
        "amount": due_amount,
        "qr_code": f"data:image/png;base64,{qr_base64}",
        "upi_string": f"upi://pay?pa={upi_id}&pn={payee_name}&am={due_amount}&tn=Order #{order_id} Payment"
    }


@router.get("/test-qr-code")
async def test_qr_code_generator(
    upi_id: str = Query(..., description="UPI ID for payment"),
    amount: float = Query(..., description="Amount to be paid"),
    payee_name: str = Query("Test Name", description="Payee name"),
):
    """
    [TESTING ONLY] Generate a dummy QR code based on provided UPI ID and amount.
    Just for testing the generator utility output.
    """
    try:
        qr_base64 = generate_upi_qr(
            upi_id=upi_id,
            name=payee_name,
            amount=amount,
            transaction_note=f"Test QR Code Payment"
        )
        return {
            "amount": amount,
            "qr_code_base64": qr_base64,
            "upi_string": f"upi://pay?pa={upi_id}&pn={payee_name}&am={amount}&tn=Test QR Code Payment"
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ===========================INVOICE GENERATION================================

@router.get("/{order_id}/invoice")
async def generate_order_invoice(
    order_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate PDF invoice for an order
    """
    stmt = (
        select(Order)
        .options(
            selectinload(Order.user),
            selectinload(Order.transactions)
        )
        .where(Order.id == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    stmt = (
        select(InquiryGroup)
        .options(selectinload(InquiryGroup.items).selectinload(InquiryItem.product))
        .where(InquiryGroup.id == order.inquiry_id)
    )
    group = (await db.execute(stmt)).scalar_one_or_none()
    
    if not group:
         raise HTTPException(status_code=404, detail="Inquiry group not found")
    
    if order.user_id != current_user.id and not current_user.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to generate invoice for this order"
        )
    
    company_info = {
        'name': settings.company_name,
        'address': settings.company_address,
        'phone': settings.company_phone,
        'email': settings.company_email,
        'gstin': settings.company_gstin or None,
    }
    
    customer_info = {
        'name': order.user.name,
        'email': order.user.email,
        'phone': order.user.phone or 'N/A',
        'address': ''
    }
    
    items = []
    for itm in group.items:
        items.append({
            'description': f"{itm.product.name if itm.product else 'Service'} (Custom Order)",
            'quantity': itm.quantity,
            'unit_price': (itm.line_item_price or 0) / itm.quantity if itm.quantity > 0 else 0,
            'total': itm.line_item_price or 0
        })
        
        if itm.selected_options:
            options_desc = ", ".join([f"{k}: {v}" for k, v in itm.selected_options.items()])
            items[-1]['description'] += f"\nOptions: {options_desc}"
    
    order_data = {
        'total_amount': order.total_amount,
        'amount_paid': order.amount_paid,
        'subtotal': order.total_amount,
        'tax': 0,
        'discount': 0
    }
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        invoice_filename = tmp.name
    
    invoice_data = {
        'invoice_number': f"INV-{order_id.hex[:6].upper()}",
        'invoice_date': order.created_at,
        'order_data': order_data,
        'company_info': company_info,
        'customer_info': customer_info,
        'items': items,
        'qr_code': None  
    }
    
    generate_simple_invoice(invoice_filename, invoice_data)
    
    return FileResponse(
        invoice_filename,
        media_type='application/pdf',
        filename=f"invoice_{order_id}.pdf"
    )
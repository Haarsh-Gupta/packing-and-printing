from datetime import datetime, timezone
from typing import Optional , List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.config import settings
from ..auth.auth import get_current_user, get_current_admin_user
from ..users.models import User
from ..inquiry.models import Inquiry
from ..products.models import ProductTemplate
from .models import Order, Transaction
from .schemas import (
    OrderCreate,
    OrderUpdate,
    OrderResponse,
    OrderListResponse,
    TransactionCreate,
    TransactionResponse,
    InvoiceData
)


import sys
import os
sys.path.append(os.path.dirname(__file__))

from .utils.qr_generator import generate_upi_qr, generate_payment_qr
from .utils.invoice_generator import InvoiceGenerator, generate_simple_invoice
# from .utils.whatsapp_messenger import WhatsAppMessenger


router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_order(order : OrderCreate , current_user : User = Depends(get_current_user) , db : AsyncSession = Depends(get_db)):
    """
    Create an order from an accepted inquiry.
    Only inquiries with ACCEPTED status can be converted to orders.
    """


    stmt = select(Inquiry).selectinload(Inquiry.template).where(Inquiry.id == order.inquiry_id , Inquiry.status == "ACCEPTED" , Inquiry.user_id == current_user.id)

    result = await db.execute(stmt)
    inquiry = result.scalar_one_or_none()

    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail="Inquiry not found")

    if inquiry.quote_valid_until < datetime.now(timezone.utc):
        inquiry.status = "EXPIRED"
        await db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail="This quote has expired. Please request a new quotation.")


    stmt = select(Order).where(Order.inquiry_id == order.inquiry_id)
    result = await db.execute(stmt)
    existing_order = result.scalar_one_or_none()

    if existing_order:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail="Order already exists for this inquiry")


    new_order = Order(
        inquiry_id=inquiry.id,
        user_id=current_user.id,
        total_amount=inquiry.total_amount,
        amount_paid=0,
        status="WAITING_PAYMENT"
    )

    await db.add(new_order)
    await db.commit()
    await db.refresh(new_order)

    return new_order

@router.get("/my" , response_model=list[OrderListResponse])
async def get_my_orders(
    skip : int = 0,
    limit : int = 20,
    status : Optional[str] = None,
    current_user : User = Depends(get_current_user) ,
    db : AsyncSession = Depends(get_db)
):
    """
    Get all orders for the current user.
    """
    stmt = select(Order).where(Order.user_id == current_user.id)

    if status:
        stmt = stmt.where(Order.status == status.upper())

    stmt = stmt.offset(skip).limit(limit).order_by(Order.created_at.desc())

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/my/{order_id}" , response_model=OrderResponse)
async def get_my_order(
    order_id : int,
    current_user : User = Depends(get_current_user) ,
    db : AsyncSession = Depends(get_db)
):
    """
    Get a specific order by ID (only if owned by current user).
    """
    stmt = select(Order).where(Order.id == order_id , Order.user_id == current_user.id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail="Order not found")

    return order


# =========================================Payment Routes=========================================

@router.post("/my/{order_id}/payment" , response_model=TransactionResponse)
async def pay_for_order(
    order_id : int,
    payment_data : TransactionCreate,
    current_user : User = Depends(get_current_admin_user) ,
    db : AsyncSession = Depends(get_db)
):
    """
    Offline payment to be recorded by the admin 
    """
    stmt = select(Order).where(Order.id == order_id , Order.user_id == current_user.id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail="Order not found")

    if order.status in ["WAITING_PAYMENT" , "PARTIALLY_PAID"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail="Order is not in WAITING_PAYMENT or PARTIALLY_PAID status")

    

    new_transaction = Transaction(
        order_id=order.id,
        amount=payment_data.amount,
        payment_method=payment_data.payment_method,
        payment_mode=payment_data.payment_mode,
        notes=payment_data.notes
    )

    order.amount_paid += payment_data.amount
    
    if order.amount_paid >= order.total_amount:
        order.status = "PAID"
    elif order.amount_paid > 0:
        order.status = "PARTIALLY_PAID"

    await db.add(new_transaction)
    await db.commit()
    await db.refresh(new_transaction)

    return new_transaction

@router.get("{order_id}/payments" , response_model = List[TransactionResponse])
async def get_order_payments(
    order_id : int,
    current_user : User = Depends(get_current_user) ,
    db : AsyncSession = Depends(get_db)
):
    """
    Get all payments for a specific order (only if owned by current user).
    """

    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail="Order not found")

    if order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN , detail="You are not authorized to access this order")

    stmt = select(Transaction).where(Transaction.order_id == order_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{order_id}/payments", response_model=list[TransactionResponse])
async def get_order_payments(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all payment transactions for an order"""
    # Verify order access
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user owns the order or is admin
    if order.user_id != current_user.id and not current_user.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these transactions"
        )
    
    # Get transactions
    stmt = select(Transaction).where(Transaction.order_id == order_id).order_by(Transaction.created_at.desc())
    result = await db.execute(stmt)
    
    return result.scalars().all()


# ==================== QR CODE GENERATION ====================

@router.get("/{order_id}/payment-qr")
async def generate_payment_qr_code(
    order_id: int,
    upi_id: str = Query(..., description="UPI ID for payment"),
    payee_name: str = Query(..., description="Payee name"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate UPI QR code for order payment
    """
    # Get order
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check authorization
    if order.user_id != current_user.id and not current_user.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to generate QR for this order"
        )
    
    # Calculate due amount
    due_amount = order.total_amount - order.amount_paid
    
    if due_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already fully paid"
        )
    
    # Generate QR code
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

# ===========================INVOIC GENERATION================================

@router.get("/{order_id}/invoice")
async def generate_order_invoice(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate PDF invoice for an order
    """
    # Get order with all relationships
    stmt = (
        select(Order)
        .options(
            selectinload(Order.inquiry).selectinload(Inquiry.template),
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
    
    # Check authorization
    if order.user_id != current_user.id and not current_user.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to generate invoice for this order"
        )
    
    # Prepare invoice data
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
        'address': ''  # Add if available
    }
    
    # Prepare invoice items
    items = [{
        'description': f"{order.inquiry.template.name} (Custom Order)",
        'quantity': order.inquiry.quantity,
        'unit_price': order.total_amount / order.inquiry.quantity,
        'total': order.total_amount
    }]
    
    # Add selected options as additional description
    options_desc = ", ".join([f"{k}: {v}" for k, v in order.inquiry.selected_options.items()])
    items[0]['description'] += f"\nOptions: {options_desc}"
    
    order_data = {
        'total_amount': order.total_amount,
        'amount_paid': order.amount_paid,
        'subtotal': order.total_amount,
        'tax': 0,
        'discount': 0
    }
    
    # Generate invoice
    invoice_filename = f"/tmp/invoice_{order_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    invoice_data = {
        'invoice_number': f"INV-{order_id:06d}",
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


#  ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/all", response_model=list[OrderResponse])
async def get_all_orders(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Get all orders with optional status filter
    """
    stmt = select(Order).options(selectinload(Order.transactions))
    
    if status_filter:
        stmt = stmt.where(Order.status == status_filter.upper())
    
    stmt = stmt.order_by(Order.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    
    return result.scalars().all()


@router.patch("/admin/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_update: OrderUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Update order status
    """
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    order.status = status_update.status
    
    await db.commit()
    await db.refresh(order)
    
    return order


@router.delete("/admin/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_order(
    order_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Delete an order and all associated transactions
    """
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    await db.execute(delete(Order).where(Order.id == order_id))
    await db.commit()
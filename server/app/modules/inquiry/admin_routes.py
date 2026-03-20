import logging
from uuid import UUID
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.task_registry import fire
from ..auth.auth import get_current_admin_user
from ..users.models import User
from .models import InquiryGroup, InquiryItem, InquiryMessage, QuoteVersion
from ..notifications.models import Notification, EmailLog
from app.core.email.service import get_email_service
from app.core.email.templates.quote import render_quote_email
from .schemas import (
    AdminPricingCalculatorRequest,
    QuoteVersionCreate,
    InquiryStatus,
    InquiryStatusUpdate,
    ADMIN_ALLOWED_TRANSITIONS,
    InquiryGroupResponse,
    InquiryGroupListResponse,
    InquiryMessageCreate,
    InquiryMessageResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()
email_service = get_email_service()

@router.post("/calculate-price", status_code=status.HTTP_200_OK)
async def admin_calculate_custom_price(
    request: AdminPricingCalculatorRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Calculate estimated price for a product/service hypothetically (bypassing DB values).
    Takes base_price, quantity, config_schema, and selected_options.
    """
    estimated_price = 0.0
    
    if request.is_service:
        # Service logic: (Price Per Unit * Quantity)
        estimated_price = request.base_price * request.quantity
    else:
        # Product logic: Base Price + Options
        base_item_price = request.base_price
        
        if request.selected_options and request.config_schema:
            sections_list = request.config_schema.get("sections", []) if isinstance(request.config_schema, dict) else []
            sections_map = {
                section["key"]: section 
                for section in sections_list
                if isinstance(section, dict) and "key" in section
            }
            
            for key, selected_val in request.selected_options.items():
                if key not in sections_map:
                    raise HTTPException(status_code=400, detail=f"Invalid option category: {key}")
                
                section = sections_map[key]
                s_type = section.get("type")
                
                if s_type in ["dropdown", "radio"]:
                    options = section.get("options", []) or []
                    options_map = {
                        str(opt.get("value")): float(opt.get("price_mod", 0.0))
                        for opt in options if isinstance(opt, dict) and "value" in opt
                    }
                    val_str = str(selected_val)
                    if val_str not in options_map:
                        raise HTTPException(status_code=400, detail=f"Invalid value '{selected_val}' for option '{key}'")
                    base_item_price += options_map[val_str]
                
                elif s_type == "number_input":
                    try:
                        qty = float(selected_val)
                        ppu = float(section.get("price_per_unit", 0.0))
                        base_item_price += (qty * ppu)
                    except (ValueError, TypeError):
                        pass

        estimated_price = base_item_price * request.quantity

    return {"estimated_price": estimated_price}


@router.get("/", response_model=list[InquiryGroupListResponse], status_code=status.HTTP_200_OK)
async def get_all_inquiries(
    skip: int = 0,
    limit: int = 50,
    status_filter: str = None,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Get all inquiry groups with optional status filter.
    """
    stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items)
    ).order_by(InquiryGroup.created_at.desc())
    
    if status_filter:
        stmt = stmt.where(InquiryGroup.status == status_filter.upper())
    
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    groups = result.scalars().all()

    for group in groups:
        group.item_count = len(group.items)
    
    return groups


@router.get("/{group_id}", response_model=InquiryGroupResponse, status_code=status.HTTP_200_OK)
async def get_inquiry_by_id(
    group_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Get a specific detailed inquiry by ID.
    """
    stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items),
        selectinload(InquiryGroup.messages),
        selectinload(InquiryGroup.quote_versions),
        selectinload(InquiryGroup.active_quote),
    ).where(InquiryGroup.id == group_id)
    
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Inquiry not found")
        
    # Auto-transition to UNDER_REVIEW when admin opens a SUBMITTED inquiry
    if group.status == 'SUBMITTED':
        group.status = 'UNDER_REVIEW'
        await db.commit()
        await db.refresh(group)
        
        # Fire SSE notification to user
        from app.core.sse import sse_manager
        fire(
            sse_manager.publish(str(group.user_id), "inquiry_status_updated", {
                "inquiry_id": str(group.id),
                "status": "UNDER_REVIEW",
                "message": "An admin has started reviewing your inquiry."
            })
        )
    
    return group


@router.patch("/{group_id}/quote", response_model=InquiryGroupResponse, status_code=status.HTTP_200_OK)
async def send_quotation(
    group_id: UUID,
    quotation: QuoteVersionCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Send a quotation by creating a new QuoteVersion and emailing the user.
    """
    stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items).selectinload(InquiryItem.product),
        selectinload(InquiryGroup.items).selectinload(InquiryItem.service),
        selectinload(InquiryGroup.messages),
        selectinload(InquiryGroup.quote_versions),
        selectinload(InquiryGroup.active_quote),
    ).where(InquiryGroup.id == group_id)
    
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    if group.status not in ['SUBMITTED', 'UNDER_REVIEW', 'NEGOTIATING', 'QUOTED']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot quote inquiries with {group.status} status"
        )
    
    # Supersede the current active quote if one exists
    if group.active_quote and group.active_quote.status == "PENDING_REVIEW":
        group.active_quote.status = "SUPERSEDED"

    # Determine next version number
    next_version = len(group.quote_versions) + 1

    # Create the new QuoteVersion
    new_quote = QuoteVersion(
        inquiry_id=group.id,
        version=next_version,
        created_by=current_user.id,
        total_price=quotation.total_price,
        valid_until=datetime.now(timezone.utc) + timedelta(days=quotation.valid_days),
        admin_notes=quotation.admin_notes,
        milestones=[m.model_dump() for m in quotation.milestones],
        line_items=[li for li in quotation.line_items] if quotation.line_items else None,
        status="PENDING_REVIEW",
    )
    db.add(new_quote)
    await db.flush()

    # Update parent group
    group.active_quote_id = new_quote.id
    group.status = "QUOTED"
    
    # Update line-item pricing on inquiry items if provided
    if quotation.line_items:
        prices_map = {li.get("item_id"): li.get("line_item_price") for li in quotation.line_items if li.get("item_id")}
        for item in group.items:
            if str(item.id) in prices_map:
                item.line_item_price = prices_map[str(item.id)]
    
    await db.commit()
    
    # Persistent In-App Notification
    notif = Notification(
        user_id=group.user_id,
        title="Quotation Received",
        message=f"Admin has sent a quotation of ₹{float(new_quote.total_price):,.2f} for your inquiry.",
        metadata_={"type": "inquiry_quote", "id": str(group.id)}
    )
    db.add(notif)
    await db.commit()

    # --- EMAIL DELIVERY ---
    try:
        user_stmt = select(User).where(User.id == group.user_id)
        user_res = await db.execute(user_stmt)
        target_user = user_res.scalar_one()

        items_data = []
        for item in group.items:
            # Use property or direct access
            p_name = item.product.name if item.product else (item.service.name if item.service else "Custom Item")
            items_data.append({
                "product_name": p_name,
                "quantity": item.quantity,
                "line_item_price": item.line_item_price or 0.0
            })
            
        quote_html = render_quote_email(
            inquiry_id=str(group.id),
            total_price=float(new_quote.total_price),
            valid_until=new_quote.valid_until.strftime("%d %b %Y"),
            items=items_data,
            admin_notes=new_quote.admin_notes,
            user_name=target_user.name
        )
        
        msg_id = await email_service.send_email(
            to=target_user.email,
            subject=f"Quotation for Inquiry #{str(group.id)[:8].upper()}",
            body_html=quote_html
        )
        
        if msg_id:
            db.add(EmailLog(
                recipient=target_user.email,
                subject=f"Quote #{str(group.id)[:8].upper()}",
                message_id=msg_id,
                status="delivered",
                inquiry_id=group.id,
                metadata_={"type": "quote", "version": next_version}
            ))
            group.quote_email_status = "delivered"
        else:
            group.quote_email_status = "failed"
            
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to send quote email for inquiry {group.id}: {e}")

    # SSE Push
    from app.core.sse import sse_manager
    fire(
        sse_manager.publish(str(group.user_id), "inquiry_quoted", {
            "inquiry_id": str(group.id),
            "total_price": float(new_quote.total_price),
            "message": "Admin has sent a quotation for your inquiry!"
        })
    )
    
    # Re-fetch for response
    fetch_stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items).selectinload(InquiryItem.product),
        selectinload(InquiryGroup.items).selectinload(InquiryItem.service),
        selectinload(InquiryGroup.messages),
        selectinload(InquiryGroup.quote_versions),
        selectinload(InquiryGroup.active_quote),
    ).where(InquiryGroup.id == group_id)
    
    refreshed_result = await db.execute(fetch_stmt)
    return refreshed_result.scalar_one()


@router.patch("/{group_id}/status", response_model=InquiryGroupResponse, status_code=status.HTTP_200_OK)
async def update_inquiry_status(
    group_id: UUID,
    status_update: InquiryStatusUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Update the status of an inquiry group manually.
    """
    stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items),
        selectinload(InquiryGroup.messages),
        selectinload(InquiryGroup.quote_versions),
        selectinload(InquiryGroup.active_quote),
    ).where(InquiryGroup.id == group_id)
    
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Inquiry not found")
        
    # Lazy check for expiration: if QUOTED and active quote is expired, auto-transition
    if group.status == 'QUOTED' and group.active_quote and group.active_quote.valid_until < datetime.now(timezone.utc):
        group.status = 'EXPIRED'
        group.active_quote.status = 'EXPIRED'
        
    try:
        current_enum = InquiryStatus(group.status)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid status in DB")
        
    allowed_transitions = ADMIN_ALLOWED_TRANSITIONS.get(current_enum, [])
    
    if status_update.status not in allowed_transitions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Admin cannot transition inquiry from {group.status} to {status_update.status.value}"
        )

    target_status = status_update.status.value
        
    group.status = target_status
    
    # Notify the user persistently
    notif = Notification(
        user_id=group.user_id,
        title="Inquiry Status Updated",
        message=f"Your inquiry #{str(group.id).split('-')[0].upper()} was updated to {target_status.replace('_', ' ')}.",
        metadata_={"type": "inquiry_status", "id": str(group.id), "status": target_status}
    )
    db.add(notif)
    
    await db.commit()
    
    from app.core.sse import sse_manager
    fire(
        sse_manager.publish(str(group.user_id), "inquiry_status_updated", {
            "inquiry_id": str(group.id),
            "status": target_status,
            "message": f"Admin updated your inquiry status to {target_status}"
        })
    )
    
    # Re-fetch the fully loaded group with relationships after commit
    fetch_stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items),
        selectinload(InquiryGroup.messages),
        selectinload(InquiryGroup.quote_versions),
        selectinload(InquiryGroup.active_quote),
    ).where(InquiryGroup.id == group_id)
    
    refreshed_result = await db.execute(fetch_stmt)
    refreshed_group = refreshed_result.scalar_one()
    
    return refreshed_group


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_inquiry(
    group_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Delete any inquiry group.
    """
    stmt = select(InquiryGroup).where(InquiryGroup.id == group_id)
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    await db.execute(delete(InquiryGroup).where(InquiryGroup.id == group_id))
    await db.commit()


@router.post("/{group_id}/messages", response_model=InquiryMessageResponse)
async def admin_send_message(
    group_id: UUID,
    message: InquiryMessageCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Send a message in any inquiry thread.
    """
    stmt = select(InquiryGroup).where(InquiryGroup.id == group_id)
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    new_message = InquiryMessage(
        inquiry_group_id=group_id,
        sender_id=current_user.id,
        content=message.content,
        file_urls=message.file_urls
    )

    db.add(new_message)
    await db.commit()
    
    notif = Notification(
        user_id=group.user_id,
        title="New Message",
        message=f"You have a new message from admin regarding inquiry #{str(group_id)[:8].upper()}.",
        metadata_={"type": "inquiry_message", "id": str(group_id)}
    )
    db.add(notif)
    await db.commit()
    await db.refresh(new_message)
    
    from app.core.sse import sse_manager
    from app.core.websockets import ws_manager
    fire(
        sse_manager.publish(str(group.user_id), "inquiry_new_message", {
            "inquiry_id": str(group_id),
            "message": "New message from admin regarding your inquiry."
        })
    )
    
    # Broadcast to websocket
    await ws_manager.broadcast(str(group_id), {
        "type": "new_message",
        "message": {
            "id": new_message.id,
            "inquiry_group_id": str(new_message.inquiry_group_id),
            "sender_id": str(new_message.sender_id),
            "content": new_message.content,
            "file_urls": new_message.file_urls,
            "created_at": new_message.created_at.isoformat() if new_message.created_at else None
        }
    })

    return new_message
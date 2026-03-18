from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.modules.auth.auth import get_current_user
from app.modules.auth.schemas import TokenData
from app.modules.services.models import SubService
from app.modules.products.models import SubProduct
from app.modules.orders.models import Order, OrderMilestone
from app.modules.orders.schemas import OrderResponse
from app.modules.orders.schemas import PaymentSplitType
from .models import InquiryGroup, InquiryItem, InquiryMessage
from .schemas import (
    InquiryGroupCreate,
    InquiryItemUpdate,
    InquiryItemCreate,
    InquiryStatus,
    InquiryStatusUpdate,
    USER_ALLOWED_TRANSITIONS,
    InquiryGroupResponse,
    InquiryGroupListResponse,
    InquiryMessageCreate,
    InquiryMessageResponse
)
from app.modules.notifications.service import NotificationService

from fastapi import WebSocket, WebSocketDisconnect, Query
from jose import jwt
from app.core.config import settings
from app.core.websockets import ws_manager
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/{group_id}")
async def websocket_inquiry_endpoint(websocket: WebSocket, group_id: str, token: str = Query(...)):
    """WebSocket endpoint for real-time inquiry messaging & typing indicators."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        token_data = TokenData(**payload)
        user_id = str(token_data.id)
        is_admin = token_data.admin
        logger.info(f"WS auth OK: user={user_id}, admin={is_admin}, group={group_id}")
    except Exception as e:
        logger.warning(f"WS auth FAILED for group={group_id}: {e}")
        await websocket.close(code=1008)
        return

    await ws_manager.connect(websocket, group_id, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "typing":
                    await ws_manager.broadcast(group_id, {
                        "type": "typing",
                        "user_id": user_id,
                        "is_typing": msg.get("is_typing", False),
                        "is_admin": is_admin
                    })
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, group_id, user_id)
    except Exception as e:
        logger.error(f"WS error for user={user_id}, group={group_id}: {e}")
        ws_manager.disconnect(websocket, group_id, user_id)
        try:
            await websocket.close()
        except Exception:
            pass

async def calculate_item_estimated_price(item: InquiryItemCreate, db: AsyncSession) -> float:
    """
    Validates the inquiry item options and calculates the estimated price 
    based on backend database values.
    """
    estimated_price = 0.0
    # 1. SERVICE VALIDATION & CALCULATION
    if item.subservice_id:
        stmt = select(SubService).where(SubService.id == item.subservice_id)
        sub_service = (await db.execute(stmt)).scalar_one_or_none()
        
        if not sub_service:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"SubService {item.subservice_id} not found")
        if not sub_service.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This service is currently unavailable")
        if item.quantity < sub_service.minimum_quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Minimum quantity required is {sub_service.minimum_quantity} for '{sub_service.name}'")
        
        # Calculation: (Base Price) + (Price Per Unit * Quantity)
        estimated_price = sub_service.price_per_unit * item.quantity

    # 2. PRODUCT VALIDATION & CALCULATION
    elif item.subproduct_id:
        stmt = select(SubProduct).where(SubProduct.id == item.subproduct_id)
        sub_product = (await db.execute(stmt)).scalar_one_or_none()
        
        if not sub_product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"SubProduct {item.subproduct_id} not found")
        if not sub_product.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This product is currently unavailable")
        if item.quantity < sub_product.minimum_quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Minimum quantity required is {sub_product.minimum_quantity} for '{sub_product.name}'")

        base_item_price = sub_product.base_price

        # Options Validation using JSONB Config Schema
        if item.selected_options and sub_product.config_schema:
            config_data = sub_product.config_schema
            sections_list = config_data.get("sections", []) if isinstance(config_data, dict) else []
            
            # Create a lookup map for faster validation: key -> section data
            sections_map = {
                section["key"]: section 
                for section in sections_list
                if isinstance(section, dict) and "key" in section
            }
            
            for key, selected_val in item.selected_options.items():
                if key not in sections_map:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST, 
                        detail=f"Invalid option category: {key}"
                    )
                
                section = sections_map[key]
                s_type = section.get("type")
                
                # Only validate against predefined options for dropdown/radio
                if s_type in ["dropdown", "radio"]:
                    options = section.get("options", []) or []
                    # Map valid choices to their price modifiers
                    options_map = {
                        str(opt.get("value")): float(opt.get("price_mod", 0.0))
                        for opt in options 
                        if isinstance(opt, dict) and "value" in opt
                    }
                    
                    val_str = str(selected_val)
                    if val_str not in options_map:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST, 
                            detail=f"Invalid value '{selected_val}' for option '{key}'"
                        )
                    
                    base_item_price += options_map[val_str]
                
                # For numeric inputs holding a price per unit multiplier
                elif s_type == "number_input":
                    try:
                        qty = float(selected_val)
                        ppu = float(section.get("price_per_unit", 0.0))
                        base_item_price += (qty * ppu)
                    except (ValueError, TypeError):
                        pass
                
                # Note: text_input is allowed but adds no extra cost by default

        # Calculation: (Base Price + Options Cost) * Quantity
        estimated_price = base_item_price * item.quantity

    return estimated_price

@router.post("/", response_model=InquiryGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_inquiry_group(
    inquiry_data: InquiryGroupCreate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new Inquiry Group (RFQ Cart).
    User submits one or multiple products/services for quotation.
    """
    # 1. Create the parent container
    new_group = InquiryGroup(
        user_id=current_user.id,
        status='PENDING'
    )
    db.add(new_group)
    await db.flush()  # Flush to generate the new_group.id for the item

    # 2. Add the child items to the container
    for item in inquiry_data.items:
        estimated_price = await calculate_item_estimated_price(item, db)
        new_item = InquiryItem(
            group_id=new_group.id,
            product_id=item.product_id,
            subproduct_id=item.subproduct_id,
            service_id=item.service_id,
            subservice_id=item.subservice_id,
            quantity=item.quantity,
            selected_options=item.selected_options,
            notes=item.notes,
            images=item.images,
            estimated_price=estimated_price
        )
        db.add(new_item)
    
    # Create persistent notifications for admins
    await NotificationService.notify_admins(
        db,
        title="New Inquiry",
        message=f"A new inquiry with {len(inquiry_data.items)} items was submitted.",
        metadata={"type": "new_inquiry", "id": str(new_group.id)}
    )

    await db.commit()

    # Notify all admins of new inquiry via SSE
    from app.core.sse import sse_manager
    import asyncio
    asyncio.create_task(
        sse_manager.publish_to_admins("new_inquiry", {
            "inquiry_id": str(new_group.id),
            "user_id": str(current_user.id),
            "item_count": len(inquiry_data.items),
            "message": "New inquiry submitted by a user"
        })
    )
    
    # 3. Fetch the fully loaded group to return
    stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items),
        selectinload(InquiryGroup.messages)
    ).where(InquiryGroup.id == new_group.id)
    
    result = await db.execute(stmt)
    return result.scalar_one()


@router.get("/my", response_model=list[InquiryGroupListResponse], status_code=status.HTTP_200_OK)
async def get_my_inquiries(
    skip: int = 0,
    limit: int = 20,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all inquiries for the current user (Lightweight List).
    """
    stmt = (
        select(InquiryGroup)
        .options(selectinload(InquiryGroup.items))
        .where(InquiryGroup.user_id == current_user.id)
        .order_by(InquiryGroup.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    groups = result.scalars().all()
    
    # Calculate item counts for the lightweight response
    for group in groups:
        group.item_count = len(group.items)

    return groups


@router.get("/my/{group_id}", response_model=InquiryGroupResponse, status_code=status.HTTP_200_OK)
async def get_my_inquiry(
    group_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific detailed inquiry by ID (only if owned by current user).
    """
    stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items),
        selectinload(InquiryGroup.messages)
    ).where(
        InquiryGroup.id == group_id,
        InquiryGroup.user_id == current_user.id
    )
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    return group


@router.post("/my/{group_id}/items", response_model=InquiryGroupResponse, status_code=status.HTTP_201_CREATED)
async def add_item_to_inquiry(
    group_id: UUID,
    item: InquiryItemCreate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    group = (await db.execute(
        select(InquiryGroup).where(
            InquiryGroup.id == group_id,
            InquiryGroup.user_id == current_user.id
        )
    )).scalar_one_or_none()

    if not group:
        raise HTTPException(404)

    if group.status != "PENDING":
        raise HTTPException(400, "Cannot modify inquiry")

    price = await calculate_item_estimated_price(item, db)

    db.add(
        InquiryItem(
            group_id=group_id,
            product_id=item.product_id,
            subproduct_id=item.subproduct_id,
            service_id=item.service_id,
            subservice_id=item.subservice_id,
            quantity=item.quantity,
            selected_options=item.selected_options,
            notes=item.notes,
            images=item.images,
            estimated_price=price
        )
    )

    await db.commit()

    stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items),
        selectinload(InquiryGroup.messages)
    ).where(InquiryGroup.id == group_id)
    
    return (await db.execute(stmt)).scalar_one()

@router.patch("/my/{group_id}/items/{item_id}", response_model=InquiryGroupResponse, status_code=status.HTTP_200_OK)
async def update_inquiry_item(
    group_id: UUID,
    item_id: UUID,
    item_update: InquiryItemUpdate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    group = (await db.execute(
        select(InquiryGroup).where(
            InquiryGroup.id == group_id,
            InquiryGroup.user_id == current_user.id
        )
    )).scalar_one_or_none()

    if not group:
        raise HTTPException(detail="Inquiry not found", status_code=404)

    if group.status != "PENDING":
        raise HTTPException(status_code=400, detail="Cannot modify inquiry not in PENDING status")

    item = (await db.execute(
        select(InquiryItem).where(
            InquiryItem.id == item_id,
            InquiryItem.group_id == group_id
        )
    )).scalar_one_or_none()

    if not item:
        raise HTTPException(detail="Item not found", status_code=status.HTTP_404_NOT_FOUND)
    
    if item.subservice_id and item_update.selected_options:
        raise HTTPException(detail="Invalid update request, selected options are not allowed for services", status_code=status.HTTP_400_BAD_REQUEST)
        
    item.quantity = item_update.quantity if item_update.quantity else item.quantity
    item.notes = item_update.notes if item_update.notes else item.notes
    item.images = item_update.images if item_update.images else item.images
    
    if item_update.selected_options:
        new_opts = dict(item.selected_options or {})
        for key, value in item_update.selected_options.items():
            new_opts[key] = value
        # Assignment to trigger SQLAlchemy JSON mutability tracking
        item.selected_options = new_opts
    
    # We must convert the item model back into a schema for calculation validation
    item_schema = InquiryItemCreate(
        product_id=item.product_id,
        subproduct_id=item.subproduct_id,
        service_id=item.service_id,
        subservice_id=item.subservice_id,
        quantity=item.quantity,
        selected_options=item.selected_options,
        notes=item.notes,
        images=item.images
    )
    
    price = await calculate_item_estimated_price(item_schema, db)
    item.estimated_price = price

    await db.commit()

    stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items),
        selectinload(InquiryGroup.messages)
    ).where(InquiryGroup.id == group_id)
    
    return (await db.execute(stmt)).scalar_one()

@router.delete("/my/{group_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inquiry_item(
    group_id: UUID,
    item_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    group = (await db.execute(
        select(InquiryGroup).where(
            InquiryGroup.id == group_id,
            InquiryGroup.user_id == current_user.id
        )
    )).scalar_one_or_none()

    if not group:
        raise HTTPException(detail="Inquiry not found", status_code=404)

    if group.status != "PENDING":
        raise HTTPException(status_code=400, detail="Cannot modify inquiry not in PENDING status")

    item = (await db.execute(
        select(InquiryItem).where(
            InquiryItem.id == item_id,
            InquiryItem.group_id == group_id
        )
    )).scalar_one_or_none()

    if not item:
        raise HTTPException(404)

    await db.delete(item)
    await db.commit()


@router.post("/my/{group_id}/reorder", response_model=InquiryGroupResponse, status_code=status.HTTP_201_CREATED)
async def reorder_inquiry(
    group_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reorder an inquiry (create a new inquiry with the same items).
    """

    stmt = (
        select(InquiryGroup)
        .options(selectinload(InquiryGroup.items))
        .where(
            InquiryGroup.id == group_id,
            InquiryGroup.user_id == current_user.id
        )
    )

    result = await db.execute(stmt)
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )

    new_group = InquiryGroup(
        user_id=current_user.id,
        status="PENDING"
    )

    db.add(new_group)
    await db.flush()

    for item in group.items:

        item_schema = InquiryItemCreate(
            product_id=item.product_id,
            subproduct_id=item.subproduct_id,
            service_id=item.service_id,
            subservice_id=item.subservice_id,
            quantity=item.quantity,
            selected_options=item.selected_options,
            notes=item.notes,
            images=item.images
        )

        estimated_price = await calculate_item_estimated_price(
            item_schema,
            db
        )

        new_item = InquiryItem(
            group_id=new_group.id,
            product_id=item.product_id,
            subproduct_id=item.subproduct_id,
            service_id=item.service_id,
            subservice_id=item.subservice_id,
            quantity=item.quantity,
            selected_options=item.selected_options,
            notes=item.notes,
            images=item.images,
            estimated_price=estimated_price
        )

        db.add(new_item)

    await db.commit()

    stmt = (
        select(InquiryGroup)
        .options(
            selectinload(InquiryGroup.items),
            selectinload(InquiryGroup.messages)
        )
        .where(InquiryGroup.id == new_group.id)
    )

    result = await db.execute(stmt)

    return result.scalar_one()


@router.patch("/my/{group_id}/status", response_model=InquiryGroupResponse)
async def update_inquiry_status_user(
    group_id: UUID,
    status_update: InquiryStatusUpdate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update inquiry status based on allowed user transitions.
    """
    stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items),
        selectinload(InquiryGroup.messages)
    ).where(
        InquiryGroup.id == group_id,
        InquiryGroup.user_id == current_user.id
    )
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    
    try:
        current_enum = InquiryStatus(group.status)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid status in DB")
        
    allowed_transitions = USER_ALLOWED_TRANSITIONS.get(current_enum, [])
    
    if status_update.status not in allowed_transitions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User cannot transition inquiry from {group.status} to {status_update.status.value}"
        )
    
    group.status = status_update.status.value
    await db.commit()
    
    # Fire SSE to admin
    from app.core.sse import sse_manager
    import asyncio
    asyncio.create_task(
        sse_manager.publish_to_admins("admin_inquiry_updated", {
            "inquiry_id": str(group.id),
            "status": group.status,
            "message": f"User updated inquiry status to {group.status}"
        })
    )
    
    # Re-fetch the fully loaded group with relationships after commit
    fetch_stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items),
        selectinload(InquiryGroup.messages)
    ).where(InquiryGroup.id == group_id)
    
    refreshed_result = await db.execute(fetch_stmt)
    refreshed_group = refreshed_result.scalar_one()
    
    if group.status == 'ACCEPTED':
        # Ensure order doesn't already exist to be safe
        existing_stmt = select(Order).where(Order.inquiry_id == group.id)
        existing_order = (await db.execute(existing_stmt)).scalar_one_or_none()
        
        if not existing_order:
            # Enforce split_type options for user acceptance: FULL or HALF
            split_type = status_update.split_type or PaymentSplitType.FULL
            if split_type not in [PaymentSplitType.FULL, PaymentSplitType.HALF, PaymentSplitType.CUSTOM]:
                # If they send an invalid split type, fallback to HALF
                split_type = PaymentSplitType.HALF
            
            new_order = Order(
                inquiry_id=group.id,
                user_id=group.user_id,
                total_amount=group.total_quoted_price,
                status="WAITING_PAYMENT"
            )
            db.add(new_order)
            await db.flush() # flush to get new_order.id
            
            total = group.total_quoted_price
            milestones = []
            
            if total == 0:
                new_order.status = "PAID"
                milestones.append(OrderMilestone(
                    order_id=new_order.id, label="Zero Cost Order (100%)", amount=0.0, percentage=100.0, order_index=1, is_paid=True
                ))
            else:
                if split_type == PaymentSplitType.FULL:
                    milestones.append(OrderMilestone(
                        order_id=new_order.id, label="Full Payment (100%)", amount=total, percentage=100.0, order_index=1
                    ))
                elif split_type == PaymentSplitType.HALF:
                    milestones.append(OrderMilestone(
                        order_id=new_order.id, label="Advance Payment (50%)", amount=total * 0.5, percentage=50.0, order_index=1
                    ))
                    milestones.append(OrderMilestone(
                        order_id=new_order.id, label="Balance Before Dispatch (50%)", amount=total * 0.5, percentage=50.0, order_index=2
                    ))
                elif split_type == PaymentSplitType.CUSTOM and status_update.custom_percentages:
                    if abs(sum(status_update.custom_percentages) - 100.0) > 0.1:
                        raise HTTPException(status_code=400, detail="Custom percentages must sum to 100")
                    
                    for i, pct in enumerate(status_update.custom_percentages):
                        m_amount = (total * pct) / 100.0
                        milestones.append(OrderMilestone(
                            order_id=new_order.id, label=f"Custom Milestone {i+1} ({pct}%)", amount=m_amount, percentage=pct, order_index=i+1
                        ))
                else: 
                    # Default if CUSTOM but no percentages
                    milestones.append(OrderMilestone(
                        order_id=new_order.id, label="Full Payment (100%)", amount=total, percentage=100.0, order_index=1
                    ))
            
            db.add_all(milestones)
            await db.commit()
    
    return refreshed_group
    

@router.delete("/my/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_inquiry(
    group_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an inquiry cart (only if PENDING status).
    """
    stmt = select(InquiryGroup).where(
        InquiryGroup.id == group_id,
        InquiryGroup.user_id == current_user.id
    )
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    if group.status != 'PENDING':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only delete inquiries with PENDING status"
        )
    
    # The database will automatically delete associated Items and Messages via ON DELETE CASCADE
    await db.execute(delete(InquiryGroup).where(InquiryGroup.id == group_id))
    await db.commit()

# ==================== MESSAGING ENDPOINTS ====================

@router.post("/my/{group_id}/messages", response_model=InquiryMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_inquiry_message(
    group_id: UUID,
    message: InquiryMessageCreate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a message in the overall inquiry thread.
    """
    stmt = select(InquiryGroup).where(
        InquiryGroup.id == group_id,
        InquiryGroup.user_id == current_user.id
    )
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

    # Create persistent notification for admins
    await NotificationService.notify_admins(
        db,
        title="New User Message",
        message=f"User sent a message in inquiry #{str(group_id)[:8].upper()}",
        metadata={"type": "inquiry_message", "id": str(group_id)}
    )

    await db.commit()
    await db.refresh(new_message)

    # Notify admin
    from app.core.sse import sse_manager
    from app.core.websockets import ws_manager
    import asyncio
    asyncio.create_task(
        sse_manager.publish_to_admins("admin_inquiry_new_message", {
            "inquiry_id": str(group_id),
            "sender_id": str(current_user.id),
            "message": "New message from user in inquiry thread."
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


@router.post("/direct-checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def direct_checkout_zero_cost(
    item_data: InquiryItemCreate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Directly create an order for a 0-priced product (like free digital services).
    Bypasses the normal inquiry process. Auto-creates the inquiry as ACCEPTED and order as PAID.
    """
    # 1. First, validate it's actually 0 cost
    estimated_price = await calculate_item_estimated_price(item_data, db)
    
    if estimated_price > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Direct checkout is only available for zero-cost products. Please submit a normal inquiry."
        )

    # 2. Create the accepted inquiry group
    new_group = InquiryGroup(
        user_id=current_user.id,
        status='ACCEPTED',
        total_quoted_price=0.0
    )
    db.add(new_group)
    await db.flush()

    # 3. Add the item
    new_item = InquiryItem(
        group_id=new_group.id,
        product_id=item_data.product_id,
        subproduct_id=item_data.subproduct_id,
        service_id=item_data.service_id,
        subservice_id=item_data.subservice_id,
        quantity=item_data.quantity,
        selected_options=item_data.selected_options,
        notes=item_data.notes,
        images=item_data.images,
        estimated_price=0.0,
        line_item_price=0.0
    )
    db.add(new_item)
    await db.flush()

    # 4. Create the corresponding Order directly
    from app.modules.orders.models import Order, OrderMilestone
    new_order = Order(
        inquiry_id=new_group.id,
        user_id=new_group.user_id,
        total_amount=0.0,
        amount_paid=0.0,
        status="PAID"
    )
    db.add(new_order)
    await db.flush()

    # 5. Add a paid milestone
    milestone = OrderMilestone(
        order_id=new_order.id,
        label="Zero Cost Item (100%)",
        amount=0.0,
        percentage=100.0,
        order_index=1,
        is_paid=True
    )
    db.add(milestone)
    await db.commit()

    # 6. Fetch fully populated Order
    fetch_stmt = select(Order).options(
        selectinload(Order.transactions),
        selectinload(Order.milestones)
    ).where(Order.id == new_order.id)
    
    return (await db.execute(fetch_stmt)).scalar_one()

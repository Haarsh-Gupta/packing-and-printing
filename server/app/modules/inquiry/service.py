from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.services.models import SubService
from app.modules.products.models import SubProduct
from app.modules.inquiry.schemas import InquiryItemCreate


async def calculate_item_estimated_price(item: InquiryItemCreate, db: AsyncSession) -> float:
    estimated_price = 0.0

    if item.subservice_id:
        sub_service = (await db.execute(
            select(SubService).where(SubService.id == item.subservice_id)
        )).scalar_one_or_none()
        if not sub_service:
            raise HTTPException(404, f"SubService {item.subservice_id} not found")
        if not sub_service.is_active:
            raise HTTPException(400, "This service is currently unavailable")
        if item.quantity < sub_service.minimum_quantity:
            raise HTTPException(400, f"Minimum quantity for '{sub_service.name}' is {sub_service.minimum_quantity}")
        estimated_price = sub_service.price_per_unit

    elif item.subproduct_id:
        sub_product = (await db.execute(
            select(SubProduct).where(SubProduct.id == item.subproduct_id)
        )).scalar_one_or_none()
        if not sub_product:
            raise HTTPException(404, f"SubProduct {item.subproduct_id} not found")
        if not sub_product.is_active:
            raise HTTPException(400, "This product is currently unavailable")
        if item.quantity < sub_product.minimum_quantity:
            raise HTTPException(400, f"Minimum quantity for '{sub_product.name}' is {sub_product.minimum_quantity}")

        base_price = sub_product.base_price
        if item.selected_options and sub_product.config_schema:
            config = sub_product.config_schema
            sections_map = {
                s["key"]: s
                for s in (config.get("sections", []) if isinstance(config, dict) else [])
                if isinstance(s, dict) and "key" in s
            }
            for key, val in item.selected_options.items():
                if key not in sections_map:
                    raise HTTPException(400, f"Invalid option category: {key}")
                section = sections_map[key]
                if section.get("type") in ["dropdown", "radio"]:
                    opts = {str(o["value"]): float(o.get("price_mod", 0)) for o in section.get("options", []) if isinstance(o, dict)}
                    
                    if section.get("type") == "dropdown":
                        val_list = val if isinstance(val, list) else [val]
                        for v in val_list:
                            if str(v) not in opts:
                                raise HTTPException(400, f"Invalid value '{v}' for '{key}'")
                            base_price += opts[str(v)]
                    else:
                        if str(val) not in opts:
                            raise HTTPException(400, f"Invalid value '{val}' for '{key}'")
                        base_price += opts[str(val)]
                elif section.get("type") == "number_input":
                    try:
                        base_price += float(val or 0) * float(section.get("price_per_unit", 0))
                    except (ValueError, TypeError):
                        pass
        estimated_price = base_price

    return estimated_price


import logging
from app.modules.orders.models import Order, OrderMilestone
from app.modules.inquiry.models import InquiryGroup

logger = logging.getLogger(__name__)

async def convert_inquiry_to_order(db: AsyncSession, group: InquiryGroup) -> Order | None:
    """
    Centralized service to convert an accepted inquiry to an order.
    Idempotent: returns the existing order if it's already converted.
    """
    logger.info(f"Attempting to convert Inquiry {group.id} to Order")

    # 1. Check if Order already exists
    existing_stmt = select(Order).where(Order.inquiry_id == group.id)
    existing_order = (await db.execute(existing_stmt)).scalar_one_or_none()
        
    if existing_order:
        logger.info(f"Order {existing_order.id} already exists for Inquiry {group.id}")
        return existing_order

    # 2. Validate active quote
    if not group.active_quote:
        logger.error(f"Cannot convert Inquiry {group.id}: No active quote found")
        raise HTTPException(status_code=400, detail="No active quote found on this inquiry")
    
    quoted_total = group.active_quote.total_price

    # 3. Create Order
    new_order = Order(
        inquiry_id=group.id,
        user_id=group.user_id,
        total_amount=quoted_total,
        tax_amount=group.active_quote.tax_amount or 0.0,
        shipping_amount=group.active_quote.shipping_amount or 0.0,
        discount_amount=group.active_quote.discount_amount or 0.0,
        status="WAITING_PAYMENT"
    )
    db.add(new_order)
    await db.flush()  # To generate order.id
    
    # 4. Create Milestones based on quote configuration
    quote_milestones = group.active_quote.milestones or []
    
    if quoted_total == 0:
        new_order.status = "PAID"
        milestone = OrderMilestone(
            order_id=new_order.id, 
            label="Zero Cost Order (100%)", 
            amount=0.0, 
            percentage=100.0, 
            order_index=1,
            status="PAID"
        )
        db.add(milestone)
    else:
        # Fallback if no milestones exist in quote
        if not quote_milestones:
            quote_milestones = [
                {"label": "Advance Payment (50%)", "percentage": 50.0},
                {"label": "Balance Before Dispatch (50%)", "percentage": 50.0}
            ]
            
        for idx, m_def in enumerate(quote_milestones, start=1):
            pct = float(m_def.get("percentage", 100.0))
            amt = quoted_total * (pct / 100.0)
            
            milestone = OrderMilestone(
                order_id=new_order.id, 
                label=m_def.get("label", f"Payment {idx}"), 
                amount=amt, 
                percentage=pct, 
                order_index=idx,
                status="UNPAID"
            )
            db.add(milestone)
            
    await db.flush()
    logger.info(f"Successfully converted Inquiry {group.id} to Order {new_order.id}")
    return new_order
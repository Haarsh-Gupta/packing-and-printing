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
        estimated_price = sub_service.price_per_unit * item.quantity

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
                    if str(val) not in opts:
                        raise HTTPException(400, f"Invalid value '{val}' for '{key}'")
                    base_price += opts[str(val)]
                elif section.get("type") == "number_input":
                    try:
                        base_price += float(val or 0) * float(section.get("price_per_unit", 0))
                    except (ValueError, TypeError):
                        pass
        estimated_price = base_price * item.quantity

    return estimated_price
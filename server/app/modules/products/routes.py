from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from sqlalchemy.orm import selectinload

# Adjust these imports based on your actual project structure
from app.core.database import get_db
from app.modules.auth.auth import get_current_admin_user
from app.modules.users.models import User
from app.modules.products.models import Product, SubProduct
from app.modules.products.schemas import (
    ProductCreate, ProductUpdate, ProductResponse,
    SubProductCreate, SubProductUpdate, SubProductResponse
)

router = APIRouter()

@router.get("/", response_model=list[ProductResponse])
async def get_products(skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_db)):
    """Returns a list of main categories, including their nested sub-products."""
    # selectinload automatically fetches the related sub_products to prevent N+1 query issues
    stmt = select(Product).where(Product.is_active == True).options(selectinload(Product.sub_products)).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{slug}", response_model=ProductResponse)
async def get_product(slug: str, db: AsyncSession = Depends(get_db)):
    """Fetches a specific category and all its available sub-products."""
    stmt = select(Product).where(Product.slug == slug, Product.is_active == True).options(selectinload(Product.sub_products))
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product category not found")
    return product


# ==========================================
# 2. SUBPRODUCT ENDPOINTS (Specific Items)
# ==========================================

@router.get("/sub-products/{sub_product_slug}", response_model=SubProductResponse)
async def get_sub_product(sub_product_slug: str, db: AsyncSession = Depends(get_db)):
    """Fetches the specific configuration for a sub-product. The frontend uses this to build the dynamic form."""
    stmt = select(SubProduct).where(SubProduct.slug == sub_product_slug, SubProduct.is_active == True)
    result = await db.execute(stmt)
    sub_product = result.scalar_one_or_none()

    if not sub_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SubProduct not found")
    return sub_product


@router.get("/{product_slug}/sub-products", response_model=list[SubProductResponse])
async def get_sub_products_by_product(product_slug: str, db: AsyncSession = Depends(get_db)):
    """Fetches all sub-products of a specific product."""
    stmt = (
        select(SubProduct)
        .join(Product, SubProduct.product_id == Product.id) 
        .where(
            Product.slug == product_slug,  # Look up by the PARENT'S slug
            SubProduct.is_active == True   # Only get active sub-products
        )
    )
    result = await db.execute(stmt)
    sub_products = result.scalars().all()

    if not sub_products:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SubProduct not found")
    return sub_products
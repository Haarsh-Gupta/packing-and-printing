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

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate, 
    current_user: User = Depends(get_current_admin_user), 
    db: AsyncSession = Depends(get_db)
):
    """Admin creates a new main category (e.g., 'Corporate Diaries')."""
    stmt = select(Product).where(Product.slug == product_data.slug)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product slug already exists")
    
    new_product = Product(**product_data.model_dump())
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return new_product

@router.patch("/{slug}", response_model=ProductResponse)
async def update_product(
    slug: str, 
    update_data: ProductUpdate, 
    current_user: User = Depends(get_current_admin_user), 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).where(Product.slug == slug)
    result = await db.execute(stmt)
    db_product = result.scalar_one_or_none() 

    if not db_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(db_product, key, value)
    
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product

@router.delete("/admin/products/{slug}")
async def delete_product(
    slug: str, 
    current_user: User = Depends(get_current_admin_user), 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).where(Product.slug == slug)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    # This will cascade and delete all related SubProducts as well
    await db.execute(delete(Product).where(Product.slug == slug))
    await db.commit()
    return {"message": "Product and all related sub-products deleted successfully"}

# ====================sub-product endpoints========================

@router.post("/{slug}/sub-products", response_model=SubProductResponse, status_code=status.HTTP_201_CREATED)
async def create_sub_product(
    sub_product_data: SubProductCreate, 
    current_user: User = Depends(get_current_admin_user), 
    db: AsyncSession = Depends(get_db)
):
    """Admin creates a specific item with the JSON config (e.g., 'PU Leather Diary')."""
    # Verify Parent Product exists
    parent_stmt = select(Product).where(Product.id == sub_product_data.product_id)
    parent_result = await db.execute(parent_stmt)
    if not parent_result.scalar_one_or_none():
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent product ID does not exist")

    # Check for slug collision
    stmt = select(SubProduct).where(SubProduct.slug == sub_product_data.slug)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SubProduct slug already exists")
    
    new_sub_product = SubProduct(**sub_product_data.model_dump())
    db.add(new_sub_product)
    await db.commit()
    await db.refresh(new_sub_product)
    return new_sub_product


@router.put("sub-products/{slug}", response_model=SubProductResponse)
async def update_sub_product(
    slug: str, 
    update_data: SubProductUpdate, 
    current_user: User = Depends(get_current_admin_user), 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SubProduct).where(SubProduct.slug == slug)
    result = await db.execute(stmt)
    db_sub_product = result.scalar_one_or_none() 

    if not db_sub_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SubProduct not found")

    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(db_sub_product, key, value)
    
    db.add(db_sub_product)
    await db.commit()
    await db.refresh(db_sub_product)
    return db_sub_product

@router.delete("sub-products/{slug}")
async def delete_sub_product(
    slug: str, 
    current_user: User = Depends(get_current_admin_user), 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SubProduct).where(SubProduct.slug == slug)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SubProduct not found")
    
    await db.execute(delete(SubProduct).where(SubProduct.slug == slug))
    await db.commit()
    return {"message": "SubProduct deleted successfully"}
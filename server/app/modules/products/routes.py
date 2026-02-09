from fastapi import APIRouter , Depends , HTTPException , status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import get_db
from app.modules.auth.auth import get_current_active_user
from app.modules.users.models import User
from app.modules.products.models import ProductTemplate
from app.modules.products.schemas import ProductTemplateCreate , ProductTemplateUpdate


router = APIRouter()

@router.post("/admin" , status_code=status.HTTP_201_CREATED)
async def create_product_template(template : ProductTemplateCreate , current_user : User = Depends(get_current_active_user) , db : AsyncSession = Depends(get_db)):
    """
    Creates a new Product Template with the complex JSON config.
    """

    stmt = select(ProductTemplate).where(ProductTemplate.slug == template.slug)
    result = await db.execute(stmt)

    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail="Template already exists")
    
    new_template = ProductTemplate(**template.model_dump())

    db.add(new_template)
    await db.commit()
    await db.refresh(new_template)
    return new_template


@router.get("/admin")
async def get_product_templates(skip : int = 0 , limit : int = 10 , db : AsyncSession = Depends(get_db)):
    """
    Returns a list of available products.
    """
    stmt = select(ProductTemplate).where(ProductTemplate.is_active == True).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{slug}")
async def get_product_template(slug : str , db : AsyncSession = Depends(get_db)):
    """
    Fetches the specific configuration for a product (e.g., 'notebook-a5').
    Frontend uses this to build the form.
    """
    stmt = select(ProductTemplate).where(ProductTemplate.slug == slug , ProductTemplate.is_active == True)
    result = await db.execute(stmt)
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail="Template not found")
    
    return template


@router.put("/{slug}")
async def update_product_template(slug: str, template_data: ProductTemplateUpdate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):

    stmt = select(ProductTemplate).where(ProductTemplate.slug == slug)
    result = await db.execute(stmt)
    db_template = result.scalar_one_or_none() 

    if not db_template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")


    update_data = template_data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_template, key, value)
    
    db.add(db_template)
    await db.commit()
    await db.refresh(db_template)
    return db_template


@router.delete("/admin/{slug}")
async def delete_product_template(slug : str , current_user : User = Depends(get_current_active_user) , db : AsyncSession = Depends(get_db)):
    stmt = select(ProductTemplate).where(ProductTemplate.slug == slug)
    result = await db.execute(stmt)
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail="Template not found")
    
    await db.execute(delete(ProductTemplate).where(ProductTemplate.slug == slug))
    await db.commit()
    return {"message" : "Template deleted successfully"}

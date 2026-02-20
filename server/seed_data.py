import asyncio
import sys
import os

# Add server directory to path
sys.path.append(os.getcwd())

from sqlalchemy import select, text
from app.core.database import AsyncSessionLocal
from app.modules.users.models import User
from app.modules.products.models import ProductTemplate
from app.modules.inquiry.models import Inquiry
from app.modules.orders.models import Order
from app.modules.auth.auth import get_password_hash

async def seed():
    async with AsyncSessionLocal() as db:
        print("Checking 'type' column...")
        try:
            # Try to select the column to see if it exists
            await db.execute(text("SELECT type FROM product_templates LIMIT 1"))
            print("Column 'type' exists.")
        except Exception:
            print("Column 'type' missing. Adding it...")
            await db.rollback() # Clear error state
            try:
                await db.execute(text("ALTER TABLE product_templates ADD COLUMN type VARCHAR DEFAULT 'product'"))
                await db.commit()
                print("Column 'type' added.")
            except Exception as e:
                print(f"Failed to add column 'type': {e}")
                await db.rollback()

        # 1. Create Test User
        print("Checking users...")
        result = await db.execute(select(User).where(User.email == "test@example.com"))
        user = result.scalar_one_or_none()
        
        if not user:
            print("Creating test user...")
            hashed_pw = get_password_hash("password123")
            user = User(
                email="test@example.com",
                name="Test User",
                hashed_password=hashed_pw,
                is_active=True,
                is_admin=False
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            print(f"Created user: {user.email} (password123)")
        else:
            print(f"User already exists: {user.email}")

        # 2. Create Products & Services
        print("Checking products...")
        # Check if we have any products
        result = await db.execute(select(ProductTemplate))
        products = result.scalars().all()
        
        if not products:
            print("Seeding products and services...")
            templates = [
                ProductTemplate(
                    slug="business-cards",
                    name="Premium Business Cards",
                    base_price=500.0,
                    minimum_quantity=100,
                    type="product",
                    config_schema={"sections": []}, # Simplified for seed
                    images=["https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop"]
                ),
                ProductTemplate(
                    slug="flyers-a5",
                    name="A5 Marketing Flyers",
                    base_price=1200.0,
                    minimum_quantity=500,
                    type="product",
                    config_schema={"sections": []},
                    images=["https://images.unsplash.com/photo-1586075010923-2dd45eeed858?q=80&w=800&auto=format&fit=crop"]
                ),
                ProductTemplate(
                    slug="design-consultation",
                    name="Design Consultation",
                    base_price=2000.0,
                    minimum_quantity=1,
                    type="service",
                    config_schema={"sections": []},
                    images=["https://images.unsplash.com/photo-1572044162444-ad6021105507?q=80&w=800&auto=format&fit=crop"]
                ),
                ProductTemplate(
                    slug="3d-mockup",
                    name="3D Packaging Mockup",
                    base_price=3500.0,
                    minimum_quantity=1,
                    type="service",
                    config_schema={"sections": []},
                     images=["https://images.unsplash.com/photo-1633409361618-c73427e4e206?q=80&w=800&auto=format&fit=crop"]
                )
            ]
            db.add_all(templates)
            await db.commit()
            print("Seeded products and services.")
        
        # Reload products to get IDs
        result = await db.execute(select(ProductTemplate))
        products = result.scalars().all()
        product_map = {p.slug: p for p in products}

        # 3. Create Inquiries
        print("Checking inquiries...")
        result = await db.execute(select(Inquiry).where(Inquiry.user_id == user.id))
        inquiries = result.scalars().all()
        
        if not inquiries:
            print("Seeding inquiries...")
            inqs = [
                Inquiry(
                    user_id=user.id,
                    template_id=product_map["business-cards"].id,
                    quantity=500,
                    selected_options={"paper": "matte", "corners": "rounded"},
                    status="PENDING"
                ),
                Inquiry(
                    user_id=user.id,
                    template_id=product_map["flyers-a5"].id,
                    quantity=2000,
                    selected_options={"paper": "glossy"},
                    status="QUOTED",
                    quoted_price=4500.0,
                    admin_notes="Includes folding."
                ),
                 Inquiry(
                    user_id=user.id,
                    template_id=product_map["3d-mockup"].id,
                    quantity=1,
                    selected_options={"format": "obj"},
                    status="ACCEPTED",
                    quoted_price=3500.0
                )
            ]
            db.add_all(inqs)
            await db.commit()
            print("Seeded inquiries.")
            
            # Reload inquiries to get IDs
            result = await db.execute(select(Inquiry).where(Inquiry.user_id == user.id))
            inquiries = result.scalars().all()

        # 4. Create Orders
        print("Checking orders...")
        result = await db.execute(select(Order).where(Order.user_id == user.id))
        orders = result.scalars().all()
        
        accepted_inq = next((i for i in inquiries if i.status == "ACCEPTED"), None)
        
        if not orders and accepted_inq:
            print("Seeding order...")
            order = Order(
                inquiry_id=accepted_inq.id,
                user_id=user.id,
                total_amount=accepted_inq.quoted_price,
                amount_paid=0.0,
                status="WAITING_PAYMENT"
            )
            db.add(order)
            await db.commit()
            print("Seeded order.")

if __name__ == "__main__":
    asyncio.run(seed())

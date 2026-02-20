from sqlalchemy import select, text
from app.core.database import AsyncSessionLocal
from app.modules.users.models import User
from app.modules.products.models import ProductTemplate
from app.modules.services.models import Service, ServiceVariant
from app.modules.inquiry.models import Inquiry
from app.modules.orders.models import Order
from app.modules.auth.auth import get_password_hash

async def seed_db():
    print("--- SEEDING DB ---")
    try:
        async with AsyncSessionLocal() as db:
            print("Checking 'type' column...")
            try:
                # Try to select the column to see if it exists
                # We interpret the error to mean the column is missing specific to Postgres
                await db.execute(text("SELECT type FROM product_templates LIMIT 1"))
                print("Column 'type' exists.")
            except Exception as e:
                print(f"Column check failed (assuming missing): {e}")
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
                hashed_pw = await get_password_hash("password123")
                user = User(
                    email="test@example.com",
                    name="Test User",
                    password=hashed_pw,
                    admin=False
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
                print(f"Created user: {user.email} (password123)")
            else:
                print(f"User already exists: {user.email}")

            # 2. Create Products & Services
            print("Checking products...")
            templates_data = [
                {
                    "slug": "business-cards",
                    "name": "Premium Business Cards",
                    "base_price": 500.0,
                    "minimum_quantity": 100,
                    "type": "product",
                    "config_schema": {
                        "sections": [
                            {
                                "key": "paper_type",
                                "label": "Paper Type",
                                "type": "radio",
                                "options": [
                                    {"label": "Standard 300gsm", "value": "standard", "price_mod": 0},
                                    {"label": "Premium Matte", "value": "matte", "price_mod": 150},
                                    {"label": "Premium Glossy", "value": "glossy", "price_mod": 150}
                                ]
                            },
                            {
                                "key": "corners",
                                "label": "Corner Style",
                                "type": "dropdown",
                                "options": [
                                    {"label": "Square", "value": "square", "price_mod": 0},
                                    {"label": "Rounded", "value": "rounded", "price_mod": 200}
                                ]
                            }
                        ]
                    },
                    "images": ["https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop"]
                },
                {
                    "slug": "flyers-a5",
                    "name": "A5 Marketing Flyers",
                    "base_price": 1200.0,
                    "minimum_quantity": 500,
                    "type": "product",
                    "config_schema": {
                        "sections": [
                            {
                                "key": "paper_weight",
                                "label": "Paper Weight",
                                "type": "radio",
                                "options": [
                                    {"label": "130gsm (Standard)", "value": "130", "price_mod": 0},
                                    {"label": "170gsm (Heavy)", "value": "170", "price_mod": 300}
                                ]
                            },
                            {
                                "key": "finish",
                                "label": "Finish",
                                "type": "dropdown",
                                "options": [
                                    {"label": "No Coating", "value": "none", "price_mod": 0},
                                    {"label": "UV Coated", "value": "uv", "price_mod": 500}
                                ]
                            }
                        ]
                    },
                    "images": ["https://images.unsplash.com/photo-1586075010923-2dd45eeed858?q=80&w=800&auto=format&fit=crop"]
                },
                {
                    "slug": "design-consultation",
                    "name": "Design Consultation",
                    "base_price": 2000.0,
                    "minimum_quantity": 1,
                    "type": "service",
                    "config_schema": {"sections": []},
                    "images": ["https://images.unsplash.com/photo-1572044162444-ad6021105507?q=80&w=800&auto=format&fit=crop"]
                },
                {
                    "slug": "3d-mockup",
                    "name": "3D Packaging Mockup",
                    "base_price": 3500.0,
                    "minimum_quantity": 1,
                    "type": "service",
                    "config_schema": {"sections": []},
                    "images": ["https://images.unsplash.com/photo-1633409361618-c73427e4e206?q=80&w=800&auto=format&fit=crop"]
                }
            ]

            for data in templates_data:
                res = await db.execute(select(ProductTemplate).where(ProductTemplate.slug == data["slug"]))
                existing = res.scalar_one_or_none()
                if existing:
                    print(f"Updating template: {data['slug']}")
                    existing.config_schema = data["config_schema"]
                    existing.images = data["images"]
                    existing.base_price = data["base_price"]
                else:
                    print(f"Creating template: {data['slug']}")
                    db.add(ProductTemplate(**data))
            
            await db.commit()
            print("Product seeding/update complete.")
            
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

            # 5. Create Dedicated Services (New Module)
            print("Checking dedicated services...")
            services_data = [
                {
                    "name": "Professional Graphic Design",
                    "slug": "graphic-design",
                    "variants": [
                        {"name": "Logo Design", "slug": "logo-design", "base_price": 2000.0, "price_per_unit": 0.0, "description": "Custom logo concepts with revisions."},
                        {"name": "Brochure Layout", "slug": "brochure-layout", "base_price": 1500.0, "price_per_unit": 50.0, "description": "Layout design per page."},
                    ]
                },
                {
                    "name": "3D Structural Prototyping",
                    "slug": "3d-prototyping",
                    "variants": [
                        {"name": "Box Mockup", "slug": "box-mockup", "base_price": 1000.0, "price_per_unit": 0.0, "description": "Digital 3D render of your packaging."},
                        {"name": "Physical Sample", "slug": "physical-sample", "base_price": 500.0, "price_per_unit": 200.0, "description": "One-off physical CAD-cut sample."},
                    ]
                }
            ]

            for s_data in services_data:
                res = await db.execute(select(Service).where(Service.slug == s_data["slug"]))
                existing_s = res.scalar_one_or_none()
                if not existing_s:
                    print(f"Creating service: {s_data['slug']}")
                    new_service = Service(name=s_data["name"], slug=s_data["slug"])
                    db.add(new_service)
                    await db.flush()
                    
                    for v_data in s_data["variants"]:
                        new_variant = ServiceVariant(**v_data, service_id=new_service.id)
                        db.add(new_variant)
            
            await db.commit()
            print("Seeded dedicated services.")
    except Exception as e:
        print(f"SEEDING FAILED: {e}")
    
    print("--- SEEDING COMPLETE ---")


import asyncio
import os
import sys

# Add parent directory to path so we can import 'app'
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))

from app.core.database import async_session_maker
from app.modules.products.models import ProductTemplate

async def create_sample_product():
    async with async_session_maker() as db:
        # Check if product exists
        from sqlalchemy import select
        stmt = select(ProductTemplate).where(ProductTemplate.slug == "premium-diary-2026")
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            print("Product already exists!")
            return

        # Create new product
        schema = {
            "sections": [
                {
                    "key": "size",
                    "label": "Select Diary Size",
                    "type": "dropdown",
                    "options": [
                        { "label": "A5 (Standard)", "value": "a5", "price_mod": 0.0 },
                        { "label": "A4 (Executive)", "value": "a4", "price_mod": 100.0 }
                    ]
                }
            ]
        }

        new_product = ProductTemplate(
            slug="premium-diary-2026",
            name="Premium Corporate Diary 2026",
            base_price=250.0,
            minimum_quantity=50,
            config_schema=schema,
            is_active=True,
            images=["https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=2000"]
        )

        db.add(new_product)
        await db.commit()
        print("Sample product created successfully!")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(create_sample_product())

import logging
import asyncio
from app.core.database import AsyncSessionLocal
from sqlalchemy import select, update
from app.modules.users.models import User

logging.basicConfig(level=logging.INFO)

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        for u in result.scalars():
            print(f'User {u.email}: admin={u.admin}')
            if not u.admin:
                u.admin = True
                print(f'Updated {u.email} to admin')
        await session.commit()

asyncio.run(main())

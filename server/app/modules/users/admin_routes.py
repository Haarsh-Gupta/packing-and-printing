from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, or_

from app.modules.users.schemas import UserOut
from app.modules.users.models import User
from app.core.database import get_db
from app.modules.auth import get_current_admin_user
from app.core.redis import redis_client

router = APIRouter()

@router.get("/online")
async def get_online_users_and_count(
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """[ADMIN] Get an exact count and list of currently online users. Merges SSE/WS tracking and HTTP tracking."""
    import time
    
    # 1. Clean up stale SSE connections (older than 35s since last heartbeat)
    cutoff = time.time() - 35
    await redis_client.zremrangebyscore("active_users", "-inf", cutoff)
    
    # 2. Get SSE online users
    sse_active_ids = await redis_client.zrange("active_users", 0, -1)
    
    # 3. Get HTTP active users (from middleware, TTL 5 mins)
    cursor = 0
    http_active_ids = set()
    while True:
        cursor, keys = await redis_client.scan(cursor=cursor, match="user_active:*", count=100)
        for key in keys:
             user_id_str = key.replace("user_active:", "")
             http_active_ids.add(user_id_str)
        if cursor == 0:
            break
             
    # Union both tracking sources
    all_online_ids = list(set(sse_active_ids) | http_active_ids)
    
    if not all_online_ids:
        return {"count": 0, "users": []}
        
    stmt = select(User).where(User.id.in_(all_online_ids))
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    return {
        "count": len(users),
        "users": [
            {
                "id": str(u.id), 
                "name": u.name, 
                "email": u.email, 
                "is_active": u.is_active, 
                "role": "admin" if u.admin else "user"
            } for u in users
        ]
    }

@router.get("/all" , response_model=list[UserOut])
async def get_all_users(
    query : Optional[str] = None,
    admin : Optional[bool] = None,
    db : AsyncSession = Depends(get_db) , 
    current_user : User = Depends(get_current_admin_user),
    is_active : Optional[bool] = None
    ):
    
    stmt = select(User)
    if admin is not None:
        stmt = stmt.where(User.admin == admin)
    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)
    if query:
        stmt = stmt.where(or_(
            User.name.ilike(f"%{query}%"),
            User.email.ilike(f"%{query}%"),
            User.phone.ilike(f"%{query}%")
        ))
    
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    # Check online status for all users in parallel
    for user in users:
        is_online = await redis_client.get(f"user_active:{user.id}")
        user.is_online = bool(is_online)
        
    return users

@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    is_online = await redis_client.get(f"user_active:{user.id}")
    user.is_online = bool(is_online)
    
    return user

@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def soft_delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    stmt = update(User).where(User.id == user_id).values(is_active=False)
    await db.execute(stmt)
    await db.commit()
    return {"detail": "User deleted successfully"}


@router.delete("/hard-delete/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()
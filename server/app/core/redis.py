import redis.asyncio as redis
from fastapi import HTTPException, status
from app.core.config import settings


# Global redis connection pool
redis_client: redis.Redis | None = None


async def init_redis() -> redis.Redis | None:
    """Initialize the Redis connection pool."""
    global redis_client
    try:
        redis_client = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            password=settings.redis_password or None,
            db=0,
            decode_responses=True
        )
        # Test connection
        await redis_client.ping()
        print(f"✅ Connected to Redis at {settings.redis_host}:{settings.redis_port}")
        return redis_client
    except (redis.ConnectionError, ConnectionRefusedError, OSError) as e:
        print(f"⚠️  Could not connect to Redis at {settings.redis_host}:{settings.redis_port}: {e}")
        print("⚠️  OTP registration will NOT work until Redis is running.")
        redis_client = None
        return None


async def close_redis():
    """Close the Redis connection pool."""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None
        print("Redis connection closed")


async def get_redis() -> redis.Redis:
    """Dependency to get the Redis client."""
    if redis_client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redis is not available. Please ensure Redis is running and restart the server."
        )
    return redis_client


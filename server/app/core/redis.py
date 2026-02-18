# ===========================================================================
# Redis Client Configuration
# ===========================================================================
# This module uses the standard `redis` Python package (redis-py) which speaks
# the Redis protocol.
#
# VENDOR SWAPPING (e.g. Upstash, AWS ElastiCache, Aiven):
#   Upstash and most managed Redis providers are wire-compatible with the
#   Redis protocol. To switch, you only need to change the environment
#   variables: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD.
#   For Upstash specifically, use the REST endpoint's host and port, and
#   supply the REST token as the password. No code changes required.
#
#   If a future provider does NOT use the Redis protocol (e.g. DynamoDB),
#   use the BaseOTPStore abstraction in core/otp_store.py instead of
#   talking to this client directly.
# ===========================================================================

import redis.asyncio as redis
from app.core.config import settings

redis_client = redis.Redis(
    host=settings.redis_host,
    port=settings.redis_port,
    password=settings.redis_password or None,
    db=settings.redis_db,
    decode_responses=True,
    ssl=settings.redis_ssl
)

async def check_redis_connection():
    try:
        await redis_client.ping()
        print("✅ Redis: Connected")
        return True
    except Exception as e:
        print(f"❌ Redis: Connection Failed - {e}")
        return False
        

async def get_redis() -> redis.Redis:
    """FastAPI dependency that yields a Redis connection."""
    yield redis_client
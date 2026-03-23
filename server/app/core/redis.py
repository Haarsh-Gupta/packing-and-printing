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

import logging
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger("app.core.redis")

redis_client = redis.Redis(
    host=settings.redis_host,
    port=settings.redis_port,
    password=settings.redis_password or None,
    db=settings.redis_db,
    decode_responses=True,
    ssl=settings.redis_ssl
)

from app.core.colors import color_print, GREEN, RED

async def check_redis_connection():
    try:
        await redis_client.ping()
        color_print("Redis: Connected", GREEN)
        return True
    except Exception as e:
        color_print(f"Redis: Connection Failed - {e}", RED)
        return False
        

async def get_redis() -> redis.Redis:
    """FastAPI dependency that yields a Redis connection."""
    yield redis_client


def create_dedicated_redis_client() -> redis.Redis:
    """
    Creates a new, unpooled connection specifically for long-lived Pub/Sub tasks.
    Using the shared pool for Pub/Sub locks the connection into Subscriber Mode,
    starving the app of standard connections.
    """
    return redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        password=settings.redis_password or None,
        db=settings.redis_db,
        decode_responses=True,
        ssl=settings.redis_ssl
    )
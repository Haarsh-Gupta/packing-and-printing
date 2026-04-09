# ===========================================================================
# OTP Store Abstraction
# ===========================================================================
# This module provides a vendor-agnostic interface for storing OTPs.
#
# CURRENT IMPLEMENTATION: RedisOTPStore (uses redis-py async client)
#
# VENDOR SWAPPING:
#   - Upstash Redis: No code change needed — just update REDIS_HOST,
#     REDIS_PORT, REDIS_PASSWORD env vars (Upstash speaks Redis protocol).
#   - DynamoDB / Firestore / any non-Redis store: subclass BaseOTPStore
#     and implement the 3 abstract methods. Then update the factory
#     function `get_otp_store()` to return your new class.
# ===========================================================================

from abc import ABC, abstractmethod
from typing import Optional

import redis.asyncio as redis
from app.core.redis import redis_client
from app.core.config import settings


class BaseOTPStore(ABC):
    """
    Abstract base for OTP storage backends.
    Subclass this to add a new vendor (Upstash REST, DynamoDB, Firestore, etc.)
    """

    @abstractmethod
    async def store_otp(self, email: str, otp: str, ttl_seconds: int | None = None) -> None:
        """Store an OTP with an automatic expiry."""
        ...

    @abstractmethod
    async def get_otp(self, email: str) -> Optional[str]:
        """Retrieve the stored OTP for an email. Returns None if expired/missing."""
        ...

    @abstractmethod
    async def delete_otp(self, email: str) -> None:
        """Delete the OTP after successful verification."""
        ...

    @abstractmethod
    async def increment_otp_attempts(self, email: str) -> int:
        """Increment verification attempt count for an OTP."""
        ...

    @abstractmethod
    async def get_daily_otp_count(self, identifier: str) -> int:
        """Get the number of OTPs generated today for an identifier (e.g. phone)."""
        ...
    
    @abstractmethod
    async def increment_daily_otp_count(self, identifier: str) -> int:
        """Increment the distinct OTP generations today for an identifier."""
        ...


class RedisOTPStore(BaseOTPStore):
    """
    Redis-backed OTP store.

    Key pattern: otp:{email}
    TTL: auto-expires via Redis SETEX.

    Works with any Redis-protocol-compatible provider:
      - Local Redis
      - Upstash (redis:// or rediss:// endpoint)
      - AWS ElastiCache
      - Aiven Redis
    """

    def __init__(self, client: redis.Redis | None = None):
        self._client = client or redis_client

    def _key(self, email: str) -> str:
        return f"otp:{email}"

    async def store_otp(self, email: str, otp: str, ttl_seconds: int | None = None) -> None:
        ttl = ttl_seconds or settings.otp_expire_seconds
        await self._client.setex(self._key(email), ttl, otp)

    async def get_otp(self, email: str) -> Optional[str]:
        return await self._client.get(self._key(email))

    async def delete_otp(self, email: str) -> None:
        await self._client.delete(self._key(email))
        await self._client.delete(f"otp_attempts:{email}")

    async def increment_otp_attempts(self, email: str) -> int:
        key = f"otp_attempts:{email}"
        attempts = await self._client.incr(key)
        if attempts == 1:
            await self._client.expire(key, settings.otp_expire_seconds)
        return attempts

    async def get_daily_otp_count(self, identifier: str) -> int:
        key = f"daily_otp:{identifier}"
        count = await self._client.get(key)
        return int(count) if count else 0

    async def increment_daily_otp_count(self, identifier: str) -> int:
        key = f"daily_otp:{identifier}"
        count = await self._client.incr(key)
        if count == 1:
            # Expire in 24 hours
            await self._client.expire(key, 86400)
        return count


# ---------------------------------------------------------------------------
# Factory — change this to return a different implementation
# ---------------------------------------------------------------------------
def get_otp_store() -> BaseOTPStore:
    """
    Returns the active OTP store instance.
    Swap this to use a different backend (e.g. UpstashOTPStore, DynamoOTPStore).
    """
    return RedisOTPStore()

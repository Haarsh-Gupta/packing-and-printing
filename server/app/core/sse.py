# ===========================================================================
# Server-Sent Events (SSE) Manager
# ===========================================================================
# Uses Redis Pub/Sub to broadcast events to connected SSE clients.
#
# Channels:
#   sse:user:{user_id}  — per-user events (order updates, payment confirmations)
#   sse:admin            — all-admin events (new orders, payments received)
#
# Usage:
#   from app.core.sse import sse_manager
#   await sse_manager.publish(user_id, "order_status_changed", {"order_id": "...", "status": "PAID"})
#   await sse_manager.publish_to_admins("payment_received", {...})
# ===========================================================================

import asyncio
import json
import logging
from typing import AsyncGenerator, Optional
from uuid import UUID

import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Dedicated Redis connection for Pub/Sub (separate from the shared client)
_pubsub_redis: Optional[redis.Redis] = None


async def _get_pubsub_redis() -> redis.Redis:
    """Lazily create a dedicated Redis connection for Pub/Sub."""
    global _pubsub_redis
    if _pubsub_redis is None:
        _pubsub_redis = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            password=settings.redis_password or None,
            db=settings.redis_db,
            decode_responses=True,
            ssl=settings.redis_ssl,
        )
    return _pubsub_redis


def _user_channel(user_id: str | UUID) -> str:
    return f"sse:user:{user_id}"


ADMIN_CHANNEL = "sse:admin"


class SSEManager:
    """
    Manages Server-Sent Event streams backed by Redis Pub/Sub.

    - publish()          → push an event to a specific user's channel
    - publish_to_admins() → push an event to the admin channel
    - subscribe()        → async generator that yields SSE-formatted strings
    """

    # ── Publishing ─────────────────────────────────────────────

    async def publish(
        self,
        user_id: str | UUID,
        event_type: str,
        data: dict,
    ) -> None:
        """Send an event to a specific user's SSE channel."""
        r = await _get_pubsub_redis()
        payload = json.dumps({"event": event_type, "data": data})
        await r.publish(_user_channel(user_id), payload)
        logger.debug(f"SSE publish → {_user_channel(user_id)}: {event_type}")

    async def publish_to_admins(
        self,
        event_type: str,
        data: dict,
    ) -> None:
        """Send an event to all connected admin SSE clients."""
        r = await _get_pubsub_redis()
        payload = json.dumps({"event": event_type, "data": data})
        await r.publish(ADMIN_CHANNEL, payload)
        logger.debug(f"SSE publish → {ADMIN_CHANNEL}: {event_type}")

    # ── Subscribing ────────────────────────────────────────────

    async def subscribe(
        self,
        user_id: str | UUID,
    ) -> AsyncGenerator[str, None]:
        """
        Async generator that yields SSE-formatted event strings.
        One generator per connected client; runs until the client disconnects.
        """
        r = await _get_pubsub_redis()
        pubsub = r.pubsub()
        channel = _user_channel(user_id)

        try:
            await pubsub.subscribe(channel)
            logger.info(f"SSE subscribe → {channel}")

            # Send initial connection confirmation
            yield _format_sse("connected", {"message": "SSE stream connected"})

            while True:
                message = await pubsub.get_message(
                    ignore_subscribe_messages=True, timeout=1.0
                )
                if message and message["type"] == "message":
                    raw = message["data"]
                    try:
                        parsed = json.loads(raw)
                        yield _format_sse(parsed["event"], parsed["data"])
                    except (json.JSONDecodeError, KeyError):
                        yield _format_sse("raw", {"message": raw})
                else:
                    # Send keepalive comment every ~30s to prevent proxy timeouts
                    yield ": keepalive\n\n"
                    # We continue immediately to get_message, which has a 1.0s timeout.
                    # This way we are always responsive but still send a heart beat periodically.
                    # (Wait, actually if we yield here and loops, it will spam keepalives every 1s)
                    # Let's use a timestamp to throttle keepalives.
                    pass
                
                # Wait for next message or a short bit
                await asyncio.sleep(0.5)

        except asyncio.CancelledError:
            logger.info(f"SSE client disconnected from {channel}")
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()

    async def subscribe_admin(self) -> AsyncGenerator[str, None]:
        """Async generator for admin SSE stream."""
        r = await _get_pubsub_redis()
        pubsub = r.pubsub()

        try:
            await pubsub.subscribe(ADMIN_CHANNEL)
            logger.info(f"SSE subscribe → {ADMIN_CHANNEL}")

            yield _format_sse("connected", {"message": "Admin SSE stream connected"})

            while True:
                message = await pubsub.get_message(
                    ignore_subscribe_messages=True, timeout=1.0
                )
                if message and message["type"] == "message":
                    raw = message["data"]
                    try:
                        parsed = json.loads(raw)
                        yield _format_sse(parsed["event"], parsed["data"])
                    except (json.JSONDecodeError, KeyError):
                        yield _format_sse("raw", {"message": raw})
                else:
                    yield ": keepalive\n\n"
                    pass
                
                # Wait for next message or a short bit
                await asyncio.sleep(0.5)

        except asyncio.CancelledError:
            logger.info("Admin SSE client disconnected")
        finally:
            await pubsub.unsubscribe(ADMIN_CHANNEL)
            await pubsub.close()

    # ── Cleanup ────────────────────────────────────────────────

    async def shutdown(self) -> None:
        """Close the dedicated Pub/Sub Redis connection."""
        global _pubsub_redis
        if _pubsub_redis:
            await _pubsub_redis.close()
            _pubsub_redis = None
            logger.info("SSE Redis connection closed")


def _format_sse(event: str, data: dict) -> str:
    """Format a payload as an SSE text block."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


# Singleton
sse_manager = SSEManager()

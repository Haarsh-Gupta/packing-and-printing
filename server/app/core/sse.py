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
import time
from typing import AsyncGenerator, Optional
from uuid import UUID
from fastapi import Request

import redis.asyncio as redis
from app.core.redis import create_dedicated_redis_client, redis_client

logger = logging.getLogger(__name__)

# Dedicated Redis connection for PUBLISHING only (lightweight, reusable)
_publish_redis: Optional[redis.Redis] = None


async def _get_publish_redis() -> redis.Redis:
    """Lazily create the shared publish-only Redis connection."""
    global _publish_redis
    if _publish_redis is None:
        _publish_redis = create_dedicated_redis_client()
    return _publish_redis


def _user_channel(user_id: str | UUID) -> str:
    return f"sse:user:{user_id}"


ADMIN_CHANNEL = "sse:admin"


class SSEManager:
    """
    Manages Server-Sent Event streams backed by Redis Pub/Sub.

    - publish()           → push an event to a specific user's channel
    - publish_to_admins() → push an event to the admin channel
    - subscribe()         → async generator that yields SSE-formatted strings
    """

    def __init__(self):
        self._shutdown_event = asyncio.Event()
        self._active_tasks: set[asyncio.Task] = set()

    # ── Publishing ─────────────────────────────────────────────

    async def publish(
        self,
        user_id: str | UUID,
        event_type: str,
        data: dict,
    ) -> None:
        """Send an event to a specific user's SSE channel."""
        try:
            r = await _get_publish_redis()
            payload = json.dumps({"event": event_type, "data": data})
            await r.publish(_user_channel(user_id), payload)
            logger.debug(f"SSE publish → {_user_channel(user_id)}: {event_type}")
        except Exception as e:
            logger.error(f"SSE publish failed for {_user_channel(user_id)}: {e}")

    async def publish_to_admins(
        self,
        event_type: str,
        data: dict,
    ) -> None:
        """Send an event to all connected admin SSE clients."""
        try:
            r = await _get_publish_redis()
            payload = json.dumps({"event": event_type, "data": data})
            await r.publish(ADMIN_CHANNEL, payload)
            logger.debug(f"SSE publish → {ADMIN_CHANNEL}: {event_type}")
        except Exception as e:
            logger.error(f"SSE publish failed for {ADMIN_CHANNEL}: {e}")

    # ── Subscribing ────────────────────────────────────────────

    async def subscribe(
        self,
        user_id: str | UUID,
        request: Request,
    ) -> AsyncGenerator[str, None]:
        """
        Async generator that yields SSE-formatted event strings.
        Each subscriber gets its own dedicated Redis connection to avoid
        contention under load.
        """
        channel = _user_channel(user_id)

        # Each subscriber gets a DEDICATED Redis connection for its pubsub
        sub_redis = create_dedicated_redis_client()
        pubsub = sub_redis.pubsub()

        try:
            await pubsub.subscribe(channel)
            logger.info(f"SSE subscribe → {channel}")

            # Send initial connection confirmation
            yield _format_sse("connected", {"message": "SSE stream connected"})

            last_keepalive = time.monotonic()
            
            # Initial active user registration
            try:
                await redis_client.zadd("active_users", {str(user_id): time.time()})
            except Exception:
                pass

            while not self._shutdown_event.is_set():
                if await request.is_disconnected():
                    logger.info(f"SSE HTTP disconnect detected for {channel}")
                    break

                try:
                    message = await asyncio.wait_for(
                        pubsub.get_message(ignore_subscribe_messages=True, timeout=0.5),
                        timeout=1.0,
                    )
                except asyncio.TimeoutError:
                    message = None
                except asyncio.CancelledError:
                    logger.info(f"SSE subscriber cancelled for {channel}")
                    return
                except Exception as e:
                    logger.error(f"SSE pubsub read error on {channel}: {e}")
                    await asyncio.sleep(1)
                    continue

                if message and message["type"] == "message":
                    raw = message["data"]
                    try:
                        parsed = json.loads(raw)
                        yield _format_sse(parsed["event"], parsed["data"])
                    except (json.JSONDecodeError, KeyError):
                        yield _format_sse("raw", {"message": raw})
                else:
                    now = time.monotonic()
                    if now - last_keepalive >= 25:
                        yield ": keepalive\n\n"
                        last_keepalive = now
                        # Heartbeat for active user tracking
                        try:
                            await redis_client.zadd("active_users", {str(user_id): time.time()})
                        except Exception:
                            pass

        except asyncio.CancelledError:
            logger.info(f"SSE client disconnected from {channel}")
        except Exception as e:
            logger.error(f"SSE subscribe fatal error for {channel}: {e}")
        finally:
            try:
                await asyncio.wait_for(pubsub.unsubscribe(channel), timeout=1.0)
            except Exception:
                pass
            try:
                await asyncio.wait_for(pubsub.close(), timeout=1.0)
            except Exception:
                pass
            try:
                await asyncio.wait_for(sub_redis.close(), timeout=1.0)
            except Exception:
                pass

    async def subscribe_admin(self, request: Request) -> AsyncGenerator[str, None]:
        """Async generator for admin SSE stream (dedicated Redis connection)."""

        # Each admin subscriber gets a DEDICATED Redis connection
        sub_redis = create_dedicated_redis_client()
        pubsub = sub_redis.pubsub()

        try:
            await pubsub.subscribe(ADMIN_CHANNEL)
            logger.info(f"SSE subscribe → {ADMIN_CHANNEL}")

            yield _format_sse("connected", {"message": "Admin SSE stream connected"})

            last_keepalive = time.monotonic()

            while not self._shutdown_event.is_set():
                if await request.is_disconnected():
                    logger.info("Admin SSE HTTP disconnect detected")
                    break

                try:
                    message = await asyncio.wait_for(
                        pubsub.get_message(ignore_subscribe_messages=True, timeout=0.5),
                        timeout=1.0,
                    )
                except asyncio.TimeoutError:
                    message = None
                except asyncio.CancelledError:
                    logger.info("Admin SSE subscriber cancelled")
                    return
                except Exception as e:
                    logger.error(f"SSE pubsub read error on {ADMIN_CHANNEL}: {e}")
                    await asyncio.sleep(1)
                    continue

                if message and message["type"] == "message":
                    raw = message["data"]
                    try:
                        parsed = json.loads(raw)
                        yield _format_sse(parsed["event"], parsed["data"])
                    except (json.JSONDecodeError, KeyError):
                        yield _format_sse("raw", {"message": raw})
                else:
                    now = time.monotonic()
                    if now - last_keepalive >= 25:
                        yield ": keepalive\n\n"
                        last_keepalive = now

        except asyncio.CancelledError:
            logger.info("Admin SSE client disconnected")
        except Exception as e:
            logger.error(f"Admin SSE subscribe fatal error: {e}")
        finally:
            try:
                await asyncio.wait_for(pubsub.unsubscribe(ADMIN_CHANNEL), timeout=1.0)
            except Exception:
                pass
            try:
                await asyncio.wait_for(pubsub.close(), timeout=1.0)
            except Exception:
                pass
            try:
                await asyncio.wait_for(sub_redis.close(), timeout=1.0)
            except Exception:
                pass

    def track_task(self, task: asyncio.Task) -> None:
        """Register an active subscriber task for cleanup on shutdown."""
        self._active_tasks.add(task)
        task.add_done_callback(self._active_tasks.discard)

    # ── Cleanup ────────────────────────────────────────────────

    async def shutdown(self) -> None:
        """Signal all subscribers to stop and close the publish Redis connection."""
        logger.info("SSE Manager: shutting down...")
        self._shutdown_event.set()

        # Cancel all tracked subscriber tasks
        if self._active_tasks:
            logger.info(f"SSE Manager: cancelling {len(self._active_tasks)} active subscriber tasks")
            for task in list(self._active_tasks):
                task.cancel()
            # Wait max 2s for them to finish
            try:
                await asyncio.wait(list(self._active_tasks), timeout=2.0)
            except Exception:
                pass
            self._active_tasks.clear()

        global _publish_redis
        if _publish_redis:
            try:
                await asyncio.wait_for(_publish_redis.close(), timeout=2.0)
            except Exception as e:
                logger.error(f"Error closing SSE publish Redis: {e}")
            _publish_redis = None
            logger.info("SSE publish Redis connection closed")

        logger.info("SSE Manager: shutdown complete")


def _format_sse(event: str, data: dict) -> str:
    """Format a payload as an SSE text block."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


# Singleton
sse_manager = SSEManager()

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

    async def publish(self,
        user_id: str | UUID,
        event_type: str,
        data: dict,
    ) -> None:
        """Send an event to a specific user's SSE channel."""
        try:
            payload = json.dumps({"event": event_type , "data" : data})
            await redis_client.publish(_user_channel(user_id), payload)
        except Exception as e:
            logger.error(f"SSE publish failed for {_user_channel(user_id)}: {e}")

    async def publish_to_admins(
        self,
        event_type: str,
        data: dict,
    ) -> None:
        """Send an event to all connected admin SSE clients."""
        try:
            payload = json.dumps({"event":event_type, "data":data})
            await redis_client.publish(ADMIN_CHANNEL, payload)
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
        channel = _user_channel(user_id) # Each subscriber gets a DEDICATED Redis connection for its pubsub
        sub_redis = create_dedicated_redis_client()
        pubsub = sub_redis.pubsub()

        try:
            await pubsub.subscribe(channel)
            logger.info(f"SSE subscribe → {channel}")

            yield _format_sse("connected", {"message": "SSE stream connected"})
            last_keepalive = time.monotonic()

            while not self._shutdown_event.is_set():
                if await request.is_disconnected():
                    logger.info(f"SSE HTTP disconnect detected for {channel}")
                    break

                try:
                    message = await asyncio.wait_for(
                        pubsub.get_message(ignore_subscribe_messages=True, timeout=0.05),
                        timeout=0.2,
                    )
                except asyncio.TimeoutError:
                    message = None
                except asyncio.CancelledError:
                    logger.info(f"SSE HTTP disconnect detected for {channel}")
                    return
                except Exception as e:
                    logger.error(f"SSE pubsub read error on {channel}: {e}")
                    await asyncio.sleep(0.1)
                    continue 

                if message and message["type"] == "message":
                    try:
                        parsed = json.loads(message["data"])
                        yield _format_sse(parsed["event"], parsed["data"])
                    except (json.JSONDecodeError, KeyError):
                        yield _format_sse("raw", {"message": str(message["data"])})
                else:
                    now = time.monotonic()
                    if now - last_keepalive >= 25:
                        yield ": keepalive\n\n"
                        last_keepalive = now
                        # Heartbeat for active user tracking
                        try:
                            current_ts = time.time()
                            await redis_client.zadd("active_users", {str(user_id): current_ts})
                            # BUG-016 FIX: Prune users inactive for >5 minutes
                            stale_cutoff = current_ts - 300
                            await redis_client.zremrangebyscore("active_users", "-inf", stale_cutoff)
                        except Exception:
                            pass

        except asyncio.CancelledError:
            logger.info(f"SSE subcriber cancelled : {channel}")
        except Exception as e:
            logger.error(f"SSE subcriber error on {channel}: {e}")
        finally:
            await _safe_cleanup(pubsub, channel, sub_redis)


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
                        pubsub.get_message(ignore_subscribe_messages=True, timeout=0.05),
                        timeout=0.2,
                    )
                except asyncio.TimeoutError:
                    message = None
                except asyncio.CancelledError:
                    logger.info("Admin SSE subscriber cancelled")
                    return
                except Exception as e:
                    logger.error(f"SSE pubsub read error on {ADMIN_CHANNEL}: {e}")
                    await asyncio.sleep(0.1)
                    continue

                if message and message["type"] == "message":
                    try:
                        parsed = json.loads(message["data"])
                        yield _format_sse(parsed["event"], parsed["data"])
                    except (json.JSONDecodeError, KeyError):
                        yield _format_sse("raw", {"message": message["data"]})
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
            await _safe_cleanup(pubsub, ADMIN_CHANNEL, sub_redis)

    # ── Cleanup ────────────────────────────────────────────────

    async def shutdown(self) -> None:
        """Signal all subscribers to stop and close the publish Redis connection."""
        self._shutdown_event.set()
        if self._active_tasks:
            for task in list(self._active_tasks):
                task.cancel()
            try:
                await asyncio.wait(list(self._active_tasks), timeout=2.0)
            except Exception as e:
                logger.error(f"Error closing SSE publish Redis: {e}")
            self._active_tasks.clear()

def _format_sse(event: str, data: dict) -> str:
    """Format a payload as an SSE text block."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"

async def _safe_cleanup(pubsub, channel: str, sub_redis: redis.Redis) -> None:
    
    for coro in [
        pubsub.unsubscribe(channel),
        pubsub.aclose(),
        sub_redis.aclose(),
    ]:

        try:
            await asyncio.wait_for(coro, timeout=0.5)
        except Exception as e:
            logger.error(f"Error closing SSE pubsub for {channel}: {e}")
        pass
    
    

# Singleton
sse_manager = SSEManager()

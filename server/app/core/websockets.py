import asyncio
import json
import logging
from typing import Dict, Set
from uuid import UUID

from fastapi import WebSocket, WebSocketDisconnect
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Dedicated Redis connections — one for publishing, one for subscribing
_ws_publish_redis: redis.Redis | None = None
_ws_subscribe_redis: redis.Redis | None = None


def _create_redis_connection() -> redis.Redis:
    return redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        password=settings.redis_password or None,
        db=settings.redis_db,
        decode_responses=True,
        ssl=settings.redis_ssl,
    )


async def get_publish_redis() -> redis.Redis:
    global _ws_publish_redis
    if _ws_publish_redis is None:
        _ws_publish_redis = _create_redis_connection()
    return _ws_publish_redis


class ConnectionManager:
    def __init__(self):
        # Local connections map: dict[group_id, dict[user_or_admin_id, set[WebSocket]]]
        self.active_connections: Dict[str, Dict[str, Set[WebSocket]]] = {}
        # Keep track of active redis pub/sub tasks per group
        self.pubsub_tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, group_id: str, client_id: str):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = {}
        if client_id not in self.active_connections[group_id]:
            self.active_connections[group_id][client_id] = set()

        self.active_connections[group_id][client_id].add(websocket)

        # Subscribe to redis channel for this group if not already subscribed
        if group_id not in self.pubsub_tasks:
            task = asyncio.create_task(self._listen_to_redis(group_id))
            self.pubsub_tasks[group_id] = task

        logger.info(f"WS client {client_id} connected to group {group_id} (total clients: {sum(len(s) for s in self.active_connections[group_id].values())})")

    def disconnect(self, websocket: WebSocket, group_id: str, client_id: str):
        if group_id in self.active_connections and client_id in self.active_connections[group_id]:
            self.active_connections[group_id][client_id].discard(websocket)
            if not self.active_connections[group_id][client_id]:
                del self.active_connections[group_id][client_id]
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]
                # cancel redis subscription
                task = self.pubsub_tasks.pop(group_id, None)
                if task:
                    task.cancel()
        logger.info(f"WS client {client_id} disconnected from group {group_id}")

    async def broadcast(self, group_id: str, message: dict):
        """Broadcast via Redis Pub/Sub (supports multi-process) + local fallback."""
        payload = json.dumps(message)
        channel = f"ws:inquiry:{group_id}"

        try:
            r = await get_publish_redis()
            receivers = await r.publish(channel, payload)
            logger.info(f"WS broadcast to {channel}: {receivers} Redis subscribers received it")
        except Exception as e:
            logger.error(f"Redis publish failed for {channel}: {e}")
            # Fallback: broadcast directly to local connections
            logger.info(f"Falling back to local broadcast for {channel}")
            await self._local_broadcast(group_id, message)

    async def _local_broadcast(self, group_id: str, message: dict):
        """Send message directly to all local WebSocket connections for a group."""
        if group_id not in self.active_connections:
            logger.warning(f"No local connections for group {group_id}")
            return

        sent_count = 0
        for client_id, websockets in list(self.active_connections[group_id].items()):
            for ws in list(websockets):
                try:
                    await ws.send_json(message)
                    sent_count += 1
                except Exception:
                    logger.warning(f"Failed to send to client {client_id}, disconnecting")
                    self.disconnect(ws, group_id, client_id)
        logger.info(f"Local broadcast to {group_id}: sent to {sent_count} connections")

    async def _listen_to_redis(self, group_id: str):
        """Listen for messages on Redis channel and forward to local WebSocket clients."""
        channel = f"ws:inquiry:{group_id}"

        # Create a DEDICATED Redis connection for this subscription
        # (pubsub requires its own connection, separate from the publish connection)
        sub_redis = _create_redis_connection()
        pubsub = sub_redis.pubsub()

        try:
            await pubsub.subscribe(channel)
            logger.info(f"Redis pubsub subscribed to {channel}")

            while True:
                try:
                    message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                    if message and message["type"] == "message":
                        raw = message["data"]
                        try:
                            parsed = json.loads(raw)
                            # Send to all local connections for this group
                            if group_id in self.active_connections:
                                for client_id, websockets in list(self.active_connections[group_id].items()):
                                    for ws in list(websockets):
                                        try:
                                            await ws.send_json(parsed)
                                        except Exception:
                                            self.disconnect(ws, group_id, client_id)
                        except json.JSONDecodeError:
                            logger.warning(f"Invalid JSON on {channel}: {raw[:100]}")
                    else:
                        await asyncio.sleep(0.1)
                except Exception as inner_e:
                    logger.error(f"Redis pubsub read error on {channel}: {inner_e}")
                    await asyncio.sleep(2)  # Back off before retrying

        except asyncio.CancelledError:
            logger.info(f"Redis pubsub cancelled for {channel}")
        except Exception as e:
            logger.error(f"Redis pubsub fatal error for {channel}: {e}")
        finally:
            try:
                await pubsub.unsubscribe(channel)
                await pubsub.close()
                await sub_redis.close()
            except Exception:
                pass

    async def shutdown(self):
        logger.info("Shutting down ConnectionManager...")
        
        # 1. Cancel all Redis Pub/Sub tasks
        tasks = list(self.pubsub_tasks.values())
        if tasks:
            logger.info(f"Cancelling {len(tasks)} Redis Pub/Sub tasks...")
            for task in tasks:
                task.cancel()
            try:
                # Wait briefly for cancellation to propagate
                await asyncio.wait(tasks, timeout=2.0)
            except Exception:
                pass
        self.pubsub_tasks.clear()
            
        # 2. Close all active websockets in parallel with a timeout
        ws_to_close = []
        for group in list(self.active_connections.values()):
            for clients in list(group.values()):
                for ws in list(clients):
                    ws_to_close.append(ws)

        if ws_to_close:
            logger.info(f"Closing {len(ws_to_close)} active WebSockets in parallel...")
            
            async def close_ws(ws):
                try:
                    # Use a short timeout to prevent blocking if a socket is dead
                    await asyncio.wait_for(ws.close(), timeout=1.0)
                except Exception:
                    pass

            await asyncio.gather(*(close_ws(ws) for ws in ws_to_close), return_exceptions=True)
            
        self.active_connections.clear()

        # 3. Clean up Redis connections
        global _ws_publish_redis
        try:
            if _ws_publish_redis:
                logger.info("Closing WebSocket publish Redis connection...")
                await _ws_publish_redis.close()
                _ws_publish_redis = None
        except Exception as e:
            logger.error(f"Error closing publish Redis: {e}")

        logger.info("ConnectionManager shutdown complete.")


ws_manager = ConnectionManager()

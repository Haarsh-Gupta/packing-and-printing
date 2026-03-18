import asyncio
import json
import logging
from typing import Dict, Set

from fastapi import WebSocket
import redis.asyncio as redis
from app.core.redis import create_dedicated_redis_client

logger = logging.getLogger(__name__)

# Dedicated Redis connection for PUBLISHING only
_ws_publish_redis: redis.Redis | None = None


async def get_publish_redis() -> redis.Redis:
    global _ws_publish_redis
    if _ws_publish_redis is None:
        _ws_publish_redis = create_dedicated_redis_client()
    return _ws_publish_redis


class ConnectionManager:
    def __init__(self):
        # Local connections map: dict[group_id, dict[user_or_admin_id, set[WebSocket]]]
        self.active_connections: Dict[str, Dict[str, Set[WebSocket]]] = {}
        # Keep track of active redis pub/sub tasks per group
        self.pubsub_tasks: Dict[str, asyncio.Task] = {}
        self._shutdown_event = asyncio.Event()

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

        total = sum(len(s) for s in self.active_connections[group_id].values())
        logger.info(f"WS client {client_id} connected to group {group_id} (total clients: {total})")

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
        """
        Listen for messages on Redis channel and forward to local WebSocket clients.
        Uses a retry loop with exponential backoff so a transient Redis failure
        doesn't permanently kill the listener for this group.
        """
        channel = f"ws:inquiry:{group_id}"
        retry_delay = 1  # seconds, grows on consecutive failures

        while not self._shutdown_event.is_set():
            # Create a DEDICATED Redis connection for this subscription
            sub_redis = create_dedicated_redis_client()
            pubsub = sub_redis.pubsub()

            try:
                await pubsub.subscribe(channel)
                logger.info(f"Redis pubsub subscribed to {channel}")
                retry_delay = 1  # reset on successful connect

                while not self._shutdown_event.is_set():
                    try:
                        message = await asyncio.wait_for(
                            pubsub.get_message(ignore_subscribe_messages=True, timeout=0.5),
                            timeout=1.0,
                        )
                    except asyncio.TimeoutError:
                        message = None
                    except asyncio.CancelledError:
                        raise  # let the outer handler deal with it
                    except Exception as inner_e:
                        logger.error(f"Redis pubsub read error on {channel}: {inner_e}")
                        break  # break inner loop to reconnect

                    if message and message["type"] == "message":
                        raw = message["data"]
                        try:
                            parsed = json.loads(raw)
                            # Send to all local connections for this group
                            if group_id in self.active_connections:
                                for client_id, websockets in list(
                                    self.active_connections[group_id].items()
                                ):
                                    for ws in list(websockets):
                                        try:
                                            await ws.send_json(parsed)
                                        except Exception:
                                            self.disconnect(ws, group_id, client_id)
                        except json.JSONDecodeError:
                            logger.warning(f"Invalid JSON on {channel}: {raw[:100]}")

            except asyncio.CancelledError:
                logger.info(f"Redis pubsub cancelled for {channel}")
                return  # exit the retry loop entirely
            except Exception as e:
                logger.error(f"Redis pubsub connection error for {channel}: {e}")
            finally:
                try:
                    await pubsub.unsubscribe(channel)
                    await pubsub.close()
                except Exception:
                    pass
                try:
                    await sub_redis.close()
                except Exception:
                    pass

            # If group no longer exists locally, stop retrying
            if group_id not in self.active_connections:
                logger.info(f"No more local clients for {group_id}, stopping listener")
                return

            # Exponential backoff (cap at 30s)
            logger.info(f"Reconnecting to {channel} in {retry_delay}s...")
            try:
                await asyncio.wait_for(self._shutdown_event.wait(), timeout=retry_delay)
                # If we get here, shutdown was signalled — exit
                return
            except asyncio.TimeoutError:
                # Normal timeout — retry
                pass
            retry_delay = min(retry_delay * 2, 30)

    async def shutdown(self):
        logger.info("Shutting down ConnectionManager...")
        self._shutdown_event.set()
        
        # 1. Cancel all Redis Pub/Sub tasks
        tasks = list(self.pubsub_tasks.values())
        if tasks:
            logger.info(f"Cancelling {len(tasks)} Redis Pub/Sub tasks...")
            for task in tasks:
                task.cancel()
            try:
                await asyncio.wait(tasks, timeout=3.0)
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

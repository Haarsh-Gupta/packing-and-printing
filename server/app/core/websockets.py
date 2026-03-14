import asyncio
import json
import logging
from typing import Dict, Set
from uuid import UUID

from fastapi import WebSocket, WebSocketDisconnect
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Dedicated Redis connection for WebSockets Pub/Sub
_ws_redis: redis.Redis | None = None

async def get_ws_redis() -> redis.Redis:
    global _ws_redis
    if _ws_redis is None:
        _ws_redis = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            password=settings.redis_password or None,
            db=settings.redis_db,
            decode_responses=True,
            ssl=settings.redis_ssl,
        )
    return _ws_redis

class ConnectionManager:
    def __init__(self):
        # Local connections map: dict[group_id, dict[user_or_admin_id, set[WebSocket]]]
        self.active_connections: Dict[str, Dict[str, Set[WebSocket]]] = {}
        # Keep track of active redis pub/sub tasks per group so we only subscribe once per instance
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
            
        logger.info(f"WS client {client_id} connected to group {group_id}")

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
        """Broadcasts practically through Redis, ensuring all instances get it."""
        r = await get_ws_redis()
        channel = f"ws:inquiry:{group_id}"
        await r.publish(channel, json.dumps(message))

    async def _listen_to_redis(self, group_id: str):
        r = await get_ws_redis()
        pubsub = r.pubsub()
        channel = f"ws:inquiry:{group_id}"
        
        try:
            await pubsub.subscribe(channel)
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message["type"] == "message":
                    raw = message["data"]
                    try:
                        parsed = json.loads(raw)
                        # send to all local connections for this group
                        if group_id in self.active_connections:
                            for client_id, websockets in list(self.active_connections[group_id].items()):
                                for ws in list(websockets):
                                    try:
                                        await ws.send_json(parsed)
                                    except Exception:
                                        self.disconnect(ws, group_id, client_id)
                    except json.JSONDecodeError:
                        pass
                else:
                    await asyncio.sleep(0.1)
        except asyncio.CancelledError:
            pass
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()

    async def shutdown(self):
        for task in self.pubsub_tasks.values():
            task.cancel()
        global _ws_redis
        if _ws_redis:
            await _ws_redis.close()
            _ws_redis = None

ws_manager = ConnectionManager()

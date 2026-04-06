import asyncio
import json
import logging
from typing import Dict, Set

from fastapi import WebSocket
import redis.asyncio as redis
from app.core.redis import create_dedicated_redis_client, redis_client

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, Set[WebSocket]]] = {}
        # Track metadata per user per group: { group_id: { client_id: { "is_admin": bool } } }
        self.user_meta: Dict[str, Dict[str, dict]] = {}
        self.pubsub_tasks: Dict[str, asyncio.Task] = {}
        self._shutdown_event = asyncio.Event()

    async def connect(self, websocket: WebSocket, group_id: str, client_id: str, is_admin: bool = False):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = {}
        if group_id not in self.user_meta:
            self.user_meta[group_id] = {}

        is_new_user = client_id not in self.active_connections[group_id]

        if is_new_user:
            self.active_connections[group_id][client_id] = set()
        self.active_connections[group_id][client_id].add(websocket)
        self.user_meta[group_id][client_id] = {"is_admin": is_admin}

        if group_id not in self.pubsub_tasks:
            task = asyncio.create_task(self._listen_to_redis(group_id))
            self.pubsub_tasks[group_id] = task

        # Broadcast presence:online to other users in the group
        if is_new_user:
            await self.broadcast(group_id, {
                "type": "presence",
                "user_id": client_id,
                "is_online": True,
                "is_admin": is_admin,
            })

    async def disconnect(self, websocket: WebSocket, group_id: str, client_id: str):
        is_admin = False
        if group_id in self.active_connections:
            if client_id in self.active_connections[group_id]:
                self.active_connections[group_id][client_id].discard(websocket)
                if not self.active_connections[group_id][client_id]:
                    meta = self.user_meta.get(group_id, {}).pop(client_id, {})
                    is_admin = meta.get("is_admin", False)
                    del self.active_connections[group_id][client_id]

                    # Broadcast presence:offline since user has no more sockets
                    await self.broadcast(group_id, {
                        "type": "presence",
                        "user_id": client_id,
                        "is_online": False,
                        "is_admin": is_admin,
                    })

            if not self.active_connections.get(group_id):
                self.active_connections.pop(group_id, None)
                self.user_meta.pop(group_id, None)
                task = self.pubsub_tasks.pop(group_id, None)
                if task:
                    task.cancel()

    async def broadcast(self, group_id: str, message: dict):
        # Uses shared pool — no module-level global, no loop-binding issue
        payload = json.dumps(message)
        channel = f"ws:inquiry:{group_id}"
        try:
            await redis_client.publish(channel, payload)
        except Exception as e:
            logger.error(f"Redis publish failed for {channel}: {e}")
            await self._local_broadcast(group_id, message)

    def _remove_socket(self, websocket: WebSocket, group_id: str, client_id: str):
        """Silently remove a dead socket without broadcasting presence (used in error handlers)."""
        if group_id in self.active_connections:
            if client_id in self.active_connections[group_id]:
                self.active_connections[group_id][client_id].discard(websocket)
                if not self.active_connections[group_id][client_id]:
                    self.user_meta.get(group_id, {}).pop(client_id, None)
                    del self.active_connections[group_id][client_id]
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]
                self.user_meta.pop(group_id, None)
                task = self.pubsub_tasks.pop(group_id, None)
                if task:
                    task.cancel()

    async def _local_broadcast(self, group_id: str, message: dict):
        if group_id not in self.active_connections:
            return
        for client_id, websockets in list(self.active_connections[group_id].items()):
            for ws in list(websockets):
                try:
                    await ws.send_json(message)
                except Exception:
                    self._remove_socket(ws, group_id, client_id)

    async def _listen_to_redis(self, group_id: str):
        channel = f"ws:inquiry:{group_id}"
        retry_delay = 1

        while not self._shutdown_event.is_set():
            sub_redis = create_dedicated_redis_client()
            pubsub = sub_redis.pubsub()

            try:
                await pubsub.subscribe(channel)
                retry_delay = 1

                while not self._shutdown_event.is_set():
                    try:
                        message = await asyncio.wait_for(
                            pubsub.get_message(ignore_subscribe_messages=True, timeout=0.05),
                            timeout=0.2,  # was 1.0
                        )
                    except asyncio.TimeoutError:
                        message = None
                    except asyncio.CancelledError:
                        raise  # propagate — don't retry
                    except Exception as e:
                        logger.error(f"WS pubsub read error on {channel}: {e}")
                        break

                    if message and message["type"] == "message":
                        try:
                            parsed = json.loads(message["data"])
                            if group_id in self.active_connections:
                                for client_id, websockets in list(self.active_connections[group_id].items()):
                                    for ws in list(websockets):
                                        try:
                                            await ws.send_json(parsed)
                                        except Exception:
                                            self._remove_socket(ws, group_id, client_id)
                        except json.JSONDecodeError:
                            pass

            except asyncio.CancelledError:
                return
            except Exception as e:
                logger.error(f"WS pubsub connection error for {channel}: {e}")
            finally:
                for coro in [pubsub.unsubscribe(channel), pubsub.aclose(), sub_redis.aclose()]:
                    try:
                        await asyncio.wait_for(coro, timeout=0.5)
                    except Exception:
                        pass

            if group_id not in self.active_connections:
                return

            try:
                await asyncio.wait_for(self._shutdown_event.wait(), timeout=retry_delay)
                return
            except asyncio.TimeoutError:
                pass
            retry_delay = min(retry_delay * 2, 30)

    async def shutdown(self):
        self._shutdown_event.set()
        tasks = list(self.pubsub_tasks.values())
        if tasks:
            for task in tasks:
                task.cancel()
            try:
                await asyncio.wait(tasks, timeout=3.0)
            except Exception:
                pass
        self.pubsub_tasks.clear()

        ws_list = []
        for group in list(self.active_connections.values()):
            for clients in list(group.values()):
                ws_list.extend(clients)

        async def _close(ws):
            try:
                await asyncio.wait_for(ws.close(), timeout=1.0)
            except Exception:
                pass

        if ws_list:
            await asyncio.gather(*(_close(ws) for ws in ws_list), return_exceptions=True)
        self.active_connections.clear()


ws_manager = ConnectionManager()
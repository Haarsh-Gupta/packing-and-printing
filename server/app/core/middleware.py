from fastapi import Request, status
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send
from app.core.redis import redis_client
from app.core.config import settings
from jose import jwt, JWTError
import asyncio

class RateLimitMiddleware:
    """
    Pure ASGI middleware for rate limiting.
    Unlike BaseHTTPMiddleware, this does NOT interfere with WebSocket upgrades.
    """
    def __init__(self, app: ASGIApp, limit: int = None, window: int = None):
        self.app = app
        self.limit = limit or settings.rate_limit_requests
        self.window = window or settings.rate_limit_window_seconds

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        # Only rate-limit HTTP requests, pass everything else through
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)

        # Get Real IP (Behind Proxy)
        forwarded = request.headers.get("X-Forwarded-For")
        client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")

        key = f"global_limit:{client_ip}"

        try:
            async with redis_client.pipeline(transaction=True) as pipe:
                await pipe.incr(key)
                await pipe.ttl(key)
                result = await pipe.execute()

            count, ttl = result

            if ttl == -1:
                await redis_client.expire(key, self.window)

            if count > self.limit:
                response = JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "System busy. Too many requests."},
                    headers={"Retry-After": str(ttl)},
                )
                await response(scope, receive, send)
                return
        except Exception:
            pass  # Fail open

        await self.app(scope, receive, send)


class UserActivityMiddleware:
    """
    Middleware to track user online status in Redis.
    No database changes. Updates Redis TTL on every request.
    """
    _background_tasks: set = set()

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        
        # Try to extract user from token without blocking or DB calls
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                # Fast JWT decode without validation (secret check only)
                payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
                user_id = payload.get("id")
                if user_id:
                    task = asyncio.create_task(self.mark_online(user_id))
                    self._background_tasks.add(task)
                    task.add_done_callback(self._background_tasks.discard)
            except (JWTError, Exception):
                pass
        
        await self.app(scope, receive, send)

    async def mark_online(self, user_id: str):
        try:
            # key: user_active:{user_id}, value skipping for simplicity, TTL 5 mins
            # EX=300 is 5 minutes
            await redis_client.set(f"user_active:{user_id}", "online", ex=300)
        except Exception:
            pass
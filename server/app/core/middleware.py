import logging
import time
import uuid

from fastapi import Request, status
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send
from app.core.redis import redis_client
from app.core.config import settings
from app.core.logging_config import correlation_id
from jose import jwt, JWTError
import asyncio
from user_agents import parse
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Component 6:  Correlation / Request-ID Middleware
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class CorrelationMiddleware:
    """
    Pure ASGI middleware that:
      1. Generates a uuid4 for every incoming HTTP request.
      2. Sets it in the `correlation_id` contextvar (visible to all loggers).
      3. Injects it into the response as `X-Request-ID`.
      4. Logs ONE structured JSON line at the end of the request with
         method, path, status_code, and process_time_ms.

    Non-HTTP scopes (WebSocket, lifespan) are passed through untouched.
    """

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # ── Generate & bind correlation ID ────────────────────────────────
        request_id = uuid.uuid4().hex
        token = correlation_id.set(request_id)

        request = Request(scope, receive)
        start = time.perf_counter()

        status_code: int = 500  # default in case of unhandled crash

        async def send_with_request_id(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message.get("status", 500)
                # Inject X-Request-ID header
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", request_id.encode()))
                message["headers"] = headers
            await send(message)

        try:
            await self.app(scope, receive, send_with_request_id)
        finally:
            process_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.info(
                "request completed",
                extra={
                    "http_method": request.method,
                    "path": request.url.path,
                    "status_code": status_code,
                    "process_time_ms": process_ms,
                },
            )
            # Reset the contextvar so the token doesn't leak
            correlation_id.reset(token)

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
        
        # Track Device Traffic
        user_agent_string = request.headers.get("User-Agent", "")
        if user_agent_string:
            task = asyncio.create_task(self.track_traffic(user_agent_string))
            self._background_tasks.add(task)
            task.add_done_callback(self._background_tasks.discard)

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

    async def track_traffic(self, user_agent_string: str):
        try:
            user_agent = parse(user_agent_string)
            device_type = "mobile"
            if user_agent.is_tablet:
                device_type = "tablet"
            elif user_agent.is_pc or user_agent.is_bot: # classify bots as desktop for simplicity, or we could ignore them
                device_type = "desktop"
                
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            key = f"analytics:traffic:{today}"
            
            async with redis_client.pipeline(transaction=True) as pipe:
                await pipe.zincrby(key, 1, device_type)
                await pipe.expire(key, 86400 * 90)  # Keep for 90 days
                await pipe.execute()
        except Exception as e:
            logger.error(f"Error tracking traffic: {e}")
            pass
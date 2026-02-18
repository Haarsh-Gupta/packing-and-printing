from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.redis import redis_client 
from app.core.config import settings

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = None, window: int = None):
        super().__init__(app)
        self.limit = limit or settings.rate_limit_requests
        self.window = window or settings.rate_limit_window_seconds

    async def dispatch(self, request: Request, call_next):
        # 1. Get Real IP (Behind Proxy)
        forwarded = request.headers.get("X-Forwarded-For")
        client_ip = forwarded.split(",")[0].strip() if forwarded else request.client.host

        key = f"global_limit:{client_ip}"

        try:
            # 2. Check Global Limit
            async with redis_client.pipeline(transaction=True) as pipe:
                await pipe.incr(key)
                await pipe.ttl(key)
                result = await pipe.execute()
            
            count, ttl = result

            if ttl == -1:
                await redis_client.expire(key, self.window)

            if count > self.limit:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "System busy. Too many requests."},
                    headers={"Retry-After": str(ttl)}
                )
        except Exception:
            pass # Fail open

        return await call_next(request)
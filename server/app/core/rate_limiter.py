from fastapi import HTTPException, Request, Depends, status
from app.core.redis import get_redis
import redis.asyncio as redis

class RateLimiter:
    def __init__(self, times: int, seconds: int):
        self.times = times
        self.seconds = seconds

    async def __call__(self, request: Request, client: redis.Redis = Depends(get_redis)):
        # 1. Identify User (IP based)
        client_ip = request.client.host if request.client else "127.0.0.1"
        
        # 2. Create Unique Key for this Route
        # Key looks like: "rate_limit:127.0.0.1:/auth/login"
        key = f"rate_limit:{client_ip}:{request.url.path}"

        try:
            # 3. Increment & Check
            async with client.pipeline(transaction=True) as pipe:
                await pipe.incr(key)
                await pipe.ttl(key)
                result = await pipe.execute()
                
            count = result[0]
            ttl = result[1]

            # 4. Set expiration if it's the first request
            if count == 1:
                await client.expire(key, self.seconds)
            
            # 5. Block if limit exceeded
            if count > self.times:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many requests. Try again in {ttl if ttl > 0 else self.seconds} seconds."
                )
                
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            print(f"Redis Error: {e}")
            # Fail Open: Allow request if Redis breaks, don't crash the server
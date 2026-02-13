import json
import random
import string
from typing import Optional

import redis.asyncio as redis

from app.core.email import send_otp_email


OTP_PREFIX = "otp:"
OTP_TTL_SECONDS = 600  # 10 minutes
MAX_ATTEMPTS = 3


def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP code."""
    return "".join(random.choices(string.digits, k=length))


async def store_otp(
    redis_client: redis.Redis,
    email: str,
    otp: str,
    user_data: dict
) -> None:
    """
    Store OTP and user registration data in Redis.
    
    Key format: otp:{email}
    Value: JSON {otp, user_data, attempts}
    TTL: 10 minutes
    """
    key = f"{OTP_PREFIX}{email}"
    payload = json.dumps({
        "otp": otp,
        "user_data": user_data,
        "attempts": 0
    })
    await redis_client.setex(key, OTP_TTL_SECONDS, payload)


async def verify_otp(
    redis_client: redis.Redis,
    email: str,
    otp: str
) -> dict:
    """
    Verify an OTP code for a given email.
    
    Returns:
        user_data dict on success
    
    Raises:
        ValueError with message on failure
    """
    key = f"{OTP_PREFIX}{email}"
    raw = await redis_client.get(key)

    if not raw:
        raise ValueError("OTP expired or not found. Please register again.")

    data = json.loads(raw)

    # Check max attempts
    if data["attempts"] >= MAX_ATTEMPTS:
        await redis_client.delete(key)
        raise ValueError("Maximum verification attempts exceeded. Please register again.")

    # Check OTP match
    if data["otp"] != otp:
        data["attempts"] += 1
        remaining = MAX_ATTEMPTS - data["attempts"]

        if data["attempts"] >= MAX_ATTEMPTS:
            await redis_client.delete(key)
            raise ValueError("Maximum verification attempts exceeded. Please register again.")

        # Update attempts count, preserve TTL
        ttl = await redis_client.ttl(key)
        if ttl > 0:
            await redis_client.setex(key, ttl, json.dumps(data))

        raise ValueError(f"Invalid OTP. {remaining} attempt(s) remaining.")

    # OTP is correct — delete the key and return user data
    await redis_client.delete(key)
    return data["user_data"]


async def resend_otp(
    redis_client: redis.Redis,
    email: str
) -> str:
    """
    Resend a new OTP for an existing pending registration.
    Resets attempts to 0 and generates a new OTP.
    
    Returns:
        The new OTP code
    
    Raises:
        ValueError if no pending registration found
    """
    key = f"{OTP_PREFIX}{email}"
    raw = await redis_client.get(key)

    if not raw:
        raise ValueError("No pending registration found. Please register again.")

    data = json.loads(raw)

    # Generate new OTP and reset attempts
    new_otp = generate_otp()
    data["otp"] = new_otp
    data["attempts"] = 0

    await redis_client.setex(key, OTP_TTL_SECONDS, json.dumps(data))

    # Send new OTP email
    await send_otp_email(email, new_otp)

    return new_otp

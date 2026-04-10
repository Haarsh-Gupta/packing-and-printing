import logging

from fastapi import APIRouter, HTTPException, status, Depends
from app.modules.otps.schemas import OtpSend, OtpVerify
from app.modules.otps.services import get_otp_service
from app.core.rate_limiter import RateLimiter

logger = logging.getLogger("app.modules.otps")

router = APIRouter()
otp_service = get_otp_service()



@router.post("/send", status_code=status.HTTP_200_OK, dependencies=[Depends(RateLimiter(times=3, seconds=60))])
async def send_otp(payload: OtpSend):
    """
    Generate a 6-digit OTP, store it in Redis, and send it to the given email.
    """
    try:
        success = await otp_service.send_otp(email=payload.email)
    except ValueError as e:
        if str(e) == "MAX_GENERATION_LIMIT_EXCEEDED":
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many OTP requests. Please try again after 10 hours."
            )
        raise e

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email. Please try again.",
        )

    return {"message": "OTP sent successfully", "email": payload.email}


@router.post("/verify", status_code=status.HTTP_200_OK)
async def verify_otp(payload: OtpVerify):
    """
    Verify the OTP for the given email. Does NOT delete the OTP on success (check-only).
    """
    try:
        valid = await otp_service.verify_otp(email=payload.email, otp=payload.otp, consume=False)
    except ValueError as e:
        if str(e) == "MAX_ATTEMPT_LIMIT_EXCEEDED":
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many incorrect attempts. Your OTP has been revoked. Please request a new one."
            )
        raise e

    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP.",
        )

    return {"message": "OTP verified successfully", "email": payload.email}

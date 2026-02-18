from fastapi import APIRouter, HTTPException, status, Depends
from .schemas import OtpSend, OtpVerify
from .services import get_otp_service
from app.core.rate_limiter import RateLimiter


router = APIRouter()
otp_service = get_otp_service()


@router.post("/send", status_code=status.HTTP_200_OK, dependencies=[Depends(RateLimiter(times=3, seconds=60))])
async def send_otp(payload: OtpSend):
    """
    Generate a 6-digit OTP, store it in Redis, and send it to the given email.
    """
    success = await otp_service.send_otp(email=payload.email)

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
    valid = await otp_service.verify_otp(email=payload.email, otp=payload.otp, consume=False)

    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP.",
        )

    return {"message": "OTP verified successfully", "email": payload.email}

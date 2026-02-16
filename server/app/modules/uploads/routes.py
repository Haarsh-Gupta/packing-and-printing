from fastapi import APIRouter, UploadFile, File, Query, Depends, HTTPException
from typing import Literal
from app.core.file_upload import upload_file_to_cloud
from app.modules.auth.auth import get_current_user
from app.modules.users.schemas import UserOut

router = APIRouter()

@router.post("/", response_model=dict, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    purpose: Literal["profile", "product", "inquiry"] = Query(..., description="Type of upload: profile, product, or inquiry"),
    current_user: UserOut = Depends(get_current_user)
):
    """
    General purpose upload endpoint.
    
    Args:
        purpose: 'profile' (Users), 'product' (Admins), 'inquiry' (Users)
    """
    
    # Security Check: Only Admins can upload Product images
    if purpose == "product" and not current_user.admin:
        raise HTTPException(status_code=403, detail="Only admins can upload product images")

    # Upload
    url = await upload_file_to_cloud(file, purpose)
    
    return {
        "url": url,
        "filename": file.filename,
        "type": file.content_type
    }
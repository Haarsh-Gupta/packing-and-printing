import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings
import os

# Configure Cloudinary
cloudinary.config( 
  cloud_name = settings.cloudinary_cloud_name, 
  api_key = settings.cloudinary_api_key, 
  api_secret = settings.cloudinary_api_secret,
  secure = True
)

# Define allowed types for different purposes
ALLOWED_TYPES = {
    "profile": ["image/jpeg", "image/png", "image/webp"],
    "product": ["image/jpeg", "image/png", "image/webp"],
    # Inquiries need vector files (CDR, AI) and PDFs
    "inquiry": ["image/jpeg", "image/png", "application/pdf", "application/cdr", "application/postscript", "application/octet-stream"] 
}

async def upload_file_to_cloud(file: UploadFile, purpose: str) -> str:
    """
    Uploads a file to Cloudinary based on the purpose (profile, product, inquiry).
    Returns the secure URL.
    """
    
    # 1. Validate File Type
    # Note: CDR files often have generic mime types like 'application/octet-stream', 
    # so we also check file extensions for inquiries.
    if purpose not in ALLOWED_TYPES:
         raise HTTPException(status_code=400, detail="Invalid upload purpose")

    is_valid_type = file.content_type in ALLOWED_TYPES[purpose]
    
    # Extra check for Inquiry files (extensions)
    if purpose == "inquiry" and not is_valid_type:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext in ['.cdr', '.ai', '.pdf', '.eps']:
            is_valid_type = True

    if not is_valid_type:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed for {purpose}. Allowed: {ALLOWED_TYPES[purpose]}"
        )

    # 2. Determine Folder
    folder_map = {
        "profile": "bookbind/users/profiles",
        "product": "bookbind/products",
        "inquiry": "bookbind/inquiries" # Private-ish folder
    }
    
    try:
        content = await file.read()
        
        # 3. Upload
        # resource_type="auto" lets Cloudinary decide if it's an image or raw file (like CDR)
        response = cloudinary.uploader.upload(
            content, 
            folder=folder_map.get(purpose, "bookbind/misc"),
            resource_type="auto" 
        )
        
        return response.get("secure_url")
        
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")
import cloudinary
import cloudinary.uploader
import asyncio
import logging
import os
from fastapi import UploadFile, HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure Cloudinary
cloudinary.config( 
  cloud_name = settings.cloudinary_cloud_name, 
  api_key = settings.cloudinary_api_key, 
  api_secret = settings.cloudinary_api_secret,
  secure = True
)

# Max file size: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024

# Define allowed types for different purposes
ALLOWED_TYPES = {
    "profile": ["image/jpeg", "image/png", "image/webp"],
    "product": ["image/jpeg", "image/png", "image/webp"],
    "payment": ["image/jpeg", "image/png", "image/webp"],
    # Inquiries need vector files (CDR, AI) and PDFs
    "inquiry": ["image/jpeg", "image/png", "application/pdf", "application/cdr", "application/postscript", "application/octet-stream"] 
}

# Allowed file extensions for inquiry (fallback when MIME is generic)
_INQUIRY_EXTENSIONS = {'.cdr', '.ai', '.pdf', '.eps', '.jpg', '.jpeg', '.png'}

# Magic byte signatures for common file types
_MAGIC_SIGNATURES = {
    b'\xff\xd8\xff': "image/jpeg",
    b'\x89PNG\r\n\x1a\n': "image/png",
    b'RIFF': "image/webp",  # WebP starts with RIFF....WEBP
    b'%PDF': "application/pdf",
    b'%!PS': "application/postscript",  # PostScript/AI
}


def _detect_mime_from_bytes(content: bytes) -> str | None:
    """Detect MIME type from file header magic bytes (no external dependency)."""
    header = content[:16]
    for sig, mime in _MAGIC_SIGNATURES.items():
        if header.startswith(sig):
            # Special case: RIFF could be WAV or WebP
            if sig == b'RIFF' and b'WEBP' not in header[:12]:
                continue
            return mime
    return None


async def upload_file_to_cloud(file: UploadFile, purpose: str) -> str:
    """
    Uploads a file to Cloudinary based on the purpose (profile, product, inquiry).
    Returns the secure URL.
    """
    
    # 1. Validate purpose
    if purpose not in ALLOWED_TYPES:
         raise HTTPException(status_code=400, detail="Invalid upload purpose")

    # 2. Read file content (with size limit)
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)} MB",
        )
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # 3. BUG-013 FIX: Validate MIME type using magic bytes, not client Content-Type
    detected_mime = _detect_mime_from_bytes(content)
    # Fall back to client-provided Content-Type only if magic detection fails
    effective_mime = detected_mime or file.content_type or "application/octet-stream"

    is_valid_type = effective_mime in ALLOWED_TYPES[purpose]
    
    # Extra check for Inquiry files (extensions) — CDR/AI have unreliable MIME types
    if purpose == "inquiry" and not is_valid_type:
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext in _INQUIRY_EXTENSIONS:
            is_valid_type = True

    if not is_valid_type:
        raise HTTPException(
            status_code=400, 
            detail=f"File type '{effective_mime}' not allowed for {purpose}. Allowed: {ALLOWED_TYPES[purpose]}"
        )

    # 4. Determine Folder
    folder_map = {
        "profile": "bookbind/users/profiles",
        "product": "bookbind/products",
        "inquiry": "bookbind/inquiries",
        "payment": "bookbind/payment_screenshots",
    }
    
    try:
        # 5. BUG-013 FIX: Run blocking Cloudinary upload in a thread pool
        response = await asyncio.to_thread(
            cloudinary.uploader.upload,
            content, 
            folder=folder_map.get(purpose, "bookbind/misc"),
            resource_type="auto",
        )
        
        return response.get("secure_url")
        
    except Exception as e:
        logger.error(f"Cloudinary upload error: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")
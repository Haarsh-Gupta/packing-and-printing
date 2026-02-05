import os 
import asyncio
import cloudinary
import cloudinary.uploader
from app.config import settings


cloudinary.config(
    cloud_name = settings.cloudinary_cloud_name,
    api_key = settings.cloudinary_api_key,
    api_secret = settings.cloudinary_api_secret
)

async def upload_image(file_path : str):
    try:
        upload_result = await asyncio.to_thread(cloudinary.uploader.upload , file_path)
        return upload_result
    except Exception as e:
        print(f"Error uploading image: {e}")
        return None

    
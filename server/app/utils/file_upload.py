import os
import shutil
import uuid
from fastapi import UploadFile

current_dir = os.path.dirname(__file__)
temp_dir = os.path.join(os.path.dirname(current_dir) , "temp_uploads")

os.makedirs(temp_dir , exist_ok=True)

async def create_temp_dir():
    id = uuid.uuid4()
    path = os.path.join(temp_dir , str(id))
    os.makedirs(path, exist_ok=True)
    return path

async def delete_temp_dir(path):
    shutil.rmtree(path)


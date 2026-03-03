import requests
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

# 1. Login
url = "http://127.0.0.1:8000/auth/login"
data = {"username": "test@navart.com", "password": "password123"}
r = requests.post(url, data=data)
print("Login 1:", r.status_code, r.text)

if r.status_code == 200:
    access_token = r.json()["access_token"]
    
    # 2. Logout
    url = "http://127.0.0.1:8000/auth/logout"
    headers = {"Authorization": f"Bearer {access_token}"}
    r = requests.post(url, headers=headers)
    print("Logout:", r.status_code, r.text)
    
    # 3. Login Again
    url = "http://127.0.0.1:8000/auth/login"
    r = requests.post(url, data=data)
    print("Login 2:", r.status_code, r.text)

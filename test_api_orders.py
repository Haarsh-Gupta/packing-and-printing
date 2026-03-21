import httpx
import asyncio

BASE_URL = "http://localhost:8000"

async def test_orders():
    async with httpx.AsyncClient() as client:
        # 1. Login to get token
        login_res = await client.post(f"{BASE_URL}/auth/login", json={
            "email": "admin@example.com",
            "password": "admin"
        })
        if login_res.status_code != 200:
            print(f"Login failed: {login_res.text}")
            # Try alternative credentials if I knew them, but let's assume default for now
            return

        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Fetch all orders
        res = await client.get(f"{BASE_URL}/admin/orders/all?skip=0&limit=200", headers=headers)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            orders = res.json()
            print(f"Count: {len(orders)}")
            if orders:
                print(f"First Order: {orders[0]}")
        else:
            print(f"Error: {res.text}")

if __name__ == "__main__":
    asyncio.run(test_orders())

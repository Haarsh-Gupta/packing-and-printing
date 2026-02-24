import asyncio
import urllib.request, urllib.parse, json
import sys

def go():
    base_url = "http://localhost:8000"
    
    # 1. Login with hardcoded dummy (or register and login)
    email = "testman_order1@example.com"
    pwd = "password123"
    try:
        req = urllib.request.Request(f"{base_url}/users/register", data=json.dumps({"email": email, "password": pwd, "full_name": "Test Man", "role": "user"}).encode(), headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req)
    except:
        pass
    
    data = urllib.parse.urlencode({'username': email, 'password': pwd}).encode('utf-8')
    req = urllib.request.Request(f'{base_url}/auth/login', data=data)
    res = urllib.request.urlopen(req)
    token = json.loads(res.read())['access_token']
    
    # 2. Create an inquiry
    headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token}
    payload = {
        "items": [{
            "service_id": 1,
            "variant_id": 1,
            "quantity": 2,
            "selected_options": {"variant_name": "Basic"},
            "notes": "Testing"
        }]
    }
    req = urllib.request.Request(f"{base_url}/inquiries/", data=json.dumps(payload).encode(), headers=headers)
    res = urllib.request.urlopen(req)
    inquiry = json.loads(res.read())
    inq_id = inquiry['id']
    
    # We must patch the inquiry directly to ACCEPTED somehow, but the status update might require Quoted.
    # We will just raw SQL inject it to "ACCEPTED"
    import sqlite3
    # Wait, it's postgres! We can't easily SQLite it... let's just make a script using motor or sqlalchemy.
    pass

go()

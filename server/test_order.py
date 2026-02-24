import asyncio
import urllib.request, urllib.parse, json
import sys

try:
    data = urllib.parse.urlencode({'username': 'admin@navart.com', 'password': 'admin'}).encode('utf-8')
    req = urllib.request.Request('http://localhost:8000/auth/login', data=data)
    res = urllib.request.urlopen(req)
    token = json.loads(res.read())['access_token']
    
    req2 = urllib.request.Request('http://localhost:8000/orders/', data=json.dumps({'inquiry_id': '019c9140-7ac8-4111-bc89-4b7566d9a53e'}).encode('utf-8'), headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token})
    res2 = urllib.request.urlopen(req2)
    print(res2.read())
except Exception as e:
    if hasattr(e, 'read'): print("Error:", e.read().decode())
    else: print("Error:", e)

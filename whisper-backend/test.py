import requests

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzU4Mjc3OTAxLCJleHAiOjE3NTgyNzk3MDEsInR5cGUiOiJhY2Nlc3MiLCJqdGkiOiJiNzgxYWNkNC02NDE5LTQ4YjAtOWQyZC1lYzU2NjM0ZjU1NDEiLCJ1c2VyIjp7ImlkIjoxLCJ1c2VybmFtZSI6ImFrYWRtaW4iLCJlbWFpbCI6ImFkbWluQGxvY2FsLmNvbSIsInJvbGUiOiJhZG1pbiIsImZ1bGxfbmFtZSI6ImF1dGhlbnRpayBEZWZhdWx0IEFkbWluIn19.qcVd_WhTmupqSk8CRrBTX3spjBKhqcS3GmyZDwKtNXg"

headers = {"Authorization": f"Bearer {token}"}
base_url = "http://localhost:8000/api/prompts"

print("1. Adding favorite...")
r = requests.post(f"{base_url}/1/favorite", headers=headers)
print(f"   Response: {r.json()}")

print("\n2. Getting favorites...")
r = requests.get(f"{base_url}/favorites", headers=headers)
print(f"   Count: {r.json()['count']}")

print("\n3. Getting all prompts...")
r = requests.get(base_url, headers=headers)
prompts = r.json()['prompts']
for p in prompts[:3]:
    print(f"   - {p['title']}: favorited={p.get('is_favorited', False)}")
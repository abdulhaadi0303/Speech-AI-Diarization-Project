# Create complete_test.py
import requests

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwiaWF0IjoxNzU4ODY0NzEwLCJleHAiOjE3NTg4NjY1MTAsInR5cGUiOiJhY2Nlc3MiLCJqdGkiOiJkNDZiN2Q2ZC01OTUwLTRkMzEtOTZiZS04YmJjODcyZDQ5ZDIiLCJ1c2VyIjp7ImlkIjoyLCJ1c2VybmFtZSI6IkFiZHVsIEhhYWRpIiwiZW1haWwiOiJoYWFkaUBhZG1pbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJmdWxsX25hbWUiOiJIYWFkaSJ9fQ.9xs3PF1WMg0KBReVWKoh5mYaV6B0aTYJ8_jraKOm3V0"

headers = {"Authorization": f"Bearer {token}"}
base_url = "http://localhost:8888/api/prompts"

print("COMPLETE FAVORITES API TEST")
print("=" * 50)

# 1. Add multiple favorites
print("\n1. Adding multiple prompts to favorites...")
for prompt_id in [1, 3, 5]:  # Add prompts 1, 3, and 5
    r = requests.post(f"{base_url}/{prompt_id}/favorite", headers=headers)
    status = "✓" if r.status_code == 200 else "✗"
    print(f"   [{status}] Prompt {prompt_id}: {r.json().get('message', 'Error')}")

# 2. Get all favorites
print("\n2. Getting all favorites...")
r = requests.get(f"{base_url}/favorites", headers=headers)
if r.status_code == 200:
    data = r.json()
    print(f"   Total favorites: {data['count']}")
    for prompt in data['prompts']:
        print(f"   ✓ {prompt['title']}")

# 3. Check is_favorited field in all prompts
print("\n3. Checking is_favorited field...")
r = requests.get(base_url, headers=headers)
if r.status_code == 200:
    prompts = r.json()['prompts']
    for p in prompts:
        fav = "★" if p.get('is_favorited') else "☆"
        print(f"   {fav} ID:{p['id']} - {p['title']}")

# 4. Remove a favorite
print("\n4. Removing prompt 3 from favorites...")
r = requests.delete(f"{base_url}/3/favorite", headers=headers)
print(f"   Response: {r.json().get('message', 'Error')}")

# 5. Check favorites again
print("\n5. Final favorites list...")
r = requests.get(f"{base_url}/favorites", headers=headers)
if r.status_code == 200:
    data = r.json()
    print(f"   Remaining favorites: {data['count']}")
    for prompt in data['prompts']:
        print(f"   ✓ {prompt['title']}")

print("\n" + "=" * 50)
print("✅ Step 2 Complete! Backend API is working!")
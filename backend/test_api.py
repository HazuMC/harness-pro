import sys
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_makestory_api():
    print("Testing POST /makestory ...")
    payload = {
        "story": "Một thám tử cyberpunk điều tra vụ trộm ký ức tại thành phố Neo-Hà Nội năm 2088",
        "story_type": "short",
        "style": "Cyberpunk Neon"
    }
    response = client.post("/makestory", json=payload)
    print(f"Status Code: {response.status_code}")
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()
    assert data["success"] is True
    print(f"Response message: {data['message']}")
    print(f"Story title: {data['data']['title']}")
    print(f"Number of scenes: {len(data['data']['scenes'])}")
    for sc in data['data']['scenes']:
        print(f"  Scene {sc['scene_number']}: {sc['description'][:60]}... -> Visual: {sc['visual_prompt'][:50]}...")
    print(" API Test POST /makestory passed successfully!")


if __name__ == "__main__":
    test_makestory_api()

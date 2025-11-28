import requests
import json

# Test the deployments API
url = "http://localhost:8000/api/deployments/"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY0MzUwODQ5LCJpYXQiOjE3NjQzNDcyNDksImp0aSI6ImRmNjI0OWU4MmRmYzRiMTg5YTcyNjNjN2NjZGM1YzAyIiwidXNlcl9pZCI6IjEifQ.HBnZvBnE0PS2--dqGuvxCPDeiLQihPzr1BJq9qfsYZU"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Content: {response.text}")
    
    # Try to parse JSON
    try:
        data = response.json()
        print(f"Parsed JSON: {json.dumps(data, indent=2)}")
    except Exception as e:
        print(f"Could not parse JSON: {e}")
        
except Exception as e:
    print(f"Request failed: {e}")
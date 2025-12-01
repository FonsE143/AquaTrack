import os
import django
import requests
import json

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from core.models import User, Profile
from django.contrib.auth.hashers import make_password

def test_employee_creation():
    """
    Test script to verify staff and driver creation functionality
    """
    print("=== Employee Creation Test ===\n")
    
    # Test data
    test_staff = {
        'username': 'test_staff_001',
        'first_name': 'Test',
        'last_name': 'Staff',
        'email': 'test.staff@example.com',
        'phone': '09123456789',
        'role': 'staff'
    }
    
    test_driver = {
        'username': 'test_driver_001',
        'first_name': 'Test',
        'last_name': 'Driver',
        'email': 'test.driver@example.com',
        'phone': '09987654321',
        'role': 'driver'
    }
    
    # Base URL for the API
    base_url = 'http://127.0.0.1:8000/api'
    
    print("1. Testing Staff Creation...")
    try:
        response = requests.post(f'{base_url}/staff/', json=test_staff)
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 201:
            print("   ✓ Staff created successfully")
            print(f"   Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"   ✗ Staff creation failed: {response.text}")
    except Exception as e:
        print(f"   ✗ Staff creation error: {e}")
    
    print("\n2. Testing Driver Creation...")
    try:
        response = requests.post(f'{base_url}/drivers/', json=test_driver)
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 201:
            print("   ✓ Driver created successfully")
            print(f"   Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"   ✗ Driver creation failed: {response.text}")
    except Exception as e:
        print(f"   ✗ Driver creation error: {e}")
    
    print("\n3. Checking database records...")
    try:
        # Check users
        users = User.objects.filter(username__in=['test_staff_001', 'test_driver_001'])
        print(f"   Found {users.count()} test users:")
        for user in users:
            print(f"   - User: {user.username} (ID: {user.id})")
            
        # Check profiles
        profiles = Profile.objects.filter(user__username__in=['test_staff_001', 'test_driver_001'])
        print(f"   Found {profiles.count()} test profiles:")
        for profile in profiles:
            print(f"   - Profile: {profile.user.username} (ID: {profile.id}, Role: {profile.role})")
    except Exception as e:
        print(f"   ✗ Database check error: {e}")
    
    print("\n4. Testing duplicate prevention...")
    try:
        # Try to create the same staff again
        response = requests.post(f'{base_url}/staff/', json=test_staff)
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 400:
            print("   ✓ Duplicate prevention working correctly")
            print(f"   Error message: {response.json().get('error', 'No error message')}")
        else:
            print(f"   ✗ Duplicate prevention failed: {response.text}")
    except Exception as e:
        print(f"   ✗ Duplicate test error: {e}")
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    test_employee_creation()
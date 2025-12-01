import requests
import json

# Base URL for the API
BASE_URL = "http://127.0.0.1:8000"

def test_staff_creation():
    print("Testing staff creation via API...")
    
    # First, let's try to get an auth token
    auth_data = {
        "username": "admin1",
        "password": "testpassword123"  # Updated password
    }
    
    try:
        # Try to get auth token
        auth_response = requests.post(f"{BASE_URL}/api/auth/token/", data=auth_data)
        print(f"Auth response status: {auth_response.status_code}")
        
        if auth_response.status_code == 200:
            token_data = auth_response.json()
            access_token = token_data.get('access')
            print(f"Got access token: {access_token[:10]}...")
            
            # Now try to create a staff member
            staff_data = {
                "username": "completely_new_staff_user_12345",  # Use a completely new username
                "first_name": "Staff",
                "last_name": "Three",
                "email": "staff3@test.com",
                "phone": "09123456789"
                # Don't send role field - it will be set by the StaffViewSet
            }
            
            print(f"Sending staff data: {staff_data}")
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            create_response = requests.post(
                f"{BASE_URL}/api/staff/",
                headers=headers,
                data=json.dumps(staff_data)
            )
            
            print(f"Create staff response status: {create_response.status_code}")
            print(f"Create staff response data: {create_response.json()}")
            
            if create_response.status_code == 201:
                print("SUCCESS: Staff member created successfully!")
                # Clean up
                try:
                    # We'd need to delete the user here if we had the ID
                    pass
                except Exception as e:
                    print(f"Cleanup error: {e}")
            else:
                print("FAILED to create staff member")
        else:
            print(f"Auth failed: {auth_response.status_code}")
            print(auth_response.text)
            
    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    test_staff_creation()
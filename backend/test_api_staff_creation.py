import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

import json
from core.models import User, Profile
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

def test_api_staff_creation():
    print("Testing API staff creation...")
    
    # Clean up any existing test users
    User.objects.filter(username__in=['api_admin_user', 'api_staff_user']).delete()
    
    # Create an admin user for authentication
    admin_user = User.objects.create_user(
        username='api_admin_user',
        email='admin@test.com',
        password='adminpass123'
    )
    admin_profile = Profile.objects.create(
        user=admin_user,
        role='admin',
        first_name='API',
        last_name='Admin'
    )
    
    # Create JWT token for admin user
    refresh = RefreshToken.for_user(admin_user)
    access_token = str(refresh.access_token)
    
    # Create API client
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # Test data for staff creation
    staff_data = {
        'username': 'api_staff_user',
        'first_name': 'API',
        'last_name': 'Staff',
        'email': 'api.staff@test.com',
        'phone': '09123456789'
    }
    
    print(f"Creating staff with data: {staff_data}")
    
    # Make POST request to create staff
    response = client.post('/api/staff/', staff_data, format='json')
    
    print(f"Response status code: {response.status_code}")
    print(f"Response data: {response.data}")
    
    if response.status_code == 201:
        print("Successfully created staff member via API!")
        # Verify the profile was created with the correct role
        try:
            profile = Profile.objects.get(user__username='api_staff_user')
            print(f"Created profile: {profile}")
            print(f"Profile role: {profile.role}")
        except Profile.DoesNotExist:
            print("Profile was not created")
    else:
        print("Failed to create staff member via API")
        print(f"Response: {response.data}")
    
    # Clean up
    User.objects.filter(username__in=['api_admin_user', 'api_staff_user']).delete()
    print("Cleaned up test users")

if __name__ == "__main__":
    test_api_staff_creation()
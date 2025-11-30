import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from django.contrib.auth import authenticate
from rest_framework.test import APIRequestFactory
from core.api.views import StaffViewSet, DriverViewSet
from rest_framework_simplejwt.tokens import RefreshToken

def test_listing():
    print("Testing staff and driver listing...")
    
    # Authenticate as admin
    user = authenticate(username='admin', password='adminpass')
    if not user:
        print("Admin authentication failed")
        return
    
    print(f"Admin authenticated: {user is not None}")
    
    # Create request factory
    factory = APIRequestFactory()
    
    # Generate JWT token
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    # Test 1: List staff members
    print("\n--- Listing Staff Members ---")
    request = factory.get('/staff/')
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
    request.user = user
    
    viewset = StaffViewSet.as_view({'get': 'list'})
    response = viewset(request)
    
    print(f"Staff listing response status: {response.status_code}")
    if response.status_code == 200:
        print(f"Number of staff members: {len(response.data) if isinstance(response.data, list) else 'N/A'}")
        if isinstance(response.data, list) and len(response.data) > 0:
            print(f"First staff member: {response.data[0]}")
    
    # Test 2: List drivers
    print("\n--- Listing Drivers ---")
    request = factory.get('/drivers/')
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
    request.user = user
    
    viewset = DriverViewSet.as_view({'get': 'list'})
    response = viewset(request)
    
    print(f"Driver listing response status: {response.status_code}")
    if response.status_code == 200:
        print(f"Number of drivers: {len(response.data) if isinstance(response.data, list) else 'N/A'}")
        if isinstance(response.data, list) and len(response.data) > 0:
            print(f"First driver: {response.data[0]}")

if __name__ == "__main__":
    test_listing()
import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from django.contrib.auth import authenticate
from rest_framework.test import APIRequestFactory
from core.api.views import StaffViewSet, DriverViewSet
from rest_framework_simplejwt.tokens import RefreshToken

def test_direct_creation():
    print("Testing direct staff and driver creation...")
    
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
    
    # Test 1: Create a staff member
    print("\n--- Creating Staff Member ---")
    request = factory.post('/staff/', {
        'username': 'directstaff1', 
        'first_name': 'Direct', 
        'last_name': 'Staff', 
        'email': 'directstaff1@example.com', 
        'phone': '1111111111'
    }, format='json')
    
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
    request.user = user
    
    viewset = StaffViewSet.as_view({'post': 'create'})
    response = viewset(request)
    
    print(f"Staff creation response status: {response.status_code}")
    print(f"Staff creation response data: {response.data}")
    
    # Test 2: Create a driver
    print("\n--- Creating Driver ---")
    request = factory.post('/drivers/', {
        'username': 'directdriver1', 
        'first_name': 'Direct', 
        'last_name': 'Driver', 
        'email': 'directdriver1@example.com', 
        'phone': '2222222222'
    }, format='json')
    
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
    request.user = user
    
    viewset = DriverViewSet.as_view({'post': 'create'})
    response = viewset(request)
    
    print(f"Driver creation response status: {response.status_code}")
    print(f"Driver creation response data: {response.data}")

if __name__ == "__main__":
    test_direct_creation()
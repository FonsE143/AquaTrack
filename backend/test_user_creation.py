import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from django.contrib.auth import authenticate
from rest_framework.test import APIRequestFactory
from core.api.views import UsersViewSet
from rest_framework_simplejwt.tokens import RefreshToken

def test_user_creation():
    print("Testing user creation through UsersViewSet...")
    
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
    
    # Create a POST request to create a driver
    request = factory.post('/users/', {
        'username': 'testdriver2', 
        'first_name': 'Test2', 
        'last_name': 'Driver2', 
        'email': 'testdriver2@example.com', 
        'phone': '1234567892', 
        'role': 'driver'
    }, format='json')
    
    # Set authorization header
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
    
    # Set user on request
    request.user = user
    
    # Create viewset instance
    viewset = UsersViewSet()
    
    # Call the create method
    response = viewset.create(request)
    
    print(f"Response status: {response.status_code}")
    print(f"Response data: {response.data}")

if __name__ == "__main__":
    test_user_creation()
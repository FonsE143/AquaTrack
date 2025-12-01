import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

# Import the correct User model
from core.models import User, Profile
from core.api.views import StaffViewSet
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request
from django.contrib.auth.models import AnonymousUser

def test_staff_creation():
    print("Testing staff creation with sample data...")
    
    # Clean up any existing test users
    try:
        User.objects.filter(username__in=['testadmin', 'staff3']).delete()
        print("Cleaned up existing test users")
    except Exception as e:
        print(f"Error cleaning up test users: {e}")
    
    # Create a test admin user
    try:
        admin_user = User.objects.create_user(
            username='testadmin_unique',
            email='admin@test.com',
            password='testpass123'
        )
        # Create admin profile
        admin_profile = Profile.objects.create(
            user=admin_user,
            role='admin',
            first_name='Test',
            last_name='Admin'
        )
        print(f"Created admin user: {admin_user.username}")
    except Exception as e:
        print(f"Error creating admin user: {e}")
        return
    
    # Test data for staff creation
    test_data = {
        'username': 'staff3_test',
        'first_name': 'Staff',
        'last_name': 'Three',
        'email': 'staff3@test.com',
        'phone': '09123456789'
    }
    
    print(f"Test data: {test_data}")
    
    # Create request factory
    factory = APIRequestFactory()
    
    # Create POST request
    request = factory.post('/api/staff/', test_data, format='json')
    request.user = admin_user
    
    # Wrap in DRF Request
    drf_request = Request(request)
    
    # Create StaffViewSet instance
    viewset = StaffViewSet()
    viewset.request = drf_request
    viewset.format_kwarg = None
    
    try:
        # Try to create staff member
        response = viewset.create(drf_request)
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.data}")
        
        if response.status_code == 201:
            print("SUCCESS: Staff member created successfully!")
            # Clean up - delete the created user
            try:
                created_user = User.objects.get(username='staff3_test')
                created_user.delete()
                print("Cleaned up test user")
            except User.DoesNotExist:
                print("Test user not found for cleanup")
        elif response.status_code == 400:
            print("VALIDATION ERROR:")
            print(response.data)
        else:
            print(f"UNEXPECTED RESPONSE: {response.status_code}")
            print(response.data)
            
    except Exception as e:
        print(f"ERROR during staff creation: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_staff_creation()
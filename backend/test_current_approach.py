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
from core.api.views import StaffViewSet, DriverViewSet
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request

def test_current_approach():
    print("Testing current approach with StaffViewSet and DriverViewSet...")
    
    # Clean up any existing test users
    try:
        User.objects.filter(username__in=['test_staff_current', 'test_driver_current']).delete()
        print("Cleaned up existing test users")
    except Exception as e:
        print(f"Error cleaning up test users: {e}")
    
    # Try to get existing admin user
    try:
        admin_user = User.objects.get(username='admin1')
        print(f"Using existing admin user: {admin_user.username}")
    except User.DoesNotExist:
        print("No admin user found, skipping test")
        return
    
    # Test data for staff creation
    staff_data = {
        'username': 'test_staff_current',
        'first_name': 'Staff',
        'last_name': 'Current',
        'email': 'staff.current@test.com',
        'phone': '09123456789'
    }
    
    print(f"Staff data: {staff_data}")
    
    # Create request factory
    factory = APIRequestFactory()
    
    # Create POST request for staff
    request = factory.post('/api/staff/', staff_data)
    request.user = admin_user
    
    # Wrap in DRF Request
    drf_request = Request(request)
    
    # Create StaffViewSet instance
    staff_viewset = StaffViewSet()
    staff_viewset.request = drf_request
    staff_viewset.format_kwarg = None
    
    try:
        # Try to create staff member
        response = staff_viewset.create(drf_request)
        print(f"Staff creation response status: {response.status_code}")
        if response.status_code == 201:
            print("SUCCESS: Staff member created successfully!")
            print(f"Staff response data: {response.data}")
            
            # Verify the profile was created with the correct role
            try:
                profile = Profile.objects.get(user__username='test_staff_current')
                print(f"Verified profile role: {profile.role}")
            except Profile.DoesNotExist:
                print("ERROR: Could not find created profile")
        else:
            print(f"Staff creation failed: {response.data}")
    except Exception as e:
        print(f"Error creating staff member: {e}")
        import traceback
        traceback.print_exc()
    
    # Test data for driver creation
    driver_data = {
        'username': 'test_driver_current',
        'first_name': 'Driver',
        'last_name': 'Current',
        'email': 'driver.current@test.com',
        'phone': '09987654321'
    }
    
    print(f"\nDriver data: {driver_data}")
    
    # Create POST request for driver
    request = factory.post('/api/drivers/', driver_data)
    request.user = admin_user
    
    # Wrap in DRF Request
    drf_request = Request(request)
    
    # Create DriverViewSet instance
    driver_viewset = DriverViewSet()
    driver_viewset.request = drf_request
    driver_viewset.format_kwarg = None
    
    try:
        # Try to create driver member
        response = driver_viewset.create(drf_request)
        print(f"Driver creation response status: {response.status_code}")
        if response.status_code == 201:
            print("SUCCESS: Driver member created successfully!")
            print(f"Driver response data: {response.data}")
            
            # Verify the profile was created with the correct role
            try:
                profile = Profile.objects.get(user__username='test_driver_current')
                print(f"Verified profile role: {profile.role}")
            except Profile.DoesNotExist:
                print("ERROR: Could not find created profile")
        else:
            print(f"Driver creation failed: {response.data}")
    except Exception as e:
        print(f"Error creating driver member: {e}")
        import traceback
        traceback.print_exc()
    
    # Clean up
    try:
        User.objects.filter(username__in=['test_staff_current', 'test_driver_current']).delete()
        print("\nCleaned up test users")
    except Exception as e:
        print(f"Error cleaning up: {e}")

if __name__ == "__main__":
    test_current_approach()
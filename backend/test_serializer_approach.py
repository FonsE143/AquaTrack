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
from core.api.serializers import ProfileSerializer

def test_serializer_approach():
    print("Testing serializer approach with context...")
    
    # Clean up any existing test users
    try:
        User.objects.filter(username__in=['test_staff_serializer', 'test_driver_serializer']).delete()
        print("Cleaned up existing test users")
    except Exception as e:
        print(f"Error cleaning up test users: {e}")
    
    # Test data for staff creation
    staff_data = {
        'username': 'test_staff_serializer',
        'first_name': 'Staff',
        'last_name': 'Serializer',
        'email': 'staff.serializer@test.com',
        'phone': '09123456789'
    }
    
    print(f"Staff data: {staff_data}")
    
    # Create serializer instance with role in context
    staff_serializer = ProfileSerializer(data=staff_data, context={'role': 'staff'})
    
    if staff_serializer.is_valid():
        try:
            staff_profile = staff_serializer.save()
            print(f"SUCCESS: Staff created with role '{staff_profile.role}'")
        except Exception as e:
            print(f"Error creating staff: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"Staff serializer errors: {staff_serializer.errors}")
    
    # Test data for driver creation
    driver_data = {
        'username': 'test_driver_serializer',
        'first_name': 'Driver',
        'last_name': 'Serializer',
        'email': 'driver.serializer@test.com',
        'phone': '09987654321'
    }
    
    print(f"\nDriver data: {driver_data}")
    
    # Create serializer instance with role in context
    driver_serializer = ProfileSerializer(data=driver_data, context={'role': 'driver'})
    
    if driver_serializer.is_valid():
        try:
            driver_profile = driver_serializer.save()
            print(f"SUCCESS: Driver created with role '{driver_profile.role}'")
        except Exception as e:
            print(f"Error creating driver: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"Driver serializer errors: {driver_serializer.errors}")
    
    # Clean up
    try:
        User.objects.filter(username__in=['test_staff_serializer', 'test_driver_serializer']).delete()
        print("\nCleaned up test users")
    except Exception as e:
        print(f"Error cleaning up: {e}")

if __name__ == "__main__":
    test_serializer_approach()
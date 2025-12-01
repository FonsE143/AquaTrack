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

def final_test():
    print("Final test of the complete solution...")
    
    # Clean up any existing test users
    try:
        User.objects.filter(username__in=['final_test_staff', 'final_test_driver']).delete()
        print("Cleaned up existing test users")
    except Exception as e:
        print(f"Error cleaning up test users: {e}")
    
    # Test creating a staff member directly through the ProfileSerializer with context
    from core.api.serializers import ProfileSerializer
    
    # Test staff creation
    staff_data = {
        'username': 'final_test_staff',
        'first_name': 'Final',
        'last_name': 'Staff',
        'email': 'final.staff@test.com',
        'phone': '09123456789'
    }
    
    print(f"Creating staff with data: {staff_data}")
    
    # Create serializer with role in context
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
    
    # Test driver creation
    driver_data = {
        'username': 'final_test_driver',
        'first_name': 'Final',
        'last_name': 'Driver',
        'email': 'final.driver@test.com',
        'phone': '09987654321'
    }
    
    print(f"\nCreating driver with data: {driver_data}")
    
    # Create serializer with role in context
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
        User.objects.filter(username__in=['final_test_staff', 'final_test_driver']).delete()
        print("\nCleaned up test users")
    except Exception as e:
        print(f"Error cleaning up: {e}")

if __name__ == "__main__":
    final_test()
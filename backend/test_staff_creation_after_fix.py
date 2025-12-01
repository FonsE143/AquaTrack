import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from core.models import User, Profile
from core.api.serializers import ProfileSerializer

def test_staff_creation_after_fix():
    print("Testing staff creation after applying the fix...")
    
    # Clean up any existing test user
    User.objects.filter(username='test_staff_after_fix').delete()
    
    # Test data for staff creation
    staff_data = {
        'username': 'test_staff_after_fix',
        'first_name': 'Test',
        'last_name': 'Staff',
        'email': 'test.staff@example.com',
        'phone': '09123456789',
        'role': 'staff'
    }
    
    print(f"Creating staff with data: {staff_data}")
    
    # Create serializer instance
    serializer = ProfileSerializer(data=staff_data)
    
    # Check if serializer is valid
    print(f"Serializer is valid: {serializer.is_valid()}")
    
    if not serializer.is_valid():
        print(f"Serializer errors: {serializer.errors}")
        return
    
    try:
        # Create the staff profile
        profile = serializer.save()
        print(f"SUCCESS: Created staff profile: {profile}")
        print(f"Profile role: {profile.role}")
        print(f"Profile user: {profile.user.username}")
    except Exception as e:
        print(f"ERROR: Failed to create staff profile: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Clean up
    try:
        profile.user.delete()
        print("Cleaned up test user")
    except Exception as e:
        print(f"Error cleaning up: {e}")

if __name__ == "__main__":
    test_staff_creation_after_fix()
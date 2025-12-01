import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from core.models import User, Profile
from core.api.serializers import ProfileSerializer

def test_staff_creation():
    print("Testing staff creation with sample data...")
    
    # Clean up any existing test users
    try:
        User.objects.filter(username__in=['test_staff_user', 'test_admin_user']).delete()
        print("Cleaned up existing test users")
    except Exception as e:
        print(f"Error cleaning up test users: {e}")
    
    # Create a test admin user
    try:
        admin_user = User.objects.create_user(
            username='test_admin_user',
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
    staff_data = {
        'username': 'test_staff_user',
        'first_name': 'John',
        'last_name': 'Staff',
        'email': 'john.staff@test.com',
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
        print(f"Successfully created staff profile: {profile}")
        print(f"Profile role: {profile.role}")
        print(f"Profile user: {profile.user.username}")
    except Exception as e:
        print(f"Error creating staff profile: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Clean up
    try:
        profile.user.delete()
        admin_user.delete()
        print("Cleaned up test users")
    except Exception as e:
        print(f"Error cleaning up: {e}")

if __name__ == "__main__":
    test_staff_creation()
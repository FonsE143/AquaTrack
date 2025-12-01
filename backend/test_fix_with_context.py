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

def test_fix_with_context():
    print("Testing fix with context...")
    
    # Clean up any existing test users
    try:
        User.objects.filter(username__in=['test_staff_context']).delete()
        print("Cleaned up existing test users")
    except Exception as e:
        print(f"Error cleaning up test users: {e}")
    
    # Test data for staff creation
    test_data = {
        'username': 'test_staff_context',
        'first_name': 'Test',
        'last_name': 'Staff',
        'email': 'test.staff@test.com',
        'phone': '09123456789'
    }
    
    print(f"Test data: {test_data}")
    
    # Create serializer instance with role in context
    serializer = ProfileSerializer(data=test_data, context={'role': 'staff'})
    
    # Check if serializer is valid
    print(f"Serializer is valid: {serializer.is_valid()}")
    
    if not serializer.is_valid():
        print(f"Serializer errors: {serializer.errors}")
        return
    
    print(f"Validated data: {serializer.validated_data}")
    
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
        print("Cleaned up test users")
    except Exception as e:
        print(f"Error cleaning up: {e}")

if __name__ == "__main__":
    test_fix_with_context()
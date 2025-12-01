import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from core.models import User, Profile
from core.api.serializers import ProfileSerializer

def debug_helper():
    print("Debugging the helper method...")
    
    # Clean up any existing test user
    User.objects.filter(username='debug_helper_user').delete()
    
    # Create a user (this will trigger the signal)
    print("Creating user...")
    user = User.objects.create_user(
        username='debug_helper_user',
        email='test@example.com',
        password='testpass123'
    )
    print(f"Created user: {user}")
    
    # Check what profile was created by the signal
    try:
        profile = user.profile
        print(f"Signal-created profile: {profile}")
        print(f"Signal-created profile role: {profile.role}")
    except Profile.DoesNotExist:
        print("No profile was created by signal")
        profile = None
    
    # Now let's test our helper method
    print("\nTesting _update_or_create_profile method...")
    validated_data = {
        'role': 'staff',
        'first_name': 'Staff',
        'last_name': 'Member',
        'phone': '09123456789'
    }
    
    # Call the helper method directly
    serializer = ProfileSerializer()
    try:
        result_profile = serializer._update_or_create_profile(user, validated_data)
        print(f"SUCCESS: Created/updated profile: {result_profile}")
        print(f"Profile role: {result_profile.role}")
    except Exception as e:
        print(f"ERROR: {e}")
    
    # Clean up
    user.delete()
    print("Cleaned up test user")

if __name__ == "__main__":
    debug_helper()
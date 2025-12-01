import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from core.models import User, Profile

def debug_signal():
    print("Debugging signal behavior...")
    
    # Clean up any existing test user
    User.objects.filter(username='debug_signal_user').delete()
    
    # Let's see what happens when we create a user
    print("Creating user...")
    user = User.objects.create_user(
        username='debug_signal_user',
        email='test@example.com',
        password='testpass123'
    )
    print(f"Created user: {user}")
    
    # Check if profile was automatically created
    try:
        profile = user.profile
        print(f"Profile automatically created: {profile}")
        print(f"Profile role: {profile.role}")
    except Profile.DoesNotExist:
        print("No profile was automatically created")
    
    # Now let's try to create a staff profile for this user
    print("\nTrying to create staff profile...")
    try:
        staff_profile = Profile.objects.create(
            user=user,
            role='staff',
            first_name='Staff',
            last_name='Member'
        )
        print(f"Created staff profile: {staff_profile}")
    except Exception as e:
        print(f"Failed to create staff profile: {e}")
    
    # Clean up
    user.delete()
    print("Cleaned up test user")

if __name__ == "__main__":
    debug_signal()
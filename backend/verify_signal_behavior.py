import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from core.models import User, Profile

def verify_signal_behavior():
    print("Verifying signal behavior...")
    
    # Clean up any existing test user
    User.objects.filter(username='signal_test_user').delete()
    
    # Create a user - this should trigger the signal
    print("Creating user...")
    user = User.objects.create_user(
        username='signal_test_user',
        email='test@example.com',
        password='testpass123'
    )
    print(f"Created user: {user}")
    
    # Check if profile was automatically created
    try:
        profile = user.profile
        print(f"Profile automatically created: {profile}")
        print(f"Profile role: {profile.role}")
        
        # Try to change the role to staff
        print("Changing role to staff...")
        profile.role = 'staff'
        profile.save()
        print(f"Updated profile: {profile}")
        print(f"Updated profile role: {profile.role}")
    except Profile.DoesNotExist:
        print("No profile was automatically created")
    
    # Clean up
    user.delete()
    print("Cleaned up test user")

if __name__ == "__main__":
    verify_signal_behavior()
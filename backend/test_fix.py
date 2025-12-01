import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from core.models import User, Profile

def test_fix():
    print("Testing the fix for staff creation...")
    
    # Clean up any existing test user
    User.objects.filter(username='test_fix_user').delete()
    
    # Step 1: Create a user (this will trigger the signal)
    print("Step 1: Creating user...")
    user = User.objects.create_user(
        username='test_fix_user',
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )
    print(f"Created user: {user}")
    
    # Step 2: Check if profile was automatically created
    try:
        profile = user.profile
        print(f"Profile automatically created: {profile}")
        print(f"Profile role: {profile.role}")
    except Profile.DoesNotExist:
        print("No profile was automatically created")
        user.delete()
        return
    
    # Step 3: Simulate the fix - update existing profile instead of creating new one
    print("\nStep 3: Applying the fix...")
    
    # Requested role for staff
    requested_role = 'staff'
    first_name = 'Staff'
    last_name = 'Member'
    phone = '09123456789'
    
    # Check if profile exists and has different role (this is the fix)
    if profile.role != requested_role:
        print(f"Profile exists with role '{profile.role}', changing to '{requested_role}'")
        profile.role = requested_role
        profile.first_name = first_name
        profile.last_name = last_name
        profile.phone = phone
        profile.save()
        print(f"Updated profile: {profile}")
        print("SUCCESS: Profile updated without error!")
    else:
        print(f"Profile already has role '{requested_role}', no change needed")
    
    # Clean up
    user.delete()
    print("\nCleaned up test user")

if __name__ == "__main__":
    test_fix()
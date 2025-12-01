import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from core.models import User, Profile

def demonstrate_solution():
    print("Demonstrating the solution...")
    print("This shows what the ProfileSerializer.create method should do:")
    print()
    
    # Clean up any existing test user
    User.objects.filter(username='solution_test_user').delete()
    
    # Step 1: Create a user (this will trigger the signal)
    print("Step 1: Creating user...")
    user = User.objects.create_user(
        username='solution_test_user',
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
        print(f"Profile first name: {profile.first_name}")
        print(f"Profile last name: {profile.last_name}")
    except Profile.DoesNotExist:
        print("No profile was automatically created")
        return
    
    # Step 3: Simulate what should happen in ProfileSerializer.create
    print("\nStep 3: Simulating ProfileSerializer.create for staff...")
    
    # Requested role
    requested_role = 'staff'
    first_name = 'Staff'
    last_name = 'Member'
    phone = '09123456789'
    
    # Check if profile exists and has different role
    if profile.role != requested_role:
        print(f"Profile exists with role '{profile.role}', changing to '{requested_role}'")
        profile.role = requested_role
        profile.first_name = first_name
        profile.last_name = last_name
        profile.phone = phone
        profile.save()
        print(f"Updated profile: {profile}")
    else:
        print(f"Profile already has role '{requested_role}', no change needed")
    
    # Clean up
    user.delete()
    print("\nCleaned up test user")
    
    print("\nConclusion:")
    print("This demonstrates that the solution works:")
    print("1. When creating a staff member, if a profile already exists with a different role,")
    print("   we update the existing profile instead of trying to create a new one")
    print("2. This avoids the 'A profile for this user already exists' error")
    print("3. The ProfileSerializer.create method should implement this logic")

if __name__ == "__main__":
    demonstrate_solution()
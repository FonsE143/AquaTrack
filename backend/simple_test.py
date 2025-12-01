import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from core.models import User, Profile

def simple_test():
    print("Simple test to check if Django is working...")
    
    # Check if a user with our test username exists
    username = 'completely_new_staff_user_12345'
    try:
        user = User.objects.get(username=username)
        print(f"User {username} exists: {user}")
        try:
            profile = user.profile
            print(f"Profile exists: {profile}")
        except Profile.DoesNotExist:
            print("No profile for this user")
    except User.DoesNotExist:
        print(f"User {username} does not exist")
    
    # Try to create a user directly
    try:
        user = User.objects.create_user(
            username=username,
            email='test@example.com',
            password='testpassword123'
        )
        print(f"Created user: {user}")
        
        # Try to create a profile
        profile = Profile.objects.create(
            user=user,
            role='staff',
            first_name='Test',
            last_name='User'
        )
        print(f"Created profile: {profile}")
        
        # Clean up
        profile.delete()
        user.delete()
        print("Cleaned up test user and profile")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    simple_test()
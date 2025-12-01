import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from core.models import User, Profile

def check_user(username):
    print(f"Checking for user with username: {username}")
    
    # Check if user exists
    try:
        user = User.objects.filter(username=username)
        print(f"Users found with this username: {user.count()}")
        for u in user:
            print(f"  - User ID: {u.id}, Username: {u.username}")
            
            # Check if profile exists for this user
            try:
                profile = Profile.objects.filter(user=u)
                print(f"  - Profiles for this user: {profile.count()}")
                for p in profile:
                    print(f"    - Profile ID: {p.id}, Role: {p.role}")
            except Exception as e:
                print(f"  - Error checking profiles: {e}")
    except Exception as e:
        print(f"Error checking users: {e}")
    
    print("\nAll users in database:")
    all_users = User.objects.all()
    for u in all_users:
        print(f"  - User ID: {u.id}, Username: {u.username}")
        
    print("\nAll profiles in database:")
    all_profiles = Profile.objects.all()
    for p in all_profiles:
        print(f"  - Profile ID: {p.id}, User ID: {p.user.id}, Username: {p.user.username}, Role: {p.role}")

if __name__ == "__main__":
    # Replace 'testuser' with the username you're having issues with
    check_user('testuser')
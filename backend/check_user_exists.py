import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from core.models import User, Profile

def check_user_exists():
    username = 'completely_new_staff_user_12345'
    print(f"Checking for user with username {username}:")
    
    try:
        user = User.objects.get(username=username)
        print(f"User found: {user}")
        try:
            profile = user.profile
            print(f"Profile found: {profile}")
        except:
            print("No profile for this user")
    except User.DoesNotExist:
        print("User not found")

if __name__ == "__main__":
    check_user_exists()
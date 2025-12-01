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

def check_users():
    print("Checking users in database...")
    
    users = User.objects.all()
    print(f"Total users: {users.count()}")
    
    for user in users:
        print(f"- {user.username} (id: {user.id})")
        try:
            profile = user.profile
            print(f"  Profile: {profile.role}")
        except Profile.DoesNotExist:
            print("  No profile")

if __name__ == "__main__":
    check_users()
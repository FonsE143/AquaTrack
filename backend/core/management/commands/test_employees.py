from django.core.management.base import BaseCommand
from core.models import User, Profile

class Command(BaseCommand):
    help = 'Test employee creation functionality'

    def handle(self, *args, **options):
        self.stdout.write("=== Employee Creation Test ===\n")
        
        # Test data
        test_username = 'test_staff_001'
        
        self.stdout.write(f"1. Checking if user '{test_username}' exists...")
        try:
            user_exists = User.objects.filter(username=test_username).exists()
            if user_exists:
                self.stdout.write(f"   ✓ User '{test_username}' exists")
                user = User.objects.get(username=test_username)
                profile_exists = Profile.objects.filter(user=user).exists()
                if profile_exists:
                    self.stdout.write(f"   ✓ Profile for '{test_username}' exists")
                else:
                    self.stdout.write(f"   ✗ Profile for '{test_username}' does not exist")
            else:
                self.stdout.write(f"   ✗ User '{test_username}' does not exist")
        except Exception as e:
            self.stdout.write(f"   ✗ Error checking user: {e}")
        
        self.stdout.write("\n2. Listing all users and profiles...")
        try:
            users = User.objects.all()
            self.stdout.write(f"   Total users: {users.count()}")
            for user in users:
                self.stdout.write(f"   - User: {user.username} (ID: {user.id})")
                try:
                    profile = Profile.objects.get(user=user)
                    self.stdout.write(f"     Profile: ID {profile.id}, Role: {profile.role}")
                except Profile.DoesNotExist:
                    self.stdout.write(f"     No profile found for this user")
                    
        except Exception as e:
            self.stdout.write(f"   ✗ Error listing users: {e}")
        
        self.stdout.write("\n=== Test Complete ===")
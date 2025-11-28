from core.models import User, Profile

print("=== All Users ===")
users = User.objects.all()
for user in users:
    print(f"Username: {user.username}, Email: {user.email}")

print("\n=== Users with Profiles ===")
profiles = Profile.objects.all()
for profile in profiles:
    print(f"Username: {profile.user.username}, Role: {profile.role}, Name: {profile.first_name} {profile.last_name}")
import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from core.models import User, Profile
from core.api.serializers import ProfileSerializer

def test_manual_creation():
    print('Testing manual creation...')
    data = {
        'username': 'manual_test_user_123',
        'first_name': 'Manual',
        'last_name': 'Test',
        'email': 'manual@test.com',
        'phone': '09123456789',
        'role': 'staff'
    }
    
    serializer = ProfileSerializer(data=data)
    print(f'Serializer is valid: {serializer.is_valid()}')
    
    if not serializer.is_valid():
        print(f'Serializer errors: {serializer.errors}')
    else:
        try:
            profile = serializer.save()
            print(f'Created profile: {profile}')
        except Exception as e:
            print(f'Error creating profile: {e}')
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_manual_creation()
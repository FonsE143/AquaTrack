import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

# Let's add some debug prints to the _update_or_create_profile method
# by monkey patching it

from core.models import User, Profile
from core.api.serializers import ProfileSerializer

# Save the original method
original_method = ProfileSerializer._update_or_create_profile

def debug_update_or_create_profile(self, user, validated_data):
    """Debug version of _update_or_create_profile"""
    print(f"DEBUG: _update_or_create_profile called with user={user}, validated_data={validated_data}")
    
    role = validated_data.get('role', 'customer')
    first_name = validated_data.get('first_name', '')
    last_name = validated_data.get('last_name', '')
    phone = validated_data.get('phone', '')
    
    print(f"DEBUG: Requested role={role}")
    
    # Get existing profile or create new one
    profile, created = Profile.objects.get_or_create(
        user=user,
        defaults={
            'role': role,
            'first_name': first_name,
            'last_name': last_name,
            'phone': phone,
        }
    )
    
    print(f"DEBUG: get_or_create returned profile={profile}, created={created}")
    
    # If profile wasn't created, it already existed, so we need to update it
    if not created:
        print(f"DEBUG: Profile already existed with role={profile.role}")
        # If role is different, update it
        if profile.role != role:
            print(f"DEBUG: Roles are different, updating profile")
            profile.role = role
            profile.first_name = first_name
            profile.last_name = last_name
            profile.phone = phone
            
            # Handle address if provided
            municipality_id = validated_data.get('municipality')
            barangay_id = validated_data.get('barangay')
            address_details = validated_data.get('address_details', '')
            
            if municipality_id and barangay_id and address_details:
                try:
                    municipality = Municipality.objects.get(id=municipality_id)
                    barangay = Barangay.objects.get(id=barangay_id, municipality=municipality)
                    address = Address.objects.create(
                        barangay=barangay,
                        full_address=address_details.strip()
                    )
                    profile.address = address
                except (Municipality.DoesNotExist, Barangay.DoesNotExist):
                    raise serializers.ValidationError('Invalid municipality or barangay selected.')
            
            profile.save()
            print(f"DEBUG: Updated profile to role={profile.role}")
        else:
            # Same role, this is a duplicate
            print(f"DEBUG: Same role, raising error")
            raise serializers.ValidationError('A profile for this user already exists.')
    else:
        print(f"DEBUG: Created new profile with role={profile.role}")
    
    return profile

# Monkey patch the method
ProfileSerializer._update_or_create_profile = debug_update_or_create_profile

def test_with_debug():
    print("Testing with debug prints...")
    
    # Clean up any existing test user
    User.objects.filter(username='debug_prints_user').delete()
    
    # Test data for staff creation
    staff_data = {
        'username': 'debug_prints_user',
        'first_name': 'Test',
        'last_name': 'Staff',
        'email': 'test.staff@example.com',
        'phone': '09123456789',
        'role': 'staff'
    }
    
    print(f"Creating staff with data: {staff_data}")
    
    # Create serializer instance
    serializer = ProfileSerializer(data=staff_data)
    
    # Check if serializer is valid
    print(f"Serializer is valid: {serializer.is_valid()}")
    
    if not serializer.is_valid():
        print(f"Serializer errors: {serializer.errors}")
        return
    
    try:
        # Create the staff profile
        profile = serializer.save()
        print(f"SUCCESS: Created staff profile: {profile}")
        print(f"Profile role: {profile.role}")
        print(f"Profile user: {profile.user.username}")
    except Exception as e:
        print(f"ERROR: Failed to create staff profile: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Clean up
    try:
        profile.user.delete()
        print("Cleaned up test user")
    except Exception as e:
        print(f"Error cleaning up: {e}")

if __name__ == "__main__":
    test_with_debug()
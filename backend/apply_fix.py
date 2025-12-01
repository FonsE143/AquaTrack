import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

# Read the current serializers.py file
file_path = r'd:\pons\3rd yr\new shit\Project for SIA with Copi - Copy\water-station\backend\core\api\serializers.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the specific section we need to replace
old_code = '''                if existing_profile:
                    raise serializers.ValidationError('A profile for this user already exists.')
                else:
                    # User exists but no profile, use existing user
                    user = existing_user'''

new_code = '''                if existing_profile:
                    # If profile exists but role is different, update the role
                    if existing_profile.role != role:
                        existing_profile.role = role
                        existing_profile.first_name = first_name
                        existing_profile.last_name = last_name
                        existing_profile.phone = phone
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
                                existing_profile.address = address
                            except (Municipality.DoesNotExist, Barangay.DoesNotExist):
                                raise serializers.ValidationError('Invalid municipality or barangay selected.')
                        
                        existing_profile.save()
                        return existing_profile
                    else:
                        raise serializers.ValidationError('A profile for this user already exists.')
                else:
                    # User exists but no profile, use existing user
                    user = existing_user'''

# Replace the old code with the new code
updated_content = content.replace(old_code, new_code)

# Write the updated content back to the file
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(updated_content)

print("Fix applied successfully to ProfileSerializer!")
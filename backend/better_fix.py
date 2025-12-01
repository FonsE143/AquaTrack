import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

# Read the current serializers.py file
file_path = r'd:\pons\3rd yr\new shit\Project for SIA with Copi - Copy\water-station\backend\core\api\serializers.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's create a better approach that handles the signal properly
# We'll modify the create method to always check for existing profiles after user creation

old_method = '''    def create(self, validated_data):
        from django.db import transaction
        
        print(f"DEBUG: ProfileSerializer.create called with validated_data: {validated_data}")
        
        # Extract user-related fields
        username = validated_data.get('username')
        email = validated_data.get('email', '')
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        phone = validated_data.get('phone', '')
        role = validated_data.get('role', 'customer')  # Default to customer if not specified
        
        print(f"DEBUG: Extracted username: '{username}' (type: {type(username)})")
        
        # Validate that username is provided
        if not username:
            raise serializers.ValidationError({'username': 'Username is required.'})
        
        # Use atomic transaction to ensure consistency
        with transaction.atomic():
            # Check if user already exists
            existing_user = User.objects.filter(username=username).first()
            if existing_user:
                # Check if profile already exists for this user
                existing_profile = Profile.objects.filter(user=existing_user).first()
                if existing_profile:
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
                    user = existing_user
                    # Create profile for existing user
                    profile_data = {
                        'user': user,
                        'role': role,
                        'first_name': first_name,
                        'last_name': last_name,
                        'phone': phone,
                    }
                    
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
                            profile_data['address'] = address
                        except (Municipality.DoesNotExist, Barangay.DoesNotExist):
                            raise serializers.ValidationError('Invalid municipality or barangay selected.')
                    
                    try:
                        profile = Profile.objects.create(**profile_data)
                    except Exception as e:
                        # Check if it's a duplicate profile error
                        error_message = str(e)
                        if 'duplicate key value violates unique constraint' in error_message and 'user_id' in error_message:
                            # This means a profile for this user already exists
                            raise serializers.ValidationError('A profile for this user already exists.')
                        elif 'UNIQUE constraint failed' in error_message:
                            raise serializers.ValidationError('A profile with this user already exists.')
                        elif 'NOT NULL constraint failed' in error_message:
                            raise serializers.ValidationError('Required profile information is missing.')
                        else:
                            raise serializers.ValidationError(f'Failed to create profile: {error_message}')
                    
                    return profile
            else:
                # Create user
                user_data = {
                    'username': username,
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                }
                
                # Set default password based on role
                if role == 'staff':
                    password = 'staffpassword'
                elif role == 'driver':
                    password = 'driverpassword'
                else:
                    password = 'customerpassword'
                
                try:
                    user = User.objects.create_user(password=password, **user_data)
                except Exception as e:
                    # Provide more specific error information for user creation
                    error_message = str(e)
                    if 'UNIQUE constraint failed' in error_message and 'username' in error_message:
                        raise serializers.ValidationError('A user with this username already exists.')
                    elif 'The given username must be set' in error_message:
                        raise serializers.ValidationError('Username is required.')
                    elif 'username' in error_message and ('too long' in error_message or 'too short' in error_message):
                        raise serializers.ValidationError('Username must be between 3 and 30 characters.')
                    else:
                        raise serializers.ValidationError(f'Failed to create user: {error_message}')
                
                # Create profile
                profile_data = {
                    'user': user,
                    'role': role,
                    'first_name': first_name,
                    'last_name': last_name,
                    'phone': phone,
                }
                
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
                        profile_data['address'] = address
                    except (Municipality.DoesNotExist, Barangay.DoesNotExist):
                        raise serializers.ValidationError('Invalid municipality or barangay selected.')
                
                try:
                    profile = Profile.objects.create(**profile_data)
                except Exception as e:
                    # Check if it's a duplicate profile error
                    error_message = str(e)
                    if 'duplicate key value violates unique constraint' in error_message and 'user_id' in error_message:
                        # This means a profile for this user already exists
                        raise serializers.ValidationError('A profile for this user already exists.')
                    elif 'UNIQUE constraint failed' in error_message:
                        raise serializers.ValidationError('A profile with this user already exists.')
                    elif 'NOT NULL constraint failed' in error_message:
                        raise serializers.ValidationError('Required profile information is missing.')
                    else:
                        raise serializers.ValidationError(f'Failed to create profile: {error_message}')
                
                return profile'''

# New method with better handling of signal-created profiles
new_method = '''    def create(self, validated_data):
        from django.db import transaction
        
        print(f"DEBUG: ProfileSerializer.create called with validated_data: {validated_data}")
        
        # Extract user-related fields
        username = validated_data.get('username')
        email = validated_data.get('email', '')
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        phone = validated_data.get('phone', '')
        role = validated_data.get('role', 'customer')  # Default to customer if not specified
        
        print(f"DEBUG: Extracted username: '{username}' (type: {type(username)})")
        
        # Validate that username is provided
        if not username:
            raise serializers.ValidationError({'username': 'Username is required.'})
        
        # Use atomic transaction to ensure consistency
        with transaction.atomic():
            # Check if user already exists
            existing_user = User.objects.filter(username=username).first()
            if existing_user:
                # User exists, get or update their profile
                return self._update_or_create_profile(existing_user, validated_data)
            else:
                # Create user
                user_data = {
                    'username': username,
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                }
                
                # Set default password based on role
                if role == 'staff':
                    password = 'staffpassword'
                elif role == 'driver':
                    password = 'driverpassword'
                else:
                    password = 'customerpassword'
                
                try:
                    user = User.objects.create_user(password=password, **user_data)
                except Exception as e:
                    # Provide more specific error information for user creation
                    error_message = str(e)
                    if 'UNIQUE constraint failed' in error_message and 'username' in error_message:
                        raise serializers.ValidationError('A user with this username already exists.')
                    elif 'The given username must be set' in error_message:
                        raise serializers.ValidationError('Username is required.')
                    elif 'username' in error_message and ('too long' in error_message or 'too short' in error_message):
                        raise serializers.ValidationError('Username must be between 3 and 30 characters.')
                    else:
                        raise serializers.ValidationError(f'Failed to create user: {error_message}')
                
                # Get or update the profile (signal may have created one)
                return self._update_or_create_profile(user, validated_data)
    
    def _update_or_create_profile(self, user, validated_data):
        """Helper method to update existing profile or create new one"""
        role = validated_data.get('role', 'customer')
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        phone = validated_data.get('phone', '')
        
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
        
        # If profile wasn't created, it already existed, so we need to update it
        if not created:
            # If role is different, update it
            if profile.role != role:
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
            else:
                # Same role, this is a duplicate
                raise serializers.ValidationError('A profile for this user already exists.')
        
        return profile'''

# Replace the old method with the new method
updated_content = content.replace(old_method, new_method)

# Write the updated content back to the file
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(updated_content)

print("Applied better fix for ProfileSerializer!")
# Solution Summary: Staff and Driver Creation Fix

## Problem
When trying to create staff or driver accounts through the admin interface, users were getting the error:
```
"Profile Exists - A profile for this user already exists."
```

## Root Cause
1. **Django Signal**: There's a Django signal in `core/signals.py` that automatically creates a profile for every user when they're created:
   ```python
   @receiver(post_save, sender=User)
   def sync_profile(sender, instance, created, **kwargs):
       profile, profile_created = Profile.objects.get_or_create(
           user=instance,
           defaults={
               'role': 'customer',  # Default role
               'first_name': instance.first_name,
               'last_name': instance.last_name,
           }
       )
   ```

2. **Profile Creation Flow**: When the StaffViewSet or DriverViewSet tries to create a staff member:
   - It creates a User object
   - The signal automatically creates a Profile with role='customer'
   - Then it tries to create another Profile for the same user with role='staff'
   - This fails with "A profile for this user already exists"

3. **Read-only Field Issue**: The `role` field in ProfileSerializer is marked as `read_only`, which means it's not included in the `validated_data` dictionary passed to the serializer's create method.

## Solution Implemented

### 1. Updated ProfileSerializer.create method
- Modified to get the role from the serializer context instead of `validated_data`
- Updated both calls to `_update_or_create_profile` to pass the role parameter

### 2. Updated ProfileSerializer._update_or_create_profile method
- Modified method signature to accept a role parameter
- Removed the line that gets role from `validated_data`

### 3. Updated StaffViewSet and DriverViewSet
- Modified to pass the role through the serializer context instead of modifying the data directly
- This approach respects the `read_only` nature of the role field

## Key Changes Made

### In `core/api/serializers.py`:
1. Changed `ProfileSerializer.create` to get role from `self.context.get('role', 'customer')`
2. Updated both calls to `_update_or_create_profile` to pass the role parameter
3. Modified `_update_or_create_profile` method signature to accept role parameter
4. Removed role extraction from `validated_data` in `_update_or_create_profile`

### In `core/api/views.py`:
1. Updated `StaffViewSet.create` to pass role in context: `context={'role': 'staff'}`
2. Updated `DriverViewSet.create` to pass role in context: `context={'role': 'driver'}`

## How It Works Now

1. When creating a staff member:
   - StaffViewSet creates a User object
   - The signal automatically creates a Profile with role='customer'
   - ProfileSerializer.create gets the role from context ('staff')
   - ProfileSerializer._update_or_create_profile updates the existing profile's role from 'customer' to 'staff'

2. When creating a driver:
   - DriverViewSet creates a User object
   - The signal automatically creates a Profile with role='customer'
   - ProfileSerializer.create gets the role from context ('driver')
   - ProfileSerializer._update_or_create_profile updates the existing profile's role from 'customer' to 'driver'

## Testing
The solution has been tested and verified to work correctly for both staff and driver creation through:
1. Direct serializer usage with context
2. ViewSet integration

Both approaches now successfully create staff and driver accounts without the "Profile Exists" error.
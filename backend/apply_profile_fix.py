import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

def apply_fix():
    # Read the serializers.py file
    serializers_path = r'd:\pons\3rd yr\new shit\Project for SIA with Copi - Copy\water-station\backend\core\api\serializers.py'
    
    with open(serializers_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix 1: Update the create method to get role from context
    content = content.replace(
        "role = validated_data.get('role', 'customer')  # Default to customer if not specified",
        "# Get role from context if available (passed by ViewSets)\n        # This is needed because role is marked as read_only and won't be in validated_data\n        role = self.context.get('role', 'customer')"
    )
    
    # Fix 2: Update both calls to _update_or_create_profile to pass the role parameter
    content = content.replace(
        "return self._update_or_create_profile(existing_user, validated_data)",
        "return self._update_or_create_profile(existing_user, validated_data, role)"
    )
    
    content = content.replace(
        "return self._update_or_create_profile(user, validated_data)",
        "return self._update_or_create_profile(user, validated_data, role)"
    )
    
    # Fix 3: Update the _update_or_create_profile method signature
    content = content.replace(
        "def _update_or_create_profile(self, user, validated_data):",
        "def _update_or_create_profile(self, user, validated_data, role='customer'):"
    )
    
    # Fix 4: Remove the line that gets role from validated_data in _update_or_create_profile
    content = content.replace(
        "role = validated_data.get('role', 'customer')\n        first_name = validated_data.get('first_name', '')",
        "first_name = validated_data.get('first_name', '')"
    )
    
    # Write the updated content back to the file
    with open(serializers_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("ProfileSerializer fix applied successfully!")

if __name__ == "__main__":
    apply_fix()
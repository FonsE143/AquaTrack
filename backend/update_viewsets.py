import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

def update_viewsets():
    # Read the views.py file
    views_path = r'd:\pons\3rd yr\new shit\Project for SIA with Copi - Copy\water-station\backend\core\api\views.py'
    
    with open(views_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update StaffViewSet create method
    staff_old_code = '''        # Prepare data for serializer - add role explicitly
        serializer_data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        serializer_data['role'] = 'staff'  # Set the role explicitly
        
        print(f"DEBUG: StaffViewSet.create called with data: {serializer_data}")
        
        # Use serializer to create the profile
        serializer = self.get_serializer(data=serializer_data)'''
    
    staff_new_code = '''        # Prepare data for serializer - don't modify the data directly
        serializer_data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        
        print(f"DEBUG: StaffViewSet.create called with data: {serializer_data}")
        
        # Use serializer to create the profile, passing role in context
        serializer = self.get_serializer(data=serializer_data, context={'role': 'staff'})'''
    
    content = content.replace(staff_old_code, staff_new_code)
    
    # Update DriverViewSet create method
    driver_old_code = '''        # Prepare data for serializer - add role explicitly
        serializer_data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        serializer_data['role'] = 'driver'  # Set the role explicitly
        
        # Use serializer to create the profile
        serializer = self.get_serializer(data=serializer_data)'''
    
    driver_new_code = '''        # Prepare data for serializer - don't modify the data directly
        serializer_data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        
        # Use serializer to create the profile, passing role in context
        serializer = self.get_serializer(data=serializer_data, context={'role': 'driver'})'''
    
    content = content.replace(driver_old_code, driver_new_code)
    
    # Write the updated content back to the file
    with open(views_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("ViewSets updated successfully!")

if __name__ == "__main__":
    update_viewsets()
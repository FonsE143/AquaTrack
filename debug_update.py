import os
import sys
import django
from django.conf import settings

# Add the project directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')

# Setup Django
django.setup()

from core.models import Delivery, Profile
from core.api.serializers import DeliverySerializer

# Test updating a delivery
try:
    # Get a delivery
    delivery = Delivery.objects.first()
    if delivery:
        print(f"Testing delivery: {delivery.id}")
        print(f"Current status: {delivery.status}")
        
        # Try to update the status
        data = {'status': 'in_route'}
        serializer = DeliverySerializer(delivery, data=data, partial=True)
        
        if serializer.is_valid():
            print("Serializer is valid")
            serializer.save()
            print(f"Updated status: {delivery.status}")
        else:
            print("Serializer errors:", serializer.errors)
    else:
        print("No deliveries found")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
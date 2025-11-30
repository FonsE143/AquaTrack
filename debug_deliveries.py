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

# Test the query
try:
    # Get a driver profile
    driver_profiles = Profile.objects.filter(role='driver')
    if driver_profiles.exists():
        driver = driver_profiles.first()
        print(f"Testing with driver: {driver}")
        
        # Try the same query as in the view
        deliveries = Delivery.objects.select_related(
            'order', 'order__product', 'order__customer', 'order__customer__user', 'vehicle', 'route'
        ).filter(
            driver=driver
        ).exclude(
            status='delivered'
        ).exclude(
            status='cancelled'
        ).order_by('-created_at')
        
        print(f"Found {deliveries.count()} deliveries")
        
        # Try serializing the deliveries
        if deliveries.exists():
            delivery = deliveries.first()
            print(f"Serializing delivery: {delivery.id}")
            serializer = DeliverySerializer(delivery)
            print("Serialized data:", serializer.data)
        else:
            print("No deliveries found for this driver")
    else:
        print("No driver profiles found")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
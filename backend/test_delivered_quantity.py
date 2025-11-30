import os
import django
from django.contrib.auth import authenticate
from django.test import RequestFactory
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import Delivery, Deployment

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

def test_delivered_quantity():
    print("Testing delivered quantity display...")
    
    # Authenticate as driver
    user = authenticate(username='driver', password='driverpass')
    if not user:
        print("Authentication failed")
        return
    
    print(f"Authenticated user: {user.username}")
    
    # Get a delivery that's not yet delivered
    try:
        delivery = Delivery.objects.exclude(status='delivered').first()
        if not delivery:
            print("No undelivered deliveries found")
            return
            
        print(f"Delivery before update: ID={delivery.id}, Status={delivery.status}, Delivered Quantity={delivery.delivered_quantity}")
    except Delivery.DoesNotExist:
        print("Delivery not found")
        return
    
    # Create request factory
    factory = RequestFactory()
    
    # Generate JWT token
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    # Create a PATCH request to update the delivery with a specific delivered quantity
    delivered_qty = 5
    request = factory.patch(f'/deliveries/{delivery.id}/', {
        'status': 'delivered',
        'delivered_quantity': delivered_qty
    }, format='json')
    
    # Set authorization header
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
    
    # Set user on request
    request.user = user
    
    # Import and create viewset instance
    from core.api.views import DeliveryViewSet
    viewset = DeliveryViewSet.as_view({'patch': 'partial_update'})
    
    # Call the view
    response = viewset(request, pk=delivery.id)
    
    print(f"Response status code: {response.status_code}")
    print(f"Response data: {response.data}")
    
    # Check delivery after update
    delivery.refresh_from_db()
    print(f"Delivery after update: ID={delivery.id}, Status={delivery.status}, Delivered Quantity={delivery.delivered_quantity}")
    
    # Now test the customer view to see if delivered quantity is included
    # Authenticate as customer
    customer_user = authenticate(username='customer', password='customerpass')
    if not customer_user:
        print("Customer authentication failed")
        return
    
    print(f"Authenticated customer: {customer_user.username}")
    
    # Generate JWT token for customer
    customer_refresh = RefreshToken.for_user(customer_user)
    customer_access_token = str(customer_refresh.access_token)
    
    # Create request for customer deliveries
    customer_request = factory.get('/deliveries/my-deliveries/')
    customer_request.META['HTTP_AUTHORIZATION'] = f'Bearer {customer_access_token}'
    customer_request.user = customer_user
    
    # Create viewset instance for customer
    customer_viewset = DeliveryViewSet.as_view({'get': 'my_deliveries'})
    
    # Call the view
    customer_response = customer_viewset(customer_request)
    
    print(f"Customer response status code: {customer_response.status_code}")
    print(f"Customer response data: {customer_response.data}")
    
    # Check if delivered quantity is in the response
    if isinstance(customer_response.data, list):
        for delivery_data in customer_response.data:
            if delivery_data.get('id') == delivery.id:
                print(f"Found delivery in customer data: ID={delivery_data.get('id')}, Delivered Quantity={delivery_data.get('delivered_quantity')}")
                break
    else:
        print("Customer response is not a list")

if __name__ == "__main__":
    test_delivered_quantity()
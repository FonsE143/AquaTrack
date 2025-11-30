import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from django.contrib.auth import authenticate
from core.models import Delivery, Deployment
from rest_framework.test import APIRequestFactory
from core.api.views import DeliveryViewSet
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import AnonymousUser

def test_delivery_completion():
    print("Testing delivery completion...")
    
    # Authenticate as driver
    user = authenticate(username='driver', password='driverpass')
    if not user:
        print("Authentication failed")
        return
    
    print(f"Authenticated user: {user.username}")
    
    # Get delivery
    try:
        delivery = Delivery.objects.get(id=7)
        print(f"Delivery before update: ID={delivery.id}, Status={delivery.status}")
    except Delivery.DoesNotExist:
        print("Delivery not found")
        return
    
    # Get deployment stock before
    deployment = Deployment.objects.first()
    if deployment:
        print(f"Deployment stock before: {deployment.stock}")
    
    # Create request factory
    factory = APIRequestFactory()
    
    # Generate JWT token
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    # Create a PATCH request to update the delivery
    request = factory.patch(f'/deliveries/{delivery.id}/', {
        'status': 'delivered',
        'delivered_quantity': 10
    }, format='json')
    
    # Set authorization header
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
    
    # Set user on request
    request.user = user
    
    # Create viewset instance
    viewset = DeliveryViewSet.as_view({'patch': 'partial_update'})
    
    # Call the view
    response = viewset(request, pk=delivery.id)
    
    print(f"Response status code: {response.status_code}")
    print(f"Response data: {response.data}")
    
    # Check delivery after update
    delivery.refresh_from_db()
    print(f"Delivery after update: ID={delivery.id}, Status={delivery.status}")
    
    # Check deployment stock after
    if deployment:
        deployment.refresh_from_db()
        print(f"Deployment stock after: {deployment.stock}")

if __name__ == "__main__":
    test_delivery_completion()
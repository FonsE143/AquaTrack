import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waterstation.settings')
django.setup()

from core.models import Delivery, Deployment

def check_final_state():
    print("Final state of deliveries:")
    deliveries = Delivery.objects.all()
    for d in deliveries:
        print(f"  ID: {d.id}, Status: {d.status}, Order ID: {d.order.id}, Delivered At: {d.delivered_at}")
    
    deployment = Deployment.objects.first()
    print(f"Deployment stock: {deployment.stock if deployment else 'None'}")

if __name__ == "__main__":
    check_final_state()
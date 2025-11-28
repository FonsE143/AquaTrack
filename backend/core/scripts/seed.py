# backend/core/scripts/seed.py
from django.contrib.auth import get_user_model
from core.models import Product, Order, OrderItem, Delivery
from django.core.exceptions import ObjectDoesNotExist

User = get_user_model()

def run():
    # Create or get admin user
    try:
        admin = User.objects.get(username='admin1')
        print("Admin user already exists")
    except ObjectDoesNotExist:
        admin = User.objects.create_user(username='admin1', password='Admin@123', email='admin@example.com')
        admin.profile.role = 'admin'
        admin.profile.save()
        print("Created admin user")

    # Create or get staff user
    try:
        staff = User.objects.get(username='staff1')
        print("Staff user already exists")
    except ObjectDoesNotExist:
        staff = User.objects.create_user(username='staff1', password='Staff@123', email='staff@example.com')
        staff.profile.role = 'staff'
        staff.profile.save()
        print("Created staff user")

    # Create or get driver user
    try:
        driver = User.objects.get(username='driver1')
        print("Driver user already exists")
    except ObjectDoesNotExist:
        driver = User.objects.create_user(username='driver1', password='Driver@123', email='driver@example.com')
        driver.profile.role = 'driver'
        driver.profile.save()
        print("Created driver user")

    # Create or get customer user
    try:
        cust = User.objects.get(username='cust1')
        print("Customer user already exists")
    except ObjectDoesNotExist:
        cust = User.objects.create_user(username='cust1', password='Customer@123', email='cust@example.com')
        cust.profile.role = 'customer'
        cust.profile.save()
        print("Created customer user")

    # Create products
    p1, created = Product.objects.get_or_create(
        name='Refill 5L', 
        defaults={'sku': 'R5L', 'price': 30, 'active': True}
    )
    if created:
        print("Created Refill 5L product")
    else:
        print("Refill 5L product already exists")

    p2, created = Product.objects.get_or_create(
        name='Refill 20L', 
        defaults={'sku': 'R20L', 'price': 60, 'active': True}
    )
    if created:
        print("Created Refill 20L product")
    else:
        print("Refill 20L product already exists")

    # Create order
    try:
        o = Order.objects.get(customer=cust.profile, status='processing')
        print("Order already exists")
    except ObjectDoesNotExist:
        o = Order.objects.create(customer=cust.profile, status='processing', notes='Leave at gate')
        OrderItem.objects.create(order=o, product=p2, qty_full_out=2, qty_empty_in=2)
        from core.services.inventory import apply_order_inventory
        apply_order_inventory(o)
        print("Created order")

    # Create delivery
    try:
        delivery = Delivery.objects.get(order=o)
        print("Delivery already exists")
    except ObjectDoesNotExist:
        delivery = Delivery.objects.create(order=o, driver=driver.profile, status='assigned', route_index=0, eta_minutes=45)
        print("Created delivery")
from core.models import User, Product, Order, OrderItem, Delivery, Profile


def ensure_profile(user, role, first_name='', last_name='', phone='', address=''):
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = role
    profile.first_name = first_name
    profile.last_name = last_name
    profile.email = user.email
    profile.phone = phone
    profile.address = address
    profile.save()


def run():
    # Create or get admin
    admin, created = User.objects.get_or_create(username='admin1', defaults={
        'email': 'admin@example.com',
        'first_name': 'Aqua',
        'last_name': 'Admin'
    })
    if created:
        admin.set_password('Admin@123')
        admin.save()
    ensure_profile(admin, 'admin', 'Aqua', 'Admin', '0917-000-0000', 'Station HQ')

    # Create or get staff
    staff, created = User.objects.get_or_create(username='staff1', defaults={
        'email': 'staff@example.com',
        'first_name': 'Sam',
        'last_name': 'Dispatcher'
    })
    if created:
        staff.set_password('Staff@123')
        staff.save()
    ensure_profile(staff, 'staff', 'Sam', 'Dispatcher', '0917-111-1111', 'Dispatch')

    # Create or get customer
    cust, created = User.objects.get_or_create(username='cust1', defaults={
        'email': 'cust@example.com',
        'first_name': 'Cathy',
        'last_name': 'Customer'
    })
    if created:
        cust.set_password('Customer@123')
        cust.save()
    ensure_profile(cust, 'customer', 'Cathy', 'Customer', '0917-222-2222', 'Barangay 123')

    # Create or get driver
    driver, created = User.objects.get_or_create(username='driver1', defaults={
        'email': 'driver@example.com',
        'first_name': 'D',
        'last_name': 'Driver'
    })
    if created:
        driver.set_password('Driver@123')
        driver.save()
    ensure_profile(driver, 'driver', 'D', 'Driver', '0917-333-3333', 'Driver HQ')

    # Products
    p1, _ = Product.objects.get_or_create(sku='R5L', defaults={'name': 'Refill 5L', 'price': 30, 'active': True})
    p2, _ = Product.objects.get_or_create(sku='R20L', defaults={'name': 'Refill 20L', 'price': 60, 'active': True})

    # Create a sample order if none exist
    if not Order.objects.exists():
        o = Order.objects.create(customer=cust.profile, status='out', notes='Leave at gate')
        OrderItem.objects.create(order=o, product=p2, qty_full_out=2, qty_empty_in=2)
        from core.services.inventory import apply_order_inventory
        apply_order_inventory(o)
        # Create delivery and set it to enroute status
        delivery = Delivery.objects.create(order=o, driver=driver.profile, status='enroute', route_index=0, eta_minutes=45)

if __name__ == '__main__':
    run()
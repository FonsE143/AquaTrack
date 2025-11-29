from django.core.management.base import BaseCommand
from core.models import User, Profile, Municipality, Barangay, Address, Product, Order, WalkInOrder, Route, Vehicle

class Command(BaseCommand):
    help = 'Populate database with sample data'

    def handle(self, *args, **options):
        # Create municipalities
        manila, created = Municipality.objects.get_or_create(name='Manila')
        quezon_city, created = Municipality.objects.get_or_create(name='Quezon City')
        
        # Create barangays
        brgy_1, created = Barangay.objects.get_or_create(
            municipality=manila,
            name='Barangay 1'
        )
        brgy_2, created = Barangay.objects.get_or_create(
            municipality=manila,
            name='Barangay 2'
        )
        brgy_3, created = Barangay.objects.get_or_create(
            municipality=quezon_city,
            name='Barangay 3'
        )
        
        # Create addresses
        addr_1, created = Address.objects.get_or_create(
            barangay=brgy_1,
            defaults={'full_address': '123 Main Street, Barangay 1, Manila'}
        )
        addr_2, created = Address.objects.get_or_create(
            barangay=brgy_2,
            defaults={'full_address': '456 Second Street, Barangay 2, Manila'}
        )
        addr_3, created = Address.objects.get_or_create(
            barangay=brgy_3,
            defaults={'full_address': '789 Third Street, Barangay 3, Quezon City'}
        )
        
        # Create users and profiles
        # Admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={'password': 'adminpass'}
        )
        if created:
            admin_user.set_password('adminpass')
            admin_user.save()
        
        Profile.objects.get_or_create(
            user=admin_user,
            defaults={
                'role': 'admin',
                'first_name': 'Admin',
                'last_name': 'User',
                'phone': '09123456789',
                'address': addr_1
            }
        )
        
        # Staff user
        staff_user, created = User.objects.get_or_create(
            username='staff',
            defaults={'password': 'staffpass'}
        )
        if created:
            staff_user.set_password('staffpass')
            staff_user.save()
            
        Profile.objects.get_or_create(
            user=staff_user,
            defaults={
                'role': 'staff',
                'first_name': 'Staff',
                'last_name': 'Member',
                'phone': '09123456780',
                'address': addr_2
            }
        )
        
        # Driver user
        driver_user, created = User.objects.get_or_create(
            username='driver',
            defaults={'password': 'driverpass'}
        )
        if created:
            driver_user.set_password('driverpass')
            driver_user.save()
            
        Profile.objects.get_or_create(
            user=driver_user,
            defaults={
                'role': 'driver',
                'first_name': 'Delivery',
                'last_name': 'Driver',
                'phone': '09123456781',
                'address': addr_3
            }
        )
        
        # Customer user
        customer_user, created = User.objects.get_or_create(
            username='customer',
            defaults={'password': 'customerpass'}
        )
        if created:
            customer_user.set_password('customerpass')
            customer_user.save()
            
        customer_profile, created = Profile.objects.get_or_create(
            user=customer_user,
            defaults={
                'role': 'customer',
                'first_name': 'John',
                'last_name': 'Customer',
                'phone': '09123456782',
                'address': addr_1
            }
        )
        
        # Walk-in customer (create a user account for them as well)
        walkin_user, created = User.objects.get_or_create(
            username='walkin',
            defaults={'password': 'walkinpass'}
        )
        if created:
            walkin_user.set_password('walkinpass')
            walkin_user.save()
            
        walkin_profile, created = Profile.objects.get_or_create(
            user=walkin_user,
            defaults={
                'role': 'walk-in_customer',
                'first_name': 'Walk-in',
                'last_name': 'Customer',
                'phone': '09123456783',
                'address': addr_2
            }
        )
        
        # Create products
        product_1, created = Product.objects.get_or_create(
            name='Mineral Water (500ml)',
            defaults={
                'price': 20.00,
                'liters': 0.5
            }
        )
        product_2, created = Product.objects.get_or_create(
            name='Mineral Water (1L)',
            defaults={
                'price': 35.00,
                'liters': 1.0
            }
        )
        product_3, created = Product.objects.get_or_create(
            name='Mineral Water (5L)',
            defaults={
                'price': 150.00,
                'liters': 5.0
            }
        )
        
        # Create orders (only if no orders exist)
        if Order.objects.count() == 0:
            Order.objects.create(
                product=product_1,
                quantity=2,
                customer=customer_profile
            )
            Order.objects.create(
                product=product_2,
                quantity=1,
                customer=customer_profile
            )
        
        # Create walk-in orders (only if no walk-in orders exist)
        if WalkInOrder.objects.count() == 0:
            WalkInOrder.objects.create(
                product=product_3,
                quantity=1
            )
            WalkInOrder.objects.create(
                product=product_1,
                quantity=5
            )
        
        # Create routes
        route1, created = Route.objects.get_or_create(
            route_number='R001',
            defaults={}
        )
        if created:
            route1.municipalities.add(manila)
            route1.barangays.add(brgy_1)
        
        route2, created = Route.objects.get_or_create(
            route_number='R002',
            defaults={}
        )
        if created:
            route2.municipalities.add(quezon_city)
            route2.barangays.add(brgy_3)
        
        # Create vehicles
        Vehicle.objects.get_or_create(
            name='Delivery Truck 1',
            plate_number='ABC-123',
            defaults={'stock_limit': 100}
        )
        Vehicle.objects.get_or_create(
            name='Delivery Van 1',
            plate_number='XYZ-789',
            defaults={'stock_limit': 50}
        )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully populated sample data')
        )
import random
from django.core.management.base import BaseCommand
from core.models import Municipality, Barangay, Address, Product, Profile, User, Route, Vehicle, Order, OrderItem, Delivery

class Command(BaseCommand):
    help = 'Populate database with mock data'

    def handle(self, *args, **options):
        # Clear existing data
        self.stdout.write('Clearing existing data...')
        Municipality.objects.all().delete()
        Barangay.objects.all().delete()
        Address.objects.all().delete()
        Route.objects.all().delete()
        Vehicle.objects.all().delete()
        
        # Create municipalities
        municipalities_data = [
            'Manila', 'Quezon City', 'Caloocan', 'Las Piñas', 'Makati',
            'Malabon', 'Mandaluyong', 'Marikina', 'Muntinlupa', 'Navotas',
            'Parañaque', 'Pasay', 'Pasig', 'San Juan', 'Taguig', 'Valenzuela'
        ]
        
        municipalities = []
        for name in municipalities_data:
            municipality = Municipality.objects.create(name=name)
            municipalities.append(municipality)
            self.stdout.write(f'Created municipality: {name}')
        
        # Create barangays
        barangays_data = [
            ('Barangay 1', 'Main Street, Building 1'),
            ('Barangay 2', 'Second Street, Building 2'),
            ('Barangay 3', 'Third Street, Building 3'),
            ('Barangay 4', 'Fourth Street, Building 4'),
            ('Barangay 5', 'Fifth Street, Building 5'),
            ('Barangay 6', 'Sixth Street, Building 6'),
            ('Barangay 7', 'Seventh Street, Building 7'),
            ('Barangay 8', 'Eighth Street, Building 8'),
            ('Barangay 9', 'Ninth Street, Building 9'),
            ('Barangay 10', 'Tenth Street, Building 10'),
        ]
        
        barangays = []
        for municipality in municipalities:
            for i, (name, street) in enumerate(barangays_data):
                barangay = Barangay.objects.create(
                    municipality=municipality,
                    name=f'{name} of {municipality.name}',
                    street_house_number=street
                )
                barangays.append(barangay)
                if i >= 2:  # Limit to 3 barangays per municipality
                    break
            self.stdout.write(f'Created barangays for {municipality.name}')
        
        # Create addresses
        addresses = []
        for barangay in barangays:
            for i in range(3):
                address = Address.objects.create(
                    barangay=barangay,
                    full_address=f'{i+1} Sample St, {barangay.name}, {barangay.municipality.name}'
                )
                addresses.append(address)
            self.stdout.write(f'Created addresses for {barangay.name}')
        
        # Create products
        products_data = [
            ('Mineral Water 500ml', 25.00, 0.5),
            ('Mineral Water 1L', 45.00, 1.0),
            ('Mineral Water 5L', 120.00, 5.0),
            ('Alkaline Water 500ml', 35.00, 0.5),
            ('Alkaline Water 1L', 60.00, 1.0),
            ('Purified Water 500ml', 20.00, 0.5),
            ('Purified Water 1L', 35.00, 1.0),
            ('Distilled Water 1L', 50.00, 1.0),
        ]
        
        products = []
        for name, price, liters in products_data:
            product = Product.objects.create(
                name=name,
                sku=f'PRD{len(products)+1:03d}',
                price=price,
                liters=liters,
                active=True
            )
            products.append(product)
            self.stdout.write(f'Created product: {name}')
        
        # Create vehicles
        vehicles_data = [
            ('Water Truck Alpha', 'ABC-123', 100),
            ('Water Truck Beta', 'DEF-456', 150),
            ('Water Truck Gamma', 'GHI-789', 200),
            ('Water Truck Delta', 'JKL-012', 120),
            ('Water Truck Epsilon', 'MNO-345', 180),
        ]
        
        vehicles = []
        for name, plate_number, stock_limit in vehicles_data:
            vehicle = Vehicle.objects.create(
                name=name,
                plate_number=plate_number,
                stock_limit=stock_limit
            )
            vehicles.append(vehicle)
            self.stdout.write(f'Created vehicle: {name}')
        
        # Create routes
        routes = []
        for municipality in municipalities[:5]:  # Only first 5 municipalities
            barangay = Barangay.objects.filter(municipality=municipality).first()
            if barangay:
                route = Route.objects.create(
                    route_number=f'R{len(routes)+1:03d}',
                    municipality=municipality,
                    barangay=barangay
                )
                routes.append(route)
                self.stdout.write(f'Created route: {route.route_number} for {municipality.name}')
        
        # Create some sample orders
        customers = Profile.objects.filter(role='customer')
        if customers.exists():
            for i in range(20):
                customer = random.choice(customers)
                product = random.choice(products)
                
                order = Order.objects.create(
                    customer=customer,
                    status=random.choice(['processing', 'out', 'delivered']),
                    total_amount=product.price * random.randint(1, 5)
                )
                
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    qty_full_out=random.randint(1, 5),
                    qty_empty_in=random.randint(0, 3)
                )
                
                # Create delivery for some orders
                if order.status in ['out', 'delivered']:
                    vehicle = random.choice(vehicles) if vehicles else None
                    route = random.choice(routes) if routes else None
                    
                    delivery = Delivery.objects.create(
                        order=order,
                        status='enroute' if order.status == 'out' else 'completed',
                        vehicle=vehicle,
                        route=route
                    )
                
                self.stdout.write(f'Created order #{order.id} for {customer.user.username}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated database with mock data: '
                f'{len(municipalities)} municipalities, '
                f'{len(barangays)} barangays, '
                f'{len(addresses)} addresses, '
                f'{len(products)} products, '
                f'{len(vehicles)} vehicles, '
                f'{len(routes)} routes'
            )
        )
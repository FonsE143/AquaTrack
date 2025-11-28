import random
from django.core.management.base import BaseCommand
from core.models import Municipality, Barangay, Address, Product, Profile, User, Route, Vehicle, Order, WalkInOrder

class Command(BaseCommand):
    help = 'Populate database with new mock data structure'

    def handle(self, *args, **options):
        # Create municipalities
        municipalities_data = [
            'Manila', 'Quezon City', 'Caloocan', 'Las Piñas', 'Makati',
            'Malabon', 'Mandaluyong', 'Marikina', 'Muntinlupa', 'Navotas'
        ]
        
        municipalities = []
        for name in municipalities_data:
            municipality, created = Municipality.objects.get_or_create(name=name)
            if created:
                municipalities.append(municipality)
                self.stdout.write(f'Created municipality: {name}')
        
        # Create barangays
        barangays_data = [
            ('Barangay 1', 'Main Street, Building 1'),
            ('Barangay 2', 'Second Street, Building 2'),
            ('Barangay 3', 'Third Street, Building 3'),
        ]
        
        barangays = []
        for municipality in municipalities[:5]:  # Only first 5 municipalities
            for name, street in barangays_data:
                barangay, created = Barangay.objects.get_or_create(
                    municipality=municipality,
                    name=f'{name} of {municipality.name}',
                    defaults={'street_house_number': street}
                )
                if created:
                    barangays.append(barangay)
                    self.stdout.write(f'Created barangay: {barangay.name}')
        
        # Create addresses
        addresses = []
        for barangay in barangays:
            for i in range(2):
                address, created = Address.objects.get_or_create(
                    barangay=barangay,
                    defaults={'full_address': f'{i+1} Sample St, {barangay.name}, {barangay.municipality.name}'}
                )
                if created:
                    addresses.append(address)
                    self.stdout.write(f'Created address: {address.full_address}')
        
        # Create products
        products_data = [
            ('Mineral Water 500ml', 25.00, 0.5),
            ('Mineral Water 1L', 45.00, 1.0),
            ('Mineral Water 5L', 120.00, 5.0),
            ('Alkaline Water 500ml', 35.00, 0.5),
            ('Alkaline Water 1L', 60.00, 1.0),
        ]
        
        products = []
        for name, price, liters in products_data:
            product, created = Product.objects.get_or_create(
                name=name,
                defaults={'price': price, 'liters': liters}
            )
            if created:
                products.append(product)
                self.stdout.write(f'Created product: {name}')
        
        # Create vehicles
        vehicles_data = [
            ('Water Truck Alpha', 'ABC-123', 100),
            ('Water Truck Beta', 'DEF-456', 150),
            ('Water Truck Gamma', 'GHI-789', 200),
        ]
        
        vehicles = []
        for name, plate_number, stock_limit in vehicles_data:
            vehicle, created = Vehicle.objects.get_or_create(
                name=name,
                defaults={'plate_number': plate_number, 'stock_limit': stock_limit}
            )
            if created:
                vehicles.append(vehicle)
                self.stdout.write(f'Created vehicle: {name}')
        
        # Create routes
        routes = []
        for municipality in municipalities[:3]:  # Only first 3 municipalities
            barangay = Barangay.objects.filter(municipality=municipality).first()
            if barangay:
                route, created = Route.objects.get_or_create(
                    route_number=f'R{len(routes)+1:03d}',
                    municipality=municipality,
                    barangay=barangay,
                    defaults={}
                )
                if created:
                    routes.append(route)
                    self.stdout.write(f'Created route: {route.route_number} for {municipality.name}')
        
        # Assign addresses to existing customers
        customers = Profile.objects.filter(role='customer')
        for i, customer in enumerate(customers):
            if i < len(addresses):
                customer.address = addresses[i]
                customer.save()
                self.stdout.write(f'Assigned address to customer: {customer.user.username}')
        
        # Create some sample orders
        customers = Profile.objects.filter(role='customer')
        if customers.exists() and products:
            for i in range(10):
                customer = random.choice(customers)
                product = random.choice(products)
                
                order = Order.objects.create(
                    product=product,
                    quantity=random.randint(1, 5),
                    customer=customer
                )
                
                self.stdout.write(f'Created order #{order.id} for {customer.user.username}')
        
        # Create some walk-in orders
        if products:
            for i in range(5):
                product = random.choice(products)
                
                walkin_order = WalkInOrder.objects.create(
                    product=product,
                    quantity=random.randint(1, 3)
                )
                
                self.stdout.write(f'Created walk-in order #{walkin_order.id}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated database with new structure: '
                f'{len(municipalities)} municipalities, '
                f'{len(barangays)} barangays, '
                f'{len(addresses)} addresses, '
                f'{len(products)} products, '
                f'{len(vehicles)} vehicles, '
                f'{len(routes)} routes'
            )
        )
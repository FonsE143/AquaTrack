from django.core.management.base import BaseCommand
from core.models import Profile, Order, OrderItem
from django.db.models import Sum


class Command(BaseCommand):
    help = 'Initialize outstanding containers field for all customers based on their order history'

    def handle(self, *args, **options):
        # Get all customer profiles
        customers = Profile.objects.filter(role='customer')
        
        for customer in customers:
            self.stdout.write(f'Processing customer: {customer.user.username}')
            
            # Calculate outstanding containers from order history
            outstanding_containers = {}
            
            # Get all delivered orders for this customer
            delivered_orders = Order.objects.filter(
                customer=customer,
                status='delivered'
            ).prefetch_related('items')
            
            # Calculate total outstanding containers by product
            for order in delivered_orders:
                for item in order.items.all():
                    product_id = item.product.id
                    outstanding = item.qty_full_out - item.qty_empty_in
                    if outstanding > 0:
                        if product_id in outstanding_containers:
                            outstanding_containers[product_id] += outstanding
                        else:
                            outstanding_containers[product_id] = outstanding
            
            # Update the customer's outstanding_containers field
            customer.outstanding_containers = outstanding_containers
            customer.save(update_fields=['outstanding_containers'])
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Updated {customer.user.username} with {len(outstanding_containers)} products with outstanding containers'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully initialized outstanding containers for all customers')
        )
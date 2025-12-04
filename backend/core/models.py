from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    pass

class Profile(models.Model):
    ROLE_CHOICES = [
        ('admin','admin'),
        ('staff','staff'),
        ('driver','driver'),
        ('customer','customer'),
        ('walk-in_customer','walk-in_customer')
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.ForeignKey('Address', on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} ({self.role})"

class Municipality(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Barangay(models.Model):
    municipality = models.ForeignKey(Municipality, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    
    class Meta:
        unique_together = ('municipality', 'name')

    def __str__(self):
        return f"{self.name}, {self.municipality.name}"

class Address(models.Model):
    barangay = models.ForeignKey(Barangay, on_delete=models.CASCADE)
    full_address = models.TextField()
    
    class Meta:
        # Removed unique constraint to allow duplicate addresses
        # unique_together = ('barangay', 'full_address')
        pass

    def __str__(self):
        return f"{self.full_address}, {self.barangay}"

class Product(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    liters = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)

    def __str__(self):
        return self.name

class Order(models.Model):
    product = models.ForeignKey(Product, on_delete=models.PROTECT, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    quantity = models.PositiveIntegerField(default=1)
    free_items = models.PositiveIntegerField(default=0)
    customer = models.ForeignKey(Profile, on_delete=models.PROTECT, limit_choices_to={'role':'customer'}, null=True, blank=True)
    
    def save(self, *args, **kwargs):
        # Calculate free items (buy 10 get 1 free)
        self.free_items = self.quantity // 10
        super().save(*args, **kwargs)

    @property
    def customer_name(self):
        return f"{self.customer.first_name} {self.customer.last_name}"

class WalkInOrder(models.Model):
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    quantity = models.PositiveIntegerField()
    free_items = models.PositiveIntegerField(default=0)
    returned_containers = models.PositiveIntegerField(null=True, blank=True, default=0)
    
    def save(self, *args, **kwargs):
        # Calculate free items (buy 10 get 1 free)
        self.free_items = self.quantity // 10
        super().save(*args, **kwargs)
    
    @property
    def total_quantity(self):
        return self.quantity + self.free_items

class Route(models.Model):
    route_number = models.CharField(max_length=20)
    municipalities = models.ManyToManyField(Municipality)
    barangays = models.ManyToManyField(Barangay)
    
    def __str__(self):
        municipalities = ', '.join([m.name for m in self.municipalities.all()])
        return f"Route {self.route_number} - {municipalities}"

class Vehicle(models.Model):
    name = models.CharField(max_length=100)
    plate_number = models.CharField(max_length=20)
    stock_limit = models.PositiveIntegerField()
    
    def __str__(self):
        return f"{self.name} ({self.plate_number})"

class Deployment(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('returned', 'Returned'),
        ('completed', 'Completed')
    ]
    
    deployment_id = models.BigIntegerField(unique=True, blank=True, null=True)
    driver = models.ForeignKey(Profile, on_delete=models.CASCADE, limit_choices_to={'role': 'driver'})
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    route = models.ForeignKey(Route, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    stock = models.PositiveIntegerField()
    initial_stock = models.PositiveIntegerField(null=True, blank=True)
    returned_containers = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Deployment {self.deployment_id}: {self.driver} - {self.vehicle} - {self.route}"
    
    def clean(self):
        # Check if stock exceeds vehicle limit
        try:
            if self.vehicle and self.stock and self.vehicle.stock_limit:
                if self.stock > self.vehicle.stock_limit:
                    from django.core.exceptions import ValidationError
                    raise ValidationError(f'Stock ({self.stock}) exceeds vehicle limit ({self.vehicle.stock_limit})!')
        except AttributeError:
            # If vehicle is not set yet, skip validation
            pass
        except Exception:
            # Catch any other exceptions during validation
            pass
    
    def save(self, *args, **kwargs):
        # Generate deployment_id if it's a new deployment
        if not self.deployment_id:
            # Generate a simple numeric deployment ID
            from django.utils import timezone
            import random
            # Use last 6 digits of timestamp + 3 random digits
            timestamp_part = int(timezone.now().timestamp()) % 1000000
            random_part = random.randint(100, 999)
            self.deployment_id = int(f'{timestamp_part}{random_part}')
            
            # Set initial stock to the current stock when creating a new deployment
            if self.initial_stock is None:
                self.initial_stock = self.stock
        
        # Set returned_at when status changes to returned
        if self.status == 'returned' and not self.returned_at:
            from django.utils import timezone
            self.returned_at = timezone.now()
        
        self.clean()
        super().save(*args, **kwargs)

class OrderHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    status = models.CharField(max_length=20)
    timestamp = models.DateTimeField(auto_now_add=True)
    updated_by = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = "Order histories"
    
    def __str__(self):
        return f"Order {self.order.id} - {self.status}"


class CancelledOrder(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    reason = models.TextField(blank=True)
    cancelled_at = models.DateTimeField(auto_now_add=True)
    cancelled_by = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-cancelled_at']
        verbose_name_plural = "Cancelled orders"
    
    def __str__(self):
        return f"Cancelled Order {self.order.id}"

class Delivery(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('in_route', 'In Route'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled')
    ]
    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    driver = models.ForeignKey(Profile, on_delete=models.PROTECT, limit_choices_to={'role':'driver'}, null=True, blank=True)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True)
    route = models.ForeignKey(Route, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    delivered_quantity = models.PositiveIntegerField(null=True, blank=True)
    returned_containers = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Ensure delivered_at is set for delivered orders
        print(f"Saving delivery with status: {self.status}, delivered_at: {self.delivered_at}")
        
        # Check if this is a transition to 'delivered' status
        old_status = None
        old_delivered_quantity = None
        if self.pk:  # This is an update, not a new object
            try:
                old_instance = Delivery.objects.get(pk=self.pk)
                old_status = old_instance.status
                old_delivered_quantity = old_instance.delivered_quantity
            except Delivery.DoesNotExist:
                pass
        
        # Handle delivered status transition
        if self.status == 'delivered' and self.delivered_at is None:
            from django.utils import timezone
            self.delivered_at = timezone.now()
            print(f"Set delivered_at to: {self.delivered_at}")
        
        # Call the parent save method first to ensure the delivery is saved
        super().save(*args, **kwargs)
        print(f"Delivery saved with ID: {self.id}, status: {self.status}")
        
        # Update deployment stock if this is a transition to 'delivered' status
        if (old_status != self.status and self.status == 'delivered') or \
           (self.status == 'delivered' and old_delivered_quantity != self.delivered_quantity):
            print(f"Processing deployment stock update for delivery {self.id}")
            self.update_deployment_stock()

    def update_deployment_stock(self):
        """Update deployment stock when delivery is marked as delivered"""
        # Update deployment stock if driver has a deployment
        if self.driver and self.order and self.order.product:
            try:
                from core.models import Deployment
                print(f"Looking for deployment for driver {self.driver.id} and product {self.order.product.id}")
                # Look for an active deployment for this driver and product, ordered by creation date
                deployments = Deployment.objects.filter(
                    driver=self.driver, 
                    product=self.order.product
                ).exclude(status__in=['returned', 'completed']).order_by('-created_at')
                deployment = deployments.first()
                print(f"Found {deployments.count()} deployments, selected deployment ID: {deployment.id if deployment else 'None'}")
                if deployment:
                    # Use delivered_quantity if available, otherwise fallback to order quantity
                    delivered_quantity = self.delivered_quantity if self.delivered_quantity is not None else self.order.quantity
                    print(f"Found deployment with stock {deployment.stock}")
                    if deployment.stock >= delivered_quantity:
                        deployment.stock -= delivered_quantity
                        
                        # Accumulate returned containers in the deployment
                        if self.returned_containers is not None and self.returned_containers > 0:
                            if deployment.returned_containers is None:
                                deployment.returned_containers = 0
                            deployment.returned_containers += self.returned_containers
                        
                        # Automatically change status to completed when stock reaches zero
                        if deployment.stock == 0:
                            deployment.status = 'completed'
                        deployment.save()
                        print(f"Reduced deployment stock by {delivered_quantity}. New stock: {deployment.stock}")
                        if self.returned_containers is not None and self.returned_containers > 0:
                            print(f"Added {self.returned_containers} returned containers to deployment. Total returned: {deployment.returned_containers}")
                        if deployment.stock == 0:
                            print(f"Deployment stock reached zero, marked as completed")
                    else:
                        print(f"Insufficient stock in deployment. Available: {deployment.stock}, Needed: {delivered_quantity}")
                        # Don't fail the delivery if stock is insufficient, just log it
                else:
                    print(f"No deployment found for driver {self.driver.id} and product {self.order.product.id}")
                    # Don't fail the delivery if no deployment is found, just log it
            except Exception as e:
                print(f"Error updating deployment stock: {e}")
                import traceback
                traceback.print_exc()
                # Don't fail the delivery if there's an error updating deployment stock, just log it

class Notification(models.Model):
    TYPE = [('sms','SMS'),('email','Email'),('inapp','In-App')]
    user = models.ForeignKey(Profile, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=TYPE)
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

class ActivityLog(models.Model):
    actor = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=64)
    entity = models.CharField(max_length=64)
    meta = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = "Activity logs"



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
    middle_name = models.CharField(max_length=150, blank=True)
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

    def __str__(self):
        return f"{self.name}, {self.municipality.name}"

class Address(models.Model):
    barangay = models.ForeignKey(Barangay, on_delete=models.CASCADE)
    full_address = models.TextField()
    
    class Meta:
        unique_together = ('barangay', 'full_address')

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
    customer = models.ForeignKey(Profile, on_delete=models.PROTECT, limit_choices_to={'role':'customer'}, null=True, blank=True)

    @property
    def customer_name(self):
        return f"{self.customer.first_name} {self.customer.last_name}"

class WalkInOrder(models.Model):
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    quantity = models.PositiveIntegerField()

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
    driver = models.ForeignKey(Profile, on_delete=models.CASCADE, limit_choices_to={'role': 'driver'})
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    route = models.ForeignKey(Route, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    stock = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Deployment: {self.driver} - {self.vehicle} - {self.route}"
    
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Ensure delivered_at is set for delivered orders
        if self.status == 'delivered' and self.delivered_at is None:
            from django.utils import timezone
            self.delivered_at = timezone.now()
        super().save(*args, **kwargs)

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
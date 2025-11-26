from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    pass

class Profile(models.Model):
    ROLE_CHOICES = [('admin','admin'),('staff','staff'),('driver','driver'),('customer','customer')]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

class Product(models.Model):
    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=32, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_full = models.IntegerField(default=0)
    stock_empty = models.IntegerField(default=0)
    threshold = models.IntegerField(default=10)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} [{self.sku}]"

class Order(models.Model):
    STATUS = [
        ('processing','Processing'),
        ('out','Out for Delivery'),
        ('delivered','Delivered'),
        ('cancelled','Cancelled'),
    ]
    customer = models.ForeignKey(Profile, on_delete=models.PROTECT, limit_choices_to={'role':'customer'})
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS, default='processing')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    qty_full_out = models.IntegerField()
    qty_empty_in = models.IntegerField(default=0)

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
    STATUS = [
        ('queued','Queued'),
        ('assigned','Assigned'),
        ('enroute','Enroute'),
        ('completed','Completed'),
    ]
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery')
    driver = models.ForeignKey(Profile, on_delete=models.PROTECT, null=True, blank=True, limit_choices_to={'role':'driver'})
    status = models.CharField(max_length=20, choices=STATUS, default='queued')
    route_index = models.IntegerField(default=0)
    eta_minutes = models.IntegerField(default=30)

class Notification(models.Model):
    TYPE = [('sms','SMS'),('email','Email'),('inapp','In-App')]
    user = models.ForeignKey(Profile, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=TYPE)
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

class ActivityLog(models.Model):
    actor = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=64)
    entity = models.CharField(max_length=64)
    meta = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
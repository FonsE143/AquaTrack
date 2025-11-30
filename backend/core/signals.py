from django.db.models.signals import post_save
from django.dispatch import receiver
from core.models import User, Profile, Order, Delivery, ActivityLog

@receiver(post_save, sender=User)
def sync_profile(sender, instance, created, **kwargs):
    profile, profile_created = Profile.objects.get_or_create(
        user=instance,
        defaults={
            'role': 'customer',  # Default role
            'first_name': instance.first_name,
            'last_name': instance.last_name,
        }
    )
    # Keep profile fields aligned with the latest user info
    updated = False
    desired_values = {
        'first_name': instance.first_name,
        'last_name': instance.last_name,
    }
    for field, value in desired_values.items():
        if getattr(profile, field) != value:
            setattr(profile, field, value)
            updated = True
    if updated and not profile_created:
        profile.save()

@receiver(post_save, sender=Order)
def create_delivery_for_order(sender, instance, created, **kwargs):
    """Automatically create a delivery when an order is created"""
    if created:
        # Only create delivery for new orders
        # Get the first available driver
        driver = Profile.objects.filter(role='driver').first()
        
        Delivery.objects.get_or_create(
            order=instance,
            defaults={
                'status': 'assigned' if driver else 'pending',
                'driver': driver
            }
        )

@receiver(post_save, sender=Order)
def log_order_activity(sender, instance, created, **kwargs):
    """Create activity logs for order actions"""
    # Skip if this is being called during fixture loading or migrations
    if kwargs.get('raw', False):
        return
    
    # Try to get the user profile from the request context or the order
    actor = None
    
    # If this is a new order, try to get the customer as the actor
    if created and hasattr(instance, 'customer') and instance.customer:
        actor = instance.customer
    # If this is an update, we might not have a direct way to know who made the change
    # In a real application, you'd want to pass the user through the request context
    
    # For now, we'll create a generic log entry if we have an actor
    if actor:
        try:
            action = "order_created" if created else "order_updated"
            ActivityLog.objects.create(
                actor=actor,
                action=action,
                entity="order",
                meta={
                    "order_id": instance.id,
                    "product": instance.product.name if instance.product else "N/A",
                    "quantity": instance.quantity,
                    "customer": f"{instance.customer.first_name} {instance.customer.last_name}".strip() if instance.customer else "N/A"
                }
            )
        except Exception as e:
            # Silently fail to avoid breaking the order creation process
            pass

@receiver(post_save, sender=Delivery)
def log_delivery_activity(sender, instance, created, **kwargs):
    """Create activity logs for delivery actions"""
    # Skip if this is being called during fixture loading or migrations
    if kwargs.get('raw', False):
        return
    
    # Try to get the actor (driver or staff member who made the change)
    actor = None
    
    # If this delivery has a driver, use that as the actor
    if hasattr(instance, 'driver') and instance.driver:
        actor = instance.driver
    # If not, we might not have a direct way to know who made the change
    
    # For now, we'll create a generic log entry if we have an actor
    if actor:
        try:
            action = "delivery_created" if created else "delivery_updated"
            ActivityLog.objects.create(
                actor=actor,
                action=action,
                entity="delivery",
                meta={
                    "delivery_id": instance.id,
                    "order_id": instance.order.id if instance.order else "N/A",
                    "status": instance.status,
                    "driver": f"{instance.driver.first_name} {instance.driver.last_name}".strip() if instance.driver else "N/A"
                }
            )
        except Exception as e:
            # Silently fail to avoid breaking the delivery process
            pass
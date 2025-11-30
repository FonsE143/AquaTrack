from django.db.models.signals import post_save
from django.dispatch import receiver
from core.models import User, Profile, Order, Delivery

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
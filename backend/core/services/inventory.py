from core.models import Notification, Profile

from decimal import Decimal

def apply_order_inventory(order):
    total = Decimal('0.00')
    for item in order.items.all():
        p = item.product
        p.stock_full -= item.qty_full_out
        p.stock_empty += item.qty_empty_in
        p.save()
        total += p.price * Decimal(item.qty_full_out)
        if p.stock_full < p.threshold:
            for recipient in Profile.objects.filter(role__in=['admin','staff']):
                Notification.objects.create(
                    user=recipient, type='inapp',
                    message=f"Low stock alert: {p.name} ({p.stock_full} left)"
                )
    order.total_amount = total
    order.save()

from core.models import Notification, Profile

from decimal import Decimal

def apply_order_inventory(order):
    total = Decimal('0.00')
    for item in order.items.all():
        p = item.product
        total += p.price * Decimal(item.qty_full_out)
        # Note: Stock tracking is now done via order-based calculations in the frontend
    order.total_amount = total
    order.save()

from django.contrib import admin
from core.models import Profile, Product, Order, OrderItem, Delivery, Notification, ActivityLog

admin.site.register(Profile)
admin.site.register(Product)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Delivery)
admin.site.register(Notification)
admin.site.register(ActivityLog)

# backend/core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.api.views import (
    ProductViewSet, OrderViewSet, DeliveryViewSet,
    CustomerViewSet, StaffViewSet, ReportViewSet,
    NotificationViewSet, MeView, DriverViewSet, ActivityLogViewSet, OrderHistoryViewSet, CancelledOrderViewSet, ProfileViewSet,
    MunicipalityViewSet, BarangayViewSet, AddressViewSet, WalkInOrderViewSet, RouteViewSet, VehicleViewSet, DeploymentViewSet
)
from core.api.export import export_customers, export_staff, export_products
from core.api.account import ChangePasswordView, RegisterView

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='products')
router.register(r'orders', OrderViewSet, basename='orders')
router.register(r'deliveries', DeliveryViewSet, basename='deliveries')
router.register(r'drivers', DriverViewSet, basename='drivers')
router.register(r'activity', ActivityLogViewSet, basename='activity')
router.register(r'order-history', OrderHistoryViewSet, basename='order-history')
router.register(r'cancelled-orders', CancelledOrderViewSet, basename='cancelled-orders')
router.register(r'customers', CustomerViewSet, basename='customers')  # explicit
router.register(r'staff', StaffViewSet, basename='staff')              # explicit
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'profiles', ProfileViewSet, basename='profiles')
# New models
router.register(r'municipalities', MunicipalityViewSet, basename='municipalities')
router.register(r'barangays', BarangayViewSet, basename='barangays')
router.register(r'addresses', AddressViewSet, basename='addresses')
router.register(r'walk-in-orders', WalkInOrderViewSet, basename='walk-in-orders')
router.register(r'routes', RouteViewSet, basename='routes')
router.register(r'vehicles', VehicleViewSet, basename='vehicles')
router.register(r'deployments', DeploymentViewSet, basename='deployments')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/reports/', ReportViewSet.as_view()),
    path('api/account/register/', RegisterView.as_view()),
    path('api/account/change-password/', ChangePasswordView.as_view()),
    path('api/me/', MeView.as_view()),
    path('api/export/customers.csv', export_customers),
    path('api/export/staff.csv', export_staff),
    path('api/export/products.csv', export_products),
]
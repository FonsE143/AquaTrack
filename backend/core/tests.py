from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from core.models import User, Profile, Product

class OrderCreationTests(APITestCase):
    def setUp(self):
        # Create user and customer profile
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.customer_profile = Profile.objects.create(user=self.user, role='customer')

        # Create sample products
        self.product1 = Product.objects.create(name='Water Bottle', sku='WB123', price=10.00, stock_full=100, stock_empty=0, threshold=10)
        self.product2 = Product.objects.create(name='Water Can', sku='WC123', price=20.00, stock_full=50, stock_empty=10, threshold=5)

        # Authenticate the client
        self.client.login(username='testuser', password='testpass123')

    def test_create_order_success(self):
        url = reverse('orders-list')
        data = {
            "customer": self.customer_profile.id,
            "status": "received",
            "notes": "Test order",
            "items": [
                {"product": self.product1.id, "qty_full_out": 5, "qty_empty_in": 0},
                {"product": self.product2.id, "qty_full_out": 2, "qty_empty_in": 1}
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Refresh from DB
        self.product1.refresh_from_db()
        self.product2.refresh_from_db()

        # Check stock updated correctly
        self.assertEqual(self.product1.stock_full, 95)
        self.assertEqual(self.product1.stock_empty, 0)
        self.assertEqual(self.product2.stock_full, 48)
        self.assertEqual(self.product2.stock_empty, 11)

    def test_create_order_insufficient_stock(self):
        url = reverse('orders-list')
        data = {
            "customer": self.customer_profile.id,
            "status": "received",
            "notes": "Test order over stock",
            "items": [
                {"product": self.product1.id, "qty_full_out": 500, "qty_empty_in": 0}
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Insufficient stock', response.data.get('non_field_errors', [''])[0] or '')

    def test_low_stock_notification_created(self):
        # Reduce product stock near threshold
        self.product1.stock_full = 11
        self.product1.save()

        url = reverse('orders-list')
        data = {
            "customer": self.customer_profile.id,
            "status": "received",
            "notes": "Trigger low stock notification",
            "items": [
                {"product": self.product1.id, "qty_full_out": 5, "qty_empty_in": 0}
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check notifications created for admin/staff (assuming they exist)
        from core.models import Notification, Profile
        admins_staff = Profile.objects.filter(role__in=['admin', 'staff'])
        notifications = Notification.objects.filter(message__icontains=self.product1.name)
        self.assertTrue(notifications.exists())
        for recipient in admins_staff:
            self.assertTrue(notifications.filter(user=recipient).exists())

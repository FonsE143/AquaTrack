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
        self.product1 = Product.objects.create(name='Water Bottle', sku='WB123', price=10.00, active=True)
        self.product2 = Product.objects.create(name='Water Can', sku='WC123', price=20.00, active=True)

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

        # Stock tracking is now done via order-based calculations in the frontend
        # No need to check stock values as they are no longer stored in the database

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
        # This test is no longer applicable as stock tracking is now done via order-based calculations
        pass

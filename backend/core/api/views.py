from rest_framework import viewsets, views, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound
from django.db.models import Sum, Count, F, Q
from django.utils import timezone
from datetime import timedelta
from core.models import Product, Order, Delivery, Profile, Notification, OrderHistory, CancelledOrder
from .serializers import (
    ProductSerializer, OrderSerializer, DeliverySerializer, ProfileSerializer, NotificationSerializer,
    ActivityLogSerializer, OrderHistorySerializer, CancelledOrderSerializer
)
from core.models import ActivityLog
from .permissions import IsRole

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Admin can manage deliveries; drivers may update their delivery status
        if self.action in ['create', 'destroy']:
            return [IsAuthenticated(), IsRole('admin')]
        if self.action in ['update', 'partial_update']:
            # allow authenticated users to update (actual role checks should be enforced in views if needed)
            return [IsAuthenticated()]
        return [IsAuthenticated()]

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.filter(role='customer')
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRole('admin')]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Customers can only see their own profile
        if hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'customer':
            return queryset.filter(user=self.request.user)
        # Admin and staff can see all customers
        return queryset

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.filter(role='staff')
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Only admin can manage staff
        return [IsAuthenticated(), IsRole('admin')]


class DriverViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Profile.objects.filter(role='driver')
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('customer__user').prefetch_related('items__product')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Customers can only see their own orders
        if hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'customer':
            return queryset.filter(customer__user=self.request.user)
        # Admin and staff can see all orders
        return queryset
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRole('admin')]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        # Ensure customer is set to the current user's profile if they're a customer
        if hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'customer':
            serializer.save(customer=self.request.user.profile)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        # Permissions and allowed transitions:
        if not hasattr(request.user, 'profile'):
            raise PermissionDenied('Profile required')
        actor_profile = request.user.profile
        actor_role = actor_profile.role
        order = self.get_object()
        new_status = request.data.get('status')
        valid_statuses = [choice[0] for choice in Order.STATUS]
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if order is already in a final state
        if order.status in ['delivered', 'cancelled']:
            return Response({'error': f'Cannot change status from {order.status} to {new_status}. Order is already in a final state.'}, status=status.HTTP_400_BAD_REQUEST)

        # Staff/admin can set processing, out, cancelled. Driver can set delivered or cancelled but only if assigned.
        if actor_role in ['admin', 'staff']:
            if new_status not in ['processing', 'out', 'cancelled']:
                return Response({'error': 'Not allowed for your role'}, status=status.HTTP_403_FORBIDDEN)
        elif actor_role == 'driver':
            # driver may only mark delivered or cancelled and must be assigned to the delivery
            if new_status not in ['delivered', 'cancelled']:
                return Response({'error': 'Not allowed for your role'}, status=status.HTTP_403_FORBIDDEN)
            try:
                delivery = order.delivery
            except Delivery.DoesNotExist:
                return Response({'error': 'No delivery assigned'}, status=status.HTTP_400_BAD_REQUEST)
            if delivery.driver != request.user.profile:
                return Response({'error': 'You are not assigned to this delivery'}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({'error': 'Only staff, admin or driver may update order status'}, status=status.HTTP_403_FORBIDDEN)

        previous_status = order.status
        
        # Validate status transition
        valid_transitions = {
            'processing': ['out', 'cancelled'],
            'out': ['delivered', 'cancelled'],
            'delivered': [],
            'cancelled': []
        }
        
        if new_status not in valid_transitions.get(previous_status, []):
            return Response({'error': f'Cannot change status from {previous_status} to {new_status}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update order
        order.status = new_status
        if 'notes' in request.data:
            order.notes = request.data['notes']
        order.save()
        
        # Create order history record
        try:
            OrderHistory.objects.create(
                order=order,
                status=new_status,
                updated_by=actor_profile
            )
        except Exception as e:
            # Log the error but don't break the request
            print(f"Failed to create order history: {e}")
        
        # If order is cancelled, create a CancelledOrder record
        if new_status == 'cancelled':
            try:
                CancelledOrder.objects.get_or_create(
                    order=order,
                    defaults={
                        'reason': request.data.get('notes', ''),
                        'cancelled_by': actor_profile
                    }
                )
            except Exception as e:
                # Log the error but don't break the request
                print(f"Failed to create cancelled order record: {e}")
        
        # create or update delivery information
        driver_id = request.data.get('driver_id')
        if driver_id:
            try:
                driver = Profile.objects.get(id=driver_id, role='driver')
            except Profile.DoesNotExist:
                raise NotFound('Driver not found')
            delivery, created = Delivery.objects.get_or_create(order=order)
            delivery.driver = driver
            print(f"Delivery created/updated: ID={delivery.id}, Driver={driver.user.username}, Created={created}")
        else:
            # If no driver_id is provided, try to get existing delivery
            try:
                delivery = order.delivery
            except Delivery.DoesNotExist:
                delivery = None
        
        # Update delivery status based on order status
        if new_status == 'processing' and delivery:
            delivery.status = 'assigned'
            print(f"Setting delivery status to 'assigned'")
        elif new_status == 'out' and delivery:
            delivery.status = 'enroute'
            print(f"Setting delivery status to 'enroute'")
        elif new_status in ['delivered', 'cancelled'] and delivery:
            delivery.status = 'completed'
            print(f"Setting delivery status to 'completed'")
        
        if delivery:
            delivery.save()
            print(f"Delivery saved: ID={delivery.id}, Status={delivery.status}")
        
        # If order is delivered, create a notification for the customer
        if new_status == 'delivered' and delivery:
            try:
                # Get driver information
                driver_name = delivery.driver.user.username if delivery.driver else "Unknown Driver"
                
                # Create notification for customer
                Notification.objects.create(
                    user=order.customer,
                    type='inapp',
                    message=f"Your order #{order.id} has been delivered by {driver_name} at {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}."
                )
            except Exception as e:
                # Log the error but don't break the request
                print(f"Failed to create delivery notification: {e}")
        
        # Log activity
        try:
            ActivityLog.objects.create(
                actor=actor_profile,
                action='update_order_status',
                entity=f'order:{order.id}',
                meta={'from': previous_status, 'to': new_status, 'driver_assigned': driver_id}
            )
        except Exception:
            # ensure logging failure does not break the request
            pass
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statuses(self, request):
        return Response([s for s,_ in Order.STATUS])

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.select_related('actor__user').order_by('-timestamp')
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Admin can see all activity logs
        if hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'admin':
            return queryset
        # Drivers can only see their own activity logs
        elif hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'driver':
            return queryset.filter(actor=self.request.user.profile)
        # Staff can see all activity logs
        elif hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'staff':
            return queryset
        # Customers cannot see activity logs
        else:
            return queryset.none()

class OrderHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = OrderHistory.objects.select_related('order', 'updated_by__user')
    serializer_class = OrderHistorySerializer
    permission_classes = [IsAuthenticated, IsRole('admin')]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status', None)
        order = self.request.query_params.get('order', None)
        
        if status:
            queryset = queryset.filter(status=status)
        
        if order:
            queryset = queryset.filter(order=order)
            
        return queryset

class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = Delivery.objects.select_related('order','driver')
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Debug information
        print(f"User: {self.request.user}")
        print(f"User has profile: {hasattr(self.request.user, 'profile')}")
        if hasattr(self.request.user, 'profile'):
            print(f"Profile role: {self.request.user.profile.role}")
            print(f"Profile ID: {self.request.user.profile.id}")
        
        # Drivers can only see deliveries assigned to them for orders that are not yet completed
        # Drivers should see orders with status "Out for Delivery"
        if hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'driver':
            driver_profile = self.request.user.profile
            result = queryset.filter(
                driver=driver_profile
            ).filter(
                order__status='out'
            ).exclude(
                order__status__in=['delivered', 'cancelled']
            )
            print(f"Filtering deliveries for driver: {driver_profile.id}, Found: {result.count()}")
            # Additional debug information
            all_driver_deliveries = queryset.filter(driver=driver_profile)
            print(f"All deliveries for driver: {all_driver_deliveries.count()}")
            for delivery in all_driver_deliveries:
                print(f"Delivery ID: {delivery.id}, Order ID: {delivery.order.id}, Order Status: {delivery.order.status}, Delivery Status: {delivery.status}")
            return result
        # Staff can see all deliveries that are not queued
        elif hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'staff':
            return queryset.exclude(status='queued')
        # Customers can see deliveries for their orders
        elif hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'customer':
            return queryset.filter(order__customer__user=self.request.user)
        # Admin can see all
        return queryset
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRole('admin')]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'])
    def auto_dispatch(self, request):
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'admin':
            raise PermissionDenied('Only admins can auto-dispatch deliveries')
        
        deliveries = Delivery.objects.filter(status='queued').select_related('order__customer')
        for idx, d in enumerate(deliveries.order_by('order__customer__address')):
            d.route_index = idx
            d.status = 'assigned'
            d.save()
        return Response({'assigned': deliveries.count()})

class ReportViewSet(views.APIView):
    permission_classes = [IsAuthenticated, IsRole('admin')]
    
    def get(self, request):
        sales = Order.objects.values('created_at__date').annotate(
            total=Sum('total_amount'), orders=Count('id')
        ).order_by('-created_at__date')[:30]
        # Normalize sales dates to ISO strings and totals to floats for frontend charting
        sales_list = []
        for s in sales:
            date_val = s.get('created_at__date')
            sales_list.append({
                'created_at__date': date_val.isoformat() if date_val else None,
                'total': float(s.get('total') or 0),
                'orders': int(s.get('orders') or 0)
            })
        low_stock = Product.objects.filter(stock_full__lt=F('threshold')).values('name','stock_full','threshold')
        top_customers = Order.objects.values('customer__user__username').annotate(spend=Sum('total_amount')).order_by('-spend')[:10]
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        start_of_month = today.replace(day=1)

        def aggregate_total(start_date):
            return Order.objects.filter(created_at__date__gte=start_date).aggregate(total=Sum('total_amount'))['total'] or 0

        revenue_summary = {
            'today': float(Order.objects.filter(created_at__date=today).aggregate(total=Sum('total_amount'))['total'] or 0),
            'week': float(aggregate_total(start_of_week)),
            'month': float(aggregate_total(start_of_month)),
        }
        return Response({
            'sales': sales_list,
            'low_stock': list(low_stock),
            'top_customers': list(top_customers),
            'revenue_summary': revenue_summary,
        })


class CancelledOrderViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CancelledOrder.objects.select_related('order', 'order__customer__user', 'cancelled_by__user')
    serializer_class = CancelledOrderSerializer
    permission_classes = [IsAuthenticated, IsRole('admin')]

class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated, IsRole('admin')]

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.all().order_by('-sent_at')
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own notifications
        if hasattr(self.request.user, 'profile'):
            return self.queryset.filter(user=self.request.user.profile)
        return self.queryset.none()

class MeView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not hasattr(request.user, 'profile'):
            return Response(
                {'error': 'Profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(ProfileSerializer(request.user.profile).data)

    def patch(self, request):
        if not hasattr(request.user, 'profile'):
            return Response(
                {'error': 'Profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        profile = request.user.profile
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

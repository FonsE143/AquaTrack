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
    queryset = Order.objects.all().prefetch_related('items__product', 'customer__user', 'delivery__driver__user')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Admin can manage everything; staff can create/view/update orders; customers can only view their own orders
        if self.action in ['create']:
            # Anyone authenticated can create an order (customer creates their own, staff/admin can create for anyone)
            return [IsAuthenticated()]
        elif self.action in ['update', 'partial_update']:
            # Only admin/staff can update orders, and they can update any order
            return [IsAuthenticated(), IsRole('admin', 'staff')]
        elif self.action in ['destroy']:
            # Only admin can delete orders
            return [IsAuthenticated(), IsRole('admin')]
        return [IsAuthenticated()]  # default: view only
    
    def get_queryset(self):
        # Restrict customers to only see their own orders
        if not hasattr(self.request.user, 'profile'):
            return Order.objects.none()
            
        profile = self.request.user.profile
        if profile.role == 'customer':
            return Order.objects.filter(customer=profile)
        # Staff and admin can see all orders
        return Order.objects.all()
    
    def perform_create(self, serializer):
        # If customer is not specified and user is customer, auto-assign
        customer_id = self.request.data.get('customer')
        if not customer_id and hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'customer':
            serializer.save(customer=self.request.user.profile)
        elif customer_id:
            # Admin/staff specified a customer, verify it exists and is a customer
            try:
                customer = Profile.objects.get(id=customer_id, role='customer')
                serializer.save(customer=customer)
            except Profile.DoesNotExist:
                raise PermissionDenied('Invalid customer specified')
        else:
            # No customer specified, check if this is a walk-in order
            notes = self.request.data.get('notes', '')
            if 'walk-in' in notes.lower() or 'walk in' in notes.lower():
                # Try to find the walk-in customer
                try:
                    walkin_customer = Profile.objects.get(user__username='walkin_customer', role='customer')
                    serializer.save(customer=walkin_customer)
                except Profile.DoesNotExist:
                    # If no walk-in customer exists, save without customer (will be associated with current user)
                    serializer.save()
            else:
                # Save without customer (will be associated with current user)
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
        driver_id = request.data.get('driver_id')
        
        # Validate status if provided
        if new_status:
            valid_statuses = [choice[0] for choice in Order.STATUS]
            if new_status not in valid_statuses:
                return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if order is already in a final state
        if order.status in ['delivered', 'cancelled']:
            return Response({'error': f'Order is already in a final state.'}, status=status.HTTP_400_BAD_REQUEST)
        # Staff/admin can set processing, out, cancelled. Driver can set delivered or cancelled but only if assigned.
        # For walk-in orders, staff should also be able to set delivered status
        # Staff should also be able to assign drivers without changing status
        if actor_role in ['admin', 'staff']:
            # Check if this is a walk-in order (based on notes)
            is_walkin_order = 'walk-in' in (order.notes or '').lower() or 'walk in' in (order.notes or '').lower()
            
            # If only assigning driver (no status change), allow it
            if not new_status and driver_id:
                # Just assigning driver, no status change
                pass
            elif new_status and new_status not in ['processing', 'out', 'cancelled'] and not (new_status == 'delivered' and is_walkin_order):
                return Response({'error': 'Not allowed for your role'}, status=status.HTTP_403_FORBIDDEN)
        elif actor_role == 'driver':
            # driver may only mark delivered or cancelled and must be assigned to the delivery
            if new_status and new_status not in ['delivered', 'cancelled']:
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
        
        # Validate status transition if status is being changed
        if new_status and new_status != previous_status:
            valid_transitions = {
                'processing': ['out', 'cancelled'],
                'out': ['delivered', 'cancelled'],
                'delivered': [],
                'cancelled': []
            }
            
            # For walk-in orders, allow direct transition from processing to delivered
            is_walkin_order = 'walk-in' in (order.notes or '').lower() or 'walk in' in (order.notes or '').lower()
            if is_walkin_order and previous_status == 'processing' and new_status == 'delivered':
                # Allow this transition for walk-in orders
                pass
            elif new_status not in valid_transitions.get(previous_status, []):
                return Response({'error': f'Cannot change status from {previous_status} to {new_status}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update order status if provided
        if new_status:
            order.status = new_status
            if 'notes' in request.data:
                order.notes = request.data['notes']
            order.save()
            
            # If order is marked as delivered, also update the delivery status to completed
            if new_status == 'delivered':
                try:
                    delivery = order.delivery
                    if delivery and delivery.driver == actor_profile:
                        delivery.status = 'completed'
                        delivery.save()
                except Delivery.DoesNotExist:
                    # No delivery assigned, that's okay
                    pass
            
            # Create activity log
            try:
                from core.models import ActivityLog
                print(f"Creating activity log for order {order.id}: {previous_status} -> {new_status}")
                ActivityLog.objects.create(
                    actor=actor_profile,
                    action='update_order_status',
                    entity=f'order:{order.id}',
                    meta={'from': previous_status, 'to': new_status, 'notes': request.data.get('notes', '')}
                )
                print(f"Activity log created successfully for order {order.id}")
            except Exception as e:
                # Log the error but don't break the request
                print(f"Failed to create activity log: {e}")
                import traceback
                traceback.print_exc()
            
            # Send notification to customer about order status change
            try:
                from core.models import Notification
                status_labels = dict(Order.STATUS)
                status_label = status_labels.get(new_status, new_status.capitalize())
                
                # Create a more detailed message based on the status
                if new_status == 'out':
                    # Try to get driver info if available
                    driver_info = ''
                    try:
                        delivery = order.delivery
                        if delivery and delivery.driver:
                            driver = delivery.driver
                            driver_name = f"{driver.user.first_name} {driver.user.last_name}".strip()
                            if not driver_name:
                                driver_name = driver.user.username
                            driver_info = f" by {driver_name}"
                    except Delivery.DoesNotExist:
                        pass
                    
                    message = f"Your order #{order.id} is now Out for Delivery{driver_info}."
                elif new_status == 'delivered':
                    message = f"Your order #{order.id} has been Delivered. Thank you for choosing our service!"
                elif new_status == 'cancelled':
                    reason = request.data.get('notes', '')
                    if reason:
                        message = f"Your order #{order.id} has been Cancelled. Reason: {reason}"
                    else:
                        message = f"Your order #{order.id} has been Cancelled."
                else:
                    message = f"Your order #{order.id} status has been updated to {status_label}."
                
                Notification.objects.create(
                    user=order.customer,
                    type='inapp',
                    message=message
                )
            except Exception as e:
                # Log the error but don't break the request
                print(f"Failed to create customer notification: {e}")
                import traceback
                traceback.print_exc()
            
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
        if driver_id is not None:  # Allow unassigning driver with null
            if driver_id:
                try:
                    driver = Profile.objects.get(id=driver_id, role='driver')
                except Profile.DoesNotExist:
                    raise NotFound('Driver not found')
                delivery, created = Delivery.objects.get_or_create(order=order)
                delivery.driver = driver
                # If the order status is 'out', set the delivery status to 'assigned'
                if order.status == 'out':
                    delivery.status = 'assigned'
                delivery.save()
            else:
                # Unassign driver by removing delivery record
                Delivery.objects.filter(order=order).delete()
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def update_item(self, request, pk=None):
        """Custom endpoint to update order items (specifically qty_empty_in for container returns)"""
        order = self.get_object()
        item_updates = request.data.get('items', [])
        
        # Only drivers assigned to this order's delivery can update items
        # Admins and staff can also update items for walk-in orders
        if not hasattr(request.user, 'profile'):
            return Response({'error': 'Profile required'}, status=status.HTTP_403_FORBIDDEN)
        
        profile = request.user.profile
        role = profile.role
        
        # Check if this is a walk-in order
        is_walkin_order = 'walk-in' in (order.notes or '').lower() or 'walk in' in (order.notes or '').lower()
        
        # Allow drivers only for their assigned deliveries, and admins/staff for walk-in orders
        if role == 'driver':
            try:
                delivery = order.delivery
            except Delivery.DoesNotExist:
                return Response({'error': 'No delivery assigned to this order'}, status=status.HTTP_400_BAD_REQUEST)
                
            if delivery.driver != profile:
                return Response({'error': 'You are not assigned to this delivery'}, status=status.HTTP_403_FORBIDDEN)
        elif role in ['admin', 'staff']:
            # Only allow admins/staff to update walk-in orders
            if not is_walkin_order:
                return Response({'error': 'Only drivers can update order items for non-walk-in orders'}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({'error': 'Not authorized to update order items'}, status=status.HTTP_403_FORBIDDEN)
        
        # Update each item
        updated_items = []
        for item_data in item_updates:
            item_id = item_data.get('id')
            qty_empty_in = item_data.get('qty_empty_in')
            
            if item_id is None or qty_empty_in is None:
                continue
                
            try:
                # Find the order item belonging to this order
                item = order.items.get(id=item_id)
                # Validate that qty_empty_in is not negative and not greater than qty_full_out
                if qty_empty_in < 0:
                    return Response({'error': f'qty_empty_in for item {item_id} cannot be negative'}, status=status.HTTP_400_BAD_REQUEST)
                    
                if qty_empty_in > item.qty_full_out:
                    return Response({'error': f'qty_empty_in for item {item_id} cannot be greater than qty_full_out ({item.qty_full_out})'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Update the item
                item.qty_empty_in = qty_empty_in
                item.save()
                updated_items.append(item)
            except order.items.model.DoesNotExist:
                return Response({'error': f'Item {item_id} not found in this order'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Return updated order
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
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        return [IsAuthenticated(), IsRole('admin')]
    
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
        # Drivers should see all deliveries assigned to them where the order is not in a final state
        # Final states are: delivered (with completed delivery) and cancelled
        if hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'driver':
            driver_profile = self.request.user.profile
            result = queryset.filter(
                driver=driver_profile
            ).exclude(
                Q(order__status='delivered') & Q(status='completed')
            ).exclude(
                order__status='cancelled'
            )
            
            # Debug information
            print(f"User: {self.request.user}")
            print(f"Profile role: {self.request.user.profile.role}")
            print(f"Driver profile ID: {driver_profile.id}")
            print(f"Total deliveries for driver: {queryset.filter(driver=driver_profile).count()}")
            print(f"Filtered deliveries count: {result.count()}")
            
            # Print details of all deliveries for this driver
            all_driver_deliveries = queryset.filter(driver=driver_profile)
            for delivery in all_driver_deliveries:
                print(f"Delivery ID: {delivery.id}, Status: {delivery.status}, Order ID: {delivery.order.id}, Order Status: {delivery.order.status}")
            
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
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        return [IsAuthenticated(), IsRole('admin')]
    
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

        # Get products with outstanding container returns
        # This query finds products where delivered containers > returned containers
        to_be_returned = []
        delivered_products = Order.objects.filter(status='delivered').values(
            'items__product__name'
        ).annotate(
            total_delivered=Sum('items__qty_full_out'),
            total_returned=Sum('items__qty_empty_in')
        ).filter(
            total_delivered__gt=F('total_returned')
        )

        for product_data in delivered_products:
            to_be_returned.append({
                'name': product_data['items__product__name'],
                'delivered': product_data['total_delivered'],
                'returned': product_data['total_returned'] or 0,
                'outstanding': product_data['total_delivered'] - (product_data['total_returned'] or 0)
            })

        top_customers = Order.objects.values(
            'customer__user__username',
            'customer__first_name',
            'customer__last_name'
        ).annotate(spend=Sum('total_amount')).order_by('-spend')[:10]
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
            'to_be_returned': to_be_returned,
            'top_customers': list(top_customers),
            'revenue_summary': revenue_summary,
        })


class CancelledOrderViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CancelledOrder.objects.select_related('order', 'order__customer__user', 'cancelled_by__user')
    serializer_class = CancelledOrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        return [IsAuthenticated(), IsRole('admin')]

class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        return [IsAuthenticated(), IsRole('admin')]

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

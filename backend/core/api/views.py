from rest_framework import viewsets, views, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound
from django.db.models import Sum, Count, F, Q
from django.utils import timezone
from datetime import timedelta
from core.models import Product, Order, Delivery, Profile, Notification, OrderHistory, CancelledOrder
from core.models import ActivityLog, Municipality, Barangay, Address, WalkInOrder, Route, Vehicle, Deployment, User
from .serializers import (
    ProductSerializer, OrderSerializer, DeliverySerializer, ProfileSerializer, NotificationSerializer,
    ActivityLogSerializer, OrderHistorySerializer, CancelledOrderSerializer,
    MunicipalitySerializer, BarangaySerializer, AddressSerializer, WalkInOrderSerializer, RouteSerializer, VehicleSerializer, DeploymentSerializer
)
from .permissions import IsRole

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Admin can manage products; others can only view
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRole('admin')]
        return [IsAuthenticated()]

class MunicipalityViewSet(viewsets.ModelViewSet):
    queryset = Municipality.objects.all().order_by('name')
    serializer_class = MunicipalitySerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Admin can manage municipalities; others can only view
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRole('admin')]
        return [IsAuthenticated()]

class BarangayViewSet(viewsets.ModelViewSet):
    queryset = Barangay.objects.select_related('municipality').all().order_by('name')
    serializer_class = BarangaySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination for barangays
    
    def get_permissions(self):
        # Admin can manage barangays; others can only view
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRole('admin')]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        municipality = self.request.query_params.get('municipality', None)
        if municipality:
            queryset = queryset.filter(municipality=municipality)
        return queryset

class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.select_related('barangay', 'barangay__municipality').all()
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Admin can manage addresses; others can only view
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRole('admin')]
        return [IsAuthenticated()]

class WalkInOrderViewSet(viewsets.ModelViewSet):
    queryset = WalkInOrder.objects.select_related('product').all().order_by('-created_at')
    serializer_class = WalkInOrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Staff and admin can manage walk-in orders
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRole('admin', 'staff')]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        # Auto-set the date to now
        serializer.save()

class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.prefetch_related('municipalities', 'barangays').all().order_by('route_number')
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Admin can manage routes; others can only view
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRole('admin')]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        # Handle multiple municipalities and barangays
        municipalities = self.request.data.get('municipalities', [])
        barangays = self.request.data.get('barangays', [])
        
        # Save the route first
        route = serializer.save()
        
        # Set municipalities
        if municipalities:
            route.municipalities.set(municipalities)
        
        # Set barangays
        if barangays:
            route.barangays.set(barangays)
    
    def perform_update(self, serializer):
        # Handle multiple municipalities and barangays for updates
        municipalities = self.request.data.get('municipalities', [])
        barangays = self.request.data.get('barangays', [])
        
        # Save the route first
        route = serializer.save()
        
        # Set municipalities
        if municipalities:
            route.municipalities.set(municipalities)
        
        # Set barangays
        if barangays:
            route.barangays.set(barangays)

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all().order_by('name')
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Admin can manage vehicles; others can only view
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRole('admin')]
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
    
    @action(detail=False, methods=['get'])
    def outstanding_containers(self, request):
        """Get outstanding containers for the current customer"""
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'customer':
            return Response({'error': 'Only customers can access this endpoint'}, status=403)
        
        customer = request.user.profile
        
        # Get outstanding containers directly from the customer profile
        # This is more reliable than calculating from order history
        outstanding_data = customer.outstanding_containers or {}
        
        # Format the data for the frontend
        outstanding_containers = []
        from core.models import Product
        for product_id_str, quantity in outstanding_data.items():
            if quantity > 0:  # Only show products with outstanding containers
                try:
                    product = Product.objects.get(id=int(product_id_str))
                    outstanding_containers.append({
                        'product_id': int(product_id_str),
                        'product_name': product.name,
                        'quantity': quantity
                    })
                except (Product.DoesNotExist, ValueError):
                    # Skip invalid product IDs
                    continue
        
        return Response({
            'outstanding_containers': outstanding_containers
        })
    
    @action(detail=False, methods=['post'])
    def return_containers(self, request):
        """Allow customers to return outstanding containers"""
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'customer':
            return Response({'error': 'Only customers can return containers'}, status=403)
        
        customer = request.user.profile
        returns = request.data.get('returns', {})
        
        # Validate the returns data
        if not isinstance(returns, dict):
            return Response({'error': 'Invalid returns data format'}, status=400)
        
        # Get current outstanding containers
        current_outstanding = customer.outstanding_containers or {}
        
        # Process each return
        updates_made = False
        for product_id_str, return_qty in returns.items():
            try:
                product_id = int(product_id_str)
                return_qty = int(return_qty)
                
                # Validate return quantity
                if return_qty <= 0:
                    continue
                    
                # Check if customer has outstanding containers for this product
                current_outstanding_qty = current_outstanding.get(product_id_str, 0)
                if current_outstanding_qty <= 0:
                    continue
                
                # Calculate new outstanding quantity
                new_outstanding_qty = current_outstanding_qty - return_qty
                
                # Ensure we don't go below zero
                new_outstanding_qty = max(0, new_outstanding_qty)
                
                # Update the outstanding containers
                if new_outstanding_qty == 0:
                    current_outstanding.pop(product_id_str, None)
                else:
                    current_outstanding[product_id_str] = new_outstanding_qty
                
                updates_made = True
                
            except (ValueError, TypeError):
                # Skip invalid entries
                continue
        
        # Save updated outstanding containers if changes were made
        if updates_made:
            customer.outstanding_containers = current_outstanding
            customer.save(update_fields=['outstanding_containers'])
            
            # Log the container return
            try:
                from core.models import ActivityLog
                ActivityLog.objects.create(
                    actor=customer,
                    action="container_return",
                    entity="customer",
                    meta={
                        "returns": returns,
                        "updated_outstanding": current_outstanding
                    }
                )
            except Exception as e:
                print(f"Failed to create activity log: {e}")
        
        return Response({
            'message': 'Containers returned successfully',
            'outstanding_containers': current_outstanding
        })


class StaffViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.filter(role='staff')
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Only admin can manage staff
        return [IsAuthenticated(), IsRole('admin')]
    
    def get_queryset(self):
        # For listing, we only show staff
        # For creation, we don't want to filter by role
        if self.action == 'create':
            return Profile.objects.all()
        return super().get_queryset()
    
    def create(self, request, *args, **kwargs):
        # Create user first
        user_data = {
            'username': request.data.get('username'),
            'email': request.data.get('email', ''),
            'first_name': request.data.get('first_name', ''),
            'last_name': request.data.get('last_name', ''),
        }
        
        # Set default password for staff
        user = User.objects.create_user(password='staffpassword', **user_data)
        
        # Create profile with staff role
        profile_data = {
            'user': user,
            'role': 'staff',
            'first_name': user_data['first_name'],
            'last_name': user_data['last_name'],
            'phone': request.data.get('phone', ''),
        }
        
        # Handle address if provided
        municipality_id = request.data.get('municipality')
        barangay_id = request.data.get('barangay')
        address_details = request.data.get('address_details')
        
        if municipality_id and barangay_id and address_details:
            try:
                from core.models import Municipality, Barangay, Address
                municipality = Municipality.objects.get(id=municipality_id)
                barangay = Barangay.objects.get(id=barangay_id, municipality=municipality)
                address = Address.objects.create(
                    barangay=barangay,
                    full_address=address_details.strip()
                )
                profile_data['address'] = address
            except Exception as e:
                pass  # Silently ignore address errors for now
        
        profile = Profile.objects.create(**profile_data)
        
        # Serialize and return the created profile
        # We need to manually create the serialized data since the serializer has role as read_only
        serialized_data = {
            'id': profile.id,
            'username': profile.user.username,
            'role': profile.role,
            'first_name': profile.first_name,
            'last_name': profile.last_name,
            'middle_name': profile.middle_name,
            'email': profile.user.email,
            'phone': profile.phone,
            'address': profile.address.id if profile.address else None,
            'address_detail': {
                'id': profile.address.id,
                'full_address': profile.address.full_address,
                'barangay': profile.address.barangay.id,
                'municipality': profile.address.barangay.municipality.id,
                'barangay_name': profile.address.barangay.name,
                'municipality_name': profile.address.barangay.municipality.name
            } if profile.address else None
        }
        return Response(serialized_data, status=status.HTTP_201_CREATED)


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.filter(role='driver')
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Only admin can manage drivers
        return [IsAuthenticated(), IsRole('admin')]
    
    def get_queryset(self):
        # For listing, we only show drivers
        # For creation, we don't want to filter by role
        if self.action == 'create':
            return Profile.objects.all()
        return super().get_queryset()
    
    def create(self, request, *args, **kwargs):
        # Create user first
        user_data = {
            'username': request.data.get('username'),
            'email': request.data.get('email', ''),
            'first_name': request.data.get('first_name', ''),
            'last_name': request.data.get('last_name', ''),
        }
        
        # Set default password for driver
        user = User.objects.create_user(password='driverpassword', **user_data)
        
        # Create profile with driver role
        profile_data = {
            'user': user,
            'role': 'driver',
            'first_name': user_data['first_name'],
            'last_name': user_data['last_name'],
            'phone': request.data.get('phone', ''),
        }
        
        # Handle address if provided
        municipality_id = request.data.get('municipality')
        barangay_id = request.data.get('barangay')
        address_details = request.data.get('address_details')
        
        if municipality_id and barangay_id and address_details:
            try:
                from core.models import Municipality, Barangay, Address
                municipality = Municipality.objects.get(id=municipality_id)
                barangay = Barangay.objects.get(id=barangay_id, municipality=municipality)
                address = Address.objects.create(
                    barangay=barangay,
                    full_address=address_details.strip()
                )
                profile_data['address'] = address
            except Exception as e:
                pass  # Silently ignore address errors for now
        
        profile = Profile.objects.create(**profile_data)
        
        # Serialize and return the created profile
        # We need to manually create the serialized data since the serializer has role as read_only
        serialized_data = {
            'id': profile.id,
            'username': profile.user.username,
            'role': profile.role,
            'first_name': profile.first_name,
            'last_name': profile.last_name,
            'middle_name': profile.middle_name,
            'email': profile.user.email,
            'phone': profile.phone,
            'address': profile.address.id if profile.address else None,
            'address_detail': {
                'id': profile.address.id,
                'full_address': profile.address.full_address,
                'barangay': profile.address.barangay.id,
                'municipality': profile.address.barangay.municipality.id,
                'barangay_name': profile.address.barangay.name,
                'municipality_name': profile.address.barangay.municipality.name
            } if profile.address else None
        }
        return Response(serialized_data, status=status.HTTP_201_CREATED)

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('product', 'customer__user').all()
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
            # Save without customer (will be associated with current user)
            serializer.save()

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
    
    @action(detail=False, methods=['get'])
    def my_logs(self, request):
        """Get activity logs for the current user"""
        if not hasattr(request.user, 'profile'):
            return Response({'error': 'User profile not found'}, status=404)
        
        logs = self.get_queryset().filter(actor=request.user.profile)
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)

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
    queryset = Delivery.objects.select_related('order','driver','vehicle','route')
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
    
    @action(detail=False, methods=['get'], url_path='my-deliveries')
    def my_deliveries(self, request):
        """Get deliveries for the current customer"""
        if not hasattr(request.user, 'profile'):
            return Response({'error': 'User profile not found'}, status=404)
        
        # Only customers can access their own deliveries
        if request.user.profile.role != 'customer':
            return Response({'error': 'Only customers can access their deliveries'}, status=403)
        
        try:
            # Get deliveries for orders placed by this customer
            deliveries = Delivery.objects.select_related(
                'order', 'order__product', 'driver', 'vehicle', 'route'
            ).filter(
                order__customer=request.user.profile
            ).order_by('-created_at')
            
            serializer = self.get_serializer(deliveries, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    @action(detail=True, methods=['patch'])
    def assign_vehicle_route(self, request, pk=None):
        """Assign a vehicle and route to a delivery"""
        delivery = self.get_object()
        vehicle_id = request.data.get('vehicle_id')
        route_id = request.data.get('route_id')
        
        # Only admin and staff can assign vehicles and routes
        if not hasattr(request.user, 'profile') or request.user.profile.role not in ['admin', 'staff']:
            raise PermissionDenied('Only admin and staff can assign vehicles and routes')
        
        # Update vehicle if provided
        if vehicle_id is not None:
            if vehicle_id:
                try:
                    vehicle = Vehicle.objects.get(id=vehicle_id)
                    delivery.vehicle = vehicle
                except Vehicle.DoesNotExist:
                    return Response({'error': 'Vehicle not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                delivery.vehicle = None
        
        # Update route if provided
        if route_id is not None:
            if route_id:
                try:
                    route = Route.objects.get(id=route_id)
                    delivery.route = route
                except Route.DoesNotExist:
                    return Response({'error': 'Route not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                delivery.route = None
        
        delivery.save()
        serializer = self.get_serializer(delivery)
        return Response(serializer.data)

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
        # Only include delivered orders in sales data
        # Note: Orders don't have a status field, so we need to join with Delivery
        delivered_orders = Delivery.objects.filter(status='delivered').select_related('order')
        order_ids = [delivery.order.id for delivery in delivered_orders]
        
        sales = Order.objects.filter(
            id__in=order_ids
        ).values('created_at__date').annotate(
            total=Sum('product__price'), orders=Count('id')
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
        # Since we don't have container tracking in the current model, we'll skip this for now
        
        # Note: Orders don't have a status field, so we need to join with Delivery
        delivered_orders = Delivery.objects.filter(status='delivered').select_related('order')
        order_ids = [delivery.order.id for delivery in delivered_orders]
        
        top_customers = Order.objects.filter(
            id__in=order_ids
        ).values(
            'customer__user__username',
            'customer__first_name',
            'customer__last_name'
        ).annotate(spend=Sum('product__price')).order_by('-spend')[:10]
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        start_of_month = today.replace(day=1)

        def aggregate_total(start_date):
            # Note: Orders don't have a status field, so we need to join with Delivery
            delivered_orders = Delivery.objects.filter(status='delivered', order__created_at__date__gte=start_date).select_related('order')
            order_ids = [delivery.order.id for delivery in delivered_orders]
            return Order.objects.filter(id__in=order_ids).aggregate(total=Sum('product__price'))['total'] or 0

        # Note: Orders don't have a status field, so we need to join with Delivery
        delivered_today_orders = Delivery.objects.filter(status='delivered', order__created_at__date=today).select_related('order')
        today_order_ids = [delivery.order.id for delivery in delivered_today_orders]
        
        revenue_summary = {
            'today': float(Order.objects.filter(id__in=today_order_ids).aggregate(total=Sum('product__price'))['total'] or 0),
            'week': float(aggregate_total(start_of_week)),
            'month': float(aggregate_total(start_of_month)),
        }
        
        # Get recent deliveries for display on dashboard
        recent_deliveries = Delivery.objects.filter(
            status='delivered'
        ).select_related(
            'order', 'driver', 'vehicle'
        ).order_by('-order__created_at')[:10]
        
        recent_deliveries_data = []
        for delivery in recent_deliveries:
            recent_deliveries_data.append({
                'id': delivery.id,
                'order_id': delivery.order.id,
                'driver_name': delivery.driver.user.username if delivery.driver else 'Unassigned',
                'vehicle_name': delivery.vehicle.name if delivery.vehicle else 'Unassigned',
                'status': delivery.status,
                'delivered_at': delivery.order.created_at
            })
        
        return Response({
            'sales': sales_list,
            'to_be_returned': to_be_returned,
            'top_customers': list(top_customers),
            'revenue_summary': revenue_summary,
            'recent_deliveries': recent_deliveries_data
        })
    
    @action(detail=False, methods=['get'])
    def export_delivered_orders(self, request):
        """Export delivered orders to CSV"""
        # Only admin can export data
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'admin':
            raise PermissionDenied('Only admin can export data')
        
        # Get delivered orders
        delivered_orders = Order.objects.filter(status='delivered').select_related(
            'customer__user', 'product'
        )
        
        # Prepare data for CSV
        csv_data = []
        csv_data.append([
            'Order ID', 'Customer', 'Product', 'Quantity', 'Price', 'Total', 'Date'
        ])
        
        for order in delivered_orders:
            customer_name = f"{order.customer.first_name} {order.customer.last_name}".strip()
            if not customer_name:
                customer_name = order.customer.user.username
            
            csv_data.append([
                order.id,
                customer_name,
                order.product.name if order.product else 'N/A',
                order.quantity,
                float(order.product.price) if order.product else 0,
                float(order.product.price * order.quantity) if order.product else 0,
                order.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        # Convert to CSV string
        import csv
        import io
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerows(csv_data)
        csv_string = output.getvalue()
        output.close()
        
        # Return CSV as response
        from django.http import HttpResponse
        response = HttpResponse(csv_string, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="delivered_orders.csv"'
        return response


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


class UsersViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def create(self, request):
        # Determine the appropriate endpoint based on the role in the request data
        role = request.data.get('role', '').lower()
        
        if role == 'driver':
            # Create a driver using DriverViewSet's create method directly
            try:
                # Remove the role field from the data for the driver creation
                driver_data = request.data.copy()
                if 'role' in driver_data:
                    del driver_data['role']
                
                # Create a mock request-like object
                class MockRequest:
                    def __init__(self, user, data):
                        self.user = user
                        self.data = data
                        self.META = {}
                
                mock_request = MockRequest(request.user, driver_data)
                
                # Call the DriverViewSet create method directly
                response = DriverViewSet().create(mock_request)
                return response
            except Exception as e:
                import traceback
                traceback.print_exc()
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        elif role == 'staff':
            # Create a staff member using StaffViewSet's create method directly
            try:
                # Remove the role field from the data for the staff creation
                staff_data = request.data.copy()
                if 'role' in staff_data:
                    del staff_data['role']
                
                # Create a mock request-like object
                class MockRequest:
                    def __init__(self, user, data):
                        self.user = user
                        self.data = data
                        self.META = {}
                
                mock_request = MockRequest(request.user, staff_data)
                
                # Call the StaffViewSet create method directly
                response = StaffViewSet().create(mock_request)
                return response
            except Exception as e:
                import traceback
                traceback.print_exc()
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # If no role specified or invalid role, return an error
            return Response(
                {'error': 'Role must be specified as either "driver" or "staff"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

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

class DeploymentViewSet(viewsets.ModelViewSet):
    queryset = Deployment.objects.select_related('driver', 'vehicle', 'route', 'product').prefetch_related('route__municipalities').all().order_by('-created_at')
    serializer_class = DeploymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Admin and staff can manage deployments; others can only view
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRole('admin', 'staff')]
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        try:
            print(f"Deployment create request data: {request.data}")
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"Error in DeploymentViewSet.create: {e}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)
    

    @action(detail=False, methods=['get'], url_path='by-customer-barangay')
    def by_customer_barangay(self, request):
        """Get deployments for the current customer's barangay"""
        if not hasattr(request.user, 'profile'):
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Only customers can access this endpoint
        if request.user.profile.role != 'customer':
            return Response({'error': 'Only customers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get the customer's profile
            customer_profile = request.user.profile
            
            # Check if customer has an address
            if not customer_profile.address:
                return Response({
                    'deployments': [],
                    'message': 'No address found for customer'
                })
            
            # Get the customer's barangay
            customer_barangay = customer_profile.address.barangay
            
            # Find routes that include this barangay
            routes_with_barangay = Route.objects.filter(barangays=customer_barangay)
            
            # Get deployments for these routes
            deployments = Deployment.objects.select_related('driver', 'vehicle', 'route', 'product').filter(route__in=routes_with_barangay).order_by('-created_at')
            
            serializer = self.get_serializer(deployments, many=True)
            return Response({
                'deployments': serializer.data,
                'message': f'Found {deployments.count()} deployments for your barangay'
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        # Auto-set the created_at to now
        try:
            deployment = serializer.save()
            print(f"Deployment created successfully: {deployment.id}")
        except Exception as e:
            print(f"Error in perform_create: {e}")
            import traceback
            traceback.print_exc()
            raise
        
        # Create activity log
        try:
            from core.models import ActivityLog
            user_profile = getattr(self.request.user, 'profile', None)
            print(f"User profile for activity log: {user_profile}")
            if user_profile:
                meta_data = {
                    "deployment_id": getattr(deployment, 'id', None),
                    "stock": getattr(deployment, 'stock', None)
                }
                
                # Safely add related object IDs
                if hasattr(deployment, 'driver') and deployment.driver:
                    meta_data["driver_id"] = getattr(deployment.driver, 'id', None)
                if hasattr(deployment, 'vehicle') and deployment.vehicle:
                    meta_data["vehicle_id"] = getattr(deployment.vehicle, 'id', None)
                if hasattr(deployment, 'route') and deployment.route:
                    meta_data["route_id"] = getattr(deployment.route, 'id', None)
                if hasattr(deployment, 'product') and deployment.product:
                    meta_data["product_id"] = getattr(deployment.product, 'id', None)
                
                print(f"Creating activity log with meta: {meta_data}")
                activity_log = ActivityLog.objects.create(
                    actor=user_profile,
                    action="deployment_created",
                    entity="deployment",
                    meta=meta_data
                )
                print(f"Activity log created successfully: {activity_log.id}")
            else:
                print("No user profile found, skipping activity log creation")
        except Exception as e:
            print(f"Failed to create activity log: {e}")
            import traceback
            traceback.print_exc()
    
    def perform_update(self, serializer):
        # Save the deployment
        deployment = serializer.save()
        
        # Create activity log
        try:
            from core.models import ActivityLog
            user_profile = getattr(self.request.user, 'profile', None)
            if user_profile:
                meta_data = {
                    "deployment_id": getattr(deployment, 'id', None),
                    "stock": getattr(deployment, 'stock', None)
                }
                
                # Safely add related object IDs
                if hasattr(deployment, 'driver') and deployment.driver:
                    meta_data["driver_id"] = getattr(deployment.driver, 'id', None)
                if hasattr(deployment, 'vehicle') and deployment.vehicle:
                    meta_data["vehicle_id"] = getattr(deployment.vehicle, 'id', None)
                if hasattr(deployment, 'route') and deployment.route:
                    meta_data["route_id"] = getattr(deployment.route, 'id', None)
                if hasattr(deployment, 'product') and deployment.product:
                    meta_data["product_id"] = getattr(deployment.product, 'id', None)
                
                ActivityLog.objects.create(
                    actor=user_profile,
                    action="deployment_updated",
                    entity="deployment",
                    meta=meta_data
                )
        except Exception as e:
            print(f"Failed to create activity log: {e}")
    
    def perform_destroy(self, instance):
        # Create activity log before deleting
        try:
            from core.models import ActivityLog
            user_profile = getattr(self.request.user, 'profile', None)
            if user_profile:
                meta_data = {
                    "deployment_id": getattr(instance, 'id', None),
                    "stock": getattr(instance, 'stock', None)
                }
                
                # Safely add related object IDs
                if hasattr(instance, 'driver') and instance.driver:
                    meta_data["driver_id"] = getattr(instance.driver, 'id', None)
                if hasattr(instance, 'vehicle') and instance.vehicle:
                    meta_data["vehicle_id"] = getattr(instance.vehicle, 'id', None)
                if hasattr(instance, 'route') and instance.route:
                    meta_data["route_id"] = getattr(instance.route, 'id', None)
                if hasattr(instance, 'product') and instance.product:
                    meta_data["product_id"] = getattr(instance.product, 'id', None)
                
                ActivityLog.objects.create(
                    actor=user_profile,
                    action="deployment_deleted",
                    entity="deployment",
                    meta=meta_data
                )
        except Exception as e:
            print(f"Failed to create activity log: {e}")
        
        # Delete the deployment
        instance.delete()
    
    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            print(f"Error in DeploymentViewSet.list: {e}")
            return Response({'error': str(e)}, status=500)
    
    def retrieve(self, request, *args, **kwargs):
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            print(f"Error in DeploymentViewSet.retrieve: {e}")
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['get'], url_path='by-customer-barangay')
    def by_customer_barangay(self, request):
        """Get deployments for the current customer's barangay"""
        if not hasattr(request.user, 'profile'):
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Only customers can access this endpoint
        if request.user.profile.role != 'customer':
            return Response({'error': 'Only customers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get the customer's profile
            customer_profile = request.user.profile
            
            # Check if customer has an address
            if not customer_profile.address:
                return Response({
                    'deployments': [],
                    'message': 'No address found for customer'
                })
            
            # Get the customer's barangay
            customer_barangay = customer_profile.address.barangay
            
            # Find routes that include this barangay
            routes_with_barangay = Route.objects.filter(barangays=customer_barangay)
            
            # Get deployments for these routes
            deployments = Deployment.objects.select_related('driver', 'vehicle', 'route', 'product').filter(route__in=routes_with_barangay).order_by('-created_at')
            
            serializer = self.get_serializer(deployments, many=True)
            return Response({
                'deployments': serializer.data,
                'message': f'Found {deployments.count()} deployments for your barangay'
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, methods=['get'], url_path='my-deployment')
    def my_deployment(self, request):
        """Get the current driver's deployment"""
        if not hasattr(request.user, 'profile'):
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Only drivers can access their deployment
        if request.user.profile.role != 'driver':
            return Response({'error': 'Only drivers can access their deployment'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get the most recent deployment for this driver
            deployment = Deployment.objects.select_related('driver', 'vehicle', 'route', 'product').prefetch_related('route__municipalities', 'route__barangays').filter(driver=request.user.profile).latest('created_at')
            serializer = self.get_serializer(deployment)
            return Response(serializer.data)
        except Deployment.DoesNotExist:
            return Response({'error': 'No deployment found for this driver'}, status=status.HTTP_404_NOT_FOUND)


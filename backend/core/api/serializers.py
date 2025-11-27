from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from core.models import Product, Order, OrderItem, Delivery, Profile, Notification, OrderHistory, CancelledOrder
from core.models import ActivityLog

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        if hasattr(user, 'profile'):
            token['role'] = user.profile.role
        else:
            token['role'] = user.role if hasattr(user, 'role') else 'customer'
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        # Add role to response
        if hasattr(self.user, 'profile'):
            data['role'] = self.user.profile.role
        else:
            data['role'] = self.user.role if hasattr(self.user, 'role') else 'customer'
        return data

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    
    class Meta:
        model = Profile
        fields = [
            'id','username','role',
            'first_name','last_name','email',
            'phone','address'
        ]
        read_only_fields = ['role']  # Role should only be changed by admin
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_blank': True},
            'address': {'required': False, 'allow_blank': True},
        }

    def update(self, instance, validated_data):
        email = validated_data.get('email')
        first_name = validated_data.get('first_name')
        last_name = validated_data.get('last_name')
        user_fields_to_update = []

        if email is not None:
            instance.email = email
            instance.user.email = email
            user_fields_to_update.append('email')
        if first_name is not None:
            instance.first_name = first_name
            instance.user.first_name = first_name
            user_fields_to_update.append('first_name')
        if last_name is not None:
            instance.last_name = last_name
            instance.user.last_name = last_name
            user_fields_to_update.append('last_name')

        for field in ['phone', 'address']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        instance.save()
        if user_fields_to_update:
            instance.user.save(update_fields=user_fields_to_update)
        else:
            instance.user.save()
        return instance

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
    
    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value
    
    def validate_stock_full(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock cannot be negative.")
        return value
    
    def validate_stock_empty(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock cannot be negative.")
        return value

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id','product','product_name','qty_full_out','qty_empty_in']
    
    def validate_qty_full_out(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value
    
    def validate_qty_empty_in(self, value):
        if value < 0:
            raise serializers.ValidationError("Quantity cannot be negative.")
        return value

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    customer_username = serializers.CharField(source='customer.user.username', read_only=True)
    customer_first_name = serializers.CharField(source='customer.first_name', read_only=True, allow_null=True)
    customer_last_name = serializers.CharField(source='customer.last_name', read_only=True, allow_null=True)
    driver = serializers.SerializerMethodField()
    delivery_status = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id','customer','customer_username','customer_first_name','customer_last_name','created_at','status',
            'total_amount','notes','items','driver','delivery_status'
        ]
        read_only_fields = ['created_at', 'total_amount']
        extra_kwargs = {
            'customer': {'required': False}
        }

    def validate_items(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError("Order must have at least one item.")
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        
        for item_data in items_data:
            product = item_data['product']
            qty_full_out = item_data['qty_full_out']
            
            # Check stock availability
            if qty_full_out > product.stock_full:
                raise serializers.ValidationError(
                    f"Insufficient stock for {product.name}. Available: {product.stock_full}, Requested: {qty_full_out}"
                )
            
            # Check if product is active
            if not product.active:
                raise serializers.ValidationError(f"Product {product.name} is not active.")
            
            OrderItem.objects.create(order=order, **item_data)
        
        from core.services.inventory import apply_order_inventory
        apply_order_inventory(order)
        return order
    
    def update(self, instance, validated_data):
        # Don't allow updating items through this endpoint
        items_data = validated_data.pop('items', None)
        if items_data is not None:
            raise serializers.ValidationError("Cannot update order items. Create a new order instead.")
        
        return super().update(instance, validated_data)

    def get_driver(self, obj):
        if hasattr(obj, 'delivery') and obj.delivery and obj.delivery.driver:
            driver = obj.delivery.driver
            return {
                'id': driver.id,
                'name': driver.user.username,
            }
        return None

    def get_delivery_status(self, obj):
        if hasattr(obj, 'delivery') and obj.delivery:
            return obj.delivery.status
        return None

class DeliverySerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)
    driver_username = serializers.CharField(source='driver.user.username', read_only=True, allow_null=True)
    # Add customer details to the delivery serializer
    customer_first_name = serializers.CharField(source='order.customer.first_name', read_only=True, allow_null=True)
    customer_last_name = serializers.CharField(source='order.customer.last_name', read_only=True, allow_null=True)
    customer_address = serializers.CharField(source='order.customer.address', read_only=True, allow_null=True)
    customer_phone = serializers.CharField(source='order.customer.phone', read_only=True, allow_null=True)
    # Add order details
    order_total_amount = serializers.DecimalField(source='order.total_amount', max_digits=10, decimal_places=2, read_only=True)
    order_items = serializers.SerializerMethodField()
    
    class Meta:
        model = Delivery
        fields = [
            'id','order','order_id','order_status','driver','driver_username','status','route_index','eta_minutes',
            'customer_first_name', 'customer_last_name', 'customer_address', 'customer_phone',
            'order_total_amount', 'order_items'
        ]
        read_only_fields = ['route_index']
    
    def get_order_items(self, obj):
        from core.models import OrderItem
        items = OrderItem.objects.filter(order=obj.order)
        return [
            {
                'id': item.id,
                'product_name': item.product.name,
                'qty_full_out': item.qty_full_out,
                'qty_empty_in': item.qty_empty_in
            }
            for item in items
        ]
    
    def validate_eta_minutes(self, value):
        if value < 0:
            raise serializers.ValidationError("ETA cannot be negative.")
        return value

class CancelledOrderSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    customer_name = serializers.CharField(source='order.customer.user.username', read_only=True)
    total_amount = serializers.DecimalField(source='order.total_amount', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = CancelledOrder
        fields = ['id', 'order', 'order_id', 'customer_name', 'total_amount', 'reason', 'cancelled_at', 'cancelled_by']
        read_only_fields = ['cancelled_at']

class NotificationSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.user.username', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id','user','user_username','type','message','sent_at']
        read_only_fields = ['sent_at']

class OrderHistorySerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.user.username', read_only=True)
    
    class Meta:
        model = OrderHistory
        fields = ['id', 'order', 'status', 'timestamp', 'updated_by', 'updated_by_name']
        read_only_fields = ['timestamp']

class ActivityLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor.user.username', read_only=True)
    actor_first_name = serializers.CharField(source='actor.first_name', read_only=True, allow_blank=True, allow_null=True)
    actor_last_name = serializers.CharField(source='actor.last_name', read_only=True, allow_blank=True, allow_null=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'actor', 'actor_username', 'actor_first_name', 'actor_last_name', 'action', 'entity', 'meta', 'timestamp']
        read_only_fields = ['timestamp']
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from core.models import Product, Order, Delivery, Profile, Notification, OrderHistory, CancelledOrder
from core.models import ActivityLog, Municipality, Barangay, Address, WalkInOrder, Route, Vehicle, Deployment

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

class AddressSerializer(serializers.ModelSerializer):
    barangay_name = serializers.CharField(source='barangay.name', read_only=True)
    municipality_name = serializers.CharField(source='barangay.municipality.name', read_only=True)
    
    class Meta:
        model = Address
        fields = '__all__'
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['barangay_name'] = instance.barangay.name
        representation['municipality_name'] = instance.barangay.municipality.name
        return representation

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', required=False, allow_blank=True)
    address_detail = AddressSerializer(source='address', read_only=True)
    # Address fields for setting/updating address
    municipality = serializers.IntegerField(write_only=True, required=False)
    barangay = serializers.IntegerField(write_only=True, required=False)
    address_details = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Profile
        fields = [
            'id','username','role',
            'first_name','last_name','middle_name','email',
            'phone','address','address_detail',
            'municipality','barangay','address_details'
        ]
        read_only_fields = ['role']  # Role should only be changed by admin
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'middle_name': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_blank': True},
            'address': {'required': False, 'allow_null': True},
        }
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Include the full address information in the representation
        if instance.address:
            representation['address'] = {
                'id': instance.address.id,
                'full_address': instance.address.full_address,
                'barangay': instance.address.barangay.id,
                'municipality': instance.address.barangay.municipality.id,
                'barangay_name': instance.address.barangay.name,
                'municipality_name': instance.address.barangay.municipality.name
            }
        else:
            representation['address'] = None
        return representation
    
    def update(self, instance, validated_data):
        email = validated_data.get('email')
        first_name = validated_data.get('first_name')
        last_name = validated_data.get('last_name')
        user_fields_to_update = []
        
        if email is not None:
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
        
        # Handle address field - create or update address based on provided data
        municipality_id = validated_data.get('municipality')
        barangay_id = validated_data.get('barangay')
        address_details = validated_data.get('address_details')
        
        # If any address field is provided, all must be provided and address_details cannot be empty
        if municipality_id or barangay_id or address_details:
            # Validate that all required address fields are provided
            if not municipality_id:
                raise serializers.ValidationError({'municipality': 'Municipality is required when setting an address.'})
            if not barangay_id:
                raise serializers.ValidationError({'barangay': 'Barangay is required when setting an address.'})
            if not address_details or not address_details.strip():
                raise serializers.ValidationError({'address_details': 'House Number / Lot Number / Street is required.'})
            
            try:
                municipality = Municipality.objects.get(id=municipality_id)
                barangay = Barangay.objects.get(id=barangay_id, municipality=municipality)
                
                # Create or update address
                address_data = {
                    'barangay': barangay,
                    'full_address': address_details.strip()
                }
                
                if instance.address:
                    # Update existing address
                    for key, value in address_data.items():
                        setattr(instance.address, key, value)
                    instance.address.save()
                else:
                    # Always create a new address for each user
                    address = Address.objects.create(**address_data)
                    instance.address = address
            except Municipality.DoesNotExist:
                raise serializers.ValidationError({'municipality': 'Invalid municipality selected.'})
            except Barangay.DoesNotExist:
                raise serializers.ValidationError({'barangay': 'Invalid barangay selected.'})
        elif 'address' in validated_data:
            # Handle direct address assignment
            instance.address = validated_data['address']
            
        for field in ['phone']:
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
    

class MunicipalitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Municipality
        fields = '__all__'

class BarangaySerializer(serializers.ModelSerializer):
    municipality_name = serializers.CharField(source='municipality.name', read_only=True)
    
    class Meta:
        model = Barangay
        fields = '__all__'
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['municipality_name'] = instance.municipality.name
        return representation

class WalkInOrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = WalkInOrder
        fields = '__all__'
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['product_name'] = instance.product.name
        return representation

class RouteSerializer(serializers.ModelSerializer):
    municipalities_detail = MunicipalitySerializer(source='municipalities', many=True, read_only=True)
    barangays_detail = BarangaySerializer(source='barangays', many=True, read_only=True)
    
    class Meta:
        model = Route
        fields = '__all__'
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Add municipality names as a comma-separated string
        try:
            municipalities = instance.municipalities.all()
            representation['municipality_names'] = ", ".join([m.name for m in municipalities])
        except Exception:
            representation['municipality_names'] = 'N/A'
        return representation

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'

class DeploymentSerializer(serializers.ModelSerializer):
    driver_first_name = serializers.CharField(source='driver.first_name', read_only=True)
    driver_last_name = serializers.CharField(source='driver.last_name', read_only=True)
    vehicle_name = serializers.CharField(source='vehicle.name', read_only=True)
    vehicle_plate_number = serializers.CharField(source='vehicle.plate_number', read_only=True)
    route_number = serializers.CharField(source='route.route_number', read_only=True)
    municipality_names = serializers.SerializerMethodField(read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = Deployment
        fields = '__all__'
        read_only_fields = ['created_at']
        
    def get_municipality_names(self, obj):
        # Return comma-separated list of municipality names
        try:
            if obj.route and hasattr(obj.route, 'municipalities'):
                municipalities = obj.route.municipalities.all()
                return ", ".join([m.name for m in municipalities])
            return 'N/A'
        except Exception as e:
            print(f"Error in get_municipality_names: {e}")
            return 'N/A'
    
    def validate(self, data):
        # Validate stock against vehicle limit
        try:
            # Ensure all IDs are integers and convert them to objects
            if 'driver' in data:
                if isinstance(data['driver'], str):
                    data['driver'] = int(data['driver'])
                if isinstance(data['driver'], int):
                    from core.models import Profile
                    try:
                        driver = Profile.objects.get(id=data['driver'], role='driver')
                        data['driver'] = driver
                    except Profile.DoesNotExist:
                        raise serializers.ValidationError({
                            'driver': 'Invalid driver ID or driver not found.'
                        })
            
            if 'vehicle' in data:
                if isinstance(data['vehicle'], str):
                    data['vehicle'] = int(data['vehicle'])
                if isinstance(data['vehicle'], int):
                    from core.models import Vehicle
                    try:
                        vehicle = Vehicle.objects.get(id=data['vehicle'])
                        data['vehicle'] = vehicle
                    except Vehicle.DoesNotExist:
                        raise serializers.ValidationError({
                            'vehicle': 'Invalid vehicle ID.'
                        })
            
            if 'route' in data:
                if isinstance(data['route'], str):
                    data['route'] = int(data['route'])
                if isinstance(data['route'], int):
                    from core.models import Route
                    try:
                        route = Route.objects.get(id=data['route'])
                        data['route'] = route
                    except Route.DoesNotExist:
                        raise serializers.ValidationError({
                            'route': 'Invalid route ID.'
                        })
            
            if 'product' in data:
                if isinstance(data['product'], str):
                    data['product'] = int(data['product'])
                if isinstance(data['product'], int):
                    from core.models import Product
                    try:
                        product = Product.objects.get(id=data['product'])
                        data['product'] = product
                    except Product.DoesNotExist:
                        raise serializers.ValidationError({
                            'product': 'Invalid product ID.'
                        })
            
            if 'stock' in data and isinstance(data['stock'], str):
                data['stock'] = int(data['stock'])
                
            vehicle = data.get('vehicle')
            stock = data.get('stock')
            
            if vehicle and stock:
                if stock > vehicle.stock_limit:
                    raise serializers.ValidationError({
                        'stock': f'Stock ({stock}) exceeds vehicle limit ({vehicle.stock_limit})!'
                    })
        except ValueError as e:
            raise serializers.ValidationError({
                'non_field_errors': f'Invalid data type: {str(e)}'
            })
        except Exception as e:
            raise serializers.ValidationError({
                'non_field_errors': f'Validation error: {str(e)}'
            })
        
        return data
    
    def validate_stock(self, value):
        # Additional validation for stock
        if value is None or value <= 0:
            raise serializers.ValidationError("Stock must be a positive integer.")
        return value
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        try:
            representation['driver_first_name'] = instance.driver.first_name if instance.driver else 'N/A'
            representation['driver_last_name'] = instance.driver.last_name if instance.driver else 'N/A'
        except Exception as e:
            print(f"Error getting driver info: {e}")
            representation['driver_first_name'] = 'N/A'
            representation['driver_last_name'] = 'N/A'
        
        try:
            representation['vehicle_name'] = instance.vehicle.name if instance.vehicle else 'N/A'
            representation['vehicle_plate_number'] = instance.vehicle.plate_number if instance.vehicle else 'N/A'
        except Exception as e:
            print(f"Error getting vehicle info: {e}")
            representation['vehicle_name'] = 'N/A'
            representation['vehicle_plate_number'] = 'N/A'
        
        try:
            representation['route_number'] = instance.route.route_number if instance.route else 'N/A'
            representation['municipality_names'] = self.get_municipality_names(instance)
        except Exception as e:
            print(f"Error getting route info: {e}")
            representation['route_number'] = 'N/A'
            representation['municipality_names'] = 'N/A'
        
        try:
            representation['product_name'] = instance.product.name if instance.product else 'N/A'
        except Exception as e:
            print(f"Error getting product info: {e}")
            representation['product_name'] = 'N/A'
        
        return representation

class OrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    customer_name = serializers.CharField(source='customer.user.username', read_only=True)
    customer_first_name = serializers.CharField(source='customer.first_name', read_only=True, allow_null=True)
    customer_last_name = serializers.CharField(source='customer.last_name', read_only=True, allow_null=True)

    class Meta:
        model = Order
        fields = [
            'id','product','product_name','customer','customer_name','customer_first_name','customer_last_name',
            'created_at','quantity'
        ]
        read_only_fields = ['created_at']
        extra_kwargs = {
            'customer': {'required': False}
        }

    def create(self, validated_data):
        customer = validated_data.get('customer')
        product = validated_data.get('product')
        quantity = validated_data.get('quantity', 1)
        
        # Calculate total amount
        total_amount = product.price * quantity
        
        order = Order.objects.create(
            product=product,
            quantity=quantity,
            customer=customer
        )
        
        return order

class DeliverySerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_product_name = serializers.CharField(source='order.product.name', read_only=True)
    order_quantity = serializers.IntegerField(source='order.quantity', read_only=True)
    driver_username = serializers.CharField(source='driver.user.username', read_only=True, allow_null=True)
    vehicle_name = serializers.CharField(source='vehicle.name', read_only=True, allow_null=True)
    route_number = serializers.CharField(source='route.route_number', read_only=True, allow_null=True)
    # Add customer details to the delivery serializer
    customer_first_name = serializers.CharField(source='order.customer.first_name', read_only=True, allow_null=True)
    customer_last_name = serializers.CharField(source='order.customer.last_name', read_only=True, allow_null=True)
    customer_address = serializers.CharField(source='order.customer.address', read_only=True, allow_null=True)
    customer_phone = serializers.CharField(source='order.customer.phone', read_only=True, allow_null=True)
    
    class Meta:
        model = Delivery
        fields = [
            'id','order','order_id','order_product_name','order_quantity','driver','driver_username','vehicle','vehicle_name','route','route_number','status'
        ]
        read_only_fields = []
    
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
    actor_role = serializers.CharField(source='actor.role', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'actor', 'actor_username', 'actor_first_name', 'actor_last_name', 'actor_role', 'action', 'entity', 'meta', 'timestamp']
        read_only_fields = ['timestamp']
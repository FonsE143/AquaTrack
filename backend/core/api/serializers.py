from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from core.models import Product, Order, Delivery, Profile, Notification, OrderHistory, CancelledOrder
from core.models import ActivityLog, Municipality, Barangay, Address, WalkInOrder, Route, Vehicle, Deployment
from core.models import User
import re

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
        # Custom validation for username and password
        username = attrs.get('username')
        password = attrs.get('password')
        
        # Validate username format
        if not username or len(username.strip()) < 3:
            raise serializers.ValidationError('Username must be at least 3 characters long.')
        
        if len(username.strip()) > 30:
            raise serializers.ValidationError('Username must be no more than 30 characters long.')
        
        # Check for valid characters in username (alphanumeric and underscore only)
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            raise serializers.ValidationError('Username can only contain letters, numbers, and underscores.')
        
        # Authenticate user
        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError('Invalid username or password.')
        
        # Check if user is active
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')
        
        # Add role to response
        if hasattr(user, 'profile'):
            attrs['role'] = user.profile.role
        else:
            attrs['role'] = user.role if hasattr(user, 'role') else 'customer'
            
        # Call parent validate to continue normal flow
        data = super().validate(attrs)
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
    username = serializers.CharField(required=False)
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
            'first_name','last_name','email',
            'phone','address','address_detail',
            'municipality','barangay','address_details'
        ]
        read_only_fields = ['role']  # Role should only be changed by admin
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_blank': True},
            'address': {'required': False, 'allow_null': True},
        }
    
    def validate(self, attrs):
        # For creation, we need to ensure username is provided
        if not self.instance:  # This is a create operation
            # Extract username from the attrs
            username = attrs.get('username') or (attrs.get('user', {}).get('username') if 'user' in attrs else None)
            if not username:
                raise serializers.ValidationError({'username': 'Username is required.'})
        return super().validate(attrs)
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Add username from user object
        if hasattr(instance, 'user') and instance.user:
            representation['username'] = instance.user.username
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
        
        # Validate names if provided
        if first_name is not None:
            if len(first_name) > 50:
                raise serializers.ValidationError({'first_name': 'First name must be no more than 50 characters.'})
            instance.first_name = first_name
            instance.user.first_name = first_name
            user_fields_to_update.append('first_name')
            
        if last_name is not None:
            if len(last_name) > 50:
                raise serializers.ValidationError({'last_name': 'Last name must be no more than 50 characters.'})
            instance.last_name = last_name
            instance.user.last_name = last_name
            user_fields_to_update.append('last_name')
        
        if email is not None:
            # Validate email format if provided
            if email:
                import re
                email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                if not re.match(email_regex, email):
                    raise serializers.ValidationError({'email': 'Invalid email format.'})
            instance.user.email = email
            user_fields_to_update.append('email')
            print(f"DEBUG: Updated email {email} for user {instance.user.username}")
        
        # Handle phone validation
        phone = validated_data.get('phone')
        if phone is not None:
            if phone:
                # Validate phone format if provided
                import re
                phone_regex = r'^(09\d{2}[-\s]?\d{3}[-\s]?\d{4}|\+639\d{9})$'
                if not re.match(phone_regex, phone):
                    raise serializers.ValidationError({'phone': 'Invalid phone number format. Use 09xx xxx xxxx or +639xxxxxxxxx.'})
            instance.phone = phone
        
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
            
            # Validate address details length
            if len(address_details.strip()) > 200:
                raise serializers.ValidationError({'address_details': 'Address details must be no more than 200 characters.'})
            
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
            
        instance.save()
        if user_fields_to_update:
            instance.user.save(update_fields=user_fields_to_update)
        else:
            instance.user.save()
        return instance
    
    def create(self, validated_data):
        from django.db import transaction
        
        print(f"DEBUG: ProfileSerializer.create called with validated_data: {validated_data}")
        
        # Extract user-related fields
        username = validated_data.get('username')
        # For fields with source='user.email', we need to access them differently
        email = validated_data.get('user', {}).get('email', '') if 'user' in validated_data else validated_data.get('email', '')
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        phone = validated_data.get('phone', '')
        # Get role from context if available (passed by ViewSets)
        # This is needed because role is marked as read_only and won't be in validated_data
        role = self.context.get('role', 'customer')
        
        print(f"DEBUG: Extracted username: '{username}' (type: {type(username)})")
        print(f"DEBUG: Extracted email: '{email}' (type: {type(email)})")
        
        # Validate that username is provided
        if not username:
            raise serializers.ValidationError({'username': 'Username is required.'})
        
        # Use atomic transaction to ensure consistency
        with transaction.atomic():
            # Check if user already exists
            existing_user = User.objects.filter(username=username).first()
            if existing_user:
                # User exists, get or update their profile
                return self._update_or_create_profile(existing_user, validated_data, role)
            else:
                # Create user
                user_data = {
                    'username': username,
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                }
                
                # Set default password based on role
                if role == 'staff':
                    password = 'staffpassword'
                elif role == 'driver':
                    password = 'driverpassword'
                else:
                    password = 'customerpassword'
                
                try:
                    user = User.objects.create_user(password=password, **user_data)
                    print(f"DEBUG: Created user {user.username} with email {user.email}")
                except Exception as e:
                    # Provide more specific error information for user creation
                    error_message = str(e)
                    if 'UNIQUE constraint failed' in error_message and 'username' in error_message:
                        raise serializers.ValidationError('A user with this username already exists.')
                    elif 'The given username must be set' in error_message:
                        raise serializers.ValidationError('Username is required.')
                    elif 'username' in error_message and ('too long' in error_message or 'too short' in error_message):
                        raise serializers.ValidationError('Username must be between 3 and 30 characters.')
                    else:
                        raise serializers.ValidationError(f'Failed to create user: {error_message}')
                
                # Get or update the profile (signal may have created one)
                return self._update_or_create_profile(user, validated_data, role)
    
    def _update_or_create_profile(self, user, validated_data, role='customer'):
        """Helper method to update existing profile or create new one"""
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        # For fields with source='user.email', we need to access them differently
        email = validated_data.get('user', {}).get('email', '') if 'user' in validated_data else validated_data.get('email', '')
        phone = validated_data.get('phone', '')
        
        # Update user email if provided
        if email is not None:
            user.email = email
            user.save(update_fields=['email'])
            print(f"DEBUG: Saved email {email} to user {user.username}")
        
        # Get existing profile or create new one
        profile, created = Profile.objects.get_or_create(
            user=user,
            defaults={
                'role': role,
                'first_name': first_name,
                'last_name': last_name,
                'phone': phone,
            }
        )
        
        # If profile wasn't created, it already existed, so we need to update it
        if not created:
            # If role is different, update it
            if profile.role != role:
                profile.role = role
                profile.first_name = first_name
                profile.last_name = last_name
                profile.phone = phone
                
                # Update user email if provided
                if email is not None:
                    user.email = email
                    user.save(update_fields=['email'])
                
                # Handle address if provided
                municipality_id = validated_data.get('municipality')
                barangay_id = validated_data.get('barangay')
                address_details = validated_data.get('address_details', '')
                
                if municipality_id and barangay_id and address_details:
                    try:
                        municipality = Municipality.objects.get(id=municipality_id)
                        barangay = Barangay.objects.get(id=barangay_id, municipality=municipality)
                        address = Address.objects.create(
                            barangay=barangay,
                            full_address=address_details.strip()
                        )
                        profile.address = address
                    except (Municipality.DoesNotExist, Barangay.DoesNotExist):
                        raise serializers.ValidationError('Invalid municipality or barangay selected.')
                
                profile.save()
            else:
                # Same role, this is a duplicate
                raise serializers.ValidationError('A profile for this user already exists.')
        
        return profile

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
    driver_phone = serializers.CharField(source='driver.phone', read_only=True, allow_null=True)
    driver_id = serializers.IntegerField(source='driver.id', read_only=True, allow_null=True)
    vehicle_name = serializers.CharField(source='vehicle.name', read_only=True)
    vehicle_plate_number = serializers.CharField(source='vehicle.plate_number', read_only=True)
    route_number = serializers.CharField(source='route.route_number', read_only=True)
    municipality_names = serializers.SerializerMethodField(read_only=True)
    barangay_names = serializers.SerializerMethodField(read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    deployment_id = serializers.IntegerField(read_only=True)
    returned_containers = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = Deployment
        fields = '__all__'
        read_only_fields = ['created_at', 'returned_at']
        
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
    
    def get_barangay_names(self, obj):
        # Return comma-separated list of barangay names
        try:
            if obj.route and hasattr(obj.route, 'barangays'):
                barangays = obj.route.barangays.all()
                return ", ".join([b.name for b in barangays])
            return 'N/A'
        except Exception as e:
            print(f"Error in get_barangay_names: {e}")
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
            representation['barangay_names'] = self.get_barangay_names(instance)
        except Exception as e:
            print(f"Error getting route info: {e}")
            representation['route_number'] = 'N/A'
            representation['municipality_names'] = 'N/A'
            representation['barangay_names'] = 'N/A'
        
        try:
            representation['product_name'] = instance.product.name if instance.product else 'N/A'
        except Exception as e:
            print(f"Error getting product info: {e}")
            representation['product_name'] = 'N/A'
        
        return representation


class OrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    customer_name = serializers.CharField(source='customer.user.username', read_only=True)
    customer_first_name = serializers.CharField(source='customer.first_name', read_only=True, allow_null=True)
    customer_last_name = serializers.CharField(source='customer.last_name', read_only=True, allow_null=True)
    total_quantity = serializers.SerializerMethodField(read_only=True)
    total_amount = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id','product','product_name','product_price','customer','customer_name','customer_first_name','customer_last_name',
            'created_at','quantity','free_items','total_quantity','total_amount'
        ]
        read_only_fields = ['created_at', 'free_items', 'total_quantity', 'total_amount']
        extra_kwargs = {
            'customer': {'required': False}
        }
    
    def get_total_quantity(self, obj):
        return obj.quantity + obj.free_items
    
    def get_total_amount(self, obj):
        if obj.product and obj.product.price:
            return float(obj.product.price) * obj.quantity
        return 0.0

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
    def is_valid(self, raise_exception=False):
        print(f"Serializer is_valid called with data: {self.initial_data}")
        result = super().is_valid(raise_exception=raise_exception)
        print(f"Serializer validation result: {result}, errors: {self.errors}")
        return result
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_product_name = serializers.CharField(source='order.product.name', read_only=True)
    order_product_price = serializers.DecimalField(source='order.product.price', max_digits=10, decimal_places=2, read_only=True)
    order_quantity = serializers.IntegerField(source='order.quantity', read_only=True)
    order_free_items = serializers.IntegerField(source='order.free_items', read_only=True)
    order_total_quantity = serializers.SerializerMethodField(read_only=True)
    order_total_amount = serializers.SerializerMethodField(read_only=True)
    driver_username = serializers.CharField(source='driver.user.username', read_only=True, allow_null=True)
    driver_first_name = serializers.CharField(source='driver.first_name', read_only=True, allow_null=True)
    driver_last_name = serializers.CharField(source='driver.last_name', read_only=True, allow_null=True)
    driver_phone = serializers.CharField(source='driver.phone', read_only=True, allow_null=True)
    vehicle_name = serializers.CharField(source='vehicle.name', read_only=True, allow_null=True)
    route_number = serializers.CharField(source='route.route_number', read_only=True, allow_null=True)
    # Add customer details to the delivery serializer
    customer_first_name = serializers.CharField(source='order.customer.first_name', read_only=True, allow_null=True)
    customer_last_name = serializers.CharField(source='order.customer.last_name', read_only=True, allow_null=True)
    customer_address = serializers.SerializerMethodField(read_only=True)
    customer_phone = serializers.CharField(source='order.customer.phone', read_only=True, allow_null=True)
    # Add delivered quantity field
    delivered_quantity = serializers.IntegerField(required=False)
    
    def get_order_total_quantity(self, obj):
        return obj.order.quantity + obj.order.free_items
    
    def get_order_total_amount(self, obj):
        if obj.order.product and obj.order.product.price:
            return float(obj.order.product.price) * obj.order.quantity
        return 0.0
    
    def get_customer_address(self, obj):
        if obj.order and obj.order.customer and obj.order.customer.address:
            address = obj.order.customer.address
            full_address = address.full_address
            barangay = address.barangay.name if address.barangay else ''
            municipality = address.barangay.municipality.name if address.barangay and address.barangay.municipality else ''
            
            # Build complete address string
            parts = [full_address, barangay, municipality]
            return ', '.join([part for part in parts if part])
        return None
    
    def update(self, instance, validated_data):
        # Handle delivered quantity update
        print(f"Serializer update called with validated_data: {validated_data}")
        delivered_quantity = validated_data.pop('delivered_quantity', None)
        if delivered_quantity is not None:
            # Store the delivered quantity in the instance
            instance.delivered_quantity = delivered_quantity
            print(f"Stored delivered_quantity on instance: {delivered_quantity}")
        
        # Update other fields
        print(f"Updating instance with validated_data: {validated_data}")
        return super().update(instance, validated_data)
    
    class Meta:
        model = Delivery
        fields = [
            'id','order','order_id','order_product_name','order_product_price','order_quantity','order_free_items','order_total_quantity','order_total_amount','driver','driver_username','driver_first_name','driver_last_name','driver_phone','vehicle','vehicle_name','route','route_number','status','customer_first_name','customer_last_name','customer_address','customer_phone','delivered_quantity','delivered_at','created_at','updated_at'
        ]
        read_only_fields = ['delivered_at','created_at','updated_at']
    
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
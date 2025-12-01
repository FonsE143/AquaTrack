from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from core.models import Profile, Municipality, Barangay, Address
from core.api.serializers import ProfileSerializer

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        phone = request.data.get('phone', '').strip()
        
        # Address fields
        municipality_id = request.data.get('municipality')
        barangay_id = request.data.get('barangay')
        address_details = request.data.get('address_details', '').strip()
        
        # Validate required fields
        if not username:
            return Response(
                {'error': 'Username is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not password:
            return Response(
                {'error': 'Password is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate username
        if len(username) < 3 or len(username) > 30:
            return Response(
                {'error': 'Username must be between 3 and 30 characters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        import re
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            return Response(
                {'error': 'Username can only contain letters, numbers, and underscores'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate names (not required but if provided, they should be valid)
        if first_name and len(first_name) > 50:
            return Response(
                {'error': 'First name must be no more than 50 characters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if last_name and len(last_name) > 50:
            return Response(
                {'error': 'Last name must be no more than 50 characters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate email format
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            return Response(
                {'error': 'Invalid email format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password
        if len(password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters long'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate phone if provided
        if phone:
            # Allow common phone formats
            phone_regex = r'^(09\d{2}[-\s]?\d{3}[-\s]?\d{4}|\+639\d{9})$'
            if not re.match(phone_regex, phone):
                return Response(
                    {'error': 'Invalid phone number format. Use 09xx xxx xxxx or +639xxxxxxxxx'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Validate address fields if any are provided
        if municipality_id or barangay_id or address_details:
            # All address fields are required if any are provided
            if not municipality_id:
                return Response(
                    {'error': 'Municipality is required when providing an address'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not barangay_id:
                return Response(
                    {'error': 'Barangay is required when providing an address'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not address_details:
                return Response(
                    {'error': 'House Number / Lot Number / Street is required when providing an address'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if len(address_details) > 200:
                return Response(
                    {'error': 'Address details must be no more than 200 characters'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to create user account'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Get or create profile (should be created by signal, but let's ensure it exists)
        try:
            profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            # If profile wasn't created by signal, create it manually
            profile = Profile.objects.create(
                user=user,
                role='customer',
                first_name=first_name,
                last_name=last_name,
                phone=phone
            )
        
        # Update profile with names and phone number
        profile.first_name = first_name
        profile.last_name = last_name
        profile.phone = phone
        
        # Handle address creation if all required fields are provided
        if municipality_id and barangay_id and address_details:
            try:
                municipality = Municipality.objects.get(id=municipality_id)
                barangay = Barangay.objects.get(id=barangay_id, municipality=municipality)
                address = Address.objects.create(
                    barangay=barangay,
                    full_address=address_details
                )
                profile.address = address
            except Municipality.DoesNotExist:
                return Response(
                    {'error': 'Invalid municipality selected'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Barangay.DoesNotExist:
                return Response(
                    {'error': 'Invalid barangay selected'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                return Response(
                    {'error': 'Failed to create address'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        try:
            profile.save()
        except Exception as e:
            return Response(
                {'error': 'Failed to update profile'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Serialize the profile data
        try:
            serializer = ProfileSerializer(profile)
            return Response(
                {'message': 'User registered successfully', 'user': serializer.data},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'message': 'User registered successfully'},
                status=status.HTTP_201_CREATED
            )

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        old = request.data.get('old_password')
        new = request.data.get('new_password')
        
        if not old or not new:
            return Response(
                {'error': 'Both old_password and new_password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not request.user.check_password(old):
            return Response(
                {'error': 'Incorrect current password'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        request.user.set_password(new)
        request.user.save()
        return Response({'status': 'Password changed successfully'})
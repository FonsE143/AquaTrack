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
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        phone = request.data.get('phone', '')
        
        # Address fields
        municipality_id = request.data.get('municipality')
        barangay_id = request.data.get('barangay')
        address_details = request.data.get('address_details', '')
        
        if not username or not email or not password:
            return Response(
                {'error': 'Username, email, and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
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
                first_name=user.first_name,
                last_name=user.last_name,
                phone=phone
            )
        
        # Update profile with phone number
        profile.phone = phone
        
        # Handle address creation if all required fields are provided
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
                pass  # Silently ignore address errors for now
        
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
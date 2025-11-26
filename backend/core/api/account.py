from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from core.models import Profile
from core.api.serializers import ProfileSerializer

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        phone = request.data.get('phone', '')
        address = request.data.get('address', '')
        
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
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Profile is created automatically by signal, but update it if needed
        if hasattr(user, 'profile'):
            user.profile.phone = phone
            user.profile.address = address
            user.profile.save()
        
        return Response(
            {'message': 'User registered successfully', 'user': ProfileSerializer(user.profile).data},
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

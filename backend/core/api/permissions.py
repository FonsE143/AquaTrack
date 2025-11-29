from rest_framework.permissions import BasePermission

class IsRole(BasePermission):
    def __init__(self, *roles):
        self.roles = roles
    
    def has_permission(self, request, view):
        # Allow superusers to have admin privileges
        if hasattr(request.user, 'is_superuser') and request.user.is_superuser:
            return 'admin' in self.roles
        
        return hasattr(request.user, 'profile') and request.user.profile.role in self.roles
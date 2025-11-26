from rest_framework.permissions import BasePermission

class IsRole(BasePermission):
    def __init__(self, role): self.role = role
    def has_permission(self, request, view):
        return hasattr(request.user, 'profile') and request.user.profile.role == self.role

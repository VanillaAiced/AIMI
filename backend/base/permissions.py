from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow read-only access for any request. Require an admin role for unsafe methods.

    Admin determination: user.is_staff or user.profile.role == 'admin' (profile may not exist).
    """

    def has_permission(self, request, view):
        # SAFE_METHODS are allowed for anyone
        if request.method in permissions.SAFE_METHODS:
            return True

        user = request.user
        if not user or not user.is_authenticated:
            return False

        # superusers/staff are admins
        if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
            return True

        # try profile-based role
        profile = getattr(user, 'profile', None)
        if profile and getattr(profile, 'role', None) == 'admin':
            return True

        return False

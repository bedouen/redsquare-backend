from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_super_admin)


class IsAdminOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsOwnerAdminOrSuperAdmin(BasePermission):
    """
    Lecture publique. Écriture réservée aux Admin (sur leurs propres objets)
    et aux Super Admin (sur tous les objets).
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_super_admin:
            return True
        return getattr(obj, "created_by_id", None) == request.user.id


class IsClientOwner(BasePermission):
    """L'utilisateur ne peut voir/modifier que ses propres commandes, sauf staff."""

    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        return obj.user_id == request.user.id

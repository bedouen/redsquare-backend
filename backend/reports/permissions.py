from rest_framework import permissions


class IsAdminOrSuperAdmin(permissions.BasePermission):
    """Permission pour les Admin et Super-Admin."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_admin or request.user.is_super_admin
        )


class IsOwnerAdminOrSuperAdmin(permissions.BasePermission):
    """
    Permission personnalisée pour les produits.
    - Admin peut modifier ses propres produits.
    - Super-Admin peut modifier tous les produits.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Super-Admin a tous les droits
        if request.user.is_super_admin:
            return True
        
        # Admin peut gérer des produits
        if request.user.is_admin:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        # Super-Admin peut tout faire
        if request.user.is_super_admin:
            return True
        
        # Admin ne peut modifier que ses propres produits
        if request.user.is_admin:
            return obj.created_by == request.user
        
        return False


class IsSuperAdmin(permissions.BasePermission):
    """Permission réservée au Super-Admin."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_super_admin


class IsClientOwner(permissions.BasePermission):
    """Permission pour les clients (panier, commandes)."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Vérifier si l'objet appartient au client
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False
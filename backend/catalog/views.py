from django.db.models import Count
from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny

from accounts.permissions import IsSuperAdmin, IsOwnerAdminOrSuperAdmin
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """Lecture publique. Création/édition/suppression réservées au Super-Admin."""
    queryset = Category.objects.annotate(_product_count=Count("products")).order_by("name")
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsSuperAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProductViewSet(viewsets.ModelViewSet):
    """
    Lecture publique (visiteurs inclus).
    Écriture réservée aux Admin (sur leurs produits) et Super-Admin (tous).
    """
    queryset = Product.objects.select_related("category", "created_by").order_by("-created_at")
    serializer_class = ProductSerializer
    permission_classes = [IsOwnerAdminOrSuperAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["unit_price", "created_at", "quantity"]

    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get("category")
        if category_id:
            qs = qs.filter(category_id=category_id)
        mine = self.request.query_params.get("mine")
        if mine and self.request.user.is_authenticated:
            qs = qs.filter(created_by=self.request.user)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

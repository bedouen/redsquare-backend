from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, OrderReceiptView

# Router pour le ViewSet
router = DefaultRouter()
router.register('', OrderViewSet, basename='orders')

urlpatterns = [
    # Routes du ViewSet (liste, création, détails, etc.)
    path('', include(router.urls)),
    
    # Route pour télécharger le reçu PDF d'une commande spécifique
    # Exemple: /api/orders/550e8400-e29b-41d4-a716-446655440000/receipt/
    path('<uuid:order_id>/receipt/', OrderReceiptView.as_view(), name='order-receipt'),
]
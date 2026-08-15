from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from django.conf import settings
from django.utils import timezone
import os
import logging

from accounts.permissions import IsClientOwner
from .models import Order
from .serializers import OrderSerializer, CreateOrderSerializer

logger = logging.getLogger(__name__)


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsClientOwner]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Order.objects.all().prefetch_related("items")
        return Order.objects.filter(user=user).prefetch_related("items")

    def get_serializer_class(self):
        if self.action == "create":
            return CreateOrderSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Erreurs de validation: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            order = serializer.save()
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Erreur création commande: {str(e)}")
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=["patch"], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        order = self.get_object()
        if not request.user.is_admin:
            return Response({"detail": "Action non autorisée."}, status=status.HTTP_403_FORBIDDEN)
        
        new_status = request.data.get("status")
        if new_status not in dict(Order.Status.choices):
            return Response({"detail": "Statut invalide."}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = new_status
        if new_status == Order.Status.PAID:
            order.completed_at = timezone.now()
        order.save(update_fields=["status", "completed_at"])
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def receipt(self, request, pk=None):
        """Télécharger le reçu PDF d'une commande"""
        try:
            order = self.get_object()
            
            if not (request.user == order.user or request.user.is_admin):
                return Response(
                    {"detail": "Vous n'avez pas la permission d'accéder à cette commande."},
                    status=status.HTTP_403_FORBIDDEN
                )

            from payments.models import PaymentTransaction
            transaction = PaymentTransaction.objects.filter(order=order).first()
            
            if transaction and transaction.receipt_pdf:
                file_path = os.path.join(settings.MEDIA_ROOT, str(transaction.receipt_pdf))
                if os.path.exists(file_path):
                    return FileResponse(
                        open(file_path, 'rb'),
                        as_attachment=True,
                        filename=f"recu_commande_{str(order.id)[:8]}.pdf"
                    )
            
            # Pour les réservations, générer un reçu de confirmation
            if order.is_reservation():
                try:
                    from reports.receipt_generator import generate_receipt
                    receipt_url = generate_receipt(order, None, is_reservation=True)
                    if receipt_url:
                        file_path = os.path.join(settings.MEDIA_ROOT, receipt_url)
                        if os.path.exists(file_path):
                            return FileResponse(
                                open(file_path, 'rb'),
                                as_attachment=True,
                                filename=f"recu_confirmation_{str(order.id)[:8]}.pdf"
                            )
                except Exception as e:
                    logger.error(f"Erreur génération reçu: {e}")
            
            return Response(
                {"detail": "Reçu non disponible pour cette commande."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Erreur récupération reçu: {e}")
            return Response(
                {"detail": f"Erreur: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OrderReceiptView(generics.GenericAPIView):
    """Téléchargement du reçu PDF d'une commande via URL dédiée"""
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = get_object_or_404(Order, id=order_id)
            
            if not (request.user == order.user or request.user.is_admin):
                return Response(
                    {"detail": "Vous n'avez pas la permission d'accéder à cette commande."},
                    status=status.HTTP_403_FORBIDDEN
                )

            from payments.models import PaymentTransaction
            transaction = PaymentTransaction.objects.filter(order=order).first()
            
            if transaction and transaction.receipt_pdf:
                file_path = os.path.join(settings.MEDIA_ROOT, str(transaction.receipt_pdf))
                if os.path.exists(file_path):
                    return FileResponse(
                        open(file_path, 'rb'),
                        as_attachment=True,
                        filename=f"recu_commande_{str(order.id)[:8]}.pdf"
                    )
            
            return Response(
                {"detail": "Reçu non disponible pour cette commande."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Erreur: {e}")
            return Response(
                {"detail": f"Erreur: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OrderHistoryView(generics.ListAPIView):
    """Historique des commandes"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')
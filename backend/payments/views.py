from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
import uuid

from .models import PaymentMethod, PaymentTransaction
from .serializers import (
    PaymentMethodSerializer, 
    PaymentTransactionSerializer,
    PaymentInitiateSerializer,
    PaymentVerifySerializer
)
from .services.orange_money import OrangeMoneyService, MTNMoneyService, VisaService
from orders.models import Order
from reports.receipt_generator import generate_receipt


class PaymentMethodViewSet(viewsets.ModelViewSet):
    """Gestion des méthodes de paiement de l'utilisateur"""
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user, is_active=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Définit une méthode de paiement comme par défaut"""
        payment_method = self.get_object()
        PaymentMethod.objects.filter(user=request.user).update(is_default=False)
        payment_method.is_default = True
        payment_method.save()
        return Response({'status': 'default set'})

    @action(detail=True, methods=['post'])
    def delete_method(self, request, pk=None):
        """Supprime une méthode de paiement (désactivation)"""
        payment_method = self.get_object()
        payment_method.is_active = False
        payment_method.save()
        return Response({'status': 'deleted'})


class PaymentTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """Consultation des transactions de paiement"""
    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PaymentTransaction.objects.filter(user=self.request.user)


class PaymentInitiateView(generics.GenericAPIView):
    """Initiation d'un paiement"""
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentInitiateSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order_id = serializer.validated_data['order_id']
        payment_type = serializer.validated_data['payment_type']
        payment_data = serializer.validated_data.get('payment_data', {})
        
        # Récupérer la commande
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        if order.status == 'paid':
            return Response(
                {'error': 'Cette commande est déjà payée'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Générer une référence unique
        reference = f"RED-{uuid.uuid4().hex[:8].upper()}"
        
        # Initialiser le service de paiement
        payment_service = None
        if payment_type == 'orange_money':
            payment_service = OrangeMoneyService()
            phone = payment_data.get('phone_number', request.user.phone_number)
            result = payment_service.initiate_payment(phone, order.total_amount, reference)
        elif payment_type == 'mtn_money':
            payment_service = MTNMoneyService()
            phone = payment_data.get('phone_number', request.user.phone_number)
            result = payment_service.initiate_payment(phone, order.total_amount, reference)
        elif payment_type == 'visa':
            payment_service = VisaService()
            result = payment_service.initiate_payment(
                payment_data.get('card_data', {}),
                order.total_amount,
                reference
            )
        else:
            return Response(
                {'error': 'Méthode de paiement non supportée'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not result.get('success'):
            return Response(
                {'error': result.get('error', 'Erreur de paiement')},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Créer la transaction
        transaction = PaymentTransaction.objects.create(
            user=request.user,
            order=order,
            payment_type=payment_type,
            transaction_id=result.get('transaction_id'),
            amount=order.total_amount,
            status=PaymentTransaction.Status.PENDING,
            reference=reference,
            payment_data=payment_data
        )

        # Si c'est une réservation (paiement différé)
        if order.order_type == 'reservation':
            transaction.status = PaymentTransaction.Status.RESERVED
            transaction.save()
            order.status = 'reserved'
            order.save()
            
            # Générer le reçu de réservation
            receipt_url = generate_receipt(order, transaction, is_reservation=True)
            transaction.receipt_pdf = receipt_url
            transaction.save()

            return Response({
                'status': 'reserved',
                'transaction_id': transaction.id,
                'receipt_pdf_url': receipt_url,
                'message': 'Réservation confirmée. Paiement à effectuer lors du retrait.'
            })

        # Si c'est un paiement direct, vérifier le statut
        # En production, vous attendriez la confirmation du paiement
        # Ici, on simule un succès
        transaction.status = PaymentTransaction.Status.SUCCESS
        transaction.completed_at = timezone.now()
        transaction.save()
        
        order.status = 'paid'
        order.save()

        # Générer le reçu
        receipt_url = generate_receipt(order, transaction, is_reservation=False)
        transaction.receipt_pdf = receipt_url
        transaction.save()

        return Response({
            'status': 'success',
            'transaction_id': transaction.id,
            'receipt_pdf_url': receipt_url,
            'message': 'Paiement effectué avec succès'
        })


class PaymentVerifyView(generics.GenericAPIView):
    """Vérification du statut d'un paiement"""
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentVerifySerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        transaction_id = serializer.validated_data['transaction_id']
        
        try:
            transaction = PaymentTransaction.objects.get(
                id=transaction_id, 
                user=request.user
            )
        except PaymentTransaction.DoesNotExist:
            return Response(
                {'error': 'Transaction non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Vérifier le statut auprès du service
        payment_service = None
        if transaction.payment_type == 'orange_money':
            payment_service = OrangeMoneyService()
        elif transaction.payment_type == 'mtn_money':
            payment_service = MTNMoneyService()
        elif transaction.payment_type == 'visa':
            payment_service = VisaService()
        else:
            return Response(
                {'error': 'Type de paiement non supporté'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = payment_service.verify_payment(transaction.transaction_id)
        
        if result.get('success'):
            transaction.status = PaymentTransaction.Status.SUCCESS
            transaction.completed_at = timezone.now()
            transaction.save()
            
            order = transaction.order
            order.status = 'paid'
            order.save()
            
            return Response({
                'status': 'success',
                'message': 'Paiement confirmé'
            })
        
        return Response({
            'status': 'pending',
            'message': 'Paiement en attente de confirmation'
        })


class PaymentHistoryView(generics.ListAPIView):
    """Historique des paiements de l'utilisateur"""
    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PaymentTransaction.objects.filter(
            user=self.request.user
        ).order_by('-created_at')
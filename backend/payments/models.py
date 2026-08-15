import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class PaymentMethod(models.Model):
    """Modèle pour les méthodes de paiement des utilisateurs"""
    
    class PaymentType(models.TextChoices):
        ORANGE_MONEY = 'orange_money', 'Orange Money'
        MTN_MONEY = 'mtn_money', 'MTN Mobile Money'
        VISA = 'visa', 'Visa'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_methods')
    payment_type = models.CharField(max_length=20, choices=PaymentType.choices)
    
    # Champs pour Orange Money et MTN Money
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    operator = models.CharField(max_length=20, blank=True, null=True)  # 'orange' ou 'mtn'
    
    # Champs pour Visa
    card_number = models.CharField(max_length=20, blank=True, null=True)
    card_holder_name = models.CharField(max_length=100, blank=True, null=True)
    card_expiry = models.CharField(max_length=7, blank=True, null=True)  # MM/YYYY
    card_cvv = models.CharField(max_length=4, blank=True, null=True)
    
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment_methods'
        verbose_name = 'Méthode de paiement'
        verbose_name_plural = 'Méthodes de paiement'

    def __str__(self):
        return f"{self.get_payment_type_display()} - {self.user.phone_number}"

    def mask_card_number(self):
        """Masque le numéro de carte pour l'affichage"""
        if self.card_number and len(self.card_number) >= 4:
            return f"****{self.card_number[-4:]}"
        return self.card_number


class PaymentTransaction(models.Model):
    """Modèle pour les transactions de paiement"""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'En attente'
        SUCCESS = 'success', 'Réussi'
        FAILED = 'failed', 'Échoué'
        CANCELLED = 'cancelled', 'Annulé'
        RESERVED = 'reserved', 'Réservé'

    class PaymentType(models.TextChoices):
        ORANGE_MONEY = 'orange_money', 'Orange Money'
        MTN_MONEY = 'mtn_money', 'MTN Mobile Money'
        VISA = 'visa', 'Visa'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='transactions')
    payment_type = models.CharField(max_length=20, choices=PaymentType.choices)
    transaction_id = models.CharField(max_length=100, unique=True, blank=True, null=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reference = models.CharField(max_length=100, blank=True, null=True)
    payment_data = models.JSONField(default=dict, blank=True)
    receipt_pdf = models.FileField(upload_to='receipts/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'payment_transactions'
        verbose_name = 'Transaction de paiement'
        verbose_name_plural = 'Transactions de paiement'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_id or 'N/A'} - {self.get_status_display()}"

    @property
    def is_completed(self):
        return self.status in [self.Status.SUCCESS, self.Status.FAILED, self.Status.CANCELLED]
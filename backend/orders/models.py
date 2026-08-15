import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone
from catalog.models import Product


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        PAID = "paid", "Payée"
        SHIPPED = "shipped", "Expédiée"
        DELIVERED = "delivered", "Livrée"
        CANCELLED = "cancelled", "Annulée"
        RESERVED = "reserved", "Réservée"

    class PaymentMethod(models.TextChoices):
        ORANGE_MONEY = "orange_money", "Orange Money"
        MTN_MONEY = "mtn_money", "MTN Mobile Money"
        VISA = "visa", "Visa"
        RESERVATION = "reservation", "Réservation"  # Pour les réservations

    class OrderType(models.TextChoices):
        PAYMENT = "payment", "Paiement direct"
        RESERVATION = "reservation", "Réservation"

    # Frais de livraison fixes
    DELIVERY_FEE_XAF = 2000

    # ─── Champs d'identité ───
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    
    # ─── Montants (FCFA) ───
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # ─── Statut et type ───
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.RESERVATION)
    order_type = models.CharField(
        max_length=20, 
        choices=OrderType.choices, 
        default=OrderType.PAYMENT,
        help_text="Type de commande : paiement direct ou réservation"
    )
    
    # ─── Champs pour la RÉSERVATION ───
    pickup_date = models.DateField(
        blank=True, 
        null=True, 
        help_text="Date de retrait pour une réservation"
    )
    pickup_time = models.TimeField(
        blank=True, 
        null=True, 
        help_text="Heure de retrait pour une réservation"
    )
    reserved_until = models.DateTimeField(
        blank=True, 
        null=True, 
        help_text="Date limite de retrait (généralement 24h après la réservation)"
    )
    
    # ─── Champs pour la LIVRAISON ───
    delivery_phone = models.CharField(max_length=20, blank=True, null=True)
    delivery_city = models.CharField(max_length=100, blank=True, null=True)
    delivery_neighborhood = models.CharField(max_length=150, blank=True, null=True)
    delivery_address_details = models.TextField(blank=True)
    
    # ─── Champs pour le PAIEMENT ───
    payment_reference = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text="Référence de paiement (ex: RED-XXXXXXXX)"
    )
    transaction_id = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text="ID de transaction du fournisseur de paiement"
    )
    payment_data = models.JSONField(
        default=dict, 
        blank=True, 
        help_text="Données supplémentaires du paiement"
    )

    # ─── Timestamps ───
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(
        blank=True, 
        null=True, 
        help_text="Date de finalisation de la commande (paiement ou réservation confirmée)"
    )

    class Meta:
        db_table = "orders"
        ordering = ["-created_at"]
        verbose_name = "Commande"
        verbose_name_plural = "Commandes"
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["order_type"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["payment_reference"]),
        ]

    def __str__(self):
        return f"Commande {self.id[:8].upper()} - {self.user.phone_number}"

    # ─── Méthodes ───
    def has_delivery_info(self):
        """Vérifie si les informations de livraison sont complètes"""
        return bool(self.delivery_phone and self.delivery_city and self.delivery_neighborhood)

    def recompute_total(self):
        """Recalcule le total de la commande"""
        subtotal = sum(item.quantity * item.unit_price for item in self.items.all())
        delivery_fee = self.DELIVERY_FEE_XAF if self.has_delivery_info() else 0
        self.subtotal = subtotal
        self.delivery_fee = delivery_fee
        self.total_amount = subtotal + delivery_fee
        self.save(update_fields=["subtotal", "delivery_fee", "total_amount"])

    def is_reservation(self):
        """Vérifie si c'est une réservation"""
        return self.order_type == self.OrderType.RESERVATION

    def is_payment(self):
        """Vérifie si c'est un paiement direct"""
        return self.order_type == self.OrderType.PAYMENT

    def is_paid(self):
        """Vérifie si la commande est payée"""
        return self.status == self.Status.PAID

    def is_reserved(self):
        """Vérifie si la commande est réservée"""
        return self.status == self.Status.RESERVED

    def is_cancelled(self):
        """Vérifie si la commande est annulée"""
        return self.status == self.Status.CANCELLED

    def get_status_display(self):
        """Retourne le nom affichable du statut"""
        return dict(self.Status.choices).get(self.status, self.status)

    def get_payment_method_display(self):
        """Retourne le nom affichable de la méthode de paiement"""
        return dict(self.PaymentMethod.choices).get(self.payment_method, self.payment_method)

    def get_order_type_display(self):
        """Retourne le nom affichable du type de commande"""
        return dict(self.OrderType.choices).get(self.order_type, self.order_type)

    def get_pickup_datetime(self):
        """Retourne la date et l'heure de retrait combinées"""
        if self.pickup_date and self.pickup_time:
            return timezone.datetime.combine(self.pickup_date, self.pickup_time)
        return None

    def set_reserved_until(self, hours=24):
        """Définit la date limite de retrait (par défaut 24h)"""
        now = timezone.now()
        self.reserved_until = now + timezone.timedelta(hours=hours)
        return self.reserved_until

    def cancel_reservation(self):
        """Annule une réservation"""
        if self.is_reserved():
            self.status = self.Status.CANCELLED
            self.save(update_fields=["status"])

    def confirm_reservation(self):
        """Confirme une réservation (passage à l'état réservé)"""
        if self.is_reservation() and self.status == self.Status.PENDING:
            self.status = self.Status.RESERVED
            self.set_reserved_until()
            self.save(update_fields=["status", "reserved_until"])


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)  # snapshot au moment de l'achat
    product_name = models.CharField(
        max_length=200, 
        blank=True, 
        help_text="Nom du produit au moment de l'achat"
    )
    product_image = models.URLField(
        blank=True, 
        null=True, 
        help_text="URL de l'image du produit"
    )

    class Meta:
        db_table = "order_items"
        verbose_name = "Article de commande"
        verbose_name_plural = "Articles de commande"

    def __str__(self):
        return f"{self.quantity} x {self.product_name or self.product.name}"

    @property
    def total(self):
        return self.quantity * self.unit_price
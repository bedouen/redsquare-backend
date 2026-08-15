from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from catalog.models import Product
from .models import Order, OrderItem


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True, default="Produit supprimé")
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "product_image", "quantity", "unit_price"]
        read_only_fields = ["id", "unit_price"]

    def get_product_image(self, obj):
        try:
            if obj.product and obj.product.image_front:
                return obj.product.image_front.url
        except Product.DoesNotExist:
            pass
        return None


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    buyer_name = serializers.SerializerMethodField()
    buyer_phone = serializers.CharField(source="user.phone_number", read_only=True)
    buyer_email = serializers.CharField(source="user.email", read_only=True)
    currency = serializers.SerializerMethodField()
    pickup_datetime = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "user", "buyer_name", "buyer_phone", "buyer_email",
            "subtotal", "delivery_fee", "total_amount",
            "currency", "status", "payment_method", "order_type",
            "pickup_date", "pickup_time", "pickup_datetime", "reserved_until",
            "delivery_phone", "delivery_city", "delivery_neighborhood",
            "delivery_address_details",
            "payment_reference", "transaction_id", "payment_data",
            "created_at", "updated_at", "completed_at",
            "items",
        ]
        read_only_fields = [
            "id", "user", "subtotal", "delivery_fee", "total_amount",
            "created_at", "updated_at", "completed_at"
        ]

    def get_buyer_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name or ''}".strip()

    def get_currency(self, obj):
        return "FCFA"

    def get_pickup_datetime(self, obj):
        if obj.pickup_date and obj.pickup_time:
            return timezone.datetime.combine(obj.pickup_date, obj.pickup_time).isoformat()
        return None


class CreateOrderSerializer(serializers.Serializer):
    """
    Création d'une commande à partir du panier (checkout).
    """
    items = OrderItemInputSerializer(many=True)
    payment_method = serializers.CharField(max_length=50, required=False, default="reservation")
    order_type = serializers.CharField(max_length=20, required=False, default="payment")
    
    # Réservation
    pickup_date = serializers.DateField(required=False, allow_null=True)
    pickup_time = serializers.TimeField(required=False, allow_null=True)
    
    # Livraison
    delivery_phone = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    delivery_city = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    delivery_neighborhood = serializers.CharField(max_length=150, required=False, allow_blank=True, allow_null=True)
    delivery_address_details = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Le panier ne peut pas être vide.")
        
        # Vérifier que les produits existent
        for item in items:
            product_id = item.get("product_id")
            if not product_id:
                raise serializers.ValidationError("ID de produit manquant.")
            try:
                Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Produit {product_id} introuvable.")
        
        return items

    def validate(self, attrs):
        order_type = attrs.get("order_type", "payment")
        
        # Pour une réservation, la date et l'heure sont requises
        if order_type == "reservation":
            if not attrs.get("pickup_date"):
                raise serializers.ValidationError(
                    {"pickup_date": "La date de retrait est requise pour une réservation."}
                )
            if not attrs.get("pickup_time"):
                raise serializers.ValidationError(
                    {"pickup_time": "L'heure de retrait est requise pour une réservation."}
                )
        
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        user = self.context["request"].user
        
        # Extraire les champs avec des valeurs par défaut
        order_type = validated_data.get("order_type", "payment")
        payment_method = validated_data.get("payment_method", "reservation")
        
        # Créer la commande
        order = Order.objects.create(
            user=user,
            order_type=order_type,
            payment_method=payment_method,
            pickup_date=validated_data.get("pickup_date"),
            pickup_time=validated_data.get("pickup_time"),
            delivery_phone=validated_data.get("delivery_phone", ""),
            delivery_city=validated_data.get("delivery_city", ""),
            delivery_neighborhood=validated_data.get("delivery_neighborhood", ""),
            delivery_address_details=validated_data.get("delivery_address_details", ""),
        )
        
        # Si c'est une réservation
        if order_type == "reservation":
            order.status = Order.Status.RESERVED
            order.reserved_until = timezone.now() + timezone.timedelta(hours=24)
        else:
            order.status = Order.Status.PENDING
        
        # Calcul du sous-total
        subtotal = Decimal("0")
        
        for item_data in items_data:
            product = Product.objects.select_for_update().get(pk=item_data["product_id"])
            quantity = item_data["quantity"]
            unit_price = product.unit_price
            
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                product_name=product.name,
                product_image=product.image_front.url if product.image_front else None
            )
            
            # Réduire le stock (sauf pour les réservations)
            if order_type != "reservation":
                product.quantity -= quantity
                product.save(update_fields=["quantity"])
            
            subtotal += unit_price * quantity
        
        # Calcul des frais de livraison
        delivery_fee = Decimal(Order.DELIVERY_FEE_XAF) if order.has_delivery_info() else Decimal("0")
        
        order.subtotal = subtotal
        order.delivery_fee = delivery_fee
        order.total_amount = subtotal + delivery_fee
        order.save(update_fields=["subtotal", "delivery_fee", "total_amount", "status", "reserved_until"])
        
        return order
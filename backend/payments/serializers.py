from rest_framework import serializers
from .models import PaymentMethod, PaymentTransaction
from orders.serializers import OrderSerializer

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'payment_type', 'phone_number', 'operator',
            'card_number', 'card_holder_name', 'card_expiry',
            'is_default', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.card_number:
            data['card_number'] = instance.mask_card_number()
        return data


class PaymentTransactionSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display')
    payment_type_display = serializers.CharField(source='get_payment_type_display')

    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'order', 'payment_type', 'payment_type_display',
            'transaction_id', 'amount', 'status', 'status_display',
            'reference', 'receipt_pdf', 'created_at', 'completed_at'
        ]
        read_only_fields = fields


class PaymentInitiateSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    payment_type = serializers.ChoiceField(choices=[
        'orange_money', 'mtn_money', 'visa'
    ])
    payment_data = serializers.JSONField(required=False, default=dict)


class PaymentVerifySerializer(serializers.Serializer):
    transaction_id = serializers.UUIDField()
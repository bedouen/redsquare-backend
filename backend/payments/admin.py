from django.contrib import admin
from .models import PaymentMethod, PaymentTransaction


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    """Administration des méthodes de paiement"""
    list_display = [
        'id', 
        'user', 
        'payment_type', 
        'phone_number', 
        'card_number_masked',
        'is_default', 
        'is_active',
        'created_at'
    ]
    list_filter = ['payment_type', 'is_default', 'is_active']
    search_fields = ['user__phone_number', 'user__email', 'phone_number', 'card_number']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('id', 'user', 'payment_type', 'is_default', 'is_active')
        }),
        ('Orange Money / MTN Money', {
            'fields': ('phone_number', 'operator'),
            'classes': ('collapse',)
        }),
        ('Visa', {
            'fields': ('card_number', 'card_holder_name', 'card_expiry', 'card_cvv'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def card_number_masked(self, obj):
        """Affiche le numéro de carte masqué"""
        return obj.mask_card_number()
    card_number_masked.short_description = 'Numéro de carte'


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    """Administration des transactions de paiement"""
    list_display = [
        'id', 
        'user', 
        'order_id_short', 
        'payment_type', 
        'amount', 
        'status_colored', 
        'reference',
        'created_at'
    ]
    list_filter = ['status', 'payment_type', 'created_at']
    search_fields = ['user__phone_number', 'reference', 'transaction_id', 'order__id']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('id', 'user', 'order', 'payment_type', 'amount', 'status')
        }),
        ('Détails de la transaction', {
            'fields': ('transaction_id', 'reference', 'payment_data', 'receipt_pdf')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )

    def order_id_short(self, obj):
        """Affiche l'ID de la commande raccourci"""
        if obj.order:
            return str(obj.order.id)[:8].upper()
        return 'N/A'
    order_id_short.short_description = 'Commande'

    def status_colored(self, obj):
        """Affiche le statut avec une couleur"""
        colors = {
            'pending': 'orange',
            'success': 'green',
            'failed': 'red',
            'cancelled': 'gray',
            'reserved': 'blue'
        }
        color = colors.get(obj.status, 'black')
        return f'<span style="color: {color}; font-weight: bold;">{obj.get_status_display()}</span>'
    status_colored.short_description = 'Statut'
    status_colored.allow_tags = True
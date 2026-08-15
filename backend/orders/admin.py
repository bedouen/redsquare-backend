from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "total_amount", "status", "payment_method", "created_at")
    list_filter = ("status", "payment_method")
    inlines = [OrderItemInline]


admin.site.register(Order, OrderAdmin)

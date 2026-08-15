from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, OTPCode


class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ("phone_number", "email", "first_name", "role", "is_active")
    list_filter = ("role", "is_active")
    ordering = ("-created_at",)
    search_fields = ("phone_number", "email", "first_name", "last_name")
    fieldsets = (
        (None, {"fields": ("phone_number", "email", "password")}),
        ("Infos personnelles", {"fields": ("first_name", "last_name", "city", "location", "neighborhood")}),
        ("Rôle & permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("phone_number", "first_name", "email", "role", "password1", "password2"),
        }),
    )


admin.site.register(User, UserAdmin)
admin.site.register(OTPCode)

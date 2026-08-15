from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()

DEFAULT_AVATAR_URL = "/static/avatars/default-avatar.png"


# ═══════════════════════════════════════════════════════════════
# SERIALIZER PRINCIPAL
# ═══════════════════════════════════════════════════════════════

class UserSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "phone_number", "email", "first_name", "last_name", "full_name",
            "profile_picture", "profile_picture_url",
            "city", "location", "neighborhood", "role", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "role", "created_at", "updated_at"]

    def get_profile_picture_url(self, obj):
        """Retourne l'URL complète de la photo de profil"""
        if obj.profile_picture:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return DEFAULT_AVATAR_URL

    def get_full_name(self, obj):
        """Retourne le nom complet de l'utilisateur"""
        return obj.full_name


# ═══════════════════════════════════════════════════════════════
# SERIALIZER BASIQUE (pour les relations)
# ═══════════════════════════════════════════════════════════════

class UserBasicSerializer(serializers.ModelSerializer):
    """
    Serializer basique pour les relations (utilisé dans catalog, orders, etc.)
    """
    full_name = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "phone_number", "first_name", "last_name", "full_name",
            "profile_picture", "profile_picture_url", "email"
        ]

    def get_full_name(self, obj):
        return obj.full_name

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return DEFAULT_AVATAR_URL


# ═══════════════════════════════════════════════════════════════
# SERIALIZER D'INSCRIPTION
# ═══════════════════════════════════════════════════════════════

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        # Seuls phone_number, first_name, password sont obligatoires
        fields = [
            "phone_number", "first_name", "password",
            "email", "last_name", "profile_picture", "city", "location", "neighborhood",
        ]
        extra_kwargs = {
            "email": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
            "profile_picture": {"required": False},
            "city": {"required": False, "allow_blank": True},
            "location": {"required": False, "allow_blank": True},
            "neighborhood": {"required": False, "allow_blank": True},
        }

    def validate_phone_number(self, value):
        """Valide le format du numéro de téléphone"""
        import re
        cleaned = re.sub(r'[\s\-()]', '', value)
        if not re.match(r'^(\+237|0)?[6-9][0-9]{8}$', cleaned):
            raise serializers.ValidationError(
                "Format de téléphone invalide. Utilisez +2376XXXXXXXX ou 6XXXXXXXX"
            )
        return cleaned

    def create(self, validated_data):
        # Toute inscription publique crée systématiquement un Client
        validated_data.pop("role", None)
        return User.objects.create_user(**validated_data)


# ═══════════════════════════════════════════════════════════════
# SERIALIZER DE CONNEXION
# ═══════════════════════════════════════════════════════════════

class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(
        help_text="Numéro de téléphone (prioritaire) ou email"
    )
    password = serializers.CharField(write_only=True)


# ═══════════════════════════════════════════════════════════════
# SERIALIZER ADMIN (pour Super-Admin)
# ═══════════════════════════════════════════════════════════════

class AdminCreateUserSerializer(serializers.ModelSerializer):
    """Utilisé par le Super-Admin pour créer des comptes avec un rôle choisi."""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "phone_number", "first_name", "last_name", "email",
            "city", "location", "neighborhood", "role", "password",
        ]

    def validate_phone_number(self, value):
        """Valide le format du numéro de téléphone"""
        import re
        cleaned = re.sub(r'[\s\-()]', '', value)
        if not re.match(r'^(\+237|0)?[6-9][0-9]{8}$', cleaned):
            raise serializers.ValidationError(
                "Format de téléphone invalide. Utilisez +2376XXXXXXXX ou 6XXXXXXXX"
            )
        return cleaned

    def create(self, validated_data):
        password = validated_data.pop("password")
        role = validated_data.pop("role", User.Role.CLIENT)
        user = User(role=role, **validated_data)
        user.set_password(password)
        user.save()
        return user


# ═══════════════════════════════════════════════════════════════
# SERIALIZERS OTP
# ═══════════════════════════════════════════════════════════════

class RequestOTPSerializer(serializers.Serializer):
    identifier = serializers.CharField(
        help_text="Numéro de téléphone ou email"
    )
    channel = serializers.ChoiceField(
        choices=["sms", "email"],
        default="sms",
        help_text="Canal d'envoi : sms (prioritaire) ou email"
    )


class VerifyOTPSerializer(serializers.Serializer):
    identifier = serializers.CharField(
        help_text="Numéro de téléphone ou email"
    )
    code = serializers.CharField(
        max_length=6,
        help_text="Code OTP reçu"
    )
    new_password = serializers.CharField(
        min_length=8,
        help_text="Nouveau mot de passe"
    )


# ═══════════════════════════════════════════════════════════════
# SERIALIZER DE MISE À JOUR DU PROFIL
# ═══════════════════════════════════════════════════════════════

class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour du profil utilisateur"""
    
    class Meta:
        model = User
        fields = [
            "first_name", "last_name", "email",
            "city", "location", "neighborhood",
            "profile_picture"
        ]
        extra_kwargs = {
            "first_name": {"required": False},
            "last_name": {"required": False},
            "email": {"required": False},
            "city": {"required": False},
            "location": {"required": False},
            "neighborhood": {"required": False},
            "profile_picture": {"required": False},
        }


# ═══════════════════════════════════════════════════════════════
# SERIALIZER POUR LE CHANGEMENT DE RÔLE (Super-Admin)
# ═══════════════════════════════════════════════════════════════

class ChangeRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=User.Role.choices)
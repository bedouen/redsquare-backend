import uuid
import re
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.conf import settings

# ═══════════════════════════════════════════════════════════════
# VALIDATEURS
# ═══════════════════════════════════════════════════════════════

def validate_phone_number(value):
    """Valide un numéro de téléphone camerounais"""
    pattern = r'^(\+237|0)?[6-9][0-9]{8}$'
    cleaned = value.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
    if not re.match(pattern, cleaned):
        raise ValidationError(
            'Format de téléphone invalide. Utilisez +2376XXXXXXXX ou 6XXXXXXXX'
        )
    return cleaned

def validate_image_size(value):
    """Valide la taille de l'image (max 5MB)"""
    if value.size > 5 * 1024 * 1024:
        raise ValidationError('La taille de l\'image ne doit pas dépasser 5MB.')

# ═══════════════════════════════════════════════════════════════
# USER MANAGER
# ═══════════════════════════════════════════════════════════════

class UserManager(BaseUserManager):
    def create_user(self, phone_number, first_name, password=None, **extra_fields):
        if not phone_number:
            raise ValueError("Le numéro de téléphone est obligatoire.")
        if not first_name:
            raise ValueError("Le prénom est obligatoire.")

        email = extra_fields.pop("email", None)
        if email:
            email = self.normalize_email(email)

        extra_fields.setdefault("role", User.Role.CLIENT)
        if extra_fields.get("role") == User.Role.SUPER_ADMIN and not extra_fields.get(
            "_allow_super_admin_creation"
        ):
            extra_fields["role"] = User.Role.CLIENT
        extra_fields.pop("_allow_super_admin_creation", None)

        phone_number = phone_number.strip()

        user = self.model(
            phone_number=phone_number,
            first_name=first_name.strip(),
            email=email,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, first_name, password=None, **extra_fields):
        extra_fields["role"] = User.Role.SUPER_ADMIN
        extra_fields["is_staff"] = True
        extra_fields["is_superuser"] = True
        extra_fields["_allow_super_admin_creation"] = True
        return self.create_user(phone_number, first_name, password, **extra_fields)


# ═══════════════════════════════════════════════════════════════
# USER MODEL
# ═══════════════════════════════════════════════════════════════

class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        CLIENT = "client", "Client"
        ADMIN = "admin", "Administrateur"
        SUPER_ADMIN = "super_admin", "Super Administrateur"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(
        max_length=20, unique=True, validators=[validate_phone_number],
        help_text="Numéro de téléphone au format +2376XXXXXXXX"
    )
    email = models.EmailField(unique=True, null=True, blank=True, help_text="Adresse email (optionnelle)")
    first_name = models.CharField(max_length=150, help_text="Prénom")
    last_name = models.CharField(max_length=150, blank=True, null=True, help_text="Nom (optionnel)")

    profile_picture = models.ImageField(
        upload_to="avatars/%Y/%m/%d/", blank=True, null=True,
        validators=[validate_image_size], help_text="Photo de profil de l'utilisateur"
    )

    city = models.CharField(max_length=100, blank=True, null=True, help_text="Ville")
    location = models.CharField(max_length=255, blank=True, null=True, help_text="Localisation complète")
    neighborhood = models.CharField(max_length=150, blank=True, null=True, help_text="Quartier")

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CLIENT, help_text="Rôle de l'utilisateur")
    is_active = models.BooleanField(default=True, help_text="Compte actif")
    is_staff = models.BooleanField(default=False, help_text="Accès à l'administration Django")

    preferred_language = models.CharField(
        max_length=10, default='fr',
        choices=[('fr', 'Français'), ('en', 'Anglais')],
        help_text="Langue préférée"
    )
    receive_newsletter = models.BooleanField(default=False, help_text="Recevoir la newsletter")
    receive_promotions = models.BooleanField(default=False, help_text="Recevoir les promotions")

    facebook_url = models.URLField(blank=True, null=True, help_text="URL du profil Facebook")
    instagram_url = models.URLField(blank=True, null=True, help_text="URL du profil Instagram")
    twitter_url = models.URLField(blank=True, null=True, help_text="URL du profil Twitter")
    linkedin_url = models.URLField(blank=True, null=True, help_text="URL du profil LinkedIn")

    created_at = models.DateTimeField(auto_now_add=True, help_text="Date de création")
    updated_at = models.DateTimeField(auto_now=True, help_text="Date de dernière modification")
    last_activity = models.DateTimeField(null=True, blank=True, help_text="Date de dernière activité")

    objects = UserManager()

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = ["first_name"]

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["phone_number"]),
            models.Index(fields=["email"]),
            models.Index(fields=["role"]),
            models.Index(fields=["created_at"]),
        ]
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        return f"{self.first_name} {self.last_name or ''} ({self.phone_number})"

    def save(self, *args, **kwargs):
        if self.phone_number:
            self.phone_number = re.sub(r'[\s\-()]', '', self.phone_number)
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        if self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name

    @property
    def profile_picture_url(self):
        if self.profile_picture:
            if self.profile_picture.url.startswith(('http://', 'https://')):
                return self.profile_picture.url
            request = getattr(self, '_request', None)
            if request:
                return request.build_absolute_uri(self.profile_picture.url)
            if hasattr(settings, 'MEDIA_URL'):
                return f"{settings.MEDIA_URL}{self.profile_picture}"
        return None

    @property
    def is_admin(self):
        return self.role in (User.Role.ADMIN, User.Role.SUPER_ADMIN)

    @property
    def is_super_admin(self):
        return self.role == User.Role.SUPER_ADMIN

    @property
    def is_client(self):
        return self.role == User.Role.CLIENT

    @property
    def role_display(self):
        return dict(User.Role.choices).get(self.role, self.role)

    @property
    def has_profile(self):
        return bool(self.profile_picture or self.city or self.neighborhood)

    @property
    def is_profile_complete(self):
        return all([self.first_name, self.last_name, self.email, self.city, self.neighborhood])

    @property
    def initials(self):
        initials = self.first_name[0] if self.first_name else ''
        if self.last_name:
            initials += self.last_name[0]
        return initials.upper() or '?'

    @property
    def phone_formatted(self):
        phone = self.phone_number
        if phone.startswith('+237'):
            phone = phone[4:]
        if len(phone) >= 9:
            return f"{phone[:3]} {phone[3:6]} {phone[6:9]}"
        return phone

    def update_last_activity(self):
        self.last_activity = timezone.now()
        self.save(update_fields=['last_activity'])

    def get_profile_completion_percentage(self):
        required_fields = [
            self.first_name, self.last_name, self.email,
            self.city, self.neighborhood, self.profile_picture,
        ]
        filled = sum(1 for field in required_fields if field)
        return int((filled / len(required_fields)) * 100)

    def get_social_links(self):
        return {
            'facebook': self.facebook_url, 'instagram': self.instagram_url,
            'twitter': self.twitter_url, 'linkedin': self.linkedin_url,
        }

    def has_social_links(self):
        return any([self.facebook_url, self.instagram_url, self.twitter_url, self.linkedin_url])

    def get_notification_preferences(self):
        return {'newsletter': self.receive_newsletter, 'promotions': self.receive_promotions}

    def get_dashboard_url(self):
        if self.is_super_admin:
            return '/superadmin'
        if self.is_admin:
            return '/admin'
        return '/client'

    def get_avatar_url(self):
        url = self.profile_picture_url
        if url:
            return url
        return f"https://ui-avatars.com/api/?name={self.full_name}&background=E63946&color=FFFFFF&bold=true&size=128"

    def get_role_badge_color(self):
        colors = {
            User.Role.SUPER_ADMIN: 'red', User.Role.ADMIN: 'purple', User.Role.CLIENT: 'blue',
        }
        return colors.get(self.role, 'gray')

    def get_role_badge_icon(self):
        icons = {
            User.Role.SUPER_ADMIN: '⭐', User.Role.ADMIN: '🛡️', User.Role.CLIENT: '👤',
        }
        return icons.get(self.role, '👤')


# ═══════════════════════════════════════════════════════════════
# OTP CODE MODEL
# ═══════════════════════════════════════════════════════════════

class OTPCode(models.Model):
    class Channel(models.TextChoices):
        SMS = "sms", "SMS"
        EMAIL = "email", "Email"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="otp_codes")
    code = models.CharField(max_length=6, help_text="Code à 6 chiffres")
    channel = models.CharField(max_length=10, choices=Channel.choices, help_text="Canal d'envoi (SMS ou Email)")
    is_used = models.BooleanField(default=False, help_text="Code déjà utilisé")
    attempts = models.IntegerField(default=0, help_text="Nombre de tentatives")
    created_at = models.DateTimeField(auto_now_add=True, help_text="Date de création")
    expires_at = models.DateTimeField(help_text="Date d'expiration")

    class Meta:
        db_table = "otp_codes"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "code"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["expires_at"]),
        ]
        verbose_name = "Code OTP"
        verbose_name_plural = "Codes OTP"

    def __str__(self):
        return f"OTP {self.code} pour {self.user.phone_number} ({self.channel})"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_expired and not self.is_used

    @property
    def remaining_attempts(self):
        return max(0, 5 - self.attempts)

    def mark_used(self):
        self.is_used = True
        self.save(update_fields=['is_used'])

    def increment_attempts(self):
        self.attempts += 1
        self.save(update_fields=['attempts'])
        return self.attempts

    def generate_code(self):
        import random
        self.code = ''.join(str(random.randint(0, 9)) for _ in range(6))
        self.expires_at = timezone.now() + timezone.timedelta(minutes=10)
        return self.code

    def reset_attempts(self):
        self.attempts = 0
        self.save(update_fields=['attempts'])


# ═══════════════════════════════════════════════════════════════
# USER SESSION MODEL (Optionnel)
# ═══════════════════════════════════════════════════════════════

class UserSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    token = models.CharField(max_length=500, help_text="Token JWT")
    device_info = models.JSONField(default=dict, help_text="Informations sur l'appareil")
    ip_address = models.GenericIPAddressField(null=True, blank=True, help_text="Adresse IP")
    user_agent = models.TextField(blank=True, help_text="User Agent du navigateur")
    is_active = models.BooleanField(default=True, help_text="Session active")
    created_at = models.DateTimeField(auto_now_add=True, help_text="Date de création")
    expires_at = models.DateTimeField(help_text="Date d'expiration")
    last_activity = models.DateTimeField(auto_now=True, help_text="Dernière activité")

    class Meta:
        db_table = "user_sessions"
        ordering = ["-last_activity"]
        indexes = [
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["created_at"]),
        ]
        verbose_name = "Session utilisateur"
        verbose_name_plural = "Sessions utilisateurs"

    def __str__(self):
        return f"Session {self.user.phone_number} - {self.created_at}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return self.is_active and not self.is_expired

    def extend_session(self, days=7):
        self.expires_at = timezone.now() + timezone.timedelta(days=days)
        self.save(update_fields=['expires_at'])
        return self.expires_at
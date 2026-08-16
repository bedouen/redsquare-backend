"""
Configuration Django pour RedSquare.
Version : 2.0 - Production Ready (Railway)
"""

import os
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv
import dj_database_url

# ═══════════════════════════════════════════════════════════════
# PATHS DE BASE
# ═══════════════════════════════════════════════════════════════

BASE_DIR = Path(__file__).resolve().parent.parent

# ═══════════════════════════════════════════════════════════════
# SÉCURITÉ
# ═══════════════════════════════════════════════════════════════

SECRET_KEY = config("SECRET_KEY", default="hK_X1NnfhDlFf3XBdnB2jIeLm6mFdzcDjV6FUZt8FSi4hLMNpzWnxl6QCKuYDfw2V7o")
DEBUG = config("DEBUG", default=True, cast=bool)

# ⚠️ Pour Railway, accepter tous les hosts ou spécifier les domaines
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="127.0.0.1,localhost,*.railway.app", cast=Csv())

# ═══════════════════════════════════════════════════════════════
# APPLICATIONS INSTALLÉES
# ═══════════════════════════════════════════════════════════════

INSTALLED_APPS = [
    # Django Admin
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.humanize",

    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",

    # Local apps
    "accounts",
    "catalog",
    "orders",
    "payments",
    "reports",
    "chat",
]

# ═══════════════════════════════════════════════════════════════
# MIDDLEWARE (⚠️ AJOUT DE WHITENOISE POUR RAILWAY)
# ═══════════════════════════════════════════════════════════════

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # ✅ AJOUTÉ POUR RAILWAY
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# ═══════════════════════════════════════════════════════════════
# URLS ET TEMPLATES
# ═══════════════════════════════════════════════════════════════

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ═══════════════════════════════════════════════════════════════
# BASE DE DONNÉES (⚠️ CONFIGURATION RAILWAY)
# ═══════════════════════════════════════════════════════════════

# Utiliser DATABASE_URL si disponible (Railway)
DATABASE_URL = config('DATABASE_URL', default='')

if DATABASE_URL:
    # Production (Railway)
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Développement (local)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("DB_NAME", default="redsquare"),
            "USER": config("DB_USER", default="postgres"),
            "PASSWORD": config("DB_PASSWORD", default="postgres"),
            "HOST": config("DB_HOST", default="localhost"),
            "PORT": config("DB_PORT", default="5432"),
            "CONN_MAX_AGE": 600,
            "OPTIONS": {
                "client_encoding": "UTF8",
            },
        }
    }

# ═══════════════════════════════════════════════════════════════
# AUTHENTIFICATION
# ═══════════════════════════════════════════════════════════════

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ═══════════════════════════════════════════════════════════════
# INTERNATIONALISATION
# ═══════════════════════════════════════════════════════════════

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Douala"
USE_I18N = True
USE_TZ = True

# ═══════════════════════════════════════════════════════════════
# FICHIERS STATIQUES ET MEDIAS (⚠️ CONFIGURATION RAILWAY)
# ═══════════════════════════════════════════════════════════════

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [
    BASE_DIR / "static",
]

# ✅ Whitenoise pour servir les fichiers statiques en production
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION DES FICHIERS MEDIA - IMPORTANT POUR RAILWAY
# ═══════════════════════════════════════════════════════════════

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ═══════════════════════════════════════════════════════════════
# REST FRAMEWORK
# ═══════════════════════════════════════════════════════════════

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/day",
        "user": "1000/day",
    },
    "DATETIME_FORMAT": "%Y-%m-%dT%H:%M:%S%z",
}

# ═══════════════════════════════════════════════════════════════
# SIMPLE JWT
# ═══════════════════════════════════════════════════════════════

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=2),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ═══════════════════════════════════════════════════════════════
# CORS - MIS À JOUR AVEC L'URL DE PRODUCTION DU FRONTEND
# ═══════════════════════════════════════════════════════════════

CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:5173,http://127.0.0.1:5173,https://redsquare-o-production.up.railway.app,https://redsquare-o.railway.app",
    cast=Csv()
)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# ═══════════════════════════════════════════════════════════════
# SÉCURITÉ (Production)
# ═══════════════════════════════════════════════════════════════

if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = 31536000  # 1 an
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    X_FRAME_OPTIONS = "DENY"
    SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# ═══════════════════════════════════════════════════════════════
# EMAIL
# ═══════════════════════════════════════════════════════════════

EMAIL_BACKEND = config(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend"
)
EMAIL_HOST = config("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="noreply@redsquare.com")

# ═══════════════════════════════════════════════════════════════
# PAIEMENTS
# ═══════════════════════════════════════════════════════════════

# Orange Money
ORANGE_MONEY_API_URL = config('ORANGE_MONEY_API_URL', default='https://api.orange.com/om/v1')
ORANGE_MONEY_CLIENT_ID = config('ORANGE_MONEY_CLIENT_ID', default='')
ORANGE_MONEY_CLIENT_SECRET = config('ORANGE_MONEY_CLIENT_SECRET', default='')
ORANGE_MONEY_MERCHANT_KEY = config('ORANGE_MONEY_MERCHANT_KEY', default='')
ORANGE_MONEY_RECIPIENT = '+237690787473'

# MTN Money
MTN_MONEY_API_URL = config('MTN_MONEY_API_URL', default='https://api.mtn.com/momo/v1')
MTN_MONEY_API_KEY = config('MTN_MONEY_API_KEY', default='')
MTN_MONEY_SUBSCRIPTION_KEY = config('MTN_MONEY_SUBSCRIPTION_KEY', default='')
MTN_MONEY_MERCHANT_KEY = config('MTN_MONEY_MERCHANT_KEY', default='')
MTN_MONEY_RECIPIENT = '+237674422407'

# Visa
VISA_API_URL = config('VISA_API_URL', default='https://api.stripe.com/v1')
VISA_API_KEY = config('VISA_API_KEY', default='')
VISA_MERCHANT_KEY = config('VISA_MERCHANT_KEY', default='')
VISA_BANK_ACCOUNT = '148068957458'

# ═══════════════════════════════════════════════════════════════
# SMS (Twilio)
# ═══════════════════════════════════════════════════════════════

TWILIO_ACCOUNT_SID = config('TWILIO_ACCOUNT_SID', default='')
TWILIO_AUTH_TOKEN = config('TWILIO_AUTH_TOKEN', default='')
TWILIO_PHONE_NUMBER = config('TWILIO_PHONE_NUMBER', default='')

# ═══════════════════════════════════════════════════════════════
# LOGGING
# ═══════════════════════════════════════════════════════════════

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {asctime} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": BASE_DIR / "logs" / "django.log",
            "maxBytes": 5 * 1024 * 1024,
            "backupCount": 5,
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": True,
        },
    },
}

# ═══════════════════════════════════════════════════════════════
# AUTRES CONFIGURATIONS
# ═══════════════════════════════════════════════════════════════

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
DEFAULT_DELIVERY_FEE = 2000
SITE_NAME = "RedSquare"
SITE_URL = config("SITE_URL", default="http://localhost:8000")
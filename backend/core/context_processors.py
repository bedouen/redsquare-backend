from django.conf import settings

def site_settings(request):
    """Fournit les paramètres du site aux templates"""
    return {
        'SITE_NAME': getattr(settings, 'SITE_NAME', 'RedSquare'),
        'SITE_DESCRIPTION': getattr(settings, 'SITE_DESCRIPTION', ''),
        'SITE_URL': getattr(settings, 'SITE_URL', ''),
        'DEFAULT_DELIVERY_FEE': getattr(settings, 'DEFAULT_DELIVERY_FEE', 2000),
        'DEBUG': settings.DEBUG,
    }
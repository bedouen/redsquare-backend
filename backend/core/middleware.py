import logging
from django.utils import timezone
from django.http import JsonResponse

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    """Log les requêtes entrantes"""
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Avant la requête
        logger.info(f"Request: {request.method} {request.path}")
        
        response = self.get_response(request)
        
        # Après la requête
        logger.info(f"Response: {response.status_code}")
        
        return response


class AuditLogMiddleware:
    """Log des actions sensibles"""
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Log des actions de modification
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            user = request.user if request.user.is_authenticated else 'Anonymous'
            logger.info(
                f"Audit: {user} - {request.method} {request.path}"
            )
        
        return response
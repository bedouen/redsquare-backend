from rest_framework.views import exception_handler
from rest_framework.response import Response
from django.http import Http404
from rest_framework import status

def custom_exception_handler(exc, context):
    """Handler d'exceptions personnalisé"""
    
    # Appeler l'handler de base
    response = exception_handler(exc, context)
    
    if response is not None:
        # Personnaliser le format de l'erreur
        response.data = {
            'error': True,
            'status_code': response.status_code,
            'detail': response.data.get('detail', response.data),
            'timestamp': str(datetime.now()),
            'path': context['request'].path,
        }
    
    return response
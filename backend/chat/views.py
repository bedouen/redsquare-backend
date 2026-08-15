# chat/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.shortcuts import get_object_or_404
import uuid
import logging

from .models import ChatSession, ChatMessage
from .services import ChatService
from .serializers import ChatMessageSerializer

logger = logging.getLogger(__name__)


class ChatView(APIView):
    """Point d'entrée principal pour l'assistant IA"""
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Récupérer ou créer une session
            session_id = request.data.get('session_id')
            message = request.data.get('message', '').strip()
            
            if not message:
                return Response(
                    {'error': 'Le message ne peut pas être vide'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Gérer la session
            if session_id:
                session = ChatSession.objects.filter(session_id=session_id).first()
                if not session:
                    session_id = str(uuid.uuid4())
                    session = ChatSession.objects.create(
                        user=request.user if request.user.is_authenticated else None,
                        session_id=session_id
                    )
            else:
                session_id = str(uuid.uuid4())
                session = ChatSession.objects.create(
                    user=request.user if request.user.is_authenticated else None,
                    session_id=session_id
                )
            
            # Créer le message utilisateur
            user_message = ChatMessage.objects.create(
                session=session,
                message_type=ChatMessage.MessageType.USER,
                content=message
            )
            
            # Traiter le message
            chat_service = ChatService(
                user=request.user if request.user.is_authenticated else None,
                session=session
            )
            response_data = chat_service.process_message(message)
            
            # Créer le message assistant
            assistant_message = ChatMessage.objects.create(
                session=session,
                message_type=ChatMessage.MessageType.ASSISTANT,
                content=response_data.get('message', ''),
                intent=response_data.get('intent', ''),
                entities={}
            )
            
            # Récupérer l'historique
            messages = ChatMessage.objects.filter(session=session).order_by('created_at')
            
            return Response({
                'session_id': session_id,
                'response': response_data,
                'history': ChatMessageSerializer(messages, many=True).data,
                'message_id': str(assistant_message.id)
            })
            
        except Exception as e:
            logger.error(f"Erreur chat: {str(e)}")
            return Response(
                {'error': 'Une erreur est survenue lors du traitement de votre message'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatHistoryView(APIView):
    """Récupère l'historique d'une session de chat"""
    permission_classes = [AllowAny]

    def get(self, request, session_id):
        try:
            session = get_object_or_404(ChatSession, session_id=session_id)
            messages = ChatMessage.objects.filter(session=session).order_by('created_at')
            serializer = ChatMessageSerializer(messages, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Erreur historique chat: {str(e)}")
            return Response(
                {'error': 'Erreur lors du chargement de l\'historique'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatSuggestionsView(APIView):
    """Génère des suggestions de questions"""
    permission_classes = [AllowAny]

    def get(self, request):
        suggestions = [
            "Quels sont vos meilleurs produits ?",
            "Je cherche un smartphone",
            "Comment puis-je passer une commande ?",
            "Quels sont les modes de paiement ?",
            "Comment suivre ma commande ?",
            "Quels sont les frais de livraison ?",
            "Puis-je retourner un produit ?",
            "Comment créer un compte ?",
            "Avez-vous des promotions ?",
            "Je veux des écouteurs sans fil",
            "Quels sont vos produits les moins chers ?",
            "Comment contacter le service client ?"
        ]
        return Response({'suggestions': suggestions})
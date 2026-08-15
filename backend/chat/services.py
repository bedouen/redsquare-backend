# chat/services.py
from typing import Dict, List, Optional, Any
from django.db.models import Q
from catalog.models import Product, Category
from orders.models import Order
from .intents import IntentClassifier
import json
import re


class ChatService:
    """Service principal de l'assistant IA"""
    
    def __init__(self, user=None, session=None):
        self.user = user
        self.session = session
        self.context = {}
    
    def process_message(self, message: str) -> Dict[str, Any]:
        """
        Traite un message utilisateur et retourne une réponse structurée
        """
        # 1. Classifier l'intention
        intent, entities = IntentClassifier.classify(message)
        
        # 2. Traiter selon l'intention
        if intent == 'product_search':
            response = self._handle_product_search(message, entities)
        elif intent == 'product_help':
            response = self._handle_product_help(message, entities)
        elif intent == 'order_status':
            response = self._handle_order_status(message, entities)
        elif intent in ['greeting', 'help', 'about', 'delivery', 'payment', 'return', 'account']:
            response = self._handle_faq(intent)
        elif intent == 'unknown':
            response = self._handle_unknown(message)
        else:
            response = self._handle_general(message)
        
        return response
    
    def _handle_product_search(self, message: str, entities: Dict) -> Dict[str, Any]:
        """Recherche des produits"""
        # Extraire les mots-clés de recherche
        keywords = self._extract_keywords(message)
        
        # Filtrer les produits
        products = Product.objects.all()
        
        if keywords:
            q_objects = Q()
            for word in keywords:
                q_objects |= Q(name__icontains=word) | Q(description__icontains=word)
            products = products.filter(q_objects)
        
        # Filtrer par catégorie si spécifiée
        if entities.get('categories'):
            categories = Category.objects.filter(name__icontains=entities['categories'][0])
            if categories.exists():
                products = products.filter(category=categories.first())
        
        # Limiter les résultats
        products = products[:5]
        
        if products.exists():
            response_text = "Voici quelques produits qui pourraient vous intéresser :\n\n"
            product_list = []
            for product in products:
                response_text += f"• {product.name} - {product.unit_price} FCFA (Stock: {product.quantity})\n"
                product_list.append({
                    'id': str(product.id),
                    'name': product.name,
                    'price': float(product.unit_price),
                    'category': product.category.name if product.category else None,
                    'quantity': product.quantity,
                    'image': product.image_front.url if product.image_front else None
                })
            
            return {
                'type': 'product_list',
                'message': response_text,
                'products': product_list,
                'intent': 'product_search'
            }
        else:
            return {
                'type': 'text',
                'message': "Je n'ai pas trouvé de produits correspondant à votre recherche. Essayez avec d'autres mots-clés.",
                'intent': 'product_search'
            }
    
    def _handle_product_help(self, message: str, entities: Dict) -> Dict[str, Any]:
        """Informations sur un produit spécifique"""
        # Essayer de trouver le produit mentionné
        product_name = self._extract_product_name(message)
        
        if product_name:
            product = Product.objects.filter(name__icontains=product_name).first()
            if product:
                response_text = f"**{product.name}**\n"
                response_text += f"Description: {product.description or 'Aucune description'}\n"
                response_text += f"Prix: {product.unit_price} FCFA\n"
                response_text += f"Stock disponible: {product.quantity}\n"
                response_text += f"Catégorie: {product.category.name if product.category else 'Non catégorisé'}\n"
                
                return {
                    'type': 'product_detail',
                    'message': response_text,
                    'product': {
                        'id': str(product.id),
                        'name': product.name,
                        'price': float(product.unit_price),
                        'description': product.description,
                        'quantity': product.quantity,
                        'category': product.category.name if product.category else None,
                        'image': product.image_front.url if product.image_front else None
                    },
                    'intent': 'product_help'
                }
        
        return {
            'type': 'text',
            'message': "Quel produit souhaitez-vous connaître ? Donnez-moi son nom.",
            'intent': 'product_help'
        }
    
    def _handle_order_status(self, message: str, entities: Dict) -> Dict[str, Any]:
        """Statut des commandes de l'utilisateur"""
        if not self.user:
            return {
                'type': 'text',
                'message': "Veuillez vous connecter pour consulter vos commandes.",
                'intent': 'order_status',
                'requires_login': True
            }
        
        # Récupérer les commandes de l'utilisateur
        orders = Order.objects.filter(user=self.user).order_by('-created_at')
        
        if not orders.exists():
            return {
                'type': 'text',
                'message': "Vous n'avez pas encore de commandes.",
                'intent': 'order_status'
            }
        
        # Filtrer par statut si mentionné
        if entities.get('order_status'):
            status_mapping = {
                'en attente': 'pending',
                'payée': 'paid',
                'expédiée': 'shipped',
                'livrée': 'delivered',
                'annulée': 'cancelled',
                'réservée': 'reserved'
            }
            status = status_mapping.get(entities['order_status'][0])
            if status:
                orders = orders.filter(status=status)
        
        orders = orders[:5]
        
        response_text = "Voici vos commandes récentes :\n\n"
        order_list = []
        for order in orders:
            status_emoji = {
                'paid': '✅',
                'pending': '⏳',
                'shipped': '🚚',
                'delivered': '📦',
                'cancelled': '❌',
                'reserved': '📋'
            }.get(order.status, '📋')
            
            response_text += f"{status_emoji} Commande #{str(order.id)[:8].upper()}\n"
            response_text += f"   Total: {order.total_amount} FCFA\n"
            response_text += f"   Statut: {order.get_status_display()}\n"
            response_text += f"   Date: {order.created_at.strftime('%d/%m/%Y')}\n\n"
            
            order_list.append({
                'id': str(order.id),
                'total': float(order.total_amount),
                'status': order.status,
                'status_display': order.get_status_display(),
                'created_at': order.created_at.isoformat(),
                'items_count': order.items.count()
            })
        
        return {
            'type': 'order_list',
            'message': response_text,
            'orders': order_list,
            'intent': 'order_status'
        }
    
    def _handle_faq(self, intent: str) -> Dict[str, Any]:
        """Réponses aux questions fréquentes"""
        response = IntentClassifier.get_intent_response(intent)
        return {
            'type': 'text',
            'message': response,
            'intent': intent
        }
    
    def _handle_unknown(self, message: str) -> Dict[str, Any]:
        """Réponse pour les messages non reconnus"""
        # Essayer de trouver une réponse dans la base de connaissances
        response = "Je suis désolé, je ne comprends pas votre question. "
        response += "Je peux vous aider avec :\n"
        response += "• La recherche de produits\n"
        response += "• Les informations sur les produits\n"
        response += "• Le suivi de vos commandes\n"
        response += "• Les questions sur la livraison et les paiements"
        
        # Proposer des suggestions
        suggestions = self._generate_suggestions(message)
        if suggestions:
            response += "\n\nAvez-vous cherché l'un de ces produits ? " + ", ".join(suggestions[:3])
        
        return {
            'type': 'text',
            'message': response,
            'intent': 'unknown'
        }
    
    def _handle_general(self, message: str) -> Dict[str, Any]:
        """Réponse générale"""
        return {
            'type': 'text',
            'message': "Je suis l'assistant RedSquare. Comment puis-je vous aider ?",
            'intent': 'general'
        }
    
    def _extract_keywords(self, message: str) -> List[str]:
        """Extrait les mots-clés d'un message"""
        # Supprimer les mots vides
        stop_words = ['le', 'la', 'les', 'un', 'une', 'des', 'pour', 'avec', 'sans', 'sur', 'dans']
        words = re.findall(r'[a-zA-ZÀ-ÿ0-9]+', message.lower())
        keywords = [w for w in words if len(w) > 2 and w not in stop_words]
        return keywords
    
    def _extract_product_name(self, message: str) -> Optional[str]:
        """Extrait le nom d'un produit du message"""
        # Rechercher les produits dans la base
        keywords = self._extract_keywords(message)
        for word in keywords:
            if Product.objects.filter(name__icontains=word).exists():
                return word
        return None
    
    def _generate_suggestions(self, message: str) -> List[str]:
        """Génère des suggestions basées sur le message"""
        suggestions = []
        keywords = self._extract_keywords(message)
        for keyword in keywords[:3]:
            products = Product.objects.filter(name__icontains=keyword)[:2]
            for product in products:
                if product.name not in suggestions:
                    suggestions.append(product.name)
        return suggestions[:5]
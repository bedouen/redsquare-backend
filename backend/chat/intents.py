# chat/intents.py

from typing import Dict, Tuple, List
import re


class IntentClassifier:
    """Classifieur d'intentions pour l'assistant IA"""
    
    # Définition des intentions
    INTENTS = {
        'greeting': {
            'keywords': ['bonjour', 'salut', 'coucou', 'hey', 'hello', 'hi', 'bonsoir'],
            'response': "Bonjour ! Je suis l'assistant RedSquare. Comment puis-je vous aider ?",
        },
        'product_search': {
            'keywords': ['produit', 'acheter', 'commander', 'rechercher', 'trouver', 'catalogue', 'article'],
            'description': "Recherche de produits",
        },
        'product_help': {
            'keywords': ['prix', 'stock', 'disponible', 'quantité', 'couleur', 'taille', 'caractéristique'],
            'description': "Informations sur un produit",
        },
        'order_status': {
            'keywords': ['commande', 'réservation', 'historique', 'achat', 'suivi', 'livraison'],
            'description': "Statut des commandes",
        },
        'delivery': {
            'keywords': ['livraison', 'transport', 'expédition', 'frais', 'délai', 'colis'],
            'description': "Questions sur la livraison",
        },
        'payment': {
            'keywords': ['paiement', 'payer', 'orange money', 'mtn', 'visa', 'facture', 'reçu', 'mobile money'],
            'description': "Questions sur le paiement",
        },
        'help': {
            'keywords': ['aide', 'support', 'assistance', 'contact', 'problème', 'pb'],
            'description': "Demande d'aide",
        },
        'about': {
            'keywords': ['redsquare', 'marketplace', 'site', 'entreprise', 'qui êtes-vous'],
            'description': "Informations sur RedSquare",
        },
        'return': {
            'keywords': ['retour', 'échange', 'remboursement', 'satisfait'],
            'description': "Questions sur les retours",
        },
        'account': {
            'keywords': ['compte', 'inscription', 'connexion', 'mot de passe', 'profil', 'identifier'],
            'description': "Questions sur le compte",
        },
    }
    
    # Entités reconnues
    ENTITIES = {
        'product': ['smartphone', 'téléphone', 'écouteur', 'casque', 'chargeur', 'ordinateur', 'pc', 'laptop',
                    'télévision', 'tv', 'robe', 'chemise', 'sac', 'chaussure', 'basket', 'sandale', 'mixeur',
                    'café', 'crème', 'parfum', 'riz', 'huile', 'ballon', 'tapis'],
        'category': ['électronique', 'mode', 'maison', 'beauté', 'chaussure', 'téléphonie', 'alimentation', 'sport'],
        'order_status': ['en attente', 'payée', 'expédiée', 'livrée', 'annulée', 'réservée'],
    }

    @classmethod
    def classify(cls, message: str) -> Tuple[str, Dict]:
        """Classifie le message et extrait les entités"""
        message_lower = message.lower().strip()
        
        # Vérifier chaque intention
        for intent_name, intent_data in cls.INTENTS.items():
            if any(keyword in message_lower for keyword in intent_data['keywords']):
                entities = cls._extract_entities(message_lower)
                return intent_name, entities
        
        # Intention par défaut
        return 'unknown', {}

    @classmethod
    def _extract_entities(cls, message: str) -> Dict:
        """Extrait les entités du message"""
        entities = {}
        
        # Rechercher les produits
        found_products = []
        for product in cls.ENTITIES['product']:
            if product in message:
                found_products.append(product)
        if found_products:
            entities['products'] = found_products
        
        # Rechercher les catégories
        found_categories = []
        for category in cls.ENTITIES['category']:
            if category in message:
                found_categories.append(category)
        if found_categories:
            entities['categories'] = found_categories
        
        # Rechercher les statuts de commande
        found_status = []
        for status in cls.ENTITIES['order_status']:
            if status in message:
                found_status.append(status)
        if found_status:
            entities['order_status'] = found_status
        
        return entities
    
    @classmethod
    def get_intent_response(cls, intent: str, entities: Dict = None) -> str:
        """Retourne une réponse pour une intention donnée"""
        responses = {
            'greeting': "Bonjour ! Je suis l'assistant RedSquare. Je peux vous aider à trouver des produits, suivre vos commandes ou répondre à vos questions.",
            'help': "Je suis là pour vous aider ! Posez-moi vos questions sur nos produits, les commandes, la livraison ou les paiements.",
            'about': "RedSquare est la marketplace multi-vendeurs camerounaise. Nous connectons acheteurs et vendeurs en toute sécurité avec paiement en FCFA.",
            'delivery': "Nous livrons à Douala, Yaoundé et Bafoussam. Les frais de livraison sont de 2 000 FCFA pour une livraison à domicile.",
            'payment': "Nous acceptons Orange Money, MTN Mobile Money et les cartes Visa. Les paiements sont sécurisés.",
            'return': "Vous disposez de 14 jours pour retourner un produit non utilisé dans son emballage d'origine.",
            'account': "Vous pouvez créer un compte gratuitement avec votre numéro de téléphone et un mot de passe.",
            'unknown': "Je n'ai pas bien compris votre question. Pouvez-vous reformuler ?",
        }
        return responses.get(intent, "Je suis désolé, je ne comprends pas votre question. Pourriez-vous la reformuler ?")
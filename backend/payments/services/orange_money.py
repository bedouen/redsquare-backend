import requests
import json
import uuid
from decimal import Decimal
from django.conf import settings

class OrangeMoneyService:
    """Service d'intégration Orange Money Cameroun"""
    
    # Compte de réception
    RECIPIENT_PHONE = "+237690787473"
    
    def __init__(self):
        self.api_url = settings.ORANGE_MONEY_API_URL if hasattr(settings, 'ORANGE_MONEY_API_URL') else "https://api.orange.com/om/v1"
        self.client_id = settings.ORANGE_MONEY_CLIENT_ID if hasattr(settings, 'ORANGE_MONEY_CLIENT_ID') else ""
        self.client_secret = settings.ORANGE_MONEY_CLIENT_SECRET if hasattr(settings, 'ORANGE_MONEY_CLIENT_SECRET') else ""
        self.merchant_key = settings.ORANGE_MONEY_MERCHANT_KEY if hasattr(settings, 'ORANGE_MONEY_MERCHANT_KEY') else ""

    def initiate_payment(self, phone_number, amount, reference):
        """
        Initie un paiement Orange Money
        """
        try:
            # En production, vous utiliseriez l'API Orange Money
            # Voici la structure de la requête
            payload = {
                'merchant_key': self.merchant_key,
                'phone_number': self._format_phone_number(phone_number),
                'amount': str(amount),
                'reference': reference,
                'description': f'Paiement RedSquare - {reference}'
            }
            
            # Simuler l'appel API (pour le développement)
            # En production, remplacer par un appel réel
            # response = requests.post(f"{self.api_url}/payment/initiate", json=payload)
            
            # Simulation d'une transaction réussie
            return {
                'success': True,
                'transaction_id': f"ORANGE-{uuid.uuid4().hex[:12].upper()}",
                'status': 'pending',
                'reference': reference,
                'payment_data': payload
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def verify_payment(self, transaction_id):
        """
        Vérifie le statut d'un paiement Orange Money
        """
        try:
            # En production, vérifier le statut via l'API
            # response = requests.get(f"{self.api_url}/payment/status/{transaction_id}")
            
            # Simulation
            return {
                'success': True,
                'status': 'success',
                'transaction_id': transaction_id
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def _format_phone_number(self, phone):
        """Formate le numéro de téléphone pour Orange Money"""
        phone = phone.replace(' ', '').replace('-', '')
        if not phone.startswith('+'):
            if phone.startswith('6'):
                phone = f"+237{phone}"
            elif phone.startswith('0'):
                phone = f"+237{phone[1:]}"
        return phone


class MTNMoneyService:
    """Service d'intégration MTN Mobile Money Cameroun"""
    
    # Compte de réception
    RECIPIENT_PHONE = "+237674422407"
    
    def __init__(self):
        self.api_url = settings.MTN_MONEY_API_URL if hasattr(settings, 'MTN_MONEY_API_URL') else "https://api.mtn.com/momo/v1"
        self.api_key = settings.MTN_MONEY_API_KEY if hasattr(settings, 'MTN_MONEY_API_KEY') else ""
        self.subscription_key = settings.MTN_MONEY_SUBSCRIPTION_KEY if hasattr(settings, 'MTN_MONEY_SUBSCRIPTION_KEY') else ""
        self.merchant_key = settings.MTN_MONEY_MERCHANT_KEY if hasattr(settings, 'MTN_MONEY_MERCHANT_KEY') else ""

    def initiate_payment(self, phone_number, amount, reference):
        """
        Initie un paiement MTN Mobile Money
        """
        try:
            payload = {
                'merchant_key': self.merchant_key,
                'phone_number': self._format_phone_number(phone_number),
                'amount': str(amount),
                'reference': reference,
                'description': f'Paiement RedSquare - {reference}'
            }
            
            # Simulation (remplacer par appel API réel en production)
            return {
                'success': True,
                'transaction_id': f"MTN-{uuid.uuid4().hex[:12].upper()}",
                'status': 'pending',
                'reference': reference,
                'payment_data': payload
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def verify_payment(self, transaction_id):
        """Vérifie le statut d'un paiement MTN Money"""
        try:
            # Simulation
            return {
                'success': True,
                'status': 'success',
                'transaction_id': transaction_id
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def _format_phone_number(self, phone):
        """Formate le numéro de téléphone pour MTN Money"""
        phone = phone.replace(' ', '').replace('-', '')
        if not phone.startswith('+'):
            if phone.startswith('6'):
                phone = f"+237{phone}"
            elif phone.startswith('0'):
                phone = f"+237{phone[1:]}"
        return phone


class VisaService:
    """Service d'intégration Visa (via Stripe ou autre)"""
    
    def __init__(self):
        self.api_url = settings.VISA_API_URL if hasattr(settings, 'VISA_API_URL') else "https://api.stripe.com/v1"
        self.api_key = settings.VISA_API_KEY if hasattr(settings, 'VISA_API_KEY') else ""
        self.merchant_key = settings.VISA_MERCHANT_KEY if hasattr(settings, 'VISA_MERCHANT_KEY') else ""
        # Compte bancaire de réception
        self.bank_account = "148068957458"

    def initiate_payment(self, card_data, amount, reference):
        """
        Initie un paiement par carte Visa
        card_data: {
            'card_number': '4111111111111111',
            'card_holder': 'Jean Dupont',
            'expiry': '12/2025',
            'cvv': '123'
        }
        """
        try:
            # En production, utiliser Stripe ou un autre service
            # import stripe
            # stripe.api_key = self.api_key
            # charge = stripe.Charge.create(
            #     amount=int(amount * 100),
            #     currency='xaf',
            #     source='tok_visa',
            #     description=f'Paiement RedSquare - {reference}',
            #     metadata={'order_ref': reference}
            # )
            
            # Simulation
            return {
                'success': True,
                'transaction_id': f"VISA-{uuid.uuid4().hex[:12].upper()}",
                'status': 'success',
                'reference': reference,
                'payment_data': card_data
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def verify_payment(self, transaction_id):
        """Vérifie le statut d'un paiement Visa"""
        try:
            # Simulation
            return {
                'success': True,
                'status': 'success',
                'transaction_id': transaction_id
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
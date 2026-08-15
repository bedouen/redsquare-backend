from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PaymentMethodViewSet,
    PaymentTransactionViewSet,
    PaymentInitiateView,
    PaymentVerifyView,
    PaymentHistoryView
)

router = DefaultRouter()
router.register('methods', PaymentMethodViewSet, basename='payment-methods')
router.register('transactions', PaymentTransactionViewSet, basename='payment-transactions')

urlpatterns = [
    path('', include(router.urls)),
    path('initiate/', PaymentInitiateView.as_view(), name='payment-initiate'),
    path('verify/', PaymentVerifyView.as_view(), name='payment-verify'),
    path('history/', PaymentHistoryView.as_view(), name='payment-history'),
]
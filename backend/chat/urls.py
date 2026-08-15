# chat/urls.py
from django.urls import path
from .views import ChatView, ChatHistoryView, ChatSuggestionsView

urlpatterns = [
    path('', ChatView.as_view(), name='chat'),
    path('history/<str:session_id>/', ChatHistoryView.as_view(), name='chat-history'),
    path('suggestions/', ChatSuggestionsView.as_view(), name='chat-suggestions'),
]
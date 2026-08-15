# chat/serializers.py
from rest_framework import serializers
from .models import ChatSession, ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'session', 'message_type', 'content',
            'intent', 'entities', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.IntegerField(source='messages.count', read_only=True)

    class Meta:
        model = ChatSession
        fields = [
            'id', 'session_id', 'user', 'is_active',
            'created_at', 'updated_at', 'messages', 'message_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
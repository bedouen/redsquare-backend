# chat/models.py
import uuid
from django.db import models
from django.conf import settings


class ChatSession(models.Model):
    """Session de chat avec l'assistant IA"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='chat_sessions'
    )
    session_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "chat_sessions"
        ordering = ["-created_at"]
        verbose_name = "Session de chat"
        verbose_name_plural = "Sessions de chat"

    def __str__(self):
        return f"Session {self.session_id[:8]} - {self.created_at.strftime('%d/%m/%Y %H:%M')}"


class ChatMessage(models.Model):
    """Message de chat"""
    class MessageType(models.TextChoices):
        USER = "user", "Utilisateur"
        ASSISTANT = "assistant", "Assistant"
        SYSTEM = "system", "Système"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        ChatSession, 
        on_delete=models.CASCADE, 
        related_name="messages"
    )
    message_type = models.CharField(
        max_length=20, 
        choices=MessageType.choices, 
        default=MessageType.USER
    )
    content = models.TextField()
    intent = models.CharField(max_length=100, blank=True, null=True)
    entities = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_messages"
        ordering = ["created_at"]
        verbose_name = "Message de chat"
        verbose_name_plural = "Messages de chat"

    def __str__(self):
        return f"{self.message_type}: {self.content[:50]}"
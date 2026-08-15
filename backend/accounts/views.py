import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OTPCode
from .permissions import IsSuperAdmin
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    AdminCreateUserSerializer, RequestOTPSerializer, VerifyOTPSerializer,
)

User = get_user_model()


def tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


class RegisterView(generics.CreateAPIView):
    """Inscription publique : crée toujours un rôle Client."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"user": UserSerializer(user).data, **tokens_for_user(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    Connexion : le téléphone est prioritaire.
    Si aucun utilisateur ne correspond au téléphone, on tente l'email.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data["identifier"]
        password = serializer.validated_data["password"]

        user = User.objects.filter(phone_number=identifier).first()
        if user is None:
            user = User.objects.filter(email=identifier).first()

        if user is None or not user.check_password(password) or not user.is_active:
            return Response({"detail": "Identifiants invalides."}, status=status.HTTP_401_UNAUTHORIZED)

        return Response({"user": UserSerializer(user).data, **tokens_for_user(user)})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class RequestOTPView(APIView):
    """Demande de code OTP : SMS en priorité, email en secours."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data["identifier"]
        channel = serializer.validated_data["channel"]

        user = User.objects.filter(phone_number=identifier).first() or User.objects.filter(email=identifier).first()
        if user is None:
            # On ne révèle pas si l'utilisateur existe ou non (sécurité)
            return Response({"detail": "Si ce compte existe, un code a été envoyé."})

        code = f"{random.randint(0, 999999):06d}"
        OTPCode.objects.create(
            user=user, code=code, channel=channel,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        if channel == "sms" and user.phone_number:
            # TODO: brancher un vrai fournisseur SMS (Twilio, Orange, etc.)
            print(f"[SMS SIMULÉ] Code OTP pour {user.phone_number}: {code}")
        else:
            if user.email:
                send_mail(
                    "Votre code de réinitialisation RedSquare",
                    f"Votre code est : {code}",
                    "no-reply@redsquare.local",
                    [user.email],
                    fail_silently=True,
                )

        return Response({"detail": "Si ce compte existe, un code a été envoyé."})


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data["identifier"]
        code = serializer.validated_data["code"]
        new_password = serializer.validated_data["new_password"]

        user = User.objects.filter(phone_number=identifier).first() or User.objects.filter(email=identifier).first()
        if user is None:
            return Response({"detail": "Code invalide."}, status=status.HTTP_400_BAD_REQUEST)

        otp = OTPCode.objects.filter(
            user=user, code=code, is_used=False, expires_at__gte=timezone.now()
        ).order_by("-created_at").first()

        if otp is None:
            return Response({"detail": "Code invalide ou expiré."}, status=status.HTTP_400_BAD_REQUEST)

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response({"detail": "Mot de passe réinitialisé avec succès."})


class UserManagementViewSet(viewsets.ModelViewSet):
    """CRUD utilisateurs + attribution des rôles — réservé au Super-Admin."""
    queryset = User.objects.all().order_by("-created_at")
    permission_classes = [IsSuperAdmin]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return AdminCreateUserSerializer
        return UserSerializer
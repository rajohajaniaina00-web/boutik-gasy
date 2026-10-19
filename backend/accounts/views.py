from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, ProfileSerializer

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                "message": "Compte créé avec succès.",
                "token": token.key,
                "user": ProfileSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        identifier = str(request.data.get("username", "")).strip()
        password = request.data.get("password", "")

        if not identifier or not isinstance(password, str) or not password:
            return Response(
                {"detail": "Identifiant et mot de passe obligatoires."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        username = identifier

        if "@" in identifier:
            user = User.objects.filter(
                email__iexact=identifier
            ).first()
            if user is None:
                return Response(
                    {"detail": "Identifiants incorrects."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            username = user.get_username()

        user = authenticate(
            request=request,
            username=username,
            password=password,
        )

        if user is None:
            return Response(
                {"detail": "Identifiants incorrects."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "message": "Connexion réussie.",
                "token": token.key,
                "user": ProfileSerializer(user).data,
            }
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.auth:
            request.auth.delete()
        return Response({"message": "Déconnexion réussie."})


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ProfileSerializer(request.user).data)

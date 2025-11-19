from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Identifiants invalides.")

        if not user.check_password(password):
            raise serializers.ValidationError("Identifiants invalides.")

        if not user.is_active:
            raise serializers.ValidationError("Compte désactivé.")

        if getattr(user, "role", None) == "recruiter" and not getattr(user, "is_validated", True):
            raise serializers.ValidationError("Votre compte doit être validé par un administrateur.")

        data['user'] = user
        return data

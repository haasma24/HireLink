#users/serializers.
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, Entreprise
from django.contrib.auth import get_user_model


User = get_user_model()  


class EntrepriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entreprise
        fields = ['name', 'address', 'website']

class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    entreprise = EntrepriseSerializer(required=False)

    class Meta:
        model = CustomUser
        fields = (
            'username', 'email', 'password', 'password2',
            'role', 'full_name', 'phone', 'date_of_birth', 'profile_picture', 'entreprise'
        )

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        if CustomUser.objects.filter(email=attrs.get('email')).exists():
            raise serializers.ValidationError({"email": "Cet e-mail est déjà enregistré."})
        if attrs['role'] == 'recruiter' and not attrs.get('entreprise'):
            raise serializers.ValidationError({"entreprise": "Les informations sur l'entreprise sont requises pour les recruteurs."})
        return attrs

    def create(self, validated_data):
        entreprise_data = validated_data.pop('entreprise', None)
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        if entreprise_data and user.role == 'recruiter':
            Entreprise.objects.create(recruiter=user, **entreprise_data)
            user.is_validated = False  # must be validated by admin
            user.save()
        else:
            user.is_validated = True  # candidate and admin directly validated
            user.save()
        return user

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


class UserSerializer(serializers.ModelSerializer):
    entreprise = EntrepriseSerializer(read_only=True)
    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'role', 'full_name', 'phone',
            'date_of_birth', 'profile_picture', 'entreprise', 'is_validated'
        )
        read_only_fields = ('id', 'username', 'email', 'role')

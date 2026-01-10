# Hirelink_backend/users/serializers/registration_serializer.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from users.models import CustomUser, Entreprise
from users.serializers.entreprise_serializer import EntrepriseSerializer

class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    entreprise = EntrepriseSerializer(required=False)

    class Meta:
        model = CustomUser
        fields = (
            'username', 'email', 'password', 'password2', 'role', 'full_name',
            'phone', 'date_of_birth', 'profile_picture', 'entreprise'
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
            user.is_validated = False
            user.save()
        else:
            user.is_validated = True
            user.save()
        return user

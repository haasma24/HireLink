from rest_framework import serializers
from users.models import CustomUser
from users.serializers.entreprise_serializer import EntrepriseSerializer

class UserSerializer(serializers.ModelSerializer):
    entreprise = EntrepriseSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'role', 'full_name', 'phone',
            'date_of_birth', 'profile_picture', 'entreprise', 'is_validated'
        )
        read_only_fields = ('id', 'username', 'email', 'role')

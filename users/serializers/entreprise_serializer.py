from rest_framework import serializers
from users.models import Entreprise

class EntrepriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entreprise
        fields = ['name', 'address', 'website']

from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate

class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'password2', 
                  'role', 'full_name', 'phone', 'date_of_birth', 'profile_picture')
        extra_kwargs = {
            'email': {'required': True},
            'full_name': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        if CustomUser.objects.filter(email=attrs.get('email')).exists():
            raise serializers.ValidationError({"email": "This email is already registered."})
            
        return attrs

    def create(self, validated_data):
        password2 = validated_data.pop('password2')
        profile_picture = validated_data.pop('profile_picture', None)
        
        user = CustomUser.objects.create_user(
            **validated_data
        )
        
        if profile_picture:
            user.profile_picture = profile_picture
            user.save()
            
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role', 'full_name', 
                  'phone', 'date_of_birth', 'profile_picture')
        read_only_fields = ('id', 'username')

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError("User account is disabled.")
            else:
                raise serializers.ValidationError("Unable to log in with provided credentials.")
        else:
            raise serializers.ValidationError("Must include 'username' and 'password'.")

        return data
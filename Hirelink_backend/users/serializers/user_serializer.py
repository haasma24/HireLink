# Hirelink_backend/users/serializers/user_serializer.py
from rest_framework import serializers
from users.models import CustomUser
from users.serializers.entreprise_serializer import EntrepriseSerializer

# UPDATE THIS SERIALIZER:
# users/serializers.py - Fix the Meta class fields
class UserSerializer(serializers.ModelSerializer):
    entreprise = EntrepriseSerializer(read_only=True)
    resume_url = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    skills_list = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'role', 'full_name', 'phone',
            'date_of_birth', 'profile_picture', 'profile_picture_url',
            'resume', 'resume_url', 'headline', 'location', 'website',
            'bio', 'skills', 'skills_list', 'github_url', 'linkedin_url',
            'twitter_url', 'entreprise', 'is_validated'
        )
        read_only_fields = ('id', 'username', 'email', 'role')
    
    # users/serializers.py - Update get_resume_url method
    def get_resume_url(self, obj):
     print(f"DEBUG get_resume_url called for user: {obj.username}")
     print(f"DEBUG obj.resume: {obj.resume}")
     print(f"DEBUG obj.resume.name: {obj.resume.name if obj.resume else 'No resume'}")
    
     if obj.resume and hasattr(obj.resume, 'url'):
        try:
            print(f"DEBUG resume exists, getting URL...")
            request = self.context.get('request')
            if request:
                url = request.build_absolute_uri(obj.resume.url)
                print(f"DEBUG Absolute URL: {url}")
                return url
            else:
                url = obj.resume.url
                print(f"DEBUG Relative URL: {url}")
                return url
        except Exception as e:
            print(f"DEBUG Error getting resume URL: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
     else:
        print(f"DEBUG No resume or no url attribute")
        return None
    
    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None
    
    def get_skills_list(self, obj):
        return obj.get_skills_list()

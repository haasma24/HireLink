# users/views/profile_views.py - ADD THIS TO YOUR EXISTING FILE
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from users.models import CustomUser
from users.serializers import UserSerializer

# users/views/profile_views.py - Update UserDetailView
class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # Debug: Print what's being returned
        print(f"DEBUG - User: {instance.username}")
        print(f"DEBUG - Resume field: {instance.resume}")
        print(f"DEBUG - Resume URL: {instance.resume.url if instance.resume else 'No resume'}")
        print(f"DEBUG - Serialized data: {serializer.data}")
        
        return Response(serializer.data)

# ADD THESE NEW VIEWS:
class UploadResumeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        user = request.user
        
        if 'resume' not in request.FILES:
            return Response(
                {'error': 'No resume file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check file type
        resume_file = request.FILES['resume']
        allowed_types = ['application/pdf', 'application/msword', 
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        
        if resume_file.content_type not in allowed_types:
            return Response(
                {'error': 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check file size (max 5MB)
        if resume_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'File too large. Maximum size is 5MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save the resume
        user.resume = resume_file
        user.save()
        
        serializer = UserSerializer(user, context={'request': request})
        return Response({
            'message': 'Resume uploaded successfully',
            'resume_url': serializer.data.get('resume_url'),
            'user': serializer.data
        }, status=status.HTTP_200_OK)

class UpdateProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request):
        user = request.user
        data = request.data
        
        # Update allowed fields
        allowed_fields = [
            'full_name', 'phone', 'date_of_birth', 'headline',
            'location', 'website', 'bio', 'skills', 'github_url',
            'linkedin_url', 'twitter_url'
        ]
        
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])
        
        user.save()
        
        serializer = UserSerializer(user, context={'request': request})
        return Response({
            'message': 'Profile updated successfully',
            'user': serializer.data
        }, status=status.HTTP_200_OK)
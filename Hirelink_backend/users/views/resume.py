# Create a view to verify file storage
from django.http import FileResponse, Http404
from django.conf import settings
import os

def serve_resume(request, user_id, filename):
    resume_path = os.path.join(settings.MEDIA_ROOT, 'resumes', f'user_{user_id}', filename)
    
    if os.path.exists(resume_path):
        return FileResponse(open(resume_path, 'rb'), content_type='application/pdf')
    raise Http404("Resume not found")
"""
Django API Views for Resume ATS Builder with File Upload
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
import json
import os
from django.conf import settings

# Import our services
from services.resume_analyser import ResumeATSBuilder
from services.file_processor import ResumeFileProcessor

class ResumeATSAnalyzeView(APIView):
    """
    API endpoint for analyzing resumes with ATS Builder
    Supports both text input and file upload
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [AllowAny]  # Change to IsAuthenticated if needed
    
    def __init__(self):
        super().__init__()
        # Initialize ATS Builder
        try:
            self.ats_builder = ResumeATSBuilder()
            self.service_ready = True
        except Exception as e:
            self.service_ready = False
            self.error_message = f"Failed to initialize ATS Builder: {str(e)}"
    
    def post(self, request):
        """
        Analyze a resume - supports multiple input formats:
        1. File upload (PDF, DOCX, TXT)
        2. JSON with 'text' field
        3. Form data with 'resume_text' field
        """
        # Check if service is ready
        if not self.service_ready:
            return Response({
                'success': False,
                'error': self.error_message
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        try:
            # Case 1: File upload
            if 'resume_file' in request.FILES:
                return self._handle_file_upload(request)
            
            # Case 2: Text input (JSON or form data)
            return self._handle_text_input(request)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Server error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _handle_file_upload(self, request):
        """Handle resume file upload"""
        resume_file = request.FILES['resume_file']
        filename = resume_file.name
        
        print(f"📁 Processing uploaded file: {filename}")
        
        # Validate file
        is_valid, error_msg = ResumeFileProcessor.validate_file(resume_file, filename)
        if not is_valid:
            return Response({
                'success': False,
                'error': error_msg
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract text from file
        resume_text, file_metadata = ResumeFileProcessor.extract_text_from_file(resume_file, filename)
        
        if not file_metadata['success']:
            return Response({
                'success': False,
                'error': f"Failed to extract text from file: {file_metadata.get('error', 'Unknown error')}",
                'file_metadata': file_metadata
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate extracted text
        if len(resume_text.strip()) < 50:
            return Response({
                'success': False,
                'error': 'Extracted text is too short (minimum 50 characters). The file might be empty or unreadable.',
                'file_metadata': file_metadata
            }, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"✅ Extracted {file_metadata['word_count']} words from {filename}")
        
        # Analyze the resume
        analysis_result = self.ats_builder.analyze_resume(resume_text)
        
        if analysis_result['success']:
            # Add file metadata to response
            analysis_result['file_metadata'] = file_metadata
            
            return Response(analysis_result, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': analysis_result.get('error', 'Analysis failed'),
                'file_metadata': file_metadata
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _handle_text_input(self, request):
        """Handle text input (JSON or form data)"""
        # Get resume text from request
        resume_text = self._extract_text_from_request(request)
        
        if not resume_text:
            return Response({
                'success': False,
                'error': 'No resume text provided. Send text in JSON, form data, or upload a file.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate text length
        if len(resume_text.strip()) < 50:
            return Response({
                'success': False,
                'error': 'Resume text is too short (minimum 50 characters)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Analyze resume
        analysis_result = self.ats_builder.analyze_resume(resume_text)
        
        if analysis_result['success']:
            return Response(analysis_result, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': analysis_result.get('error', 'Analysis failed')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _extract_text_from_request(self, request):
        """Extract resume text from request (JSON or form data)"""
        # Check for JSON data
        if request.content_type == 'application/json':
            data = request.data
            return data.get('text', '') or data.get('resume_text', '')
        
        # Check for form data
        return request.data.get('text', '') or request.data.get('resume_text', '')
    
    def get(self, request):
        """
        Get service status and example
        """
        if not self.service_ready:
            return Response({
                'success': False,
                'error': self.error_message
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Provide sample analysis if requested
        if request.GET.get('sample') == 'true':
            sample_resume = self._get_sample_resume()
            analysis_result = self.ats_builder.analyze_resume(sample_resume)
            
            return Response({
                'success': True,
                'message': 'Resume ATS Builder is running - Sample Analysis',
                'sample_analysis': analysis_result
            })
        
        return Response({
            'success': True,
            'message': 'Resume ATS Builder API is running',
            'endpoints': {
                'POST /api/ats-analyze/': 'Analyze a resume (text or file upload)',
                'GET /api/ats-analyze/?sample=true': 'Get sample analysis'
            },
            'supported_file_formats': ['PDF', 'DOCX', 'DOC', 'TXT'],
            'max_file_size': '5MB',
            'service_info': {
                'name': 'HireLink Resume ATS Builder',
                'version': '2.0',
                'features': [
                    'Resume Quality Scoring (1-5 scale)',
                    'ATS Compatibility Check',
                    'File Upload Support (PDF, DOCX, TXT)',
                    'Detailed Feedback & Suggestions',
                    'Section-by-Section Analysis',
                    'Actionable Improvement Advice'
                ]
            }
        })
    
    
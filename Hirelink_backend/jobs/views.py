from rest_framework.permissions import AllowAny
from django.db.models import Q, Count
from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from .models import Job, JobApplication, SavedJob
from .serializers import (
    JobSerializer, JobCreateUpdateSerializer,
    JobApplicationSerializer, JobApplicationCreateSerializer,
    SavedJobSerializer, JobSearchSerializer
)
from users.models import CustomUser
from jobs.ai_matching import ai_matcher
from users.models import CustomUser
import time

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class JobListView(generics.ListAPIView):
    """View for listing all active jobs (temporarily public)"""
    serializer_class = JobSerializer
    permission_classes = [AllowAny]  # Temporary: Allow anyone to view
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['job_type', 'experience_level', 'company', 'location']
    search_fields = ['title', 'description', 'company', 'required_skills', 'preferred_skills']
    ordering_fields = ['created_at', 'salary_min', 'salary_max']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Job.objects.filter(is_active=True).select_related('posted_by')
       
        
        # If user is a recruiter, also show their own inactive jobs
        #if self.request.user.role == 'recruiter':
        #    queryset = queryset.filter(
         #       Q(is_active=True) | Q(posted_by=self.request.user)
          #  )
        
        return queryset

class JobSearchView(APIView):
    """Advanced job search with multiple filters"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = JobSearchSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            # Start with all active jobs
            queryset = Job.objects.filter(is_active=True).select_related('posted_by')
            
            # Keyword search (search in multiple fields)
            if data.get('keyword'):
                keyword = data['keyword']
                queryset = queryset.filter(
                    Q(title__icontains=keyword) |
                    Q(description__icontains=keyword) |
                    Q(company__icontains=keyword) |
                    Q(required_skills__icontains=keyword) |
                    Q(preferred_skills__icontains=keyword)
                )
            
            # Location filter
            if data.get('location'):
                queryset = queryset.filter(location__icontains=data['location'])
            
            # Job type filter
            if data.get('job_type'):
                queryset = queryset.filter(job_type__in=data['job_type'])
            
            # Experience level filter
            if data.get('experience_level'):
                queryset = queryset.filter(experience_level__in=data['experience_level'])
            
            # Salary range filter
            if data.get('salary_min'):
                queryset = queryset.filter(salary_min__gte=data['salary_min'])
            if data.get('salary_max'):
                queryset = queryset.filter(salary_max__lte=data['salary_max'])
            
            # Company filter
            if data.get('company'):
                queryset = queryset.filter(company__icontains=data['company'])
            
            # Sorting
            sort_by = data.get('sort_by', '-created_at')
            queryset = queryset.order_by(sort_by)
            
            # Pagination
            page = data.get('page', 1)
            page_size = data.get('page_size', 10)
            paginator = PageNumberPagination()
            paginator.page_size = page_size
            
            result_page = paginator.paginate_queryset(queryset, request)
            serializer = JobSerializer(result_page, many=True, context={'request': request})
            
            return paginator.get_paginated_response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class JobDetailView(generics.RetrieveAPIView):
    """View for retrieving a single job"""
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Allow users to see their own inactive jobs
        user = self.request.user
        if hasattr(user, 'role') and user.role == 'recruiter':
            return Job.objects.filter(
                Q(is_active=True) | Q(posted_by=user)
            ).select_related('posted_by')
        return Job.objects.filter(is_active=True).select_related('posted_by')

    queryset = Job.objects.filter(is_active=True)
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

class JobCreateView(generics.CreateAPIView):
    """View for recruiters to create new jobs"""
    serializer_class = JobCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        # Automatically set the posted_by field to the current user
        serializer.save(posted_by=self.request.user)

class JobUpdateView(generics.UpdateAPIView):
    """View for recruiters to update their jobs"""
    serializer_class = JobCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Job.objects.filter(posted_by=self.request.user)


class JobDeleteView(generics.DestroyAPIView):
    """View for recruiters to delete their jobs"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Job.objects.filter(posted_by=self.request.user)
    
    def perform_destroy(self, instance):
        # Actually delete the job from database
        instance.delete()
    
    def delete(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            job_title = instance.title
            self.perform_destroy(instance)
            return Response(
                {"detail": f"Job '{job_title}' deleted successfully."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class RecruiterJobListView(generics.ListAPIView):
    """View for recruiters to see all jobs they've posted"""
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """return Job.objects.filter(
            posted_by=self.request.user
        ).order_by('-created_at')"""
        qs = Job.objects.filter(posted_by=self.request.user)
        return qs.order_by('-created_at')

class JobApplicationCreateView(generics.CreateAPIView):
    """View for candidates to apply for jobs"""
    serializer_class = JobApplicationCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(applicant=self.request.user)

class JobApplicationsListView(generics.ListAPIView):
    """View for recruiters to see applications for their jobs"""
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        job_id = self.kwargs.get('job_id')
        
        if job_id:
            return JobApplication.objects.filter(
                job__id=job_id,
                job__posted_by=self.request.user
            ).select_related('job', 'applicant').order_by('-applied_at')
        else:
            # Return all applications for recruiter's jobs
            return JobApplication.objects.filter(
                job__posted_by=self.request.user
            ).select_related('job', 'applicant').order_by('-applied_at')

class CandidateApplicationsListView(generics.ListAPIView):
    """View for candidates to see their own applications"""
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return JobApplication.objects.filter(
            applicant=self.request.user
        ).select_related('job').order_by('-applied_at')

class SaveJobView(APIView):
    """View for candidates to save/unsave jobs"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id, is_active=True)
        except Job.DoesNotExist:
            return Response(
                {"detail": "Job not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if job is already saved
        saved_job = SavedJob.objects.filter(job=job, user=request.user).first()
        
        if saved_job:
            # Unsave the job
            saved_job.delete()
            return Response({"detail": "Job unsaved."}, status=status.HTTP_200_OK)
        else:
            # Save the job
            SavedJob.objects.create(job=job, user=request.user)
            return Response({"detail": "Job saved."}, status=status.HTTP_201_CREATED)

class SavedJobsListView(generics.ListAPIView):
    """View for candidates to see their saved jobs"""
    serializer_class = SavedJobSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return SavedJob.objects.filter(
            user=self.request.user
        ).select_related('job').order_by('-saved_at')

class RecruiterDashboardStatsView(APIView):
    """View for recruiter dashboard statistics"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Check if user is recruiter
        if not hasattr(request.user, 'role') or request.user.role != 'recruiter':
            return Response(
                {"detail": "Only recruiters can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        jobs = Job.objects.filter(posted_by=request.user)
        
        total_jobs = jobs.count()
        active_jobs = jobs.filter(is_active=True).count()
        total_applications = JobApplication.objects.filter(
            job__posted_by=request.user
        ).count()
        
        recent_jobs = jobs.order_by('-created_at')[:5]
        recent_jobs_data = JobSerializer(recent_jobs, many=True, context={'request': request}).data
        
        applications_by_status = JobApplication.objects.filter(
            job__posted_by=request.user
        ).values('status').annotate(count=Count('id'))
        
        return Response({
            'stats': {
                'total_jobs': total_jobs,
                'active_jobs': active_jobs,
                'total_applications': total_applications,
            },
            'applications_by_status': list(applications_by_status),
            'recent_jobs': recent_jobs_data
        })

class JobToggleActiveView(APIView):
    """View to toggle job active status"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            job = Job.objects.get(pk=pk, posted_by=request.user)
        except Job.DoesNotExist:
            return Response(
                {"detail": "Job not found or you don't have permission."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        job.is_active = not job.is_active
        job.save()
        
        return Response({
            'detail': f"Job {'activated' if job.is_active else 'deactivated'} successfully.",
            'is_active': job.is_active
        })


# AI CLASSES

class AIRecommendationsView(APIView):
    """
    Get AI-recommended jobs for authenticated candidate
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Check if user is a candidate
        if request.user.role != 'candidate':
            return Response(
                {"error": "Only candidates can access AI recommendations"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if model is trained
        if not ai_matcher.is_trained:
            # Try to load saved model
            if not ai_matcher.load_model():
                return Response(
                    {
                        "error": "AI model not trained yet",
                        "message": "Please ask an admin to train the AI model first"
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
        
        # Get number of recommendations (default: 10, max: 50)
        try:
            n_recommendations = min(int(request.GET.get('limit', 10)), 50)
        except:
            n_recommendations = 10
        
        # Get recommendations
        try:
            start_time = time.time()
            recommendations = ai_matcher.get_recommendations_for_candidate(
                request.user, 
                n_recommendations
            )
            processing_time = time.time() - start_time
            
            # Get full job details for each recommendation
            job_ids = [rec['job_id'] for rec in recommendations]
            jobs = Job.objects.filter(id__in=job_ids, is_active=True)
            
            # Create a mapping for quick lookup
            job_dict = {job.id: job for job in jobs}
            
            # Build response
            response_data = []
            for rec in recommendations:
                if rec['job_id'] in job_dict:
                    job = job_dict[rec['job_id']]
                    job_serializer = JobSerializer(job, context={'request': request})
                    
                    response_data.append({
                        **job_serializer.data,
                        'ai_match_score': rec['match_score'],
                        'skill_match_percentage': rec['skill_match_percentage'],
                        'matching_skills': rec['matching_skills'],
                        'rank': rec['rank']
                    })
            
            return Response({
                'count': len(response_data),
                'processing_time': f"{processing_time:.3f}s",
                'recommendations': response_data
            })
            
        except Exception as e:
            print(f"Error getting AI recommendations: {e}")
            return Response(
                {"error": "Failed to get AI recommendations", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TrainAIModelView(APIView):
    """
    Train AI model on current database (admin/recruiter only)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Only allow admin or recruiter
        if request.user.role not in ['recruiter', 'admin']:
            return Response(
                {"error": "Only recruiters or admins can train the AI model"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Get active jobs
            jobs = Job.objects.filter(is_active=True)
            
            if not jobs.exists():
                return Response(
                    {"error": "No active jobs found in database"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Prepare and train
            jobs_df = ai_matcher.prepare_job_features(jobs)
            success = ai_matcher.train_model(jobs_df)
            
            if success:
                # Save model
                ai_matcher.save_model()
                
                return Response({
                    "success": True,
                    "message": f"AI model trained successfully on {len(jobs_df)} jobs",
                    "stats": {
                        "jobs_trained": len(jobs_df),
                        "unique_skills": ai_matcher.n_skills,
                        "model_saved": True
                    }
                })
            else:
                return Response(
                    {"error": "Model training failed"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            print(f"Error training AI model: {e}")
            return Response(
                {"error": "Failed to train AI model", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AIModelStatusView(APIView):
    """
    Check AI model status
    """
    permission_classes = [permissions.AllowAny]  # Allow checking without auth
    
    def get(self, request):
        status = {
            'is_trained': ai_matcher.is_trained,
            'jobs_in_model': len(ai_matcher.job_ids) if ai_matcher.job_ids is not None else 0,
            'skills_in_model': ai_matcher.n_skills,
            'model_loaded': False
        }
        
        # Try to load saved model if not trained
        if not ai_matcher.is_trained:
            status['model_loaded'] = ai_matcher.load_model()
            if status['model_loaded']:
                status['is_trained'] = True
                status['jobs_in_model'] = len(ai_matcher.job_ids)
                status['skills_in_model'] = ai_matcher.n_skills
        
        return Response(status)

class TestAIRecommendationView(APIView):
    """
    Test AI recommendations for any candidate (admin/recruiter only)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, candidate_id=None):
        # Only allow admin or recruiter
        if request.user.role not in ['recruiter', 'admin']:
            return Response(
                {"error": "Only recruiters or admins can test AI recommendations"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if model is trained
        if not ai_matcher.is_trained and not ai_matcher.load_model():
            return Response(
                {"error": "AI model not trained yet"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Get candidate (use provided ID or first candidate with skills)
        if candidate_id:
            try:
                candidate = CustomUser.objects.get(id=candidate_id, role='candidate')
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "Candidate not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Get first candidate with skills
            candidate = CustomUser.objects.filter(
                role='candidate', 
                skills__isnull=False
            ).exclude(skills='').first()
            
            if not candidate:
                return Response(
                    {"error": "No candidates with skills found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Get recommendations
        n_recommendations = min(int(request.GET.get('limit', 5)), 20)
        
        try:
            recommendations = ai_matcher.get_recommendations_for_candidate(
                candidate, 
                n_recommendations
            )
            
            # Get candidate info
            candidate_info = {
                'id': candidate.id,
                'full_name': candidate.full_name,
                'skills': candidate.skills,
                'location': candidate.location,
                'experience_level': getattr(candidate, 'experience_level', 'Not specified')
            }
            
            # Get job details for top recommendations
            top_recommendations = []
            for rec in recommendations[:5]:  # Show top 5
                try:
                    job = Job.objects.get(id=rec['job_id'])
                    top_recommendations.append({
                        'job': {
                            'id': job.id,
                            'title': job.title,
                            'company': job.company,
                            'location': job.location,
                            'experience_level': job.experience_level,
                            'required_skills': job.required_skills
                        },
                        'ai_match_score': rec['match_score'],
                        'skill_match_percentage': rec['skill_match_percentage'],
                        'matching_skills': rec['matching_skills']
                    })
                except Job.DoesNotExist:
                    continue
            
            return Response({
                'candidate': candidate_info,
                'total_recommendations': len(recommendations),
                'top_recommendations': top_recommendations,
                'all_recommendations': recommendations  # Full AI data
            })
            
        except Exception as e:
            print(f"Error testing AI recommendations: {e}")
            return Response(
                {"error": "Failed to get recommendations", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
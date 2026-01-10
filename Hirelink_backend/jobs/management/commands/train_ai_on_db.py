# jobs/management/commands/train_ai_on_db.py

from django.core.management.base import BaseCommand
from jobs.models import Job
from jobs.ai_matching import ai_matcher
import time

class Command(BaseCommand):
    help = 'Train AI model on current database jobs'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--save',
            action='store_true',
            help='Save the trained model to file'
        )
    
    def handle(self, *args, **options):
        self.stdout.write("🚀 Starting AI model training on database...")
        
        # Get active jobs from database
        jobs = Job.objects.filter(is_active=True)
        
        if not jobs.exists():
            self.stdout.write(self.style.ERROR("❌ No active jobs found in database!"))
            return
        
        self.stdout.write(f"📊 Found {jobs.count()} active jobs")
        
        # Prepare job features
        start_time = time.time()
        jobs_df = ai_matcher.prepare_job_features(jobs)
        prep_time = time.time() - start_time
        
        self.stdout.write(f"⏱️  Data preparation: {prep_time:.2f} seconds")
        
        # Train model
        train_start = time.time()
        success = ai_matcher.train_model(jobs_df)
        train_time = time.time() - train_start
        
        if success:
            self.stdout.write(self.style.SUCCESS(f"✅ Model trained in {train_time:.2f} seconds"))
            
            # Save model if requested
            if options['save']:
                ai_matcher.save_model()
                self.stdout.write(self.style.SUCCESS("💾 Model saved to ai_model/job_matcher.joblib"))
            
            # Test with a sample candidate if available
            from users.models import CustomUser
            candidates = CustomUser.objects.filter(role='candidate', skills__isnull=False).exclude(skills='')
            
            if candidates.exists():
                test_candidate = candidates.first()
                self.stdout.write(f"\n🧪 Testing with candidate: {test_candidate.full_name}")
                self.stdout.write(f"   Skills: {test_candidate.skills}")
                
                recommendations = ai_matcher.get_recommendations_for_candidate(test_candidate, 3)
                
                if recommendations:
                    self.stdout.write("   Top 3 recommendations:")
                    for rec in recommendations:
                        self.stdout.write(f"     - {rec['title']} at {rec['company']} ({rec['match_score']:.1f}% match)")
                else:
                    self.stdout.write("   No recommendations found")
        else:
            self.stdout.write(self.style.ERROR("❌ Model training failed!"))
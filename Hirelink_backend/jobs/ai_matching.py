# jobs/ai_matching.py - FIXED VERSION
import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import LabelEncoder
from django.db.models import Q
import joblib
import os
import json

class AIMatcher:
    """AI Job Matching Service for Django"""
    
    def __init__(self):
        self.model = None
        self.all_skills = []
        self.location_encoder = None
        self.feature_weights = None
        self.n_skills = 0
        self.job_ids = None
        self.is_trained = False
        
        # Feature weights from your notebook
        self.WEIGHTS = {
            'skills': 5.0,
            'experience': 1.5,
            'location': 1.0,
            'salary': 1.0,
            'remote': 0.8,
            'job_type': 0.7
        }
        
        # Experience level mapping
        self.EXPERIENCE_MAP = {
            'entry': 1, 'junior': 2, 'mid': 3, 'mid-level': 3, 'middle': 3,
            'senior': 4, 'expert': 5, 'intern': 1, 'associate': 2,
            'lead': 4, 'principal': 5, 'director': 5
        }
        
        # Job type mapping
        self.JOB_TYPE_MAP = {
            'full_time': 1, 'full-time': 1, 'full time': 1,
            'part_time': 2, 'part-time': 2, 'part time': 2,
            'contract': 3,
            'internship': 4,
            'temporary': 5,
            'freelance': 6,
            'remote': 7
        }
    
    def extract_skills(self, skills_string):
        """Extract skills from comma-separated string"""
        if not skills_string:
            return []
        
        skills = []
        if isinstance(skills_string, str):
            skills = [skill.strip().lower() for skill in skills_string.split(',')]
        return skills
    
    def clean_salary(self, salary_min, salary_max):
        """Calculate average salary from min and max"""
        try:
            min_val = float(salary_min) if salary_min else 0
            max_val = float(salary_max) if salary_max else 0
            
            if min_val > 0 and max_val > 0:
                return (min_val + max_val) / 2
            elif min_val > 0:
                return min_val
            elif max_val > 0:
                return max_val
            else:
                return 0
        except:
            return 0
    
    def prepare_job_features(self, jobs_queryset):
        """Prepare job data for AI model"""
        jobs_data = []
        
        for job in jobs_queryset:
            required_skills = self.extract_skills(job.required_skills)
            preferred_skills = self.extract_skills(job.preferred_skills)
            all_skills = list(set(required_skills + preferred_skills))
            
            salary_avg = self.clean_salary(job.salary_min, job.salary_max)
            
            is_remote = 'remote' in str(job.job_type).lower() or 'remote' in job.title.lower()
            
            jobs_data.append({
                'id': job.id,
                'title': job.title,
                'skills': all_skills,
                'required_skills': required_skills,
                'experience_level': job.experience_level or 'mid',
                'location': job.location or 'Unknown',
                'salary': salary_avg,
                'job_type': job.job_type or 'full_time',
                'is_remote': is_remote,
                'company': job.company
            })
        
        return pd.DataFrame(jobs_data)
    
    def prepare_candidate_features(self, candidate):
        """Prepare candidate data for matching"""
        candidate_skills = self.extract_skills(candidate.skills)
        
        exp_level = getattr(candidate, 'experience_level', 'mid').lower()
        experience_encoded = self.EXPERIENCE_MAP.get(exp_level, 3)
        
        job_type = getattr(candidate, 'preferred_job_type', 'full_time').lower()
        job_type_encoded = self.JOB_TYPE_MAP.get(job_type, 1)
        
        remote_pref = getattr(candidate, 'remote_preference', False)
        remote_preference_encoded = 1 if remote_pref in [True, 'yes', 'Yes', '1'] else 0
        
        desired_salary = getattr(candidate, 'desired_salary', 0)
        
        return {
            'id': candidate.id,
            'skills': candidate_skills,
            'experience_encoded': experience_encoded,
            'job_type_encoded': job_type_encoded,
            'remote_preference': remote_preference_encoded,
            'desired_salary': desired_salary,
            'location': candidate.location or 'Unknown',
            'full_name': candidate.full_name or candidate.username,
            'experience_level': exp_level
        }
    
    def train_model(self, jobs_df):
        """Train the KNN model on jobs data"""
        print(f"Training AI model on {len(jobs_df)} jobs...")
        
        all_skills = set()
        for skills_list in jobs_df['skills']:
            all_skills.update(skills_list)
        
        self.all_skills = sorted(list(all_skills))
        self.n_skills = len(self.all_skills)
        print(f"Found {self.n_skills} unique skills")
        
        job_skill_vectors = []
        for _, job in jobs_df.iterrows():
            skill_vector = [0] * self.n_skills
            for skill in job['skills']:
                if skill in self.all_skills:
                    skill_vector[self.all_skills.index(skill)] = 1
            job_skill_vectors.append(skill_vector)
        
        self.location_encoder = LabelEncoder()
        locations = jobs_df['location'].fillna('Unknown').astype(str).tolist()
        self.location_encoder.fit(locations)
        
        jobs_df['experience_encoded'] = jobs_df['experience_level'].astype(str).str.lower().map(
            lambda x: self.EXPERIENCE_MAP.get(x.strip(), 3)
        ).fillna(3)
        
        jobs_df['job_type_encoded'] = jobs_df['job_type'].astype(str).str.lower().map(
            lambda x: self.JOB_TYPE_MAP.get(x.strip(), 1)
        ).fillna(1)
        
        jobs_df['remote_encoded'] = jobs_df['is_remote'].astype(int)
        
        jobs_df['location_encoded'] = self.location_encoder.transform(
            jobs_df['location'].fillna('Unknown').astype(str)
        )
        
        jobs_df['salary_scaled'] = jobs_df['salary'] / 1000.0
        
        job_features = []
        for idx, job in jobs_df.iterrows():
            other_features = [
                float(job['experience_encoded']),
                float(job['location_encoded']),
                float(job['salary_scaled']),
                float(job['remote_encoded']),
                float(job['job_type_encoded'])
            ]
            job_features.append(other_features)
        
        job_skill_vectors = np.array(job_skill_vectors)
        job_features = np.array(job_features)
        
        job_combined_features = np.hstack([job_skill_vectors, job_features])
        
        weight_vector = []
        weight_vector.extend([self.WEIGHTS['skills']] * self.n_skills)
        weight_vector.extend([
            self.WEIGHTS['experience'],
            self.WEIGHTS['location'],
            self.WEIGHTS['salary'],
            self.WEIGHTS['remote'],
            self.WEIGHTS['job_type']
        ])
        
        self.feature_weights = np.array(weight_vector)
        
        job_weighted_features = job_combined_features * self.feature_weights
        
        n_neighbors = min(15, len(job_weighted_features))
        self.model = NearestNeighbors(
            n_neighbors=n_neighbors,
            metric='euclidean',
            algorithm='auto'
        )
        
        self.model.fit(job_weighted_features)
        
        self.job_ids = jobs_df['id'].values
        self.job_titles = jobs_df['title'].values
        self.job_companies = jobs_df['company'].values
        self.job_skill_vectors = job_skill_vectors
        self.job_features = job_features
        self.jobs_df = jobs_df
        self.is_trained = True
        
        print(f"✅ Model trained successfully!")
        print(f"   Jobs: {len(jobs_df)}")
        print(f"   Skills: {self.n_skills}")
        print(f"   Neighbors: {n_neighbors}")
        
        return True
    
    def save_model(self, path='ai_model'):
        """Save the trained model"""
        os.makedirs(path, exist_ok=True)
        
        model_data = {
            'model': self.model,
            'all_skills': self.all_skills,
            'location_encoder': self.location_encoder,
            'feature_weights': self.feature_weights,
            'job_ids': self.job_ids,
            'job_titles': self.job_titles,
            'job_companies': self.job_companies,
            'n_skills': self.n_skills,
            'jobs_df': self.jobs_df.to_dict('records'),
            'is_trained': self.is_trained
        }
        
        joblib.dump(model_data, os.path.join(path, 'job_matcher.joblib'))
        print(f"✅ Model saved to {path}/job_matcher.joblib")
    
    def load_model(self, path='ai_model/job_matcher.joblib'):
        """Load a pre-trained model"""
        if os.path.exists(path):
            try:
                model_data = joblib.load(path)
                
                self.model = model_data['model']
                self.all_skills = model_data['all_skills']
                self.location_encoder = model_data['location_encoder']
                self.feature_weights = model_data['feature_weights']
                self.job_ids = model_data['job_ids']
                self.job_titles = model_data['job_titles']
                self.job_companies = model_data['job_companies']
                self.n_skills = model_data['n_skills']
                self.jobs_df = pd.DataFrame(model_data['jobs_df'])
                self.is_trained = model_data['is_trained']
                
                print(f"✅ Model loaded from {path}")
                return True
            except Exception as e:
                print(f"❌ Error loading model: {e}")
                return False
        else:
            print(f"❌ Model file not found at {path}")
            return False
    
    # FIXED METHOD - CORRECT NAME AND LOGIC
    def get_recommendations_for_candidate(self, candidate, n_recommendations=10):
        """Get AI-recommended jobs for a candidate - SKILL-FOCUSED"""
        if not self.is_trained:
            print("❌ Model not trained!")
            return []
        
        candidate_data = self.prepare_candidate_features(candidate)
        
        candidate_skill_vector = [0] * self.n_skills
        for skill in candidate_data['skills']:
            if skill in self.all_skills:
                candidate_skill_vector[self.all_skills.index(skill)] = 1
        
        candidate_location = candidate_data['location']
        try:
            location_encoded = self.location_encoder.transform([candidate_location])[0]
        except:
            location_encoded = 0
        
        candidate_other_features = [
            float(candidate_data['experience_encoded']),
            float(location_encoded),
            float(candidate_data['desired_salary'] / 1000.0),
            float(candidate_data['remote_preference']),
            float(candidate_data['job_type_encoded'])
        ]
        
        candidate_combined = np.hstack([candidate_skill_vector, candidate_other_features])
        candidate_weighted = candidate_combined * self.feature_weights
        
        n_neighbors = min(n_recommendations * 2, len(self.job_ids))
        distances, indices = self.model.kneighbors(
            candidate_weighted.reshape(1, -1), 
            n_neighbors=n_neighbors
        )
        
        recommendations = []
        candidate_skills_set = set(candidate_data['skills'])
        
        for i, (distance, job_idx) in enumerate(zip(distances[0], indices[0])):
            job_id = int(self.job_ids[job_idx])
            job_row = self.jobs_df[self.jobs_df['id'] == job_id].iloc[0]
            
            job_skills = job_row['required_skills']
            matching_skills = candidate_skills_set.intersection(set(job_skills))
            
            skill_match_pct = 0
            if job_skills:
                skill_match_pct = (len(matching_skills) / len(job_skills)) * 100
            
            # SKIP jobs with 0% skill match
            if skill_match_pct == 0:
                continue
            
            # Use skill match as the score
            match_score = skill_match_pct
            
            recommendations.append({
                'job_id': job_id,
                'title': job_row['title'],
                'company': job_row['company'],
                'match_score': float(match_score),
                'skill_match_percentage': float(skill_match_pct),
                'matching_skills': list(matching_skills)[:5],
                'required_skills': job_skills[:5],
                'experience_level': job_row['experience_level'],
                'location': job_row['location'],
                'salary': float(job_row['salary']),
                'job_type': job_row['job_type'],
                'is_remote': bool(job_row['is_remote']),
                'rank': len(recommendations) + 1,
                'distance': float(distance)
            })
            
            if len(recommendations) >= n_recommendations:
                break
        
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        
        for i, rec in enumerate(recommendations):
            rec['rank'] = i + 1
        
        return recommendations

# Global instance
ai_matcher = AIMatcher()
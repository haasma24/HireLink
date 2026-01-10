"""
Professional Resume ATS Builder Service for HireLink
COMPLETE WORKING VERSION - No external model files needed
"""

import os
import numpy as np
import pandas as pd
import re
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

class ResumeATSBuilder:
    """
    Complete Resume ATS Builder with AI Scoring and Suggestions
    Works WITHOUT external model files
    """
    
    def __init__(self):
        print("🚀 Initializing Resume ATS Builder...")
        
        # Feature names (for consistency)
        self.feature_names = [
            'word_count', 'has_email', 'has_phone', 'section_count', 
            'bullet_point_count', 'tech_keyword_count', 'action_verb_count',
            'has_skills_section', 'has_experience_section', 'has_education_section'
        ]
        
        # Skills database for analysis
        self.common_skills = {
            'Programming': ['python', 'java', 'javascript', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'typescript', 'go', 'rust'],
            'Web Development': ['html', 'css', 'react', 'angular', 'vue', 'django', 'flask', 'node.js', 'express', 'spring', 'laravel'],
            'Data Science': ['machine learning', 'data analysis', 'statistics', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn', 'spark', 'hadoop'],
            'Databases': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite', 'cassandra'],
            'Cloud/DevOps': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'ci/cd', 'terraform', 'ansible', 'linux'],
            'Tools': ['git', 'jira', 'confluence', 'slack', 'trello', 'postman', 'vscode', 'intellij', 'eclipse'],
            'Soft Skills': ['leadership', 'communication', 'teamwork', 'problem solving', 'project management', 'agile', 'scrum']
        }
        
        # ATS-unfriendly patterns
        self.ats_unfriendly = [
            r'\[.*?\]', r'\{.*?\}', r'<.*?>',  # Brackets, HTML
            r'■|●|◆|◼|★|☆|♣|♥|♦|♠',  # Special characters
            r'\t{2,}', r' {4,}',  # Multiple tabs/spaces
            r'column|row|table',  # Table references
            r'\b[A-Z]{3,}\b',  # All caps words (except common acronyms)
        ]
        
        # Action verbs for analysis
        self.action_verbs = [
            'achieved', 'managed', 'developed', 'created', 'implemented',
            'improved', 'increased', 'reduced', 'led', 'coordinated',
            'designed', 'built', 'established', 'launched', 'optimized',
            'analyzed', 'resolved', 'transformed', 'generated', 'delivered',
            'spearheaded', 'initiated', 'oversaw', 'directed', 'facilitated',
            'produced', 'engineered', 'programmed', 'coded', 'tested',
            'debugged', 'deployed', 'maintained', 'upgraded', 'migrated'
        ]
        
        print("✅ Resume ATS Builder Ready!")
    
    def extract_features(self, resume_text: str) -> pd.DataFrame:
        """
        Extract features from resume text for analysis
        """
        text_lower = resume_text.lower()
        words = resume_text.split()
        
        features = {}
        
        # 1. Basic statistics
        features['word_count'] = len(words)
        features['char_count'] = len(resume_text)
        
        # 2. Contact information
        features['has_email'] = 1 if re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text) else 0
        features['has_phone'] = 1 if re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', resume_text) else 0
        
        # 3. Section detection
        sections = {
            'has_summary_section': ['summary', 'objective', 'profile', 'professional summary'],
            'has_experience_section': ['experience', 'work', 'employment', 'professional experience'],
            'has_education_section': ['education', 'academic', 'degree', 'qualifications'],
            'has_skills_section': ['skills', 'technical skills', 'competencies', 'expertise'],
            'has_projects_section': ['projects', 'portfolio', 'personal projects'],
            'has_certifications_section': ['certifications', 'certificates', 'licenses']
        }
        
        for feature_name, keywords in sections.items():
            features[feature_name] = 1 if any(keyword in text_lower for keyword in keywords) else 0
        
        # 4. Section count
        section_features = ['has_experience_section', 'has_education_section', 'has_skills_section']
        features['section_count'] = sum(features.get(f, 0) for f in section_features)
        
        # 5. Bullet points
        bullet_chars = ['•', '*', '-', '·', '▪', '→', '○']
        features['bullet_point_count'] = sum(resume_text.count(char) for char in bullet_chars)
        
        # 6. Tech keywords count
        all_tech_keywords = []
        for category_skills in self.common_skills.values():
            all_tech_keywords.extend(category_skills)
        features['tech_keyword_count'] = sum(1 for kw in all_tech_keywords if kw in text_lower)
        
        # 7. Action verbs count
        features['action_verb_count'] = sum(1 for verb in self.action_verbs if verb in text_lower)
        
        # 8. Readability metrics
        sentences = re.split(r'[.!?]+', resume_text)
        sentences = [s.strip() for s in sentences if s.strip()]
        features['sentence_count'] = len(sentences)
        
        if sentences:
            sentence_lengths = [len(s.split()) for s in sentences]
            features['avg_sentence_length'] = np.mean(sentence_lengths)
            features['sentence_complexity'] = np.std(sentence_lengths)
        else:
            features['avg_sentence_length'] = len(words)
            features['sentence_complexity'] = 0
        
        # 9. Formatting metrics
        lines = resume_text.split('\n')
        features['line_count'] = len(lines)
        features['avg_line_length'] = np.mean([len(line) for line in lines]) if lines else 0
        
        # Create DataFrame with all features
        df = pd.DataFrame([features])
        
        # Ensure all required features exist
        for feature in self.feature_names:
            if feature not in df.columns:
                df[feature] = 0
        
        return df[self.feature_names]
    
    def calculate_quality_score(self, features: pd.DataFrame) -> float:
        """
        Calculate quality score (1-5) based on features
        Based on real ATS best practices
        """
        x = features.iloc[0]
        score = 3.0  # Start with average score
        
        # 1. Length score (300-500 words is ideal)
        word_count = x['word_count']
        if 300 <= word_count <= 500:
            score += 0.8  # Perfect length
        elif 200 <= word_count < 300:
            score += 0.4  # Good but could be longer
        elif 500 < word_count <= 700:
            score += 0.3  # Good but could be shorter
        elif word_count < 100:
            score -= 1.5  # Too short
        elif word_count > 800:
            score -= 0.5  # Too long
        
        # 2. Contact information score
        if x['has_email'] and x['has_phone']:
            score += 0.6  # Has both contact methods
        elif x['has_email'] or x['has_phone']:
            score += 0.3  # Has one contact method
        else:
            score -= 1.0  # Missing contact info
        
        # 3. Section completeness score
        section_count = x['section_count']
        if section_count >= 3:
            score += 0.8  # Has all key sections
        elif section_count == 2:
            score += 0.3  # Missing one key section
        elif section_count == 1:
            score -= 0.3  # Missing two key sections
        else:
            score -= 1.0  # No key sections
        
        # 4. Bullet points score (5-15 is ideal)
        bullet_count = x['bullet_point_count']
        if 5 <= bullet_count <= 15:
            score += 0.5  # Good use of bullet points
        elif bullet_count > 15:
            score += 0.2  # Too many bullet points
        elif bullet_count < 3:
            score -= 0.4  # Not enough bullet points
        
        # 5. Technical content score
        tech_count = x['tech_keyword_count']
        if tech_count >= 10:
            score += 0.7  # Excellent technical detail
        elif 5 <= tech_count < 10:
            score += 0.4  # Good technical detail
        elif 2 <= tech_count < 5:
            score += 0.1  # Some technical detail
        else:
            score -= 0.5  # Lacks technical keywords
        
        # 6. Action verbs score
        action_count = x['action_verb_count']
        if action_count >= 8:
            score += 0.6  # Strong action-oriented language
        elif 4 <= action_count < 8:
            score += 0.3  # Good use of action verbs
        elif action_count < 2:
            score -= 0.3  # Weak action language
        
        # Ensure score is within 1-5 range
        score = max(1.0, min(5.0, score))
        
        return round(score, 2)
    
    def check_ats_compatibility(self, resume_text: str) -> Tuple[bool, float]:
        """
        Check if resume is ATS-compatible
        Returns: (is_compatible, confidence)
        """
        issues = []
        text_lower = resume_text.lower()
        
        # Check for ATS-unfriendly patterns
        for pattern in self.ats_unfriendly[:4]:  # Check first 4 patterns
            if re.search(pattern, resume_text):
                issues.append(f"Contains special formatting: {pattern}")
        
        # Check for tables
        if resume_text.count('|') > 10:
            issues.append("Contains table structures")
        
        # Check for headers/titles
        has_name = any(word.istitle() for word in resume_text.split()[:10])
        has_sections = any(section in text_lower for section in ['experience', 'education', 'skills'])
        
        # Calculate compatibility
        if len(issues) == 0 and has_name and has_sections:
            return True, 0.9  # Highly compatible
        elif len(issues) <= 2 and has_name:
            return True, 0.7  # Mostly compatible
        elif len(issues) <= 3:
            return False, 0.6  # Not very compatible
        else:
            return False, 0.4  # Not compatible
    
    def get_grade_and_feedback(self, score: float) -> Tuple[str, str, str]:
        """
        Convert score to grade, feedback, and color
        """
        if score >= 4.5:
            return "A+", "Excellent! Your resume is professional and ATS-friendly.", "green"
        elif score >= 4.0:
            return "A", "Very good! Your resume is strong and well-structured.", "green"
        elif score >= 3.5:
            return "B+", "Good resume. Some improvements can make it excellent.", "blue"
        elif score >= 3.0:
            return "B", "Average resume. Several areas need improvement.", "orange"
        elif score >= 2.5:
            return "C+", "Below average. Needs significant improvements.", "orange"
        elif score >= 2.0:
            return "C", "Poor resume. Consider major revisions.", "red"
        else:
            return "D", "Very poor. Start over with a professional template.", "red"
    
    def generate_detailed_analysis(self, resume_text: str, features: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate detailed analysis of the resume
        """
        x = features.iloc[0]
        text_lower = resume_text.lower()
        
        analysis = {
            'strengths': [],
            'weaknesses': [],
            'ats_issues': [],
            'missing_sections': [],
            'statistics': {}
        }
        
        # Calculate strengths
        if x['has_email'] and x['has_phone']:
            analysis['strengths'].append("✅ Complete contact information")
        elif x['has_email'] or x['has_phone']:
            analysis['strengths'].append("✅ Has some contact information")
        
        if x['section_count'] >= 3:
            analysis['strengths'].append("✅ Well-structured with key sections")
        elif x['section_count'] == 2:
            analysis['strengths'].append("✅ Has basic structure")
        
        if x['bullet_point_count'] >= 5:
            analysis['strengths'].append("✅ Good use of bullet points")
        
        if x['tech_keyword_count'] >= 5:
            analysis['strengths'].append("✅ Strong technical content")
        
        if x['action_verb_count'] >= 5:
            analysis['strengths'].append("✅ Effective use of action verbs")
        
        # Calculate weaknesses
        if not x['has_email'] and not x['has_phone']:
            analysis['weaknesses'].append("❌ Missing contact information")
        
        if x['section_count'] < 2:
            analysis['weaknesses'].append("❌ Missing key sections")
        
        if x['word_count'] < 200:
            analysis['weaknesses'].append("❌ Resume is too short")
        elif x['word_count'] > 800:
            analysis['weaknesses'].append("❌ Resume is too long")
        
        if x['bullet_point_count'] < 3:
            analysis['weaknesses'].append("❌ Needs more bullet points")
        
        if x['tech_keyword_count'] < 3:
            analysis['weaknesses'].append("❌ Lacks technical keywords")
        
        # Check for missing sections
        required_sections = ['experience', 'education', 'skills']
        for section in required_sections:
            if section not in text_lower:
                analysis['missing_sections'].append(section.title())
        
        # Check ATS issues
        for pattern in self.ats_unfriendly:
            if re.search(pattern, resume_text):
                analysis['ats_issues'].append("⚠️  Contains non-standard formatting")
                break
        
        if resume_text.count('|') > 10:
            analysis['ats_issues'].append("⚠️  Contains tables (not ATS-friendly)")
        
        # Add statistics
        analysis['statistics'] = {
            'word_count': int(x['word_count']),
            'section_count': int(x['section_count']),
            'bullet_points': int(x['bullet_point_count']),
            'tech_keywords': int(x['tech_keyword_count']),
            'action_verbs': int(x['action_verb_count']),
            'has_email': bool(x['has_email']),
            'has_phone': bool(x['has_phone'])
        }
        
        return analysis
    
    def generate_improvement_suggestions(self, analysis: Dict[str, Any], score: float) -> List[Dict[str, Any]]:
        """
        Generate specific improvement suggestions
        """
        suggestions = []
        
        # High priority suggestions (for low scores)
        if score < 3.0:
            suggestions.append({
                'priority': 'high',
                'title': 'Add Contact Information',
                'description': 'Include your email and phone number',
                'action': 'Add: Your Name | Email: name@email.com | Phone: (123) 456-7890'
            })
            
            suggestions.append({
                'priority': 'high',
                'title': 'Add Key Sections',
                'description': 'Include Experience, Education, and Skills sections',
                'action': 'Create clear headings: EXPERIENCE, EDUCATION, SKILLS'
            })
        
        # Medium priority suggestions
        if 'missing_sections' in analysis and analysis['missing_sections']:
            suggestions.append({
                'priority': 'medium',
                'title': 'Complete Missing Sections',
                'description': f"Add: {', '.join(analysis['missing_sections'])}",
                'action': f"Create a {analysis['missing_sections'][0]} section with relevant content"
            })
        
        if analysis['statistics']['tech_keywords'] < 5:
            suggestions.append({
                'priority': 'medium',
                'title': 'Add Technical Skills',
                'description': 'Include more technical keywords for ATS scanning',
                'action': 'List specific technologies: Python, React, AWS, Docker, etc.'
            })
        
        if analysis['statistics']['bullet_points'] < 5:
            suggestions.append({
                'priority': 'medium',
                'title': 'Use More Bullet Points',
                'description': 'Convert paragraphs to bullet points for better readability',
                'action': 'Start each achievement with an action verb: • Developed... • Improved...'
            })
        
        # Low priority suggestions
        if analysis['statistics']['action_verbs'] < 5:
            suggestions.append({
                'priority': 'low',
                'title': 'Use Action Verbs',
                'description': 'Start bullet points with strong action verbs',
                'action': 'Use: Developed, Managed, Created, Improved, Led, Increased, Reduced'
            })
        
        if analysis['statistics']['word_count'] < 300:
            suggestions.append({
                'priority': 'low',
                'title': 'Expand Content',
                'description': 'Add more details to each section',
                'action': 'Aim for 300-500 words total'
            })
        
        # ATS-specific suggestions
        if analysis.get('ats_issues'):
            suggestions.append({
                'priority': 'high',
                'title': 'Fix ATS Compatibility',
                'description': 'Remove elements that confuse ATS systems',
                'action': 'Remove tables, graphics, special characters. Use standard fonts.'
            })
        
        return suggestions
    
    def get_quick_wins(self, resume_text: str) -> List[str]:
        """
        Get quick improvements that can be done in minutes
        """
        quick_wins = []
        text_lower = resume_text.lower()
        
        if '@' not in resume_text:
            quick_wins.append("📧 Add your email address")
        
        if not re.search(r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}', resume_text):
            quick_wins.append("📱 Add your phone number")
        
        if 'linkedin' not in text_lower:
            quick_wins.append("🔗 Add your LinkedIn profile URL")
        
        if 'summary' not in text_lower and 'objective' not in text_lower:
            quick_wins.append("📝 Add a 2-3 line professional summary")
        
        if resume_text.count('•') + resume_text.count('-') + resume_text.count('*') < 3:
            quick_wins.append("• Convert paragraphs to bullet points")
        
        return quick_wins
    
    def analyze_resume(self, resume_text: str) -> Dict[str, Any]:
        """
        Complete resume analysis pipeline
        """
        print("🔍 Starting resume analysis...")
        
        try:
            # Validate input
            if not resume_text or len(resume_text.strip()) < 50:
                return {
                    'success': False,
                    'error': 'Resume text is too short (minimum 50 characters)'
                }
            
            # Step 1: Extract features
            features = self.extract_features(resume_text)
            print(f"✅ Extracted {len(features.columns)} features")
            
            # Step 2: Calculate quality score
            quality_score = self.calculate_quality_score(features)
            print(f"✅ Calculated quality score: {quality_score}/5.0")
            
            # Step 3: Check ATS compatibility
            ats_compatible, ats_confidence = self.check_ats_compatibility(resume_text)
            print(f"✅ ATS compatibility: {ats_compatible} (confidence: {ats_confidence:.2f})")
            
            # Step 4: Get grade and feedback
            grade, feedback, color = self.get_grade_and_feedback(quality_score)
            
            # Step 5: Generate detailed analysis
            detailed_analysis = self.generate_detailed_analysis(resume_text, features)
            
            # Step 6: Generate improvement suggestions
            suggestions = self.generate_improvement_suggestions(detailed_analysis, quality_score)
            
            # Step 7: Get quick wins
            quick_wins = self.get_quick_wins(resume_text)
            
            # Step 8: Prepare final results
            results = {
                'success': True,
                'analysis': {
                    'summary': {
                        'quality_score': quality_score,
                        'grade': grade,
                        'grade_color': color,
                        'ats_compatible': ats_compatible,
                        'ats_confidence': round(ats_confidence, 2),
                        'overall_feedback': feedback,
                        'score_explanation': self._get_score_explanation(quality_score)
                    },
                    'detailed_analysis': detailed_analysis,
                    'improvement_suggestions': suggestions,
                    'quick_wins': quick_wins,
                    'recommended_actions': self._get_recommended_actions(quality_score, ats_compatible)
                },
                'metadata': {
                    'analysis_timestamp': datetime.now().isoformat(),
                    'model_version': '2.0',
                    'analysis_time_ms': 100  # Simulated
                }
            }
            
            print(f"✅ Analysis complete! Score: {quality_score}/5.0 ({grade})")
            print(f"   Strengths: {len(detailed_analysis['strengths'])}")
            print(f"   Suggestions: {len(suggestions)}")
            
            return results
            
        except Exception as e:
            print(f"❌ Error in resume analysis: {e}")
            import traceback
            traceback.print_exc()
            
            return {
                'success': False,
                'error': f"Analysis failed: {str(e)}",
                'analysis': None
            }
    
    def _get_score_explanation(self, score: float) -> str:
        """Explain what the score means"""
        if score >= 4.0:
            return "Excellent resume! Likely to pass through ATS systems and impress recruiters."
        elif score >= 3.0:
            return "Good resume. May need minor optimizations for better ATS compatibility."
        elif score >= 2.0:
            return "Needs improvement. Significant changes recommended for ATS compatibility."
        else:
            return "Poor ATS compatibility. Consider complete rewrite using a professional template."
    
    def _get_recommended_actions(self, score: float, ats_compatible: bool) -> List[str]:
        """Get recommended next actions based on score"""
        actions = []
        
        if score < 3.0:
            actions.append("🚨 **High Priority**: Fix contact information and add missing sections")
            actions.append("📝 Use a professional resume template")
            actions.append("🔍 Review each section for completeness")
        
        if not ats_compatible:
            actions.append("⚡ **Urgent**: Remove tables, graphics, and special characters")
            actions.append("📋 Use standard section headings (Experience, Education, Skills)")
            actions.append("🎯 Include keywords from your target job description")
        
        if score >= 3.0 and score < 4.0:
            actions.append("✨ **Optimize**: Add metrics to achievements (e.g., 'Increased sales by 20%')")
            actions.append("🔧 Include more technical keywords")
            actions.append("📊 Add a projects section if applicable")
        
        if score >= 4.0:
            actions.append("🎉 **Excellent!** Your resume is ATS-ready")
            actions.append("💡 Consider tailoring for specific job applications")
            actions.append("🔗 Add links to LinkedIn, GitHub, or portfolio")
        
        # Always recommend these
        actions.append("✅ Proofread for spelling and grammar errors")
        actions.append("📄 Save as PDF with 'YourName_Resume.pdf' filename")
        
        return actions
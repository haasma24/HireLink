// types/application.ts
export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'remote';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive';
export type ApplicationStatus = 
  | 'applied'
  | 'under_review'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'interviewed'
  | 'rejected'
  | 'accepted'
  | 'offer_sent'
  | 'hired';

export type InterviewType = 'phone' | 'video' | 'technical' | 'onsite';

export interface Job {
  id: number;
  title: string;
  description: string;
  company: string;  // Changed from recruiter_name
  location: string;
  job_type: JobType;
  experience_level: ExperienceLevel;  // Added
  posted_by: number;  // Changed from recruiter
  posted_by_name: string;  // Added
  is_active: boolean;
  created_at: string;
  updated_at: string;  // Added
  application_deadline: string | null;
  salary_min: number | null;  // Added
  salary_max: number | null;  // Added
  salary_currency: string;  // Added
  required_skills: string;  // Added
  preferred_skills: string;  // Added
  has_applied?: boolean;

  ai_match_score?: number;
  skill_match_percentage?: number;
  matching_skills?: string[];
  rank?: number;
}

export interface Application {
  id: number;
  candidate: number;
  candidate_name: string;
  job: number;
  job_title: string;
  company_name: string;
  cover_letter: string;
  resume: string;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
  notes: string;
}

export interface Interview {
  id: number;
  application: number;
  application_details: Application;
  scheduled_date: string;
  duration_minutes: number;
  interview_type: InterviewType;
  interviewer: number;
  interviewer_name: string;
  candidate_name: string;
  job_title: string;
  meeting_link: string;
  notes: string;
  feedback: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user: number;
  notification_type: string;
  title: string;
  message: string;
  related_application: number | null;
  is_read: boolean;
  created_at: string;
}

export interface ApplicationStats {
  total_applications: number;
  by_status: Record<ApplicationStatus, number>;
  recent_applications: number;
  upcoming_interviews: number;
}

// UI helpers
export const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship',  // Added
  remote: 'Remote',
};

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
  executive: 'Executive',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview Scheduled',
  interviewed: 'Interviewed',
  rejected: 'Rejected',
  accepted: 'Accepted',
  offer_sent: 'Offer Sent',
  hired: 'Hired',
};

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  under_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  shortlisted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  interview_scheduled: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  interviewed: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  offer_sent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  hired: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100',
};

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  phone: 'Phone Screen',
  video: 'Video Call',
  technical: 'Technical Interview',
  onsite: 'On-site Interview',
};

export interface RecruiterApplication {
  id: number;
  status: ApplicationStatus;
  cover_letter: string;
  resume: string;
  notes: string;
  applied_at: string;
  updated_at: string;

  // côté candidat
  candidate_name: string;
  candidate_email?: string;
  candidate_username?: string;

  // côté job
  job: RecruiterJobSummary | number; // dépend de ton serializer
  job_title: string;
  company_name: string;
}
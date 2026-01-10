// components/JobCard.tsx - SIMPLER VERSION
import Link from 'next/link';
import { JOB_TYPES } from '@/lib/api';
import { Job } from '@/types/application';

interface JobCardProps {
  job: Job;
  showAIBadge?: boolean;
}

export default function JobCard({ job, showAIBadge = false }: JobCardProps) {
  // Cast job to any to access AI fields (quick fix)
  const aiJob = job as any;
  
  const getMatchColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (percentage >= 40) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (percentage >= 20) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white dark:bg-slate-900">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            {job.title}
          </h3>
          <p className="text-slate-600 dark:text-slate-300">
            {job.company}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {JOB_TYPES[job.job_type as keyof typeof JOB_TYPES] || job.job_type}
          </span>
          
          {showAIBadge && aiJob.skill_match_percentage !== undefined && (
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getMatchColor(aiJob.skill_match_percentage)}`}>
              {Math.round(aiJob.skill_match_percentage)}% Skill Match
            </span>
          )}
        </div>
      </div>

      <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
        {job.description}
      </p>

      {/* Matching Skills Section */}
      {showAIBadge && aiJob.matching_skills && aiJob.matching_skills.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Matching Skills:
          </p>
          <div className="flex flex-wrap gap-1">
            {aiJob.matching_skills.map((skill: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 space-y-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          📍 {job.location}
        </p>
        {job.application_deadline && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ⏰ Deadline: {new Date(job.application_deadline).toLocaleDateString()}
          </p>
        )}
        
        {job.salary_min && job.salary_max && (
          <p className="text-sm text-green-600 dark:text-green-400">
            💰 {job.salary_currency} {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}
          </p>
        )}
        
        {showAIBadge && aiJob.rank && (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            🎯 AI Recommendation #{aiJob.rank}
          </p>
        )}
      </div>

      <div className="flex justify-between items-center">
        <Link
          href={`/dashboard/jobs/${job.id}`}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View Details
        </Link>
        {job.has_applied ? (
          <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Applied
          </span>
        ) : (
          <Link
            href={`/dashboard/jobs/${job.id}/apply`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply Now
          </Link>
        )}
      </div>
    </div>
  );
}
// app/dashboard/jobs/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { applicationApi, getAuthToken } from '@/lib/api';
import { 
  Job, 
  JOB_TYPE_LABELS, 
  EXPERIENCE_LEVEL_LABELS 
} from '@/types/application';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJob();
  }, [params.id]);

  const loadJob = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await applicationApi.getJob(Number(params.id), token);
      setJob(data);
    } catch (error) {
      console.error('Failed to load job:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatSkills = (skills: string) => {
    if (!skills) return [];
    return skills.split(',').map(skill => skill.trim()).filter(skill => skill);
  };

  const getSalaryText = () => {
    if (!job) return 'Salary not specified';
    
    const hasMin = job.salary_min !== null && job.salary_min !== undefined;
    const hasMax = job.salary_max !== null && job.salary_max !== undefined;
    
    if (hasMin && hasMax) {
      return `${formatCurrency(job.salary_min, job.salary_currency)} - ${formatCurrency(job.salary_max, job.salary_currency)}`;
    } else if (hasMin) {
      return `From ${formatCurrency(job.salary_min, job.salary_currency)}`;
    } else if (hasMax) {
      return `Up to ${formatCurrency(job.salary_max, job.salary_currency)}`;
    } else {
      return 'Salary not specified';
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center py-12">Loading job details...</div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Job not found
          </h2>
          <Link
            href="/dashboard/jobs"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            ← Back to Jobs
          </Link>
        </div>
      </main>
    );
  }

  const requiredSkills = formatSkills(job.required_skills);
  const preferredSkills = formatSkills(job.preferred_skills);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/dashboard/jobs"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 mb-6"
      >
        ← Back to Jobs
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {job.title}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              {job.company}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="px-4 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium">
              {JOB_TYPE_LABELS[job.job_type]}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                📍 {job.location}
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {EXPERIENCE_LEVEL_LABELS[job.experience_level]}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span className={`px-4 py-2 rounded-full font-medium ${
            job.is_active 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {job.is_active ? 'Active' : 'Closed'}
          </span>
        </div>

        {/* Salary Information */}
        {(job.salary_min || job.salary_max) && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
              💰 Salary Information
            </h3>
            <div className="flex items-center gap-4">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {getSalaryText()}
                {job.salary_currency && job.salary_currency !== 'USD' && (
                  <span className="text-sm font-normal text-slate-600 dark:text-slate-400 ml-2">
                    ({job.salary_currency})
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Job Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
              📅 Posted On
            </h3>
            <p className="text-slate-900 dark:text-white">
              {new Date(job.created_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {job.application_deadline && (
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ⏰ Application Deadline
              </h3>
              <p className="text-slate-900 dark:text-white">
                {new Date(job.application_deadline).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
              🏢 Company
            </h3>
            <p className="text-slate-900 dark:text-white">{job.company}</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
              📍 Location
            </h3>
            <p className="text-slate-900 dark:text-white">{job.location}</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
              💼 Job Type
            </h3>
            <p className="text-slate-900 dark:text-white">
              {JOB_TYPE_LABELS[job.job_type]}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
              🎯 Experience Level
            </h3>
            <p className="text-slate-900 dark:text-white">
              {EXPERIENCE_LEVEL_LABELS[job.experience_level]}
            </p>
          </div>
        </div>

        {/* Job Description */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            Job Description
          </h2>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
            <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
              {job.description}
            </p>
          </div>
        </div>

        {/* Required Skills */}
        {requiredSkills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              🛠️ Required Skills
            </h2>
            <div className="flex flex-wrap gap-3">
              {requiredSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Preferred Skills */}
        {preferredSkills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              ✨ Preferred Skills
            </h2>
            <div className="flex flex-wrap gap-3">
              {preferredSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Posted By Info */}
        <div className="mb-8 bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
            📋 Posted By
          </h3>
          <p className="text-slate-900 dark:text-white">
            {job.posted_by_name || 'Recruiter'}
          </p>
        </div>

        {/* Last Updated */}
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Last updated: {new Date(job.updated_at).toLocaleDateString()} at{' '}
          {new Date(job.updated_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>

      // In the Action Buttons section, replace this:
<div className="flex justify-end gap-4 pt-6 border-t dark:border-slate-700">
  {job.has_applied ? (
    <div className="flex items-center gap-4">
      <span className="px-6 py-3 rounded-lg bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 font-medium">
        ✅ You have applied for this position
      </span>
      <Link
        href="/dashboard/applications"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        View Application
      </Link>
    </div>
  ) : (
    <Link
      href={`/dashboard/jobs/${job.id}/apply`}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
    >
      Apply for this Position
    </Link>
  )}
</div>
      </div>
    </main>
  );
}
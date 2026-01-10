// app/dashboard/recruiter/jobs/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

type Job = {
  id: number;
  title: string;
  description: string;
  company: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  job_type: string;
  experience_level: string;
  posted_by: string;
  is_active: boolean;
  application_deadline?: string;
  created_at: string;
  updated_at: string;
  required_skills: string;
  preferred_skills: string;
};

const jobTypeLabels: Record<string, string> = {
  'full_time': 'Full Time',
  'part_time': 'Part Time',
  'contract': 'Contract',
  'internship': 'Internship',
  'remote': 'Remote',
};

const experienceLevelLabels: Record<string, string> = {
  'entry': 'Entry Level',
  'mid': 'Mid Level',
  'senior': 'Senior Level',
  'executive': 'Executive',
};

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const access = localStorage.getItem('access_token');
    if (!access) {
      router.replace('/login');
      return;
    }

    async function loadJob() {
      try {
        setLoading(true);
        console.log('Loading job details for ID:', jobId);
        const data = await apiFetch(`/jobs/${jobId}/`, { 
          method: 'GET' 
        }, access!);
        
        console.log('Job data received:', data);
        setJob(data);
      } catch (err: any) {
        console.error('Error loading job:', err);
        setError(`Unable to load the job details: ${err.message?.detail || err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [jobId, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatSkills = (skills: string) => {
    if (!skills) return [];
    return skills.split(',').map(skill => skill.trim()).filter(skill => skill);
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading job details...</p>
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">{error || 'Job not found'}</p>
          <button
            onClick={() => router.push('/dashboard/recruiter/jobs')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Jobs
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {job.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {job.company} • {job.location}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/dashboard/recruiter/jobs/${job.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Job
            </Link>
            <Link
              href="/dashboard/recruiter/jobs"
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* Job Status */}
      <div className="mb-6">
        <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
          job.is_active 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {job.is_active ? 'Active' : 'Inactive'}
        </span>
        <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
          Posted on {formatDate(job.created_at)} • Last updated {formatDate(job.updated_at)}
        </span>
      </div>

      {/* Job Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Job Details
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Job Type</p>
              <p className="mt-1">{jobTypeLabels[job.job_type] || job.job_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Experience Level</p>
              <p className="mt-1">{experienceLevelLabels[job.experience_level] || job.experience_level}</p>
            </div>
            {(job.salary_min || job.salary_max) && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Salary Range</p>
                <p className="mt-1">
                  {job.salary_min && job.salary_max 
                    ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ${job.salary_currency}`
                    : job.salary_min
                      ? `From ${job.salary_min.toLocaleString()} ${job.salary_currency}`
                      : job.salary_max
                        ? `Up to ${job.salary_max.toLocaleString()} ${job.salary_currency}`
                        : ''
                  }
                </p>
              </div>
            )}
            {job.application_deadline && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Application Deadline</p>
                <p className="mt-1">{formatDate(job.application_deadline)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Skills Required
          </h2>
          <div className="space-y-4">
            {formatSkills(job.required_skills).length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {formatSkills(job.required_skills).map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {formatSkills(job.preferred_skills).length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Preferred Skills</p>
                <div className="flex flex-wrap gap-2">
                  {formatSkills(job.preferred_skills).map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Description */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Job Description
        </h2>
        <div className="prose dark:prose-invert max-w-none">
          <p className="whitespace-pre-line">{job.description}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Posted by: {job.posted_by}
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/recruiter/jobs"
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Back to Jobs
          </Link>
          <Link
            href={`/dashboard/recruiter/jobs/${job.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Job
          </Link>
        </div>
      </div>
    </main>
  );
}
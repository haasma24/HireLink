'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { recruiterApi, getAuthToken } from '@/lib/api';
import {
  Application,
  ApplicationStatus,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
} from '@/types/application';


type RecruiterApplication = {
  id: number;
  status: ApplicationStatus;
  cover_letter: string;
  resume: string;
  notes: string;
  applied_at: string;
  updated_at: string;
  candidate_name: string;
  candidate_email?: string;
  job_title: string;
  company_name: string;
};

export default function RecruiterApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [applications, setApplications] = useState<RecruiterApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>(
    'all'
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const statusParam = statusFilter === 'all' ? undefined : statusFilter;
      const data = await recruiterApi.getAllApplications(token, statusParam);

      const results = Array.isArray(data) ? data : data.results || [];
      setApplications(results);
    } catch (err: any) {
      console.error('Failed to load recruiter applications', err);
      setError(
        err?.message || 'Failed to load applications. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const hasSuccess = searchParams.get('success') === 'true';

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Applications
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Review and manage applications for your job postings.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/recruiter/jobs"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View My Jobs
          </Link>
        </div>
      </div>

      {hasSuccess && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg dark:bg-green-900 dark:text-green-200">
          Application status updated successfully.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
<select
  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value as any)}
>
  <option value="all">All statuses</option>
  {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
    <option key={value} value={value}>
      {label}
    </option>
  ))}
</select>


          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293L19 8.586A1 1 0 0119.293 9.293z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No applications found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            There are no applications for your jobs yet.
          </p>
          <Link
            href="/dashboard/recruiter/jobs/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Post a new job
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        {app.job_title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {app.company_name}
                      </p>
                    </div>
<span
  className={`px-3 py-1 text-xs font-medium rounded-full ${
    APPLICATION_STATUS_COLORS[app.status] ||
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  }`}
>
  {APPLICATION_STATUS_LABELS[app.status] || app.status}
</span>

                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Candidate
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {app.candidate_name}
                      </p>
                      {app.candidate_email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {app.candidate_email}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Applied on
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(app.applied_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Last updated
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(app.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Notes:</span>
                  <span>{app.notes || 'No notes yet'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/dashboard/recruiter/applications/${app.id}`}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    View details
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

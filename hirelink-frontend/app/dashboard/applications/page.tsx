// app/dashboard/applications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { applicationApi, getAuthToken } from '@/lib/api';
import { 
  Application, 
  ApplicationStatus, 
  APPLICATION_STATUS_LABELS, 
  APPLICATION_STATUS_COLORS 
} from '@/types/application';

export default function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  const loadApplications = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await applicationApi.getApplications(token, 
        statusFilter ? { status: statusFilter } : undefined
      );
      setApplications(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId: number) => {
    if (!confirm('Are you sure you want to withdraw this application?')) {
      return;
    }

    setWithdrawing(applicationId);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      await applicationApi.deleteApplication(applicationId, token);
      loadApplications(); // Refresh the list
    } catch (error) {
      console.error('Failed to withdraw application:', error);
      alert('Failed to withdraw application. Please try again.');
    } finally {
      setWithdrawing(null);
    }
  };

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      // Show success message briefly
      const timer = setTimeout(() => {
        router.replace('/dashboard/applications');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            My Applications
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Track the status of all your job applications
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/jobs"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Find More Jobs
          </Link>
          <Link
            href="/dashboard/interviews"
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            View Interviews
          </Link>
        </div>
      </div>

      {searchParams.get('success') === 'true' && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg dark:bg-green-900 dark:text-green-200">
          ✅ Your application was submitted successfully!
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <select
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus)}
          >
            <option value="">All Statuses</option>
            {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter('')}
              className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading applications...</div>
      ) : applications.length === 0 ? (
                <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No applications found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {statusFilter 
              ? `No applications with status "${APPLICATION_STATUS_LABELS[statusFilter as ApplicationStatus]}"`
              : "You haven't applied to any jobs yet"}
          </p>
          {!statusFilter && (
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Available Jobs
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div
              key={application.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        {application.job_title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {application.company_name}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${APPLICATION_STATUS_COLORS[application.status]}`}>
                      {APPLICATION_STATUS_LABELS[application.status]}
                    </span>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Applied on</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(application.applied_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last updated</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(application.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Resume</p>
                      <a 
                        href={application.resume} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Resume
                      </a>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cover Letter</p>
                    <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                      {application.cover_letter}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/dashboard/applications/${application.id}`}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    View Details
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  
                  {application.status === 'interview_scheduled' && (
                    <Link
                      href={`/dashboard/interviews?application=${application.id}`}
                      className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400"
                    >
                      View Interview
                    </Link>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {application.notes && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Notes:</span> {application.notes}
                    </div>
                  )}
                  
                  {['applied', 'under_review'].includes(application.status) && (
                    <button
                      onClick={() => handleWithdraw(application.id)}
                      disabled={withdrawing === application.id}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 text-red-700 rounded-md hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {withdrawing === application.id ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Withdrawing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Withdraw
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

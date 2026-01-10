// app/dashboard/applications/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { applicationApi, getAuthToken } from '@/lib/api';
import { 
  Application, 
  APPLICATION_STATUS_LABELS, 
  APPLICATION_STATUS_COLORS 
} from '@/types/application';

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [params.id]);

  const loadApplication = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await applicationApi.getApplication(Number(params.id), token);
      setApplication(data);
    } catch (error) {
      console.error('Failed to load application:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    setWithdrawing(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      await applicationApi.deleteApplication(Number(params.id), token);
      router.push('/dashboard/applications');
    } catch (error) {
      console.error('Failed to withdraw application:', error);
      alert('Failed to withdraw application. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!application) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Application Not Found
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            The application you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link
            href="/dashboard/applications"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            ← Back to Applications
          </Link>
        </div>
      </main>
    );
  }

  const canWithdraw = ['applied', 'under_review'].includes(application.status);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/applications"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Applications
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {application.job_title}
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-gray-600 dark:text-gray-300">
                  {application.company_name}
                </p>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${APPLICATION_STATUS_COLORS[application.status]}`}>
                  {APPLICATION_STATUS_LABELS[application.status]}
                </span>
              </div>
            </div>
            
            {canWithdraw && (
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Withdrawing...
                  </>
                ) : (
                  'Withdraw Application'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Application Details */}
        <div className="p-6 space-y-6">
          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Application Timeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Applied
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(application.applied_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Last Updated
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(application.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cover Letter
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {application.cover_letter.length} characters
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {application.cover_letter}
              </p>
            </div>
          </div>

          {/* Resume */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resume
            </h3>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Resume
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Submitted with application
                  </p>
                </div>
              </div>
              <a
                href={application.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Resume
              </a>
            </div>
          </div>

          {/* Notes */}
          {application.notes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Notes
              </h3>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300">
                  {application.notes}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              href={`/dashboard/jobs/${application.job}`}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              View Job Details
            </Link>
            
            {application.status === 'interview_scheduled' && (
              <Link
                href={`/dashboard/interviews?application=${application.id}`}
                className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                View Interview Details
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
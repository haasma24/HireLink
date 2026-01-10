// app/dashboard/recruiter/page.tsx - UPDATED FOR RECRUITER-SPECIFIC JOBS
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

type RecentJob = {
  id: number;
  title: string;
  company: string;
  is_active: boolean;
  created_at: string;
  applications_count?: number;
};

export default function RecruiterDashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate stats from recruiter's jobs
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(job => job.is_active).length;
  const totalApplications = jobs.reduce((sum, job) => sum + (job.applications_count || 0), 0);

  useEffect(() => {
    const access = localStorage.getItem('access_token');
    
    if (!access) {
      router.replace('/login');
      return;
    }

    async function loadDashboardData() {
      try {
        setLoading(true);
        console.log('Loading recruiter-specific dashboard data...');
        
        // Get recruiter's specific jobs
        let jobsData: RecentJob[] = [];
        
        try {
          const response = await apiFetch('/jobs/recruiter/jobs/', { 
            method: 'GET' 
          }, access!);
          
          console.log('Recruiter dashboard jobs response:', response);
          
          // Handle different response formats
          let rawJobs: any[] = [];
          if (Array.isArray(response)) {
            rawJobs = response;
          } else if (response && typeof response === 'object') {
            if (Array.isArray(response.results)) {
              rawJobs = response.results;
            } else if (Array.isArray(response.jobs)) {
              rawJobs = response.jobs;
            } else if (Array.isArray(response.data)) {
              rawJobs = response.data;
            } else {
              // Try to extract any array from the response
              const keys = Object.keys(response);
              for (const key of keys) {
                if (Array.isArray(response[key])) {
                  rawJobs = response[key];
                  break;
                }
              }
            }
          }
          
          // Transform to RecentJob format
          jobsData = rawJobs.map((job: any) => ({
            id: job.id,
            title: job.title,
            company: job.company,
            is_active: job.is_active,
            created_at: job.created_at,
            applications_count: job.applications_count || 0
          }));
          
          console.log(`Found ${jobsData.length} jobs for current recruiter`);
          
        } catch (recruiterEndpointError: any) {
          console.log('Recruiter-specific endpoint failed, trying fallback...', recruiterEndpointError);
          
          // Fallback: Get all jobs and filter by current user
          try {
            // First get current user profile
            const userProfile = await apiFetch('/users/profile/', { 
              method: 'GET' 
            }, access!);
            
            console.log('Current user profile for filtering:', userProfile);
            
            // Get all jobs
            const allJobsResponse = await apiFetch('/jobs/', { 
              method: 'GET' 
            }, access!);
            
            let allJobs: any[] = [];
            if (Array.isArray(allJobsResponse)) {
              allJobs = allJobsResponse;
            } else if (allJobsResponse && allJobsResponse.results) {
              allJobs = allJobsResponse.results;
            }
            
            console.log('All jobs fetched:', allJobs.length);
            
            // Filter jobs by recruiter/user ID
            const filteredJobs = allJobs.filter((job: any) => {
              // Check different possible field names for recruiter association
              return job.recruiter_id === userProfile.id || 
                     job.created_by === userProfile.id ||
                     job.user_id === userProfile.id ||
                     job.recruiter === userProfile.id ||
                     job.owner === userProfile.id;
            });
            
            console.log('Filtered jobs for dashboard:', filteredJobs.length);
            
            // Transform to RecentJob format
            jobsData = filteredJobs.map((job: any) => ({
              id: job.id,
              title: job.title,
              company: job.company,
              is_active: job.is_active,
              created_at: job.created_at,
              applications_count: job.applications_count || 0
            }));
            
            if (filteredJobs.length === 0 && allJobs.length > 0) {
              console.warn('No jobs filtered for current recruiter. Showing first 5 jobs with warning.');
              setError('Note: Could not filter jobs to current recruiter. Showing sample jobs.');
              // Show a sample of jobs
              jobsData = allJobs.slice(0, 5).map((job: any) => ({
                id: job.id,
                title: job.title,
                company: job.company,
                is_active: job.is_active,
                created_at: job.created_at,
                applications_count: job.applications_count || 0
              }));
            }
            
          } catch (fallbackError: any) {
            console.error('Fallback also failed:', fallbackError);
            setError('Unable to load dashboard data. Please check if you have any job postings.');
            jobsData = [];
          }
        }
        
        setJobs(jobsData);
        
      } catch (err: any) {
        console.error('Error loading dashboard:', err);
        if (err.status === 403) {
          setError('Access restricted to recruiters only.');
          router.push('/dashboard');
        } else {
          setError(`Unable to load dashboard data: ${err.message?.detail || err.message || 'Unknown error'}`);
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [router]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading recruiter dashboard...</p>
        </div>
      </main>
    );
  }

  if (error && !jobs.length) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Error</h2>
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <div className="mt-4 space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to main dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Recruiter Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your job postings and applications
        </p>
      </div>

      {/* Error Warning (if any) */}
      {error && jobs.length > 0 && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-yellow-800 dark:text-yellow-300">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards - Calculated from recruiter's jobs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Jobs
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {totalJobs}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Jobs
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {activeJobs}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Applications
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {totalApplications}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/recruiter/jobs/create"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow hover:shadow-lg transition-shadow flex flex-col items-center justify-center group"
          >
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Post New Job
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Create and publish a new job posting
            </p>
          </Link>

          <Link
            href="/dashboard/recruiter/jobs"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow hover:shadow-lg transition-shadow flex flex-col items-center justify-center group"
          >
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Manage My Jobs
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              View and edit your existing job postings
            </p>
          </Link>

          <Link
            href="/dashboard/recruiter/applications"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow hover:shadow-lg transition-shadow flex flex-col items-center justify-center group"
          >
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-4 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              View Applications
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Manage all received applications
            </p>
          </Link>
        </div>
      </div>

      {/* Recent Jobs - Only show recruiter's jobs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Jobs
          </h2>
          <Link
            href="/dashboard/recruiter/jobs"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {jobs && jobs.length > 0 ? (
            jobs
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 5)
              .map((job) => (
              <div key={job.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{job.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {job.company} • Posted on {new Date(job.created_at).toLocaleDateString('en-US')}
                      {job.applications_count !== undefined && (
                        <span className="ml-2">• {job.applications_count} application{job.applications_count !== 1 ? 's' : ''}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      job.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {job.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <Link
                        href={`/dashboard/recruiter/jobs/${job.id}`} 
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                No jobs posted yet
              </p>
              <Link
                href="/dashboard/recruiter/jobs/create"
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Post your first job
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
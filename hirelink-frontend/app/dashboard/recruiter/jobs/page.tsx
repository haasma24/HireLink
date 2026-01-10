// app/dashboard/recruiter/jobs/page.tsx - FIXED (removed /toggle/ endpoint attempts)
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import ConfirmationModal from '@/app/components/ConfirmationModal';

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  job_type: string;
  experience_level: string;
  is_active: boolean;
  created_at: string;
  applications_count?: number;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  recruiter_id?: number;
};

type Entreprise = {
  name: string;
};

type UserProfile = {
  entreprise?: Entreprise | null;
};

type StatusFilter = 'all' | 'active' | 'inactive';

export default function RecruiterJobsPage() {
  const router = useRouter();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [companyName, setCompanyName] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    jobId: number | null;
    jobTitle: string;
  }>({
    isOpen: false,
    jobId: null,
    jobTitle: '',
  });

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    const access = localStorage.getItem('access_token');

    if (!access) {
      router.replace('/login');
      return;
    }

    async function loadJobs() {
      try {
        setLoading(true);
        console.log('Loading recruiter-specific jobs...');
        
        try {
          const response = await apiFetch('/jobs/recruiter/jobs/', { 
            method: 'GET' 
          }, access!);
          
          console.log('Recruiter-specific jobs data received:', response);
          
          let jobsData: Job[] = [];
          if (Array.isArray(response)) {
            jobsData = response;
          } else if (response && typeof response === 'object') {
            if (Array.isArray(response.results)) {
              jobsData = response.results;
            } else if (Array.isArray(response.jobs)) {
              jobsData = response.jobs;
            } else if (Array.isArray(response.data)) {
              jobsData = response.data;
            } else {
              const keys = Object.keys(response);
              for (const key of keys) {
                if (Array.isArray(response[key])) {
                  jobsData = response[key];
                  break;
                }
              }
            }
          }
          
          console.log('Processed recruiter jobs:', jobsData.length, 'jobs');
          setAllJobs(jobsData);
          
        } catch (recruiterEndpointError: any) {
          console.log('Recruiter-specific endpoint failed, trying general jobs endpoint...', recruiterEndpointError);
          
          try {
            const userProfile = await apiFetch('/users/profile/', { 
              method: 'GET' 
            }, access!);
            
            console.log('Current user profile:', userProfile);
            
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
            
            const filteredJobs = allJobs.filter((job: any) => {
              return job.recruiter_id === userProfile.id || 
                     job.created_by === userProfile.id ||
                     job.user_id === userProfile.id ||
                     job.recruiter === userProfile.id;
            });
            
            console.log('Filtered jobs for current recruiter:', filteredJobs.length);
            
            if (filteredJobs.length === 0 && allJobs.length > 0) {
              console.warn('No jobs filtered. Job structure:', allJobs[0]);
              setJobs(allJobs);
              setError('Note: Showing all jobs. Could not filter to recruiter-specific jobs.');
            } else {
              setJobs(filteredJobs);
            }
            
          } catch (fallbackError: any) {
            console.error('Fallback also failed:', fallbackError);
            throw new Error('Unable to load your job postings from any endpoint');
          }
        }
      } catch (err: any) {
        console.error('Error loading jobs:', err);
        setError(`Unable to load your job postings: ${err.message?.detail || err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [router]);

  // Derived filtered + paginated jobs (pure frontend)
  const filteredJobs = useMemo(() => {
    let jobs = allJobs;

    if (companyName) {
      jobs = jobs.filter(
        (job) =>
          job.company &&
          job.company.trim().toLowerCase() === companyName.toLowerCase()
      );
    }

    if (statusFilter === 'active') {
      jobs = jobs.filter((job) => job.is_active);
    } else if (statusFilter === 'inactive') {
      jobs = jobs.filter((job) => !job.is_active);
    }

    return jobs;
  }, [allJobs, companyName, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + pageSize);

  const toggleJobStatus = async (jobId: number, currentStatus: boolean) => {
    const access = localStorage.getItem('access_token');
    if (!access) return;

    setUpdating(jobId);

    try {
      // Use the /update/ endpoint which actually exists
      const updateResponse = await apiFetch(
        `/jobs/${jobId}/update/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_active: !currentStatus
          }),
        },
        access!
      );

      console.log('Job status updated:', updateResponse);

      // Update local state
      setAllJobs(prev =>
        prev.map(job =>
        job.id === jobId ? { ...job, is_active: !currentStatus } : job
      )
  );

    } catch (err: any) {
      console.error('Error toggling job status:', err);
      alert(`Error updating job status: ${err.message?.detail || err.message || 'Please try again.'}`);
    } finally {
      setUpdating(null);
    }
  };

  const openDeleteModal = (jobId: number, jobTitle: string) => {
    setDeleteModal({
      isOpen: true,
      jobId,
      jobTitle,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      jobId: null,
      jobTitle: '',
    });
  };

  const deleteJob = async (jobId: number) => {
    const access = localStorage.getItem('access_token');
    if (!access) return;

    setUpdating(jobId);
    
    try {
      console.log('Deleting job ID:', jobId);
      
      try {
        await apiFetch(
          `/jobs/${jobId}/delete/`,
          {
            method: 'DELETE',
          },
          access!
        );
      } catch (deleteError1) {
        console.log('Delete endpoint 1 failed, trying endpoint 2...');
        
        try {
          await apiFetch(
            `/jobs/${jobId}/`,
            {
              method: 'DELETE',
            },
            access!
          );
        } catch (deleteError2) {
          console.log('Both delete endpoints failed, removing from local state only');
          throw new Error('Delete endpoints not available');
        }
      }

      setAllJobs(prev => prev.filter(job => job.id !== jobId));
      closeDeleteModal();
      
    } catch (err: any) {
      console.error('Error deleting job:', err);
      alert(`Error deleting job: ${err.message?.detail || err.message || 'Please try again.'}`);
      
      if (err.message?.includes('not available')) {
        setAllJobs(prev => prev.filter(job => job.id !== jobId));
        closeDeleteModal();
      }
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getJobTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      full_time: 'Full Time',
      part_time: 'Part Time',
      contract: 'Contract',
      internship: 'Internship',
      remote: 'Remote',
    };
    return types[type] || type;
  };

  const getExperienceLabel = (level: string) => {
    const levels: Record<string, string> = {
      entry: 'Entry Level',
      mid: 'Mid Level',
      senior: 'Senior Level',
      executive: 'Executive',
    };
    return levels[level] || level;
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Loading your jobs...
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Job Postings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage all your job postings ({filteredJobs.length} total)
              </p>
              {companyName && (
                <p className="text-xs text-gray-500 mt-1">
                  Company filter: <span className="font-semibold">{companyName}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as StatusFilter);
                    setCurrentPage(1);
                  }}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <Link
                href="/dashboard/recruiter/jobs/create"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Job
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {allJobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
              No jobs posted
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Start by creating your first job posting.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/recruiter/jobs/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create your first job
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedJobs.map((job) => (
                    <tr
                      key={job.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {job.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {job.company}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900 dark:text-gray-300">
                            {getJobTypeLabel(job.job_type)} •{' '}
                            {getExperienceLabel(job.experience_level)}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {job.location}
                          </div>
                          {(job.salary_min || job.salary_max) && (
                            <div className="text-gray-500 dark:text-gray-400 mt-1">
                              {job.salary_min && job.salary_max
                                ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ${job.salary_currency}`
                                : job.salary_min
                                ? `From ${job.salary_min.toLocaleString()} ${job.salary_currency}`
                                : job.salary_max
                                ? `Up to ${job.salary_max.toLocaleString()} ${job.salary_currency}`
                                : ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            job.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {job.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() =>
                              toggleJobStatus(job.id, job.is_active)
                            }
                            disabled={updating === job.id}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updating === job.id ? (
                              <svg
                                className="animate-spin h-4 w-4"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            ) : job.is_active ? (
                              'Deactivate'
                            ) : (
                              'Activate'
                            )}
                          </button>
                          <Link
                            href={`/dashboard/recruiter/jobs/${job.id}/edit`}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() =>
                              openDeleteModal(job.id, job.title)
                            }
                            disabled={updating === job.id}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {filteredJobs.length > pageSize && (
              <div className="flex items-center justify-between px-6 py-4 text-sm text-gray-400">
                <span>
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={safeCurrentPage === 1}
                    className="px-3 py-1 rounded-md border border-slate-700 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={safeCurrentPage === totalPages}
                    className="px-3 py-1 rounded-md border border-slate-700 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={() => deleteModal.jobId && deleteJob(deleteModal.jobId)}
        title="Delete Job"
        message={`Are you sure you want to delete "${deleteModal.jobTitle}"? This action is irreversible.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={updating === deleteModal.jobId}
      />
    </>
  );
}

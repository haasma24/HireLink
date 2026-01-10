// app/dashboard/jobs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { applicationApi, getAuthToken } from '@/lib/api';
import { Job, JOB_TYPE_LABELS } from '@/types/application';
import JobCard from '@/app/components/JobCard'; 

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);
  const [showAIRecommendations, setShowAIRecommendations] = useState(true);
  const [filters, setFilters] = useState({
    job_type: '',
    location: '',
    search: '',
  });

  useEffect(() => {
    loadJobs();
    loadAIRecommendations();
  }, []);

  const loadJobs = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await applicationApi.getJobs(token, filters);
      setJobs(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAIRecommendations = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        return;
      }

      const data = await applicationApi.getAIRecommendations(token, 6); // Get top 6 AI recommendations
      if (data && data.recommendations) {
        setAiRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Failed to load AI recommendations:', error);
      // Don't show AI section if there's an error
      setShowAIRecommendations(false);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    loadJobs();
  };

  const clearFilters = () => {
    setFilters({
      job_type: '',
      location: '',
      search: '',
    });
  };

  const refreshAIRecommendations = () => {
    setAiLoading(true);
    loadAIRecommendations();
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center py-12">Loading jobs...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Available Jobs
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Find your next career opportunity
        </p>
      </div>

      {/* AI Recommendations Section */}
      {showAIRecommendations && !aiLoading && aiRecommendations.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded-lg">
                  🤖
                </span>
                AI Recommended Jobs For You
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                Personalized matches based on your skills and experience
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshAIRecommendations}
                className="px-4 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors border border-blue-200 dark:border-blue-700"
              >
                Refresh AI
              </button>
              <button
                onClick={() => setShowAIRecommendations(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              >
                Hide
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aiRecommendations.map((job) => (
              <JobCard key={job.id} job={job} showAIBadge={true} />
            ))}
          </div>
        </div>
      )}

      {aiLoading && showAIRecommendations && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-blue-200 dark:bg-blue-800 rounded-full mb-4"></div>
              <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-48 mb-2"></div>
              <div className="h-3 bg-blue-100 dark:bg-blue-900 rounded w-32"></div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              placeholder="Job title, keywords..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Job Type
            </label>
            <select
              value={filters.job_type}
              onChange={(e) => setFilters({...filters, job_type: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
            >
              <option value="">All Types</option>
              {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Location
            </label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              placeholder="City, Country..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Search Jobs
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-300"
          >
            Clear Filters
          </button>
          {!showAIRecommendations && (
            <button
              type="button"
              onClick={() => {
                setShowAIRecommendations(true);
                loadAIRecommendations();
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 transition-colors"
            >
              Show AI Recommendations
            </button>
          )}
        </div>
      </form>

      {/* All Jobs List */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          All Available Jobs ({jobs.length})
        </h2>
        
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No jobs found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Try adjusting your search filters
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} showAIBadge={false} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
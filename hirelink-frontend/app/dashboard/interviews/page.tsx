// app/dashboard/interviews/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { applicationApi, getAuthToken } from '@/lib/api';
import { Interview, INTERVIEW_TYPE_LABELS } from '@/types/application';

export default function InterviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await applicationApi.getInterviews(token);
      setInterviews(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Failed to load interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    const interviewDate = new Date(interview.scheduled_date);
    const now = new Date();
    
    if (filter === 'upcoming') return interviewDate >= now;
    if (filter === 'past') return interviewDate < now;
    return true; // 'all'
  });

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      relative: getRelativeTime(date)
    };
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays > 7 && diffDays <= 30) return `In ${Math.floor(diffDays / 7)} weeks`;
    if (diffDays < 0 && diffDays >= -1) return 'Yesterday';
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    return '';
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Interviews
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your scheduled interviews
            </p>
          </div>
          <Link
            href="/dashboard/applications"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            View Applications
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-4 mt-6">
          {(['upcoming', 'past', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === 'upcoming' 
                ? interviews.filter(i => new Date(i.scheduled_date) >= new Date()).length
                : tab === 'past'
                ? interviews.filter(i => new Date(i.scheduled_date) < new Date()).length
                : interviews.length})
            </button>
          ))}
        </div>
      </div>

      {filteredInterviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No {filter !== 'all' ? filter : ''} interviews found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {filter === 'upcoming'
              ? "You don't have any upcoming interviews scheduled."
              : filter === 'past'
              ? "You haven't had any interviews yet."
              : "You haven't been scheduled for any interviews."}
          </p>
          <Link
            href="/dashboard/applications"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View Your Applications
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredInterviews.map((interview) => {
            const { date, time, relative } = formatDateTime(interview.scheduled_date);
            const isUpcoming = new Date(interview.scheduled_date) >= new Date();
            
            return (
              <div
                key={interview.id}
                className={`bg-white dark:bg-gray-800 rounded-lg border ${
                  isUpcoming
                    ? 'border-blue-200 dark:border-blue-800'
                    : 'border-gray-200 dark:border-gray-700'
                } p-6`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                          {interview.job_title}
                        </h3>
                        <div className="flex items-center gap-4">
                          <p className="text-gray-600 dark:text-gray-300">
                            {interview.interviewer_name}
                          </p>
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            {INTERVIEW_TYPE_LABELS[interview.interview_type]}
                          </span>
                        </div>
                      </div>
                      {isUpcoming && (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {relative}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date & Time</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {date} at {time}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Duration: {interview.duration_minutes} minutes
                        </p>
                      </div>
                      
                      {interview.meeting_link && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Meeting Link</p>
                          <a
                            href={interview.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Join Meeting
                          </a>
                        </div>
                      )}
                    </div>

                    {interview.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {interview.notes}
                        </p>
                      </div>
                    )}

                    {interview.feedback && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Feedback</p>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <p className="text-gray-700 dark:text-gray-300">
                            {interview.feedback}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href={`/dashboard/applications/${interview.application}`}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    View Application Details
                  </Link>
                  
                  {isUpcoming && interview.meeting_link && (
                    <a
                      href={interview.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Join Interview
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
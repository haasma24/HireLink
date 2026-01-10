// app/dashboard/page.tsx - FIXED WITH OLD RECRUITER DESIGN
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, getAuthToken, applicationApi } from '@/lib/api';
import { APPLICATION_STATUS_LABELS } from '@/types/application';

type UserProfile = {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'candidate' | 'recruiter' | string;
  full_name?: string;
  is_validated?: boolean;
  profile_picture?: string;
  headline?: string;
  location?: string;
  skills?: string[];
  resume_url?: string;
  bio?: string;
};

type ApplicationStats = {
  total_applications: number;
  by_status: Record<string, number>;
  recent_applications: number;
  upcoming_interviews: number;
};

type QuickAction = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bgColor: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    const access = getAuthToken();

    if (!access) {
      router.replace('/login');
      return;
    }

    async function loadDashboard() {
      try {
        setLoading(true);
        
        // FIXED: Using correct endpoint '/users/profile/' instead of '/api/users/profile/'
        console.log('Fetching user profile from /users/profile/...');
        const userData = await apiFetch('/users/profile/', { method: 'GET' }, access!);
        
        console.log('User data received:', userData);
        
        // Calculate profile completion percentage
        let completion = 0;
        if (userData.full_name) completion += 20;
        if (userData.headline) completion += 15;
        if (userData.location) completion += 15;
        
        // Handle skills - check if it exists and has length
        const hasSkills = userData.skills && 
                         (Array.isArray(userData.skills) ? userData.skills.length > 0 : 
                          typeof userData.skills === 'string' ? userData.skills.trim().length > 0 : false);
        
        if (hasSkills) completion += 20;
        
        if (userData.resume_url) completion += 20;
        if (userData.bio) completion += 10;
        
        setCompletionPercentage(Math.min(completion, 100));
        
        const enhancedUserData: UserProfile = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          full_name: userData.full_name,
          is_validated: userData.is_validated,
          profile_picture: userData.profile_picture || null,
          headline: userData.headline || "Looking for new opportunities",
          location: userData.location || "Not specified",
          skills: userData.skills || [],
          resume_url: userData.resume_url || null,
          bio: userData.bio || "",
        };
        
        console.log('Enhanced user data:', enhancedUserData);
        setUser(enhancedUserData);

        if (userData.role === 'candidate') {
          try {
            console.log('Fetching candidate stats...');
            const statsData = await applicationApi.getApplicationStats(access!);
            console.log('Candidate stats:', statsData);
            setStats(statsData);
          } catch (statsError: any) {
            console.log('Stats endpoint not available:', statsError?.message);
            // Don't set error here, just log it
          }
        }
      } catch (err: any) {
        console.error('Error loading dashboard:', err);
        console.error('Error details:', err?.message, err?.status, err?.data);
        
        // More specific error messages
        if (err?.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('access_token');
          router.replace('/login');
        } else if (err?.status === 404) {
          setError('Profile endpoint not found. Please check backend configuration.');
        } else if (err?.status === 403) {
          setError('Access denied. You may not have permission to access this dashboard.');
        } else {
          setError(`Unable to load your profile: ${err?.message || 'Please try again.'}`);
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  // Candidate Quick Actions
  const candidateQuickActions: QuickAction[] = [
    {
      title: 'Find Jobs',
      description: 'Browse and apply to positions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      href: '/dashboard/jobs',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'My Applications',
      description: 'Track your applications',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/dashboard/applications',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      title: 'Interviews',
      description: 'View and manage interviews',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/dashboard/interviews',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'My Profile',
      description: 'Complete your profile',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      href: '/dashboard/profile',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20'
    }
  ];

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-red-800 dark:text-red-300">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Retry
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('access_token');
                  router.replace('/login');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  // RENDER RECRUITER DASHBOARD - OLD WORKING DESIGN
  if (user.role === 'recruiter') {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 text-slate-900 dark:text-slate-50">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Profile Card for Recruiter */}
          <section className="rounded-xl border border-slate-200 bg-white px-6 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
              Profile
            </h2>
            <div className="space-y-3">
              <p className="text-sm">
                <span className="text-slate-500 dark:text-slate-400">Name:</span>{' '}
                <span className="font-medium">
                  {user.full_name || user.username}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-slate-500 dark:text-slate-400">Email:</span>{' '}
                <span className="font-medium">{user.email}</span>
              </p>
              <p className="text-sm">
                <span className="text-slate-500 dark:text-slate-400">Role:</span>{' '}
                <span className="font-medium capitalize">{user.role}</span>
              </p>
              <p className="mt-4 text-sm text-slate-400">
                Recruiter account status:{' '}
                <span className={`font-semibold ${user.is_validated ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {user.is_validated ? '✓ Validated by administrator' : 'Pending validation'}
                </span>
              </p>
            </div>
          </section>

          {/* Quick Access for Recruiter */}
          <section className="rounded-xl border border-slate-200 bg-white px-6 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
              Quick Access
            </h2>
            <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-300">
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post a new job
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Manage received applications
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View all your job postings
              </li>
            </ul>
          </section>
        </div>

        {/* Job Management Section - Only for Recruiters */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-6 shadow-sm dark:border-slate-800 dark:bg-gradient-to-r dark:from-gray-900 dark:to-slate-900">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6">
            Job Management
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Link
              href="/dashboard/recruiter"
              className="block rounded-lg bg-white px-6 py-6 text-center shadow hover:shadow-md transition-all duration-300 hover:-translate-y-1 dark:bg-slate-800"
            >
              <div className="mb-4 inline-block rounded-lg bg-blue-100 p-4 dark:bg-blue-900/30">
                <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-200">
                Dashboard
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Statistics and overview
              </p>
            </Link>
            
            <Link
              href="/dashboard/recruiter/jobs/create"
              className="block rounded-lg bg-white px-6 py-6 text-center shadow hover:shadow-md transition-all duration-300 hover:-translate-y-1 dark:bg-slate-800"
            >
              <div className="mb-4 inline-block rounded-lg bg-green-100 p-4 dark:bg-green-900/30">
                <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-200">
                New Job
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Post a new job opening
              </p>
            </Link>
            
            <Link
              href="/dashboard/recruiter/jobs"
              className="block rounded-lg bg-white px-6 py-6 text-center shadow hover:shadow-md transition-all duration-300 hover:-translate-y-1 dark:bg-slate-800"
            >
              <div className="mb-4 inline-block rounded-lg bg-purple-100 p-4 dark:bg-purple-900/30">
                <svg className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-200">
                My Jobs
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Manage all my job postings
              </p>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // RENDER CANDIDATE DASHBOARD (with all the new fixes)
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Welcome */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, <span className="text-blue-600 dark:text-blue-400">{user.full_name?.split(' ')[0] || user.username}</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Here's what's happening with your job search today
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm font-medium rounded-full">
                Candidate
              </span>
              <Link
                href="/dashboard/profile"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Complete Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats ? (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Applications</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.total_applications || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                    <span className="mr-1">↑</span>
                    <span>{stats.recent_applications || 0} recent applications</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming Interviews</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.upcoming_interviews || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {/* Profile Completion Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Profile Completion</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{completionPercentage}%</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Resume Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resume Status</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {user.resume_url ? 'Uploaded' : 'Not Uploaded'}
                </p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              {user.resume_url ? (
                <a
                  href={user.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                >
                  View Resume
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              ) : (
                <Link
                  href="/dashboard/profile#resume"
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                >
                  Upload Resume
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Summary Card */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Profile Summary</h2>
                    <p className="text-gray-600 dark:text-gray-400">Your professional overview</p>
                  </div>
                  <Link
                    href="/dashboard/profile"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    Edit Profile
                  </Link>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800">
                      {user.profile_picture ? (
                        <img 
                          src={user.profile_picture} 
                          alt={user.full_name || user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl font-bold text-blue-600 dark:text-blue-300">
                            {user.full_name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user.full_name || user.username}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">{user.headline}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {user.location}
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {user.email}
                      </div>
                    </div>

                    {user.skills && user.skills.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Top Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(user.skills) ? (
                            <>
                              {user.skills.slice(0, 6).map((skill, index) => (
                                <span 
                                  key={index}
                                  className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-lg"
                                >
                                  {skill}
                                </span>
                              ))}
                              {user.skills.length > 6 && (
                                <span className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                                  +{user.skills.length - 6} more
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-lg">
                              {user.skills}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions for Candidates */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
              <div className="space-y-4">
                {candidateQuickActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className="flex items-center p-4 rounded-xl hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                  >
                    <div className={`p-3 rounded-lg ${action.bgColor} mr-4`}>
                      <div className={action.color}>
                        {action.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{action.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status Distribution (for candidates) */}
        {user.role === 'candidate' && stats && stats.by_status && Object.keys(stats.by_status).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Application Status</h2>
                <p className="text-gray-600 dark:text-gray-400">Distribution of your applications</p>
              </div>
              <Link 
                href="/dashboard/applications"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                View Details →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(stats.by_status).map(([status, count]) => {
                const getStatusColor = (status: string) => {
                  switch(status) {
                    case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                    case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
                    case 'interview_scheduled': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
                    case 'under_review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                    default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                  }
                };

                return (
                  <div key={status} className="text-center p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {count}
                    </div>
                    <div className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(status)}`}>
                      {APPLICATION_STATUS_LABELS[status as keyof typeof APPLICATION_STATUS_LABELS] || status}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
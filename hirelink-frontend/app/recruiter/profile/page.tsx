// app/recruiter/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type Company = {
  name: string;
  address?: string | null;
  website?: string | null;
};

type UserProfile = {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  date_of_birth?: string | null;
  role: string;
  profile_picture?: string | null;
  entreprise?: Company | null;
};

type RecruiterStats = {
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
};

type StatsResponse = {
  stats: RecruiterStats;
};

export default function RecruiterProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<RecruiterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check role on client side
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('user_role');
      if (role !== 'recruiter') {
        router.push('/login');
        return;
      }
    }
    loadData();
  }, [router]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Get token from client
      let token: string | null = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('access_token');
      }

      if (!token) {
        setError('Token not found, please log in again.');
        return;
      }

      const [userData, statsData] = await Promise.all([
        apiFetch('/users/profile/', {}, token),
        apiFetch('/jobs/recruiter/stats/', {}, token),
      ]);

      setProfile(userData as UserProfile);
      setStats((statsData as StatsResponse).stats);
    } catch (err: any) {
      console.error('Error loading recruiter profile:', err);
      setError(
        err?.message || 'Unable to load your recruiter profile.'
      );
    } finally {
      setLoading(false);
    }
  }

  const avatarInitials =
    profile?.full_name
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase() || 'HR';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Recruiter profile</h1>
            <p className="text-sm text-slate-400">
              Manage your personal information and your company details.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard/recruiter')}
            className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
          >
            Back to dashboard
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading || !profile ? (
          <p className="text-sm text-slate-300">
            Loading your profile...
          </p>
        ) : (
          <div className="space-y-6">
            {/* Top row: profile + company */}
            <section className="grid gap-4 md:grid-cols-2">
              {/* Recruiter profile card */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-5">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold">
                    {avatarInitials}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-50">
                      {profile.full_name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Recruiter
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Email
                    </p>
                    <p className="text-slate-100">{profile.email}</p>
                  </div>
                  {profile.phone && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Phone
                      </p>
                      <p className="text-slate-100">{profile.phone}</p>
                    </div>
                  )}
                  {profile.date_of_birth && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Date of birth
                      </p>
                      <p className="text-slate-100">
                        {profile.date_of_birth}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => router.push('/settings/profile')}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                  >
                    Edit profile
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/recruiter/jobs')}
                    className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    View my jobs
                  </button>
                </div>
              </div>

              {/* Company card */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-5">
                <h2 className="mb-3 text-base font-semibold text-slate-50">
                  Company
                </h2>

                {profile.entreprise ? (
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Name
                      </p>
                      <p className="text-slate-100">
                        {profile.entreprise.name}
                      </p>
                    </div>
                    {profile.entreprise.address && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Address
                        </p>
                        <p className="text-slate-100">
                          {profile.entreprise.address}
                        </p>
                      </div>
                    )}
                    {profile.entreprise.website && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Website
                        </p>
                        <a
                          href={
                            profile.entreprise.website.startsWith('http')
                              ? profile.entreprise.website
                              : `https://${profile.entreprise.website}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          {profile.entreprise.website}
                        </a>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => router.push('/settings/company')}
                      className="mt-2 rounded-md bg-slate-800 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-700"
                    >
                      Edit company information
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-slate-300">
                    <p>
                      No company information is associated with your account yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push('/settings/company')}
                      className="mt-3 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                    >
                      Add a company
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Quick stats */}
            <section>
              <h2 className="mb-3 text-sm font-semibold text-slate-200">
                Job statistics
              </h2>
              {stats ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs text-slate-400">
                      Jobs posted
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {stats.total_jobs}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs text-slate-400">
                      Active jobs
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {stats.active_jobs}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs text-slate-400">
                      Applications received
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {stats.total_applications}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No statistics available yet.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

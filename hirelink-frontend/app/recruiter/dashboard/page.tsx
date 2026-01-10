// app/recruiter/dashboard/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type JobStats = {
  id: number;
  title: string;
  location: string;
  created_at: string;
  total_applications: number;
  new: number;
  in_process: number;
  rejected: number;
  hired: number;
  last_activity_days: number | null;
  days_without_new_apps: number | null;
};

type Company = {
  name: string;
  address?: string | null;
  website?: string | null;
};

type UserProfile = {
  full_name: string;
  email: string;
  entreprise?: Company | null;
};

export default function RecruiterDashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobStats[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('user_role');
      if (role !== 'recruiter') {
        router.push('/login');
        return;
      }
    }
    loadDashboard();
  }, [router]);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      let token: string | null = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('access_token');
      }

      // profile needs token, dashboard endpoint already accepts token or uses session
      const [profileData, dashboardData] = await Promise.all([
        token ? apiFetch('/users/profile/', {}, token) : apiFetch('/users/profile/'),
        apiFetch('/users/recruiter/dashboard/'),
      ]);

      setProfile(profileData as UserProfile);
      setJobs((dashboardData as any).jobs || []);
    } catch (err: any) {
      console.error('Error loading recruiter dashboard:', err);
      setError(
        err?.message || 'Unable to load recruiter dashboard.'
      );
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(() => {
    const totalJobs = jobs.length;
    const totalApps = jobs.reduce((sum, j) => sum + j.total_applications, 0);
    const totalNew = jobs.reduce((sum, j) => sum + j.new, 0);
    return { totalJobs, totalApps, totalNew };
  }, [jobs]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Recruiter dashboard</h1>
            <p className="text-sm text-slate-400">
              Overview of your jobs and application pipeline.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.clear();
              }
              router.push('/login');
            }}
            className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
          >
            Logout
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-300">Loading your dashboard...</p>
        ) : (
          <div className="space-y-6">
            {/* Current company card (only current recruiter’s company) */}
            {profile?.entreprise && (
              <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-5">
                <h2 className="mb-3 text-base font-semibold text-slate-50">
                  Company
                </h2>
                <div className="space-y-2 text-sm">
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
                </div>
              </section>
            )}

            {/* Global cards (only for this recruiter’s jobs, already filtered by backend) */}
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs text-slate-400">Active jobs</p>
                <p className="mt-1 text-2xl font-semibold">
                  {jobs.filter((j) => j.total_applications >= 0).length}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs text-slate-400">Total applications</p>
                <p className="mt-1 text-2xl font-semibold">
                  {totals.totalApps}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs text-slate-400">New applications</p>
                <p className="mt-1 text-2xl font-semibold">
                  {totals.totalNew}
                </p>
              </div>
            </section>

            {/* Jobs table (already only this recruiter’s jobs, thanks to backend) */}
            {jobs.length === 0 ? (
              <p className="text-sm text-slate-300">
                You do not have any active jobs yet.
              </p>
            ) : (
              <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Job</th>
                      <th className="px-4 py-3">Applications</th>
                      <th className="px-4 py-3">Pipeline</th>
                      <th className="px-4 py-3">Activity</th>
                      <th className="px-4 py-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr
                        key={job.id}
                        className="border-t border-slate-800/80 hover:bg-slate-900/80"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{job.title}</div>
                          <div className="text-xs text-slate-400">
                            {job.location || '—'} • posted on {job.created_at}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-200">
                          {job.total_applications}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300">
                          New: {job.new} · In process: {job.in_process} ·
                          Rejected: {job.rejected} · Hired: {job.hired}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300">
                          Last action:{' '}
                          {job.last_activity_days !== null
                            ? `${job.last_activity_days} d`
                            : '—'}
                          <br />
                          Without new apps:{' '}
                          {job.days_without_new_apps !== null
                            ? `${job.days_without_new_apps} d`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/dashboard/recruiter/jobs/${job.id}`
                              )
                            }
                            className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500"
                          >
                            View applications
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

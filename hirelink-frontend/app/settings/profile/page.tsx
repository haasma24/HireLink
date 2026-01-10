'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type UserProfile = {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  date_of_birth?: string | null;
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);

      let token: string | null = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('access_token');
      }
      if (!token) {
        setError('Token not found, please log in again.');
        return;
      }

      const data = await apiFetch('/users/profile/', {}, token);
      const p = data as UserProfile;
      setProfile(p);
      setFullName(p.full_name || '');
      setPhone(p.phone || '');
      setDateOfBirth(p.date_of_birth || '');
    } catch (err: any) {
      setError(err?.message || 'Unable to load your profile.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      let token: string | null = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('access_token');
      }
      if (!token) {
        setError('Token not found, please log in again.');
        return;
      }

      const body = {
        full_name: fullName,
        phone,
        date_of_birth: dateOfBirth || null,
      };

      await apiFetch('/users/profile/', {
        method: 'PUT',
        body: JSON.stringify(body),
      }, token);

      setSuccess('Profile updated successfully.');
    } catch (err: any) {
      setError(err?.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Profile settings</h1>
            <p className="text-sm text-slate-400">
              Update your personal information used across HireLink.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
          >
            Back
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {success}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-300">Loading profile...</p>
        ) : !profile ? (
          <p className="text-sm text-slate-300">
            Profile not available.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/70 p-5"
          >
            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">
                Email (read‑only)
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full cursor-not-allowed rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-400"
              />
            </div>

            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">
                Date of birth
              </label>
              <input
                type="date"
                value={dateOfBirth || ''}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

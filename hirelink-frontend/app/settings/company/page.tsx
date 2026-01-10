// app/settings/company/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type Company = {
  id: number;
  name: string;
  address?: string | null;
  website?: string | null;
};

const COMPANY_URL = '/users/recruiter/company/';

export default function CompanySettingsPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
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

      const data = await apiFetch(COMPANY_URL, {}, token);
      if (data) {
        const c = data as Company;
        setCompany(c);
        setName(c.name || '');
        setAddress(c.address || '');
        setWebsite(c.website || '');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load company information.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        name,
        address: address || null,
        website: website || null,
      };

      await apiFetch(
        COMPANY_URL,
        {
          method: 'PUT',
          body: JSON.stringify(body),
        },
        token
      );

      setSuccess('Company information saved successfully.');
      await loadCompany();
    } catch (err: any) {
      setError(err?.message || 'Unable to save company information.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Company settings</h1>
            <p className="text-sm text-slate-400">
              Manage the company information displayed on your job postings.
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
          <p className="text-sm text-slate-300">Loading company information...</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/70 p-5"
          >
            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">
                Company name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">
                Address
              </label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving || !name}
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

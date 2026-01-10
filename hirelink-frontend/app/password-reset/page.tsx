// app/password-reset/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { apiFetch } from '@/lib/api';

export default function PasswordResetRequestPage() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim();

    if (!email) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/users/password-reset/', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      setMessage(
        data?.message ||
          "If an account exists for this email, a reset link has been sent."
      );
    } catch (err: any) {
      const msg =
        typeof err?.message === 'string' && err.message.trim()
          ? err.message
          : "Unable to send the reset email at this time.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address to receive a secure link."
    >
      {error && (
        <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          <p className="font-medium">Unable to send</p>
          <p className="mt-0.5 text-xs">{error}</p>
        </div>
      )}
      {message && (
        <div className="rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Email address
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  );
}
// app/reset-password/[uid]/[token]/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthLayout } from '../../../components/AuthLayout';
import { apiFetch } from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams<{ uid: string; token: string }>();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get('password') || '');
    const password2 = String(formData.get('password2') || '');

    if (!password || !password2) {
      setError('Please enter and confirm your new password.');
      setLoading(false);
      return;
    }
    if (password !== password2) {
      setError('The two passwords must match.');
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch(
        `/users/reset-password/${params.uid}/${params.token}/`,
        {
          method: 'POST',
          body: JSON.stringify({ password, password2 }),
        }
      );

      setMessage(
        data?.message || 'Your password has been successfully updated.'
      );
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      const msg =
        typeof err?.message === 'string' && err.message.trim()
          ? err.message
          : 'The reset link is invalid or has expired.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Enter a new password to secure your account."
    >
      {error && (
        <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          <p className="font-medium">Reset unsuccessful</p>
          <p className="mt-0.5 text-xs">{error}</p>
        </div>
      )}
      {message && (
        <div className="rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="New password"
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <div className="relative">
          <input
            name="password2"
            type={showPassword2 ? 'text' : 'password'}
            placeholder="Confirm password"
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword2(v => !v)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {showPassword2 ? 'Hide' : 'Show'}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Updating...' : 'Save new password'}
        </button>
      </form>
    </AuthLayout>
  );
}
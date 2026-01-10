// app/login/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '../components/AuthLayout';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    if (!email || !password) {
      setError('Please enter your email address and password.');
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/users/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user_role', data.role);
        localStorage.setItem('user_id', String(data.user_id));
      }

      setInfo('Login successful. Redirecting to your space.');
      const redirectTo =
        data.role === 'candidate'
          ? '/dashboard'
          : data.role === 'recruiter'
          ? '/dashboard/recruiter'
          : '/admin/dashboard';

      setTimeout(() => router.push(redirectTo), 800);
    } catch (err: any) {
      const msg =
        typeof err?.message === 'string' && err.message.trim()
          ? err.message
          : 'The provided credentials were not recognized. Please check your information and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Log in to HireLink"
      subtitle="Access your candidate, recruiter, or administrator space."
    >
      {error && (
        <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          <p className="font-medium">Unable to log in</p>
          <p className="mt-0.5 text-xs">{error}</p>
        </div>
      )}
      {info && (
        <div className="rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {info}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Email address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
              @
            </span>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50 dark:placeholder:text-slate-500"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Password
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50 dark:placeholder:text-slate-500"
              placeholder="Your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className="h-3 w-3 rounded border-slate-400 bg-white text-blue-500 dark:border-slate-600 dark:bg-slate-900"
            />
            Stay logged in on this device
          </label>
          <button
            type="button"
            onClick={() => router.push('/password-reset')}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="pt-2 text-center text-xs text-slate-600 dark:text-slate-300">
        New to HireLink?{' '}
        <button
          type="button"
          onClick={() => router.push('/register')}
          className="text-blue-600 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200"
        >
          Create a free account
        </button>
      </p>
    </AuthLayout>
  );
}
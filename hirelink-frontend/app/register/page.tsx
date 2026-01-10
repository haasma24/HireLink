// app/register/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '../components/AuthLayout';
import { apiFetch } from '@/lib/api';

type Role = 'candidate' | 'recruiter';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('candidate');
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

    const payload: any = {
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      password2: formData.get('password2'),
      role,
      full_name: formData.get('full_name'),
      phone: formData.get('phone'),
    };

    if (role === 'recruiter') {
      payload.entreprise = {
        name: formData.get('company_name'),
        address: formData.get('company_address'),
        website: formData.get('company_website'),
      };
    }

    if (!payload.password || !payload.password2) {
      setError('Please enter and confirm your password.');
      setLoading(false);
      return;
    }
    if (payload.password !== payload.password2) {
      setError('Passwords do not match. Please check and try again.');
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/users/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      setMessage(
        data.message ||
          (role === 'recruiter'
            ? 'Recruiter registration submitted. Your account will be validated by an administrator.'
            : 'Registration successful. You are now logged in.')
      );

      if (role === 'candidate') {
        if (
          typeof window !== 'undefined' &&
          data.access_token &&
          data.refresh_token
        ) {
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          localStorage.setItem('user_role', data.role || 'candidate');
          localStorage.setItem('user_id', String(data.user_id));
        }
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        setTimeout(() => router.push('/login'), 1500);
      }
    } catch (err: any) {
      const msg =
        typeof err?.message === 'string' && err.message.trim()
          ? err.message
          : 'A problem occurred during registration. Please check the information entered.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create a HireLink account"
      subtitle="Register as a candidate or recruiter."
    >
      {error && (
        <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          <p className="font-medium">Unable to complete registration</p>
          <p className="mt-0.5 text-xs">{error}</p>
        </div>
      )}
      {message && (
        <div className="rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            name="username"
            placeholder="Username"
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50 dark:placeholder:text-slate-500"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50 dark:placeholder:text-slate-500"
          />
        </div>

        <input
          name="full_name"
          placeholder="Full name"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50 dark:placeholder:text-slate-500"
        />

        <input
          name="phone"
          placeholder="Phone"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50 dark:placeholder:text-slate-500"
        />

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Role
          </label>
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50"
            required
          >
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
          </select>
        </div>

        {role === 'recruiter' && (
          <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 space-y-2">
            <p className="font-semibold text-sm">Company information</p>
            <div className="grid grid-cols-1 gap-2">
              <input
                name="company_name"
                placeholder="Company name"
                required={role === 'recruiter'}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-50"
              />
              <input
                name="company_address"
                placeholder="Address"
                required={role === 'recruiter'}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-50"
              />
              <input
                name="company_website"
                type="url"
                placeholder="Website (optional)"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-50"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
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
              onClick={() => setShowPassword2((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {showPassword2 ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Creating account...' : 'Create HireLink account'}
        </button>

        <p className="pt-1 text-center text-xs text-slate-600 dark:text-slate-300">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200"
          >
            Log in
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
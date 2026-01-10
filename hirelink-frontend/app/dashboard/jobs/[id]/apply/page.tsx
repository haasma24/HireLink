// app/dashboard/jobs/[id]/apply/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { applicationApi, getAuthToken } from '@/lib/api';
import { Job } from '@/types/application';

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [formData, setFormData] = useState({
    cover_letter: '',
    resume: null as File | null,
  });

  useEffect(() => {
    loadJob();
  }, [params.id]);

  const loadJob = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await applicationApi.getJob(Number(params.id), token);
      setJob(data);
      
      // Check if already applied
      if (data.has_applied) {
        router.push(`/dashboard/applications`);
      }
    } catch (error) {
      console.error('Failed to load job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      if (!formData.resume) {
        throw new Error('Please upload your resume');
      }

      await applicationApi.createApplication(token, {
        job: Number(params.id),
        cover_letter: formData.cover_letter,
        resume: formData.resume,
      });
      
      router.push('/dashboard/applications?success=true');
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center py-12">Loading...</div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Job not found
          </h2>
          <Link
            href="/dashboard/jobs"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            ← Back to Jobs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/dashboard/jobs/${params.id}`}
        className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 mb-6"
      >
        ← Back to Job Details
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Apply for {job.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          {job.company} • {job.location}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Cover Letter *
            </label>
            <textarea
              required
              rows={8}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
              placeholder="Tell us why you're the perfect candidate for this position..."
              value={formData.cover_letter}
              onChange={(e) => setFormData({...formData, cover_letter: e.target.value})}
            />
            <p className="mt-2 text-sm text-slate-500">
              Minimum 150 characters recommended
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Resume / CV *
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center">
              <input
                type="file"
                id="resume"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFormData({...formData, resume: e.target.files[0]});
                  }
                }}
              />
              {formData.resume ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{formData.resume.name}</p>
                    <p className="text-sm text-slate-500">
                      {(formData.resume.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, resume: null})}
                    className="text-red-600 hover:text-red-800 dark:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label htmlFor="resume" className="cursor-pointer">
                  <div className="mb-2">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                    </svg>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Click to upload your resume
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    PDF, DOC, DOCX up to 5MB
                  </p>
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t dark:border-slate-700">
            <Link
              href={`/dashboard/jobs/${params.id}`}
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !formData.resume}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
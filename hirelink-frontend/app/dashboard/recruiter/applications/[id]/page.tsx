'use client';

import { aiEmailApi, recruiterApi, getAuthToken } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ApplicationStatus,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
} from '@/types/application';

type RecruiterApplication = {
  id: number;
  status: ApplicationStatus;
  cover_letter: string;
  resume: string;
  notes: string;
  applied_at: string;
  updated_at: string;
  candidate_name: string;
  candidate_email?: string;
  candidate_username?: string;
  job_title: string;
  company_name: string;
};

export default function RecruiterApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [application, setApplication] = useState<RecruiterApplication | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | ''>(
    ''
  );
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [generatedEmail, setGeneratedEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const id = Number(params.id);

  useEffect(() => {
    loadApplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await recruiterApi.getApplication(token, id);
      setApplication(data);
      setSelectedStatus(data.status);
    } catch (err: any) {
      console.error('Failed to load recruiter application', err);
      setError(
        err?.message || 'Failed to load application. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus || !application) return;

    if (
      !confirm(
        `Confirm changing status to "${APPLICATION_STATUS_LABELS[selectedStatus] ||
          selectedStatus}" ?`
      )
    ) {
      return;
    }

    try {
      setUpdating(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      await recruiterApi.updateApplicationStatus(
        token,
        application.id,
        selectedStatus,
        reason || undefined
      );

      router.push('/dashboard/recruiter/applications?success=true');
    } catch (err: any) {
      console.error('Failed to update status', err);
      setError(
        err?.message || 'Failed to update status. Please try again.'
      );
    } finally {
      setUpdating(false);
    }
  };

  const generateEmailFromType = async (
    type: 'refus' | 'relance' | 'invitation'
  ) => {
    if (!application) return;

    try {
      setEmailLoading(true);
      setEmailError(null);
      setSendError(null);
      setSendSuccess(null);

      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const payload = {
        candidate_name: application.candidate_name,
        candidate_email: application.candidate_email || '',
        job_title: application.job_title,
        company_name: application.company_name,
        application_date: application.applied_at.slice(0, 10), // YYYY-MM-DD
        interview_date: null,
        email_type: type,
        language: 'en',
        tone: 'professional',
      };

      const data = await aiEmailApi.generateEmail(token, payload);
      setGeneratedEmail(data.email_body || '');
      setIsEditingEmail(false); // reset edit mode on new generation
    } catch (err: any) {
      console.error('Failed to generate email', err);
      setEmailError(
        err?.message || 'Failed to generate email. Please try again.'
      );
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGenerateEmail = (type: 'refus' | 'relance' | 'invitation') => {
    generateEmailFromType(type);
  };

  const handleRegenerateEmail = () => {
    // simple regenerate: reuse last type is not stored; easiest is to let user click again
    // here we just call follow-up by default, you can adapt if needed
    if (!application) return;
    // optional: show a confirm
    generateEmailFromType('relance');
  };

  const handleSendEmail = async () => {
  if (!application || !generatedEmail) return;

  // Email statique
  const toEmail = 'hammamiasma52@gmail.com';

  const confirmed = confirm(
    `Do you want to send this email to ${toEmail}?`
  );
  if (!confirmed) return;

  try {
    setSending(true);
    setSendError(null);
    setSendSuccess(null);

    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const payload = {
      to: toEmail,
      subject: `${application.job_title} – Application update`,
      body: generatedEmail,
    };

    await aiEmailApi.sendEmail(token, payload);
    setSendSuccess('Email sent successfully.');
  } catch (err: any) {
    console.error('Failed to send email', err);
    setSendError(
      err?.message || 'Failed to send email. Please try again.'
    );
  } finally {
    setSending(false);
  }
};

  const handleCopyToClipboard = async () => {
    if (!generatedEmail) return;
    try {
      await navigator.clipboard.writeText(generatedEmail);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } catch (e) {
      console.error('Clipboard error', e);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (!application) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Application not found
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            The application you are looking for does not exist or you do not
            have access to it.
          </p>
          <Link
            href="/dashboard/recruiter/applications"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to applications
          </Link>
        </div>
      </main>
    );
  }

  const statusOptions: ApplicationStatus[] = [
    'applied',
    'under_review',
    'shortlisted',
    'interview_scheduled',
    'interviewed',
    'rejected',
    'accepted',
    'offer_sent',
    'hired',
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* Toast copied */}
      {copiedToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-md shadow-lg">
          Copied to clipboard
        </div>
      )}

      <div className="mb-6">
        <Link
          href="/dashboard/recruiter/applications"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to applications
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {application.job_title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {application.company_name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Candidate:{' '}
                <span className="font-medium">
                  {application.candidate_name}
                </span>{' '}
                {application.candidate_email && (
                  <span>({application.candidate_email})</span>
                )}
              </p>
            </div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                APPLICATION_STATUS_COLORS[application.status] ||
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}
            >
              {APPLICATION_STATUS_LABELS[application.status] ||
                application.status}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Status update */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Update status
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-900 dark:text-white"
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as ApplicationStatus)
                  }
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {APPLICATION_STATUS_LABELS[s] || s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Internal note (optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-900 dark:text-white"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Add an internal note for this status change..."
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update status'}
              </button>
            </div>
          </div>

          {/* AI Email Generator */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI email
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Generate, edit and send a ready-to-send email to the candidate.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => handleGenerateEmail('refus')}
                disabled={emailLoading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                ✖ Refusal email
              </button>
              <button
                onClick={() => handleGenerateEmail('relance')}
                disabled={emailLoading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                🔁 Follow-up email
              </button>
              <button
                onClick={() => handleGenerateEmail('invitation')}
                disabled={emailLoading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                📅 Interview invite
              </button>
              {generatedEmail && (
                <button
                  onClick={handleRegenerateEmail}
                  disabled={emailLoading}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 disabled:opacity-50"
                >
                  🔁 Regenerate
                </button>
              )}
            </div>

            {emailLoading && (
              <div className="mt-2 animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            )}

            {emailError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                {emailError}
              </p>
            )}

            {generatedEmail && (
              <div className="mt-2 space-y-3">
                {/* Header actions for email editing */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Generated email
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(!isEditingEmail)}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    ✏️ {isEditingEmail ? 'Disable editing' : 'Edit email'}
                  </button>
                </div>

                {/* Editable / read-only textarea */}
                <textarea
                  className="w-full bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-80 overflow-auto border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                  value={generatedEmail}
                  onChange={(e) =>
                    isEditingEmail && setGeneratedEmail(e.target.value)
                  }
                  readOnly={!isEditingEmail}
                  rows={10}
                />

                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Copy to clipboard
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={sending}
                    className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Sending...' : 'Send email'}
                  </button>
                </div>

                {sendError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {sendError}
                  </p>
                )}
                {sendSuccess && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {sendSuccess}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Details - cover letter, resume, notes */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Application details
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Applied on
              </p>
              <p className="font-medium text-gray-900 dark:text-white mb-2">
                {new Date(application.applied_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last updated
              </p>
              <p className="font-medium text-gray-900 dark:text-white mb-4">
                {new Date(application.updated_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>

              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
                Resume
              </h4>
              <a
                href={application.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293L19 8.586A1 1 0 0119.293 9.293z"
                  />
                </svg>
                Download resume
              </a>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Cover letter
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-80 overflow-auto">
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {application.cover_letter}
                </p>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                Notes
              </h3>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300">
                  {application.notes || 'No notes yet.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

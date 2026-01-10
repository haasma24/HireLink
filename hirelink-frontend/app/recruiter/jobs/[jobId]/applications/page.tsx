// app/recruiter/jobs/[jobId]/applications/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type ApplicationStatus =
  | 'pending'
  | 'reviewed'
  | 'shortlisted'
  | 'interview'
  | 'accepted'
  | 'rejected';

type Applicant = {
  id: number;
  full_name: string;
  email: string;
};

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
};

type JobApplication = {
  id: number;
  status: ApplicationStatus;
  cover_letter?: string | null;
  resume?: string | null;
  applied_at: string;
  updated_at: string;
  applicant: Applicant;
  job: Job;
};

type AiEmailType = 'refus' | 'relance' | 'invitation';

export default function JobApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = Number(params?.jobId);

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<ApplicationStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // IA modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTargetApp, setAiTargetApp] = useState<JobApplication | null>(null);
  const [aiType, setAiType] = useState<AiEmailType>('refus');
  const [aiInterviewDate, setAiInterviewDate] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSubject, setAiSubject] = useState('');
  const [aiBody, setAiBody] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId || Number.isNaN(jobId)) {
      setError('Offre introuvable.');
      setLoading(false);
      return;
    }

    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('user_role');
      if (role !== 'recruiter') {
        router.push('/login');
        return;
      }
    }

    async function loadApplications() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch(`/jobs/recruiter/applications/${jobId}/`);
        const apps = (data as any).results || (data as any).applications || data;
        if (apps.length > 0) {
          setJob(apps[0].job as Job);
        }
        setApplications(apps as JobApplication[]);
      } catch (err: any) {
        setError(
          err.message ||
            "Impossible de charger les candidatures pour cette offre."
        );
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, [jobId, router]);

  const filteredApplications =
    statusFilter === 'all'
      ? applications
      : applications.filter((a) => a.status === statusFilter);

  function openAiModal(app: JobApplication) {
    setAiTargetApp(app);
    setAiType('refus');
    setAiInterviewDate('');
    setAiSubject('');
    setAiBody('');
    setAiError(null);
    setShowAiModal(true);
  }

  async function handleGenerateEmail() {
    if (!aiTargetApp) return;
    try {
      setAiLoading(true);
      setAiError(null);

      const payload: any = {
        type: aiType,
      };
      if (aiType === 'invitation' && aiInterviewDate) {
        payload.interview_date = aiInterviewDate;
      }

      // URL alignée avec Django: /api/jobs/recruiter/applications/<id>/generate-email/
      const data = await apiFetch(
        `/jobs/recruiter/applications/${aiTargetApp.id}/generate-email/`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      setAiSubject(data.subject || '');
      setAiBody(data.body || '');
    } catch (err: any) {
      setAiError(
        err.message ||
          "Impossible de générer l'email avec l'IA. Réessayez plus tard."
      );
    } finally {
      setAiLoading(false);
    }
  }

  function handleCopyToClipboard() {
    const text = `Sujet: ${aiSubject}\n\n${aiBody}`;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Candidatures pour l&apos;offre
            </h1>
            {job ? (
              <p className="text-sm text-slate-400">
                {job.title} · {job.company} · {job.location}
              </p>
            ) : (
              <p className="text-sm text-slate-400">Offre #{jobId}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => router.push('/recruiter/jobs')}
            className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
          >
            Retour à mes offres
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Filtres */}
        <section className="mb-4 flex flex-wrap items-center gap-3 text-xs text-slate-200">
          <span className="text-slate-400">Filtrer par statut :</span>
          {[
            { label: 'Tous', value: 'all' as const },
            { label: 'En attente', value: 'pending' as const },
            { label: 'Revu', value: 'reviewed' as const },
            { label: 'Shortlist', value: 'shortlisted' as const },
            { label: 'Entretien', value: 'interview' as const },
            { label: 'Accepté', value: 'accepted' as const },
            { label: 'Rejeté', value: 'rejected' as const },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={
                'rounded-full border px-3 py-1 ' +
                (statusFilter === opt.value
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800')
              }
            >
              {opt.label}
            </button>
          ))}
        </section>

        {/* Tableau candidatures */}
        {loading ? (
          <p className="text-sm text-slate-300">
            Chargement des candidatures...
          </p>
        ) : filteredApplications.length === 0 ? (
          <p className="text-sm text-slate-300">
            Aucune candidature pour ce filtre.
          </p>
        ) : (
          <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Candidat</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Candidature</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-t border-slate-800/80 hover:bg-slate-900/80"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {app.applicant.full_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {app.applicant.email}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-200">
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      Reçue le {app.applied_at.slice(0, 10)}
                      <br />
                      Maj le {app.updated_at.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openAiModal(app)}
                        className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        Réponse IA
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Modal IA */}
        {showAiModal && aiTargetApp && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-xl rounded-lg border border-slate-800 bg-slate-950 p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-50">
                  Générer une réponse IA
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Fermer
                </button>
              </div>

              <p className="mb-3 text-xs text-slate-400">
                Candidat :{' '}
                <span className="font-semibold text-slate-100">
                  {aiTargetApp.applicant.full_name}
                </span>{' '}
                · {aiTargetApp.applicant.email}
              </p>

              <div className="mb-3 grid gap-3 md:grid-cols-2">
                <div className="space-y-1 text-xs">
                  <label className="font-medium text-slate-200">
                    Type d&apos;email
                  </label>
                  <select
                    value={aiType}
                    onChange={(e) =>
                      setAiType(e.target.value as AiEmailType)
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-50 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="refus">Refus</option>
                    <option value="relance">Relance</option>
                    <option value="invitation">Invitation à un entretien</option>
                  </select>
                </div>

                {aiType === 'invitation' && (
                  <div className="space-y-1 text-xs">
                    <label className="font-medium text-slate-200">
                      Date d&apos;entretien
                    </label>
                    <input
                      type="datetime-local"
                      value={aiInterviewDate}
                      onChange={(e) => setAiInterviewDate(e.target.value)}
                      className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-50 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {aiError && (
                <div className="mb-3 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {aiError}
                </div>
              )}

              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleGenerateEmail}
                  disabled={aiLoading}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {aiLoading ? 'Génération...' : 'Générer avec l’IA'}
                </button>
                {aiBody && (
                  <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    Copier dans le presse-papiers
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-medium text-slate-200">
                    Sujet
                  </label>
                  <input
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-50 focus:border-blue-500 focus:outline-none"
                    placeholder="Sujet généré par l’IA"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-200">
                    Corps de l&apos;email
                  </label>
                  <textarea
                    value={aiBody}
                    onChange={(e) => setAiBody(e.target.value)}
                    rows={8}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-50 focus:border-blue-500 focus:outline-none"
                    placeholder="Texte généré par l’IA..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type Recruiter = {
  id: number;
  full_name: string;
  email: string;
  entreprise?: {
    name: string;
    address?: string;
    website?: string;
  } | null;
  is_validated: boolean;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('user_role');
      const access = localStorage.getItem('access_token');

      if (role !== 'admin' || !access) {
        router.push('/login');
        return;
      }

      fetchRecruiters(access);
    }
  }, [router]);

  async function fetchRecruiters(access: string) {
    try {
      setLoading(true);
      setError(null);

      const data = await apiFetch('/users/recruiters/', {}, access);
      setRecruiters(data as Recruiter[]);
    } catch (err: any) {
      console.error('Admin fetchRecruiters error:', err);
      const backend = err?.data || err;
      const msg =
        backend?.detail ||
        err?.message ||
        "Impossible de charger les recruteurs.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleValidate(id: number) {
    const access = typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;

    if (!access) {
      setError("Session expirée. Veuillez vous reconnecter.");
      router.push('/login');
      return;
    }

    try {
      setActionLoadingId(id);
      setError(null);
      setInfo(null);

      await apiFetch(`/users/validate-recruiter/${id}/`, {
        method: 'POST',
      }, access);

      setInfo("Compte recruteur validé avec succès.");
      setRecruiters(prev =>
        prev.map(r =>
          r.id === id ? { ...r, is_validated: true } : r
        ),
      );
    } catch (err: any) {
      console.error('Admin validate error:', err);
      const backend = err?.data || err;
      const msg =
        backend?.detail ||
        err?.message ||
        "Erreur lors de la validation du recruteur.";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Tableau de bord administrateur
            </h1>
            <p className="text-sm text-slate-400">
              Gérez les comptes recruteurs et leur validation.
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
            Déconnexion
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {info}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-300">Chargement des recruteurs...</p>
        ) : recruiters.length === 0 ? (
          <p className="text-sm text-slate-300">
            Aucun recruteur en attente pour le moment.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Recruteur</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Entreprise</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recruiters.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-slate-800/80 hover:bg-slate-900/80"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {r.full_name || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{r.email}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {r.entreprise?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          r.is_validated
                            ? 'rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300'
                            : 'rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300'
                        }
                      >
                        {r.is_validated ? 'Validé' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!r.is_validated && (
                        <button
                          type="button"
                          onClick={() => handleValidate(r.id)}
                          disabled={actionLoadingId === r.id}
                          className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                        >
                          {actionLoadingId === r.id
                            ? 'Validation...'
                            : 'Valider'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

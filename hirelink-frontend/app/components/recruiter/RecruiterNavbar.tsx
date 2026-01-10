// components/recruiter/RecruiterNavbar.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function RecruiterNavbar() {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
    }
    router.push('/login');
  };

  return (
    <nav className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3">
      <div className="flex items-center gap-6">
        <Link href="/recruiter/dashboard" className="text-lg font-semibold text-white">
          HireLink 
        </Link>
        <div className="hidden gap-4 text-sm text-slate-300 md:flex">
          <Link href="/dashboard/recruiter">Dashboard</Link>
          <Link href="/dashboard/recruiter/jobs">My jobs</Link>
          <Link href="/dashboard/recruiter/applications">Applications</Link>
          <Link href="/recruiter/profile">Profile</Link>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <button
          onClick={() => router.push('/settings/profile')}
          className="rounded-md border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800"
        >
          Settings
        </button>
        <button
          onClick={handleLogout}
          className="rounded-md bg-red-600 px-3 py-1 text-white hover:bg-red-500"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

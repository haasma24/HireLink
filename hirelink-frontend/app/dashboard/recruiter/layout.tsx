// app/dashboard/recruiter/layout.tsx
'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { RecruiterNavbar } from '@/app/components/recruiter/RecruiterNavbar';

export default function DashboardRecruiterLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Hide recruiter navbar on settings pages
  const hideRecruiterNavbar =
    pathname === '/settings/profile' || pathname === '/settings/company';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {!hideRecruiterNavbar && <RecruiterNavbar />}
      <main className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}

// app/settings/layout.tsx
'use client';

import type { ReactNode } from 'react';
import { RecruiterNavbar } from '@/app/components/recruiter/RecruiterNavbar';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <RecruiterNavbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}

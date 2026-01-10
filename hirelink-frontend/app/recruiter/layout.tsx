// app/recruiter/layout.tsx
import type { ReactNode } from 'react';
import { RecruiterNavbar } from '@/app/components/recruiter/RecruiterNavbar';

export default function RecruiterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <RecruiterNavbar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </div>
    </div>
  );
}

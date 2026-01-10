// app/components/AuthLayout.tsx
'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500">
      <div className="relative w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-2xl shadow-slate-900/40 border border-slate-200 dark:border-slate-800 overflow-hidden backdrop-blur">
        {/* Colonne gauche : contenu */}
        <div className="p-8 md:p-10 flex flex-col justify-center space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                {subtitle}
              </p>
            )}
          </div>
          <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
            {children}
          </div>
        </div>

        {/* Colonne droite : image + overlay */}
        <div className="hidden md:block relative">
          <Image
            src="/login.png"
            alt="Interface HireLink"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/70 via-slate-900/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 space-y-2 text-slate-50">
            <h2 className="text-xl font-semibold">HireLink</h2>
            <p className="text-xs text-slate-200">
              Track applications, manage offers, and collaborate with recruiters in a seamless interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

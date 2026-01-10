// app/ThemeProvider.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { Theme } from '@/lib/theme';
import { getInitialTheme } from '@/lib/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  // toutes les routes recruteur: /recruiter/* ET /dashboard/recruiter/*
  const isRecruiterRoute =
    pathname?.startsWith('/recruiter') === true ||
    pathname?.startsWith('/dashboard/recruiter') === true ||
    pathname?.startsWith('/settings') === true;

  return (
    <>
      {!isRecruiterRoute && (
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <a
              href="/"
              className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50"
            >
              HireLink
            </a>
            <div className="flex items-center gap-4 text-sm">
              <nav className="hidden sm:flex gap-4 text-slate-600 dark:text-slate-200">
                <a href="/login" className="hover:text-slate-900 dark:hover:text-white">
                  Login
                </a>
                <a href="/register" className="hover:text-slate-900 dark:hover:text-white">
                  Register
                </a>
                <a href="/dashboard" className="hover:text-slate-900 dark:hover:text-white">
                  Dashboard
                </a>
              </nav>
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-700 shadow-sm hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    theme === 'dark' ? 'bg-slate-50' : 'bg-slate-900'
                  }`}
                />
                <span>{theme === 'dark' ? 'Mode sombre' : 'Mode clair'}</span>
              </button>
            </div>
          </div>
        </header>
      )}
      {children}
    </>
  );
}

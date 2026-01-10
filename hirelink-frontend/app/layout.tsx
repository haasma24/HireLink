// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from './ThemeProvider';

export const metadata: Metadata = {
  title: 'HireLink',
  description: 'Job Portal HireLink',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-300">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

// src/app/(marketing)/reset-password/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import ResetPasswordForm from '@/features/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Restablecer contraseña | KCE',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-blue/10 mb-4">
            <KeyRound className="h-7 w-7 text-brand-blue" />
          </div>
          <h1 className="font-heading text-3xl text-[color:var(--color-text)]">
            Nueva contraseña
          </h1>
          <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
            Elige una contraseña segura para tu cuenta KCE.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-soft">
          <ResetPasswordForm />
        </div>

        <p className="mt-6 text-center text-xs text-[color:var(--color-text-muted)]">
          ¿Recordaste tu contraseña?{' '}
          <Link href="/account" className="text-brand-blue hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}

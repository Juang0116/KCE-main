// src/app/(marketing)/forgot-password/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageShell } from '@/components/layout/PageShell';
import ForgotPasswordForm from '@/features/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Restablecer contraseña | KCE',
  description: 'Recupera el acceso a tu cuenta y crea una nueva contraseña de forma segura.',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <PageShell className="px-6 py-12 md:py-16">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text)]/70">
            Account · Security
          </div>

          <h1 className="font-heading text-3xl tracking-tight text-brand-blue">
            Restablecer contraseña
          </h1>

          <p className="text-sm text-[color:var(--color-text)]/70">
            Te enviaremos un enlace seguro a tu email para crear una nueva contraseña.
          </p>
        </header>

        <section className="card p-6 md:p-8">
          <ForgotPasswordForm />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-brand-blue underline underline-offset-4 hover:opacity-90"
            >
              ← Volver a iniciar sesión
            </Link>

            <Link
              href="/contact"
              className="text-sm text-[color:var(--color-text)]/70 underline underline-offset-4 hover:text-[color:var(--color-text)]"
            >
              ¿No te llega el email? Contáctanos
            </Link>
          </div>

          <p className="mt-4 text-xs text-[color:var(--color-text)]/55">
            Tip: revisa Spam/Promociones. Si tu correo tiene filtros, agrega{' '}
            <span className="font-mono">support@kce.travel</span> a tus contactos.
          </p>
        </section>
      </div>
    </PageShell>
  );
}

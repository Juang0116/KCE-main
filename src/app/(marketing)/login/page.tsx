// src/app/(marketing)/login/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageShell } from '@/components/layout/PageShell';
import LoginForm from '@/features/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar sesión | KCE',
  description: 'Accede a tu cuenta para gestionar reservas, soporte y wishlist.',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <PageShell className="px-6 py-12 md:py-16">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text)]/70">
            Account · Access
          </div>

          <h1 className="font-heading text-3xl tracking-tight text-brand-blue">Iniciar sesión</h1>

          <p className="text-sm text-[color:var(--color-text)]/70">
            Entra con tu email y contraseña o usa un enlace mágico. Tu cuenta te permite ver
            reservas, tickets y guardar tours.
          </p>
        </header>

        <section className="card p-6 md:p-8">
          <LoginForm />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-brand-blue underline underline-offset-4 hover:opacity-90"
            >
              Olvidé mi contraseña
            </Link>

            <Link
              href="/contact"
              className="text-sm text-[color:var(--color-text)]/70 underline underline-offset-4 hover:text-[color:var(--color-text)]"
            >
              ¿Problemas para entrar? Contáctanos
            </Link>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">
              Consejo rápido
            </div>
            <p className="mt-1 text-xs text-[color:var(--color-text)]/60">
              Si usas enlace mágico, revisa Spam/Promociones. Para mejor entrega, agrega{' '}
              <span className="font-mono">support@kce.travel</span> a tus contactos.
            </p>
          </div>
        </section>

        <nav className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
          <Link
            href="/tours"
            className="text-[color:var(--color-text)]/70 underline underline-offset-4 hover:text-[color:var(--color-text)]"
          >
            Ver tours
          </Link>
          <Link
            href="/faq"
            className="text-[color:var(--color-text)]/70 underline underline-offset-4 hover:text-[color:var(--color-text)]"
          >
            FAQ
          </Link>
          <Link
            href="/"
            className="text-[color:var(--color-text)]/70 underline underline-offset-4 hover:text-[color:var(--color-text)]"
          >
            Inicio
          </Link>
        </nav>
      </div>
    </PageShell>
  );
}

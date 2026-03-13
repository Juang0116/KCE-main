// src/app/(marketing)/register/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

import RegisterForm from '@/features/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Crear cuenta | KCE',
  description: 'Crea tu cuenta en KCE con email y contraseña para gestionar reservas y wishlist.',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="card p-10">
        {/* Hero */}
        <header className="max-w-2xl">
          <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs text-[color:var(--color-text)]/70">
            Cuenta KCE · Email + contraseña
          </div>

          <h1 className="mt-4 font-heading text-3xl text-brand-blue md:text-4xl">
            Crea tu cuenta
          </h1>

          <p className="mt-3 text-[color:var(--color-text)]/75">
            Guarda tus tours favoritos, gestiona tus reservas y recibe soporte de forma más rápida.
          </p>
        </header>

        {/* Form */}
        <div className="mt-8">
          <RegisterForm />
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-5 py-4">
          <p className="text-sm text-[color:var(--color-text)]/75">
            ¿Ya tienes cuenta?
            <Link
              href="/login"
              className="ml-2 text-brand-blue underline underline-offset-4 hover:opacity-90"
            >
              Inicia sesión
            </Link>
          </p>

          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/privacy"
              className="text-brand-blue underline underline-offset-4 hover:opacity-90"
            >
              Privacidad
            </Link>
            <Link
              href="/cookies"
              className="text-brand-blue underline underline-offset-4 hover:opacity-90"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

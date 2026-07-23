/* src/app/(marketing)/verify-email/page.tsx */
import type { Metadata } from 'next';
import { ShieldCheck, Fingerprint, Lock, ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import VerifyEmailView from '@/features/auth/VerifyEmailView';
import Link from 'next/link';

export const revalidate = 0;

const BASE_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  'https://kce.travel'
).replace(/\/+$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(BASE_SITE_URL),
  title: 'Verifica tu cuenta | KCE',
  description:
    'Proceso de validación de identidad para activar el acceso premium a Knowing Cultures S.A.S.',
  robots: { index: false, follow: true },
};

export default function VerifyEmailPage() {
  return (
    <PageShell className="relative flex min-h-screen animate-fade-in flex-col items-center justify-center overflow-hidden bg-base px-6 py-12">
      {/* Glows ambientales de seguridad */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-full max-w-4xl -translate-x-1/2 rounded-full bg-brand-blue/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-[480px]">
        {/* 01. AUTH HEADER (Minimalist Authority) */}
        <header className="mb-12 flex flex-col items-center text-center">
          <div className="group relative mb-10">
            {/* Efecto de radar de seguridad */}
            <div className="absolute inset-0 scale-150 animate-pulse rounded-full bg-brand-blue/20 opacity-50 blur-2xl" />

            <div className="relative flex h-20 w-20 items-center justify-center rounded-[2rem] border border-brand-dark/10 bg-surface text-brand-blue shadow-soft transition-all duration-700 group-hover:rotate-12 group-hover:scale-110 dark:border-white/10">
              <Fingerprint className="h-10 w-10 stroke-[1.25px]" />
            </div>
          </div>

          <h1 className="mb-4 font-heading text-4xl leading-tight tracking-tight text-main md:text-5xl">
            Validación de <br />
            <span className="font-light italic text-brand-blue opacity-90">Credenciales.</span>
          </h1>

          <p className="mx-auto max-w-[340px] text-base font-light leading-relaxed text-muted">
            Estamos asegurando tu identidad para habilitar tu acceso exclusivo al ecosistema de{' '}
            <span className="font-medium text-main">KCE</span>.
          </p>
        </header>

        {/* 02. THE VALIDATION VAULT (Premium Card) */}
        <div className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
          {/* Línea de acento superior dinámica */}
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent" />

          <div className="relative z-10 p-10 md:p-14">
            {/* El componente funcional VerifyEmailView maneja los estados internos */}
            <VerifyEmailView />
          </div>

          {/* Sutil indicativo de encriptación inferior */}
          <div className="flex items-center justify-center gap-3 border-t border-brand-dark/5 bg-surface-2 px-10 py-5 dark:border-white/5">
            <Lock className="h-3.5 w-3.5 text-brand-blue opacity-40" />
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted opacity-60">
              Protocolo de Seguridad SSL/TLS 1.3
            </span>
          </div>
        </div>

        {/* 03. SUPPORT FOOTER */}
        <footer className="mt-12 text-center">
          <div className="flex flex-col items-center gap-8">
            <div className="h-px w-16 bg-brand-dark/5 dark:bg-white/5" />

            <div className="space-y-5">
              <p className="text-[10px] font-bold uppercase leading-relaxed tracking-[0.2em] text-muted">
                ¿Problemas con el enlace? <br />
                <Link
                  href="/contact"
                  className="mt-2 inline-flex items-center gap-1 text-brand-blue transition-all hover:text-brand-dark"
                >
                  Contactar Soporte Técnico <ArrowRight className="h-3 w-3" />
                </Link>
              </p>

              <div className="flex flex-col gap-2">
                <p className="text-muted/30 text-[9px] font-bold uppercase tracking-[0.4em]">
                  Knowing Cultures S.A.S.
                </p>
                <p className="text-muted/20 text-[8px] uppercase tracking-[0.2em]">
                  Bogotá, Colombia · 2026
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Marca de agua de seguridad al fondo */}
      <ShieldCheck className="pointer-events-none fixed -bottom-20 -left-20 h-96 w-96 -rotate-12 text-brand-blue/[0.02]" />
    </PageShell>
  );
}

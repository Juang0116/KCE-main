// src/app/(marketing)/reset-password/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound, ShieldCheck, ArrowLeft } from 'lucide-react';
import ResetPasswordForm from '@/features/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Restablecer contraseña | KCE',
  description: 'Define una nueva contraseña segura para tu cuenta de viajero KCE.',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen animate-fade-in flex-col items-center justify-center overflow-hidden bg-base px-6 py-24">
      {/* Destellos ambientales sutiles */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-full max-w-4xl -translate-x-1/2 rounded-full bg-brand-blue/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-brand-yellow/5 blur-[100px]" />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Encabezado Editorial */}
        <div className="mb-10 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-blue/10 bg-brand-blue/5 shadow-sm transition-transform duration-500 hover:scale-105">
            <KeyRound className="h-8 w-8 text-brand-blue" />
          </div>

          <h1 className="mb-3 font-heading text-4xl leading-tight tracking-tight text-main">
            Nueva contraseña
          </h1>

          <p className="text-base font-light leading-relaxed text-muted">
            Define una llave segura para recuperar el acceso a tu espacio{' '}
            <span className="italic text-brand-blue">KCE</span>.
          </p>
        </div>

        {/* Tarjeta del Formulario (Premium Surface) */}
        <div className="group relative overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/10 bg-surface p-8 shadow-pop dark:border-white/10 md:p-10">
          {/* Línea de acento superior */}
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-brand-blue/40 to-transparent" />

          <ResetPasswordForm />

          <div className="mt-8 flex items-center justify-center gap-2 border-t border-brand-dark/5 pt-6 dark:border-white/5">
            <ShieldCheck className="h-4 w-4 text-green-600/50" />
            <span className="text-muted/60 text-[10px] font-bold uppercase tracking-widest">
              Conexión Segura AES-256
            </span>
          </div>
        </div>

        {/* Footer de navegación */}
        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:text-brand-blue"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>

      {/* Marca de agua sutil en el footer de la página */}
      <div className="absolute bottom-8 left-0 w-full text-center">
        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-muted opacity-30">
          Knowing Cultures Enterprise · 2026
        </p>
      </div>
    </main>
  );
}

/* src/app/(marketing)/forgot-password/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react';

import { PageShell } from '@/components/layout/PageShell';
import ForgotPasswordForm from '@/features/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Restablecer contraseña | KCE',
  description: 'Recupera el acceso a tu cuenta y crea una nueva contraseña de forma segura.',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <PageShell className="relative flex min-h-screen animate-fade-in flex-col items-center justify-center overflow-hidden bg-base px-6 py-12 md:py-24">
      {/* Destello Ambiental Sutil (Glow) para dar sensación de profundidad */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue/5 blur-[100px]" />

      {/* Contenedor de la Bóveda */}
      <div className="relative z-10 w-full max-w-md">
        {/* Branding / Área del Ícono */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-brand-dark/5 bg-surface-2 text-brand-blue shadow-sm dark:border-white/5">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="mb-4 font-heading text-4xl tracking-tight text-main md:text-5xl">
            ¿Olvidaste tu clave?
          </h1>
          <p className="px-4 text-base font-light leading-relaxed text-muted">
            Ingresa tu correo y te enviaremos un enlace seguro para restablecerla y recuperar el
            acceso a tu viaje.
          </p>
        </div>

        {/* Tarjeta del Formulario (Premium) */}
        <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface p-8 shadow-soft dark:border-white/5 md:p-10">
          <ForgotPasswordForm />
        </div>

        {/* Acciones del Footer */}
        <div className="mt-10 flex flex-col items-center gap-8 text-center">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted transition-colors hover:text-brand-blue"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Volver al inicio de sesión
          </Link>

          <div className="bg-surface-2/50 inline-flex items-center gap-2 rounded-full border border-brand-dark/5 px-5 py-2.5 shadow-sm backdrop-blur-md dark:border-white/5">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
              Conexión Encriptada
            </span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

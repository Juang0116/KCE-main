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
    <PageShell className="min-h-screen flex flex-col items-center justify-center px-6 py-12 md:py-24 bg-[var(--color-bg)] animate-fade-in relative overflow-hidden">
      
      {/* Destello Ambiental Sutil (Glow) para dar sensación de profundidad */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-96 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Contenedor de la Bóveda */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Branding / Área del Ícono */}
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-brand-blue shadow-sm">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="font-heading text-4xl text-[var(--color-text)] tracking-tight mb-3">
            ¿Olvidaste tu clave?
          </h1>
          <p className="text-base font-light text-[var(--color-text-muted)] leading-relaxed px-4">
            Ingresa tu correo y te enviaremos un enlace seguro para restablecerla y recuperar el acceso a tu viaje.
          </p>
        </div>

        {/* Tarjeta del Formulario (Glassmorphism Premium) */}
        <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl p-8 md:p-10 shadow-soft">
          <ForgotPasswordForm />
        </div>

        {/* Acciones del Footer */}
        <div className="mt-8 text-center flex flex-col items-center gap-8">
          <Link 
            href="/login" 
            className="group inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-brand-blue transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> 
            Volver al inicio de sesión
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 px-4 py-2 shadow-sm backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-success)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
              Conexión Encriptada
            </span>
          </div>
        </div>

      </div>
    </PageShell>
  );
}
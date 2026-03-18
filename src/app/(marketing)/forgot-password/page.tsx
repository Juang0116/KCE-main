import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react';

import { PageShell } from '@/components/layout/PageShell';
import ForgotPasswordForm from '@/features/auth/ForgotPasswordForm';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Restablecer contraseña | KCE',
  description: 'Recupera el acceso a tu cuenta y crea una nueva contraseña de forma segura.',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <PageShell className="min-h-[90vh] flex flex-col items-center justify-center px-6 py-12 md:py-24 bg-[var(--color-bg)]">
      
      {/* Vault Container */}
      <div className="w-full max-w-md">
        
        {/* Branding/Icon Area */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue border border-brand-blue/10 shadow-sm">
            <KeyRound className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-3xl text-brand-blue mb-3">¿Olvidaste tu clave?</h1>
          <p className="text-sm font-light text-[var(--color-text)]/60 leading-relaxed">
            No te preocupes, sucede. Ingresa tu correo y te enviaremos un enlace seguro para restablecerla.
          </p>
        </div>

        {/* The Form Card */}
        <div className="overflow-hidden rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-10 shadow-2xl relative">
          {/* Subtle security accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue/20 via-brand-blue to-brand-blue/20"></div>
          
          <ForgotPasswordForm />
        </div>

        {/* Footer Actions */}
        <div className="mt-8 text-center space-y-6">
          <Button asChild variant="ghost" className="text-[var(--color-text)]/50 hover:text-brand-blue transition-colors">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium">
              <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
            </Link>
          </Button>

          <div className="pt-8 border-t border-[var(--color-border)]">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">
                Conexión Encriptada
              </span>
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
}
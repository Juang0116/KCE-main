import type { Metadata } from 'next';
import { MailCheck, ShieldCheck } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import VerifyEmailView from '@/features/auth/VerifyEmailView';

export const revalidate = 0;

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(BASE_SITE_URL),
  title: 'Verifica tu cuenta | KCE',
  description: 'Confirma tu dirección de correo electrónico para activar tu acceso premium a Knowing Cultures Enterprise.',
  robots: { index: false, follow: true },
};

export default function VerifyEmailPage() {
  return (
    <PageShell className="bg-[var(--color-bg)] min-h-[90vh] flex flex-col items-center justify-center px-6 py-12 md:py-24">
      
      <div className="w-full max-w-md">
        
        {/* Brand Header Context */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue border border-brand-blue/10 shadow-sm">
            <MailCheck className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-3xl text-brand-blue mb-3">Verificación de Cuenta</h1>
          <p className="text-sm font-light text-[var(--color-text)]/60 leading-relaxed">
            Estamos validando tus credenciales para asegurar que tu acceso a KCE sea totalmente seguro.
          </p>
        </div>

        {/* The Vault Card - Wrapper para el componente funcional */}
        <div className="overflow-hidden rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 shadow-2xl relative">
          {/* Sutil acento de seguridad superior */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-blue via-brand-yellow to-brand-blue"></div>
          
          <div className="relative z-10">
            <VerifyEmailView />
          </div>
        </div>

        {/* Trust Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)]">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-blue/40" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">
              Protección de Identidad KCE
            </span>
          </div>
          <p className="mt-6 text-[10px] text-[var(--color-text)]/30 uppercase tracking-[0.2em] font-medium italic">
            Knowing Cultures Enterprise · 2026
          </p>
        </div>

      </div>
    </PageShell>
  );
}
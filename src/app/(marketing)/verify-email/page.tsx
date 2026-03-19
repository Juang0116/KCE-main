import type { Metadata } from 'next';
import { MailCheck, ShieldCheck, Fingerprint } from 'lucide-react';
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
    <PageShell className="bg-[var(--color-bg)] min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-fade-in">
      
      <div className="w-full max-w-[480px]">
        
        {/* 01. AUTH HEADER (Minimalist Authority) */}
        <header className="mb-12 text-center flex flex-col items-center">
          <div className="relative mb-8 group">
            {/* Glow Effect de Fondo */}
            <div className="absolute inset-0 bg-brand-blue/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] text-brand-blue shadow-soft transition-transform duration-500 group-hover:-translate-y-1">
              <Fingerprint className="h-10 w-10 stroke-[1.5px]" />
            </div>
          </div>
          
          <h1 className="font-heading text-4xl text-[var(--color-text)] tracking-tight mb-4">
            Validación de <br />
            <span className="text-brand-blue italic font-light">Credenciales.</span>
          </h1>
          
          <p className="text-base font-light text-[var(--color-text-muted)] leading-relaxed max-w-[320px]">
            Estamos asegurando tu identidad para habilitar tu acceso al ecosistema de KCE.
          </p>
        </header>

        {/* 02. THE VALIDATION VAULT */}
        <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-pop relative group">
          {/* Subtle Security Line (Zero-Pattern accent) */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-yellow/40 to-transparent" />
          
          <div className="p-10 md:p-14 relative z-10">
            {/* El componente funcional VerifyEmailView debería manejar sus propios estados de carga y error con este mismo estilo */}
            <VerifyEmailView />
          </div>

          {/* Sutil indicativo de encriptación inferior */}
          <div className="bg-[var(--color-surface-2)]/50 border-t border-[var(--color-border)] px-10 py-4 flex items-center justify-center gap-3">
             <ShieldCheck className="h-3.5 w-3.5 text-brand-blue opacity-40" />
             <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-50">
               Encriptación AES-256 de Grado Militar
             </span>
          </div>
        </div>

        {/* 03. SUPPORT FOOTER */}
        <footer className="mt-12 text-center">
          <div className="inline-flex flex-col items-center gap-6">
            <div className="h-px w-12 bg-[var(--color-border)]" />
            
            <div className="space-y-4">
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] font-medium leading-loose opacity-60">
                ¿Problemas con el enlace? <br/>
                <a href="/contact" className="text-brand-blue border-b border-brand-blue/20 hover:border-brand-blue transition-all">
                  Contactar Soporte Técnico
                </a>
              </p>
              
              <p className="text-[9px] text-[var(--color-text-muted)]/30 uppercase tracking-[0.3em] font-bold italic">
                Knowing Cultures Enterprise · 2026
              </p>
            </div>
          </div>
        </footer>

      </div>
    </PageShell>
  );
}
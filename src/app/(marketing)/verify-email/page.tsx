/* src/app/(marketing)/verify-email/page.tsx */
import type { Metadata } from 'next';
import { ShieldCheck, Fingerprint, Lock, ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import VerifyEmailView from '@/features/auth/VerifyEmailView';
import Link from 'next/link';

export const revalidate = 0;

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(BASE_SITE_URL),
  title: 'Verifica tu cuenta | KCE',
  description: 'Proceso de validación de identidad para activar el acceso premium a Knowing Cultures S.A.S.',
  robots: { index: false, follow: true },
};

export default function VerifyEmailPage() {
  return (
    <PageShell className="bg-base min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-fade-in relative overflow-hidden">
      
      {/* Glows ambientales de seguridad */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[300px] bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[480px] relative z-10">
        
        {/* 01. AUTH HEADER (Minimalist Authority) */}
        <header className="mb-12 text-center flex flex-col items-center">
          <div className="relative mb-10 group">
            {/* Efecto de radar de seguridad */}
            <div className="absolute inset-0 bg-brand-blue/20 blur-2xl rounded-full scale-150 animate-pulse opacity-50" />
            
            <div className="relative flex h-20 w-20 items-center justify-center rounded-[2rem] bg-surface border border-brand-dark/10 dark:border-white/10 text-brand-blue shadow-soft transition-all duration-700 group-hover:scale-110 group-hover:rotate-12">
              <Fingerprint className="h-10 w-10 stroke-[1.25px]" />
            </div>
          </div>
          
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tight mb-4 leading-tight">
            Validación de <br />
            <span className="text-brand-blue italic font-light opacity-90">Credenciales.</span>
          </h1>
          
          <p className="text-base font-light text-muted leading-relaxed max-w-[340px] mx-auto">
            Estamos asegurando tu identidad para habilitar tu acceso exclusivo al ecosistema de <span className="text-main font-medium">KCE</span>.
          </p>
        </header>

        {/* 02. THE VALIDATION VAULT (Premium Card) */}
        <div className="overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop relative group">
          {/* Línea de acento superior dinámica */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent" />
          
          <div className="p-10 md:p-14 relative z-10">
            {/* El componente funcional VerifyEmailView maneja los estados internos */}
            <VerifyEmailView />
          </div>

          {/* Sutil indicativo de encriptación inferior */}
          <div className="bg-surface-2 border-t border-brand-dark/5 dark:border-white/5 px-10 py-5 flex items-center justify-center gap-3">
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
              <p className="text-[10px] text-muted uppercase tracking-[0.2em] font-bold leading-relaxed">
                ¿Problemas con el enlace? <br/>
                <Link href="/contact" className="text-brand-blue hover:text-brand-dark transition-all inline-flex items-center gap-1 mt-2">
                  Contactar Soporte Técnico <ArrowRight className="h-3 w-3" />
                </Link>
              </p>
              
              <div className="flex flex-col gap-2">
                <p className="text-[9px] text-muted/30 uppercase tracking-[0.4em] font-bold">
                  Knowing Cultures S.A.S.
                </p>
                <p className="text-[8px] text-muted/20 uppercase tracking-[0.2em]">
                  Bogotá, Colombia · 2026
                </p>
              </div>
            </div>
          </div>
        </footer>

      </div>

      {/* Marca de agua de seguridad al fondo */}
      <ShieldCheck className="fixed -bottom-20 -left-20 h-96 w-96 text-brand-blue/[0.02] -rotate-12 pointer-events-none" />
    </PageShell>
  );
}
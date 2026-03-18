import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import SecurityCenterView from '@/features/auth/SecurityCenterView';
import { LockKeyhole, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Centro de Seguridad | KCE',
  robots: { index: false, follow: false },
};

export default function SecurityPage() {
  return (
    <PageShell className="mx-auto max-w-4xl px-6 py-12 md:py-20 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      
      {/* Header Seguridad */}
      <div className="mb-12 border-b border-[var(--color-border)] pb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 mb-5 shadow-sm">
            <LockKeyhole className="h-3 w-3" /> Privacidad & Accesos
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            Centro de Seguridad
          </h1>
          <p className="mt-4 text-base font-light leading-relaxed text-[var(--color-text)]/70 max-w-xl">
            Gestiona tu contraseña, cierra sesiones activas y mantén el control total sobre tus datos personales con la máxima privacidad.
          </p>
        </div>
        
        {/* Ícono de confianza flotante */}
        <div className="hidden md:flex shrink-0 items-center justify-center h-20 w-20 rounded-[1.5rem] bg-brand-blue/5 border border-brand-blue/10 shadow-sm transition-transform hover:scale-105">
          <ShieldCheck className="h-10 w-10 text-brand-blue/40" />
        </div>
      </div>

      {/* Tarjeta Principal (Bóveda) */}
      <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl p-10 md:p-16 relative overflow-hidden">
        {/* Línea de seguridad superior (sutil) */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500/50 via-brand-blue/50 to-transparent"></div>
        
        <div className="relative z-10">
          <SecurityCenterView />
        </div>
      </section>
      
    </PageShell>
  );
}
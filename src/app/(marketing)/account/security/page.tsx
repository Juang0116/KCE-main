/* src/app/(marketing)/account/security/page.tsx */
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
    <PageShell className="mx-auto w-full max-w-[var(--container-max)] px-6 py-12 md:py-20 pb-[calc(10rem+env(safe-area-inset-bottom))] animate-fade-in bg-base">
      
      {/* 01. HEADER SEGURIDAD (Premium Minimalista) */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/10 dark:border-white/10 pb-8">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-green-600 dark:text-green-400 shadow-sm">
            <LockKeyhole className="h-3 w-3" /> Privacidad & Accesos
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tight">
            Centro de Seguridad
          </h1>
          <p className="mt-4 max-w-xl text-base font-light text-muted leading-relaxed">
            Gestiona tu contraseña, cierra sesiones activas y mantén el control total sobre tus datos personales con la máxima privacidad.
          </p>
        </div>
        
        {/* Ícono de confianza sutil */}
        <div className="hidden md:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-2 border border-brand-dark/5 dark:border-white/5 shadow-sm transition-transform hover:scale-105 group">
          <ShieldCheck className="h-8 w-8 text-muted opacity-50 group-hover:text-green-600 group-hover:opacity-100 transition-colors" />
        </div>
      </header>

      {/* 02. ZONA PRINCIPAL (Formularios) */}
      <section className="max-w-4xl">
        {/* Aquí renderizamos el componente de seguridad.
            Asegúrate de que dentro de SecurityCenterView NO haya cajas enormes,
            sino divisiones sutiles (border-b) para cada sección (Contraseña, Sesiones, etc).
        */}
        <SecurityCenterView />
      </section>

    </PageShell>
  );
}
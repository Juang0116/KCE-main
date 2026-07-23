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
    <PageShell className="mx-auto w-full max-w-[var(--container-max)] animate-fade-in bg-base px-6 py-12 pb-[calc(10rem+env(safe-area-inset-bottom))] md:py-20">
      {/* 01. HEADER SEGURIDAD (Premium Minimalista) */}
      <header className="mb-12 flex flex-col justify-between gap-8 border-b border-brand-dark/10 pb-8 dark:border-white/10 md:flex-row md:items-end">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-green-600 shadow-sm dark:text-green-400">
            <LockKeyhole className="h-3 w-3" /> Privacidad & Accesos
          </div>
          <h1 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
            Centro de Seguridad
          </h1>
          <p className="mt-4 max-w-xl text-base font-light leading-relaxed text-muted">
            Gestiona tu contraseña, cierra sesiones activas y mantén el control total sobre tus
            datos personales con la máxima privacidad.
          </p>
        </div>

        {/* Ícono de confianza sutil */}
        <div className="group hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-brand-dark/5 bg-surface-2 shadow-sm transition-transform hover:scale-105 dark:border-white/5 md:flex">
          <ShieldCheck className="h-8 w-8 text-muted opacity-50 transition-colors group-hover:text-green-600 group-hover:opacity-100" />
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

import 'server-only';
import type { Metadata } from 'next';
import { AdminAnalyticsClient } from './AdminAnalyticsClient';
import { ShieldCheck, Zap } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'FinOps Analytics | KCE Ops',
  description:
    'Análisis de rentabilidad, ROAS y costo de adquisición para la toma de decisiones estratégicas en Knowing Cultures S.A.S.',
  robots: { index: false, follow: false }, // 🔒 Bloqueo de indexación correcto
};

/**
 * AdminAnalyticsPage:
 * Contenedor de nivel superior para la inteligencia financiera.
 * Este Server Component prepara el entorno de seguridad antes de
 * montar el cliente interactivo de analítica.
 */
export default function AdminAnalyticsPage() {
  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
      {/* COMPONENTE DE CLIENTE (Lógica interactiva, Workbench y Gráficos/Tablas)
          Delegamos el Header Institucional a este componente para evitar duplicación visual.
      */}
      <section className="relative">
        {/* Sutil acento lateral de "Zona Segura" */}
        <div className="absolute -left-4 top-0 h-full w-1 rounded-full bg-brand-blue opacity-20 dark:opacity-40" />
        <AdminAnalyticsClient />
      </section>

      {/* FOOTER TÁCTICO DE AUDITORÍA */}
      <footer className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-brand-dark/10 pt-8 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Zap className="h-3 w-3 fill-current text-brand-blue" /> Financial Ledger v4.2
        </div>
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-muted">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 opacity-50" /> Data Source: Stripe + Ads Ledger
          </span>
          <span className="hidden opacity-30 sm:inline">|</span>
          <span className="hidden text-brand-blue sm:inline">FX Rate: Daily P78 applied</span>
        </div>
      </footer>
    </main>
  );
}

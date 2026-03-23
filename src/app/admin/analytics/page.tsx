import 'server-only';
import type { Metadata } from 'next';
import { AdminAnalyticsClient } from './AdminAnalyticsClient';
import { ShieldCheck, Zap } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'FinOps Analytics | KCE Ops',
  description: 'Análisis de rentabilidad, ROAS y costo de adquisición para la toma de decisiones estratégicas en Knowing Cultures S.A.S.',
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
    <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* COMPONENTE DE CLIENTE (Lógica interactiva, Workbench y Gráficos/Tablas)
          Delegamos el Header Institucional a este componente para evitar duplicación visual.
      */}
      <section className="relative">
        {/* Sutil acento lateral de "Zona Segura" */}
        <div className="absolute -left-4 top-0 h-full w-1 bg-brand-blue rounded-full opacity-20 dark:opacity-40" />
        <AdminAnalyticsClient />
      </section>

      {/* FOOTER TÁCTICO DE AUDITORÍA */}
      <footer className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-brand-dark/10 dark:border-white/10 pt-8 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Zap className="h-3 w-3 text-brand-blue fill-current" /> Financial Ledger v4.2
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest uppercase text-muted">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 opacity-50" /> Data Source: Stripe + Ads Ledger
          </span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span className="hidden sm:inline text-brand-blue">FX Rate: Daily P78 applied</span>
        </div>
      </footer>
      
    </main>
  );
}
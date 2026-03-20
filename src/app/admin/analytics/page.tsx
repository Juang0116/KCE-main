import 'server-only';
import type { Metadata } from 'next';
import { AdminAnalyticsClient } from './AdminAnalyticsClient';
import { ShieldCheck, Zap } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Executive Analytics | Admin KCE',
  description: 'Análisis de rentabilidad, ROAS y costo de adquisición para la toma de decisiones estratégicas en KCE.',
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
    <main className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* COMPONENTE DE CLIENTE (Lógica interactiva, Workbench y Gráficos/Tablas)
          Delegamos el Header Institucional a este componente para evitar duplicación visual.
      */}
      <section className="relative">
        {/* Sutil acento lateral de "Zona Segura" */}
        <div className="absolute -left-4 top-0 h-full w-1 bg-brand-blue rounded-full opacity-10" />
        <AdminAnalyticsClient />
      </section>

      {/* FOOTER TÁCTICO DE AUDITORÍA */}
      <footer className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-[color:var(--color-border)] pt-8 opacity-20 transition-opacity hover:opacity-50">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Zap className="h-3 w-3 fill-current" /> Financial Ledger v4.2
        </div>
        <div className="flex items-center gap-6 text-[10px] font-mono tracking-tighter uppercase">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" /> Data Source: Stripe + Ads Ledger
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">FX Rate: Daily P78 applied</span>
        </div>
      </footer>
      
    </main>
  );
}
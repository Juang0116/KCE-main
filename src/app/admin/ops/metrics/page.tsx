/* src/app/admin/ops/metrics/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { Terminal, ShieldCheck, Database, Layers, Gauge, Activity, Zap } from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminOpsMetricsClient } from './AdminOpsMetricsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Stability Analytics | KCE Ops',
  description: 'Telemetría de resiliencia y monitoreo de SLA para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminOpsMetricsPage:
 * Shell de servidor para el análisis de salud operativa.
 * Establece la soberanía técnica antes de montar el motor de KPIs en tiempo real.
 */
export default async function AdminOpsMetricsPage() {
  // 🔒 Protocolo de seguridad: Verificación en el nodo raíz
  await requireAdmin();

  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-[1500px] space-y-12 p-4 pb-24 duration-1000 md:p-6">
      {/* 01. CABECERA DE ALTO MANDO OPERATIVO (MISSION CONTROL) */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 px-2 pb-10 dark:border-white/5 lg:flex-row lg:items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue shadow-inner backdrop-blur-xl">
            <Terminal className="h-4 w-4" /> Telemetry Lane: /ops-intelligence-node
          </div>
          <h1 className="font-heading text-5xl leading-none tracking-tighter text-main md:text-7xl">
            Salud <span className="font-light italic text-brand-yellow">Operacional</span>
          </h1>
          <p className="mt-2 max-w-3xl border-l-2 border-brand-yellow/20 pl-6 text-lg font-light italic leading-relaxed text-muted">
            Unidad de telemetría de estabilidad. Supervisa el volumen de incidentes, audita el
            cumplimiento de SLA y gestiona la sanidad de los procesos críticos de Knowing Cultures
            S.A.S.
          </p>
        </div>

        {/* Status de Sincronización del Nodo */}
        <div className="group flex items-center gap-5 rounded-[2rem] border border-brand-dark/5 bg-surface px-8 py-5 shadow-pop transition-all hover:border-brand-blue/20 dark:border-white/5">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue shadow-inner transition-transform duration-700 group-hover:rotate-90">
              <Gauge className="h-6 w-6" />
            </div>
            <div className="absolute -right-1 -top-1 h-4 w-4 animate-pulse rounded-full border-4 border-surface bg-green-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
              SLA Monitor
            </p>
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-400">
              Observer Active
            </p>
          </div>
        </div>
      </header>

      {/* 02. MOTOR DINÁMICO DE MÉTRICAS (CLIENT COMPONENT) */}
      <section className="relative px-2">
        {/* Acento lateral de integridad de la Bóveda - Amarillo KCE */}
        <div className="absolute -left-4 top-0 h-full w-1.5 rounded-full bg-brand-yellow opacity-20 dark:opacity-40" />

        {/* El cliente inyecta la lógica de KPIs, matrices de severidad y logs de pausa */}
        <AdminOpsMetricsClient />
      </section>

      {/* 03. FOOTER DE CONFORMIDAD TÉCNICA (Estilo Ops Core) */}
      <footer className="mt-16 flex flex-col items-center justify-center gap-10 border-t border-brand-dark/10 pt-12 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Confidence Stability
        </div>

        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />

        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Layers className="h-4 w-4 opacity-50" /> SLA v4.0 Active
        </div>

        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />

        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Database className="h-4 w-4" /> Registry Integrity: 100%
        </div>
      </footer>
    </main>
  );
}

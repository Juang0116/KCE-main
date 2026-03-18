// src/app/admin/ops/metrics/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { 
  Activity, 
  Terminal, 
  ShieldCheck, 
  Database, 
  Layers,
  Gauge
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminOpsMetricsClient } from './AdminOpsMetricsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Stability Metrics | Ops KCE',
  description: 'Telemetría de resiliencia y monitoreo de SLA para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

/**
 * AdminOpsMetricsPage:
 * Shell de servidor para el análisis de salud operativa.
 * Establece la soberanía técnica antes de montar el motor de KPIs en tiempo real.
 */
export default async function AdminOpsMetricsPage() {
  // Verificación de credenciales en el nodo raíz
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1500px] space-y-10 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE ALTO MANDO OPERATIVO */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8 px-2">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Telemetry Lane: /ops-intelligence
          </div>
          <h1 className="font-heading text-4xl text-brand-blue tracking-tight">
            Salud <span className="text-brand-yellow italic font-light">Operacional</span>
          </h1>
          <p className="text-sm text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Unidad de telemetría de estabilidad. Supervisa el volumen de incidentes, audita el cumplimiento 
            de SLA (Ack/Resolve) y gestiona la sanidad de los procesos críticos de KCE.
          </p>
        </div>

        {/* Status de Sincronización del Nodo */}
        <div className="flex items-center gap-4 bg-brand-blue/5 border border-brand-blue/10 px-6 py-3 rounded-2xl shadow-inner group">
           <div className="relative">
              <Gauge className="h-5 w-5 text-brand-blue group-hover:rotate-90 transition-transform duration-500" />
              <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">SLA Monitor</p>
              <p className="text-[9px] font-mono text-emerald-600 uppercase">Observer Active</p>
           </div>
        </div>
      </header>

      {/* 02. MOTOR DINÁMICO DE MÉTRICAS (CLIENT COMPONENT) */}
      <section className="relative">
        {/* Acento lateral de integridad de la Bóveda */}
        <div className="absolute -left-4 top-0 h-full w-1 rounded-full bg-brand-yellow opacity-10" />
        
        {/* El cliente inyecta la lógica de KPIs, gráficos de severidad y pausas */}
        <AdminOpsMetricsClient />
      </section>

      {/* FOOTER DE CONFORMIDAD TÉCNICA */}
      <footer className="mt-12 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 transition-opacity hover:opacity-50 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Stability
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> SLA v4.0 Active
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Database className="h-3.5 w-3.5" /> Registry Integrity: 100%
        </div>
      </footer>
      
    </main>
  );
}
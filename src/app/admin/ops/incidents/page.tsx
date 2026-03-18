// src/app/admin/ops/incidents/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { 
  ShieldAlert, 
  Terminal, 
  Activity, 
  Database,
  Zap,
  ShieldCheck
} from 'lucide-react';

import { AdminIncidentsClient } from './AdminIncidentsClient';
import { requireAdmin } from '@/lib/adminGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Stability Ops | Centro de Incidentes KCE',
  description: 'Gestión de excepciones y resiliencia de infraestructura para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

/**
 * AdminOpsIncidentsPage:
 * Shell de servidor para el triaje de fallas sistémicas.
 * Proporciona el marco de soberanía operativa antes de montar el monitor dinámico.
 */
export default async function AdminOpsIncidentsPage() {
  // Garantizamos integridad de acceso en el nodo de servidor
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1500px] space-y-10 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* CABECERA DE OPERACIONES DE ESTABILIDAD */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8 px-2">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Stability Lane: /incident-vault
          </div>
          <h1 className="font-heading text-4xl text-brand-blue tracking-tight">
            Ops <span className="text-brand-yellow italic font-light">Incidencias</span>
          </h1>
          <p className="text-sm text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Alertas operativas auto-deduplicadas. Monitorea la integridad de los webhooks de Stripe, 
            la persistencia del checkout y el rastro de emails. Reconoce (Ack) y resuelve para blindar el flujo de KCE.
          </p>
        </div>

        {/* Status de Pulso Sistémico */}
        <div className="flex items-center gap-4 bg-brand-blue/5 border border-brand-blue/10 px-6 py-3 rounded-2xl shadow-inner group">
           <div className="relative">
              <Zap className="h-5 w-5 text-brand-blue group-hover:text-brand-yellow transition-colors" />
              <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">Live Signal</p>
              <p className="text-[9px] font-mono text-emerald-600 uppercase">Observer Active</p>
           </div>
        </div>
      </header>

      {/* MONITOR DINÁMICO (CLIENT COMPONENT) */}
      <section className="relative">
        {/* Indicador lateral de integridad de la Bóveda */}
        <div className="absolute -left-4 top-0 h-full w-1 rounded-full bg-brand-yellow opacity-10" />
        
        {/* El cliente maneja el triaje, los filtros y las mutaciones de estado */}
        <AdminIncidentsClient />
      </section>

      {/* FOOTER DE CONFORMIDAD TÉCNICA */}
      <footer className="mt-12 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 transition-opacity hover:opacity-50 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Stability Sovereignty Active
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Database className="h-3.5 w-3.5" /> Registry Node v2.8
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldAlert className="h-3.5 w-3.5" /> Resilience Unit MMXXVI
        </div>
      </footer>
      
    </main>
  );
}
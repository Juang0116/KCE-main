/* src/app/admin/events/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { AdminEventsClient } from './AdminEventsClient';
import { ShieldCheck, Database, Terminal, Activity, Zap } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'System Forensics | KCE Ops',
  description: 'Timeline de eventos técnicos y trazabilidad de procesos para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminEventsPage:
 * Shell de servidor para la terminal de auditoría forense.
 * Actúa como el nodo de despacho que monta el motor de investigación.
 */
export default function AdminEventsPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. STATUS BAR: IDENTIFICACIÓN DEL NODO */}
      <div className="flex items-center justify-between px-2 opacity-40 hover:opacity-100 transition-opacity duration-500 cursor-default">
        <div className="flex items-center gap-3">
          <Terminal className="h-3.5 w-3.5 text-brand-blue" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            Investigation Lane: /forensics-node-01
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-mono text-muted uppercase tracking-widest">
              Kernel Health: Nominal
            </span>
          </div>
          <span className="hidden sm:block opacity-10">|</span>
          <div className="hidden sm:flex items-center gap-2">
            <Zap className="h-3 w-3 text-brand-yellow" />
            <span className="text-[9px] font-mono text-muted uppercase tracking-widest">
              Latency: 14ms
            </span>
          </div>
        </div>
      </div>

      {/* 02. MOTOR FORENSE (CLIENTE INTERACTIVO) */}
      <section className="relative">
        {/* Acento lateral de integridad visual - Amarillo KCE */}
        <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-20 dark:opacity-40" />
        
        {/* El cliente maneja el Header, Workbench, Filtros y la Bóveda Forense */}
        <AdminEventsClient />
      </section>

      {/* 03. FOOTER DE CONFORMIDAD TÉCNICA (Estilo Ops Core) */}
      <footer className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-10 border-t border-brand-dark/10 dark:border-white/10 pt-12 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Database className="h-3.5 w-3.5 text-brand-blue" /> Core Registry Node v2.4
        </div>
        
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <ShieldCheck className="h-3.5 w-3.5 opacity-50" /> Immutable Audit Protocol
        </div>
        
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Activity className="h-3.5 w-3.5 fill-current opacity-70" /> Real-time Observability Active
        </div>
      </footer>
      
    </main>
  );
}
// src/app/admin/events/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { AdminEventsClient } from './AdminEventsClient';
import { ShieldCheck, Database, Terminal, Activity } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Audit Trail | Observabilidad KCE',
  description: 'Timeline de eventos técnicos y trazabilidad de procesos para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

/**
 * AdminEventsPage:
 * Shell de servidor para la terminal de auditoría forense.
 * Actúa como el nodo de despacho que monta el motor de investigación.
 * Eliminamos headers redundantes: el cliente ya maneja el título y el workbench.
 */
export default function AdminEventsPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. NODO DE IDENTIFICACIÓN SUTIL */}
      <div className="flex items-center justify-between px-2 opacity-50 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
          <Terminal className="h-3.5 w-3.5 text-brand-blue" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            Investigation Lane: /forensics-node
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-brand-blue animate-pulse" />
          <span className="text-[9px] font-mono text-brand-blue/60 uppercase tracking-tighter">
            System Health: Nominal
          </span>
        </div>
      </div>

      {/* 02. MOTOR FORENSE (CLIENTE INTERACTIVO) */}
      <section className="relative">
        {/* Acento lateral de integridad visual */}
        <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
        
        {/* El cliente maneja el Header, Workbench, Filtros y la Tabla Forense */}
        <AdminEventsClient />
      </section>

      {/* 03. FOOTER DE CONFORMIDAD TÉCNICA */}
      <footer className="mt-12 flex flex-wrap items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Database className="h-3.5 w-3.5" /> Core Registry Node v2.4
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Immutable Audit Protocol
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Activity className="h-3.5 w-3.5" /> Real-time Observability
        </div>
      </footer>
      
    </main>
  );
}
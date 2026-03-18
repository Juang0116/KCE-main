// src/app/admin/runbook/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { 
  ClipboardCheck, 
  Terminal, 
  ShieldCheck, 
  Database, 
  Layers, 
  Zap, 
  Activity,
  History
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';
import AdminRunbookClient from './AdminRunbookClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Acceptance Runbook | Admin KCE',
  description: 'Protocolo de validación manual E2E para el ecosistema de Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

/**
 * AdminRunbookPage:
 * Shell de servidor para el protocolo de aceptación operativa.
 * Establece el marco de rigor técnico antes de montar el checklist interactivo.
 */
export default async function AdminRunbookPage() {
  // Verificación de integridad de sesión en el nodo raíz
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1500px] space-y-12 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE ALTO MANDO (ACCEPTANCE VAULT) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10 px-2">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Validation Lane: /acceptance-protocol
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight tracking-tight">
            Runbook de <span className="text-brand-yellow italic font-light">Aceptación</span>
          </h1>
          <p className="text-base text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Protocolo de validación manual extrema. Verifica la integridad del flujo Tours → Checkout → 
            Revenue → CRM para garantizar que KCE cumple con la promesa de marca.
          </p>
        </div>

        {/* Status de Integridad del Protocolo */}
        <div className="flex items-center gap-6 bg-brand-blue/5 border border-brand-blue/10 p-6 rounded-[2.5rem] shadow-inner group">
           <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110">
              <ClipboardCheck className="h-6 w-6 text-brand-blue" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">System Check</p>
              <p className="text-xs font-mono text-emerald-600 font-bold uppercase tracking-tighter">E2E Ready for Audit</p>
           </div>
        </div>
      </header>

      {/* 02. TERMINAL DE PROTOCOLOS (CLIENT COMPONENT) */}
      <section className="relative pt-4">
         <div className="mb-8 flex items-center gap-4 px-2">
            <Activity className="h-5 w-5 text-brand-blue opacity-30" />
            <h2 className="font-heading text-2xl text-brand-dark">Interactive Acceptance Trail</h2>
         </div>

         {/* Acento lateral de integridad de la Bóveda */}
         <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
         
         {/* El cliente maneja el checklist interactivo, el progreso local y los logs de BD */}
         <AdminRunbookClient />
      </section>

      {/* FOOTER DE CONFORMIDAD TÉCNICA */}
      <footer className="mt-20 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Manual Verification: 100%
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> E2E Protocol v1.4
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <History className="h-3.5 w-3.5" /> Audit Log Trace: ON
        </div>
      </footer>
      
    </main>
  );
}
/* src/app/admin/ops/incidents/[id]/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { 
  ShieldAlert, 
  Terminal, 
  Database,
  ShieldCheck,
  Fingerprint,
  Activity
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminIncidentDetailClient } from './AdminIncidentDetailClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Incident Analysis | KCE Ops',
  description: 'Expediente técnico de incidencia y resolución forense para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminIncidentDetailPage:
 * Shell de servidor para el análisis detallado de una falla sistémica.
 * Garantiza el acceso administrativo antes de montar la terminal forense interactiva.
 */
export default async function AdminIncidentDetailPage(props: { params: Promise<{ id: string }> }) {
  // 🔒 Protocolo de seguridad: Acceso restringido a nivel administrativo
  await requireAdmin();
  const { id } = await props.params;

  return (
    <main className="mx-auto max-w-[1500px] space-y-10 p-4 md:p-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA DE INVESTIGACIÓN (MISSION CONTROL) */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue backdrop-blur-xl shadow-inner">
            <Terminal className="h-4 w-4" /> Investigation Lane: /incidents/forensics-node
          </div>
          <h1 className="font-heading text-5xl md:text-7xl text-main tracking-tighter leading-none">
            Expediente de <span className="text-brand-yellow italic font-light">Incidencia</span>
          </h1>
          <p className="text-lg text-muted font-light max-w-3xl leading-relaxed mt-2 border-l-2 border-brand-yellow/20 pl-6 italic">
            Unidad de diagnóstico y postmortem. Rastrea la línea de tiempo del error, 
            asume la resolución y documenta la causa raíz para blindar el núcleo de KCE.
          </p>
        </div>

        {/* Status de Integridad Táctica */}
        <div className="flex items-center gap-5 bg-surface border border-brand-dark/5 dark:border-white/5 px-8 py-5 rounded-[2rem] shadow-pop group hover:border-brand-blue/20 transition-all">
           <div className="relative">
              <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner group-hover:scale-110 transition-transform">
                <Fingerprint className="h-6 w-6" />
              </div>
              <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-green-500 animate-pulse border-4 border-surface" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">Data Integrity</p>
              <p className="text-xs font-mono font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">Registry Verified</p>
           </div>
        </div>
      </header>

      {/* 02. TERMINAL CLIENTE (LÓGICA INTERACTIVA) */}
      <section className="relative px-2">
        {/* Acento lateral de la Bóveda - Amarillo KCE */}
        <div className="absolute -left-4 top-0 h-full w-1.5 rounded-full bg-brand-yellow opacity-20 dark:opacity-40" />
        
        {/* El componente cliente centraliza el timeline, el reporte postmortem y el log de actividad */}
        <AdminIncidentDetailClient id={id} />
      </section>

      {/* 03. FOOTER DE CONFORMIDAD TÉCNICA (Estilo Ops Core) */}
      <footer className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-10 border-t border-brand-dark/10 dark:border-white/10 pt-12 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Incident Sovereignty Active
        </div>
        
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Database className="h-4 w-4 opacity-50" /> Forensic Node v2.1
        </div>
        
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <ShieldAlert className="h-4 w-4 animate-pulse" /> High-Confidence Protocol
        </div>
      </footer>
      
    </main>
  );
}
// src/app/admin/ops/incidents/[id]/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  ShieldAlert, 
  ArrowLeft, 
  Terminal, 
  Database,
  ShieldCheck,
  Fingerprint
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminIncidentDetailClient } from './AdminIncidentDetailClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Análisis Forense | Incidencias KCE',
  description: 'Expediente técnico de incidencia y resolución para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

/**
 * AdminIncidentDetailPage:
 * Shell de servidor para el análisis detallado de una falla sistémica.
 * Garantiza el acceso administrativo antes de montar la terminal forense interactiva.
 */
export default async function AdminIncidentDetailPage(props: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await props.params;

  return (
    <main className="mx-auto max-w-[1500px] space-y-10 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE INVESTIGACIÓN (BÓVEDA) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[color:var(--color-border)] pb-8 px-2">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Investigation Lane: /incidents/detail
          </div>
          <h1 className="font-heading text-4xl text-brand-blue tracking-tight">
            Expediente de <span className="text-brand-yellow italic font-light">Incidencia</span>
          </h1>
          <p className="text-sm text-[color:var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Unidad de diagnóstico y postmortem. Rastrea la línea de tiempo del error, 
            asume la resolución y documenta la causa raíz para blindar el núcleo de KCE.
          </p>
        </div>

        {/* Status de Integridad de Datos */}
        <div className="flex items-center gap-4 bg-brand-blue/5 border border-brand-blue/10 px-6 py-3 rounded-2xl shadow-inner">
           <div className="relative">
              <Fingerprint className="h-5 w-5 text-brand-blue" />
              <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">Data Integrity</p>
              <p className="text-[9px] font-mono text-emerald-600 uppercase">Registry Verified</p>
           </div>
        </div>
      </header>

      {/* 02. TERMINAL CLIENTE (INTERACTIVA) */}
      <section className="relative">
        {/* Acento lateral de la Bóveda */}
        <div className="absolute -left-4 top-0 h-full w-1 rounded-full bg-brand-yellow opacity-10" />
        
        {/* El cliente maneja el timeline, postmortem y mutaciones de estado */}
        <AdminIncidentDetailClient id={id} />
      </section>

      {/* FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-12 flex items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-12 opacity-20 transition-opacity hover:opacity-50 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Incident Sovereignty Active
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Database className="h-3.5 w-3.5" /> Forensic Node v2.1
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldAlert className="h-3.5 w-3.5" /> High-Confidence Protocol
        </div>
      </footer>
      
    </main>
  );
}
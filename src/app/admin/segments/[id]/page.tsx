// src/app/admin/segments/[id]/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Target, 
  Terminal, 
  ShieldCheck, 
  Database, 
  ChevronLeft, 
  Filter, 
  Users,
  Fingerprint
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminSegmentDetailClient } from './segmentDetailClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Segment Refinement | Admin KCE',
  description: 'Unidad de definición de audiencias y lógica de filtrado para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

/**
 * AdminSegmentDetailPage:
 * Shell de servidor para el detalle y edición de un segmento específico.
 * Establece el contexto de precisión de datos antes de montar el cliente de edición.
 */
export default async function AdminSegmentDetailPage({ params }: { params: { id: string } }) {
  // Verificación de integridad en el nodo de servidor
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1500px] space-y-12 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE ALTO MANDO (SEGMENT VAULT) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10 px-2">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Audience Lane: /segment-vault/{params.id.slice(0, 8)}
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight tracking-tight">
            Refinamiento de <span className="text-brand-yellow italic font-light">Segmento</span>
          </h1>
          <p className="text-base text-[color:var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Unidad de precisión analítica. Edita las reglas de inclusión, ejecuta conteos de rastro 
            y asegura la integridad de la audiencia antes de cualquier acción de despacho.
          </p>
        </div>

        {/* Status de Precisión del Nodo */}
        <div className="flex items-center gap-6 bg-brand-blue/5 border border-brand-blue/10 p-6 rounded-[2.5rem] shadow-inner group">
           <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-surface)] shadow-sm transition-transform group-hover:rotate-12">
              <Target className="h-6 w-6 text-brand-blue" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">Target Accuracy</p>
              <p className="text-xs font-mono text-emerald-600 font-bold uppercase tracking-tighter">Query Engine Active</p>
           </div>
        </div>
      </header>

      {/* 02. BARRA DE NAVEGACIÓN Y ACCIÓN */}
      <div className="flex items-center justify-between px-2">
        <Link 
          href="/admin/segments" 
          className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] hover:text-brand-blue transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] transition-all group-hover:border-brand-blue/30 group-hover:shadow-sm">
            <ChevronLeft className="h-4 w-4" />
          </div>
          Volver a la Matriz de Segmentos
        </Link>

        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30">
          <Fingerprint className="h-3.5 w-3.5" /> Node_ID: <span className="font-mono text-brand-blue/60">{params.id}</span>
        </div>
      </div>

      {/* 03. TERMINAL DE REFINAMIENTO (CLIENT COMPONENT) */}
      <section className="relative pt-4">
         <div className="mb-8 flex items-center gap-4 px-2">
            <Filter className="h-5 w-5 text-brand-blue opacity-30" />
            <h2 className="font-heading text-2xl text-[color:var(--color-text)]">Audience Definition Interface</h2>
         </div>

         {/* Acento lateral de integridad de la Bóveda */}
         <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
         
         {/* El cliente maneja el formulario de edición, la lógica de filtros y los conteos */}
         <AdminSegmentDetailClient id={params.id} />
      </section>

      {/* FOOTER DE SOBERANÍA DE DATOS */}
      <footer className="mt-20 flex items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Logical Integrity Verified
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Users className="h-3.5 w-3.5" /> Audience Sovereignty
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Database className="h-3.5 w-3.5" /> Persistent Filter Node
        </div>
      </footer>
      
    </main>
  );
}
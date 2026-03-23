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
  Fingerprint,
  Zap
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminSegmentDetailClient } from './segmentDetailClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Segment Refinement | KCE Intelligence',
  description: 'Unidad de precisión analítica para la definición de audiencias y lógica de filtrado.',
  robots: { index: false, follow: false },
};

export default async function AdminSegmentDetailPage({ params }: { params: { id: string } }) {
  // 01. Verificación de integridad en el nodo de servidor
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1500px] space-y-12 p-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA DE ALTO MANDO (SEGMENT VAULT) */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
            <Terminal className="h-4 w-4" /> Audience Lane: /segment-vault/{params.id.slice(0, 8)}
          </div>
          <h1 className="font-heading text-4xl md:text-7xl text-main tracking-tighter leading-none">
            Segment <span className="text-brand-yellow italic font-light">Refinement</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2 italic">
            Unidad de precisión analítica. Edita las reglas de inclusión, ejecuta conteos de rastro 
            y asegura la integridad de la audiencia antes de cualquier maniobra comercial.
          </p>
        </div>

        {/* Status de Precisión del Nodo */}
        <div className="flex items-center gap-6 bg-surface-2 border border-brand-dark/5 p-6 rounded-[2.5rem] shadow-pop group">
           <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark shadow-lg transition-transform group-hover:rotate-12">
              <Target className="h-7 w-7 text-brand-yellow" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full animate-ping" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted opacity-60">Target Accuracy</p>
              <p className="text-sm font-mono text-emerald-600 font-bold uppercase tracking-tighter">Query Engine Active</p>
           </div>
        </div>
      </header>

      {/* 02. BARRA DE NAVEGACIÓN Y ACCIÓN */}
      <nav className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <Link 
          href="/admin/segments" 
          className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.25em] text-muted hover:text-brand-blue transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-dark/10 bg-surface transition-all group-hover:scale-110 group-hover:shadow-pop group-hover:border-brand-blue/30">
            <ChevronLeft className="h-5 w-5" />
          </div>
          Volver a la Matriz de Segmentos
        </Link>

        <div className="flex items-center gap-4 px-5 py-2 rounded-full bg-surface-2 border border-brand-dark/5 text-[9px] font-bold uppercase tracking-widest text-muted">
          <Fingerprint className="h-4 w-4 text-brand-blue/40" /> Node_ID: <span className="font-mono text-main">{params.id}</span>
        </div>
      </nav>

      {/* 03. TERMINAL DE REFINAMIENTO (CLIENT COMPONENT) */}
      <section className="relative px-2">
        <header className="mb-10 flex items-center gap-4 border-l-4 border-brand-yellow pl-6 py-2">
           <div>
             <h2 className="font-heading text-3xl text-main tracking-tight uppercase">Audience Definition Interface</h2>
             <p className="text-xs text-muted font-light uppercase tracking-widest mt-1">Configuración de parámetros y lógica booleana</p>
           </div>
        </header>

        {/* El cliente maneja el formulario de edición, la lógica de filtros y los conteos */}
        <div className="relative z-10">
          <AdminSegmentDetailClient id={params.id} />
        </div>
        
        {/* Decoración Táctica de fondo */}
        <div className="absolute top-0 right-0 opacity-[0.02] pointer-events-none">
           <Zap className="h-[500px] w-[500px]" />
        </div>
      </section>

      {/* FOOTER DE SOBERANÍA DE DATOS */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/5 dark:border-white/5 pt-16 opacity-30 hover:opacity-100 transition-opacity duration-700">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-brand-blue">
          <ShieldCheck className="h-4 w-4" /> Logical Integrity Verified
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-muted">
          <Users className="h-4 w-4" /> Audience Sovereignty
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-muted">
          <Database className="h-4 w-4" /> Persistent Filter Node
        </div>
      </footer>
      
    </main>
  );
}
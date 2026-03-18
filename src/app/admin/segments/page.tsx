// src/app/admin/segments/page.tsx
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
  Layers,
  ArrowUpRight
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminSegmentsClient } from './segmentsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Audience Segments | Admin KCE',
  description: 'Gestión de filtros inmutables y segmentación de base de datos para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

/**
 * AdminSegmentsPage:
 * Shell de servidor para la matriz de segmentación.
 * Establece el marco de soberanía de datos antes de montar el cliente de gestión.
 */
export default async function AdminSegmentsPage() {
  // Verificación de integridad administrativa en el nodo raíz
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1500px] space-y-12 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE ALTO MANDO (AUDIENCE VAULT) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10 px-2">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Audience Lane: /segments-vault
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight tracking-tight">
            Matriz de <span className="text-brand-yellow italic font-light">Segmentos</span>
          </h1>
          <p className="text-base text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Unidad de definición de cohortes. Guarda filtros complejos y reutilizables en el núcleo de la DB 
            para ejecutar conteos de rastro y disparar acciones de marketing con precisión quirúrgica.
          </p>
        </div>

        {/* Status de Integridad de Datos */}
        <div className="flex items-center gap-6 bg-brand-blue/5 border border-brand-blue/10 p-6 rounded-[2.5rem] shadow-inner group">
           <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110">
              <Layers className="h-6 w-6 text-brand-blue" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">Data Sovereignty</p>
              <p className="text-xs font-mono text-emerald-600 font-bold uppercase tracking-tighter">Query Node Active</p>
           </div>
        </div>
      </header>

      {/* 02. BARRA DE NAVEGACIÓN Y ACCESOS RÁPIDOS */}
      <div className="flex items-center justify-between px-2">
        <Link 
          href="/admin" 
          className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 hover:text-brand-blue transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] transition-all group-hover:border-brand-blue/30 group-hover:shadow-sm">
            <ChevronLeft className="h-4 w-4" />
          </div>
          Volver al Centro de Control
        </Link>

        <div className="flex items-center gap-8">
           <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">
              <Database className="h-3.5 w-3.5" /> Source: leads_customers
           </div>
           <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">
              <Fingerprint className="h-3.5 w-3.5" /> Admin_Only Access
           </div>
        </div>
      </div>

      {/* 03. TERMINAL DE SEGMENTACIÓN (CLIENT COMPONENT) */}
      <section className="relative pt-4">
         <div className="mb-8 flex items-center gap-4 px-2">
            <Filter className="h-5 w-5 text-brand-blue opacity-30" />
            <h2 className="font-heading text-2xl text-brand-dark">Audience Intelligence Console</h2>
         </div>

         {/* Acento lateral de integridad de la Bóveda */}
         <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
         
         {/* El cliente maneja la lista de segmentos, la creación y las acciones rápidas */}
         <AdminSegmentsClient />
      </section>

      {/* FOOTER DE CONFORMIDAD TÉCNICA */}
      <footer className="mt-20 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Logic Integrity Verified
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Users className="h-3.5 w-3.5" /> Audience Mapping v2.1
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Target className="h-3.5 w-3.5" /> High-Precision Targeting
        </div>
      </footer>
      
    </main>
  );
}
// src/app/admin/ops/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Terminal, 
  ShieldCheck, 
  Database, 
  Layers, 
  Gauge, 
  ShieldAlert, 
  BookOpen, 
  Activity,
  ArrowUpRight
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminOpsClient } from './AdminOpsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Operations HQ | Admin KCE',
  description: 'Centro de soberanía operativa, gestión de SLA y control de integridad para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

/**
 * AdminOpsPage:
 * Shell de servidor para el control maestro de operaciones.
 * Establece el marco de seguridad y navegación táctica de la suite de Ops.
 */
export default async function AdminOpsPage() {
  // Verificación de integridad de sesión en el nodo raíz
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1500px] space-y-12 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE ALTO MANDO (OPS HQ) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10 px-2">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> High-Authority Lane: /ops-vault
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight tracking-tight">
            Operations <span className="text-brand-blue italic font-light">HQ</span>
          </h1>
          <p className="text-base text-[color:var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Consola central de resiliencia. Supervisa el cumplimiento de SLA, gestiona la deuda operativa 
            y audita la integridad del pipeline comercial de KCE.
          </p>
        </div>

        {/* Status Global del Nodo Ops */}
        <div className="flex items-center gap-6 bg-brand-blue/5 border border-brand-blue/10 p-6 rounded-[2.5rem] shadow-inner relative overflow-hidden group">
           <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-surface)] shadow-sm transition-transform group-hover:scale-110">
              <ShieldCheck className="h-6 w-6 text-brand-blue animate-pulse" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">Core Integrity</p>
              <p className="text-xs font-mono text-emerald-600 font-bold uppercase">Sovereign Mode Active</p>
           </div>
        </div>
      </header>

      {/* 02. NAVEGACIÓN TÁCTICA (NODOS DE MISIÓN) */}
      <nav className="grid gap-4 grid-cols-1 sm:grid-cols-3 lg:max-w-4xl">
        {[
          { href: '/admin/ops/metrics', label: 'Métricas & SLA', color: 'text-brand-blue' },
          { href: '/admin/ops/incidents', label: 'Centro de Incidentes', color: 'text-rose-600' },
          { href: '/admin/ops/runbooks', label: 'Protocolos Runbook', color: 'text-brand-blue' }
        ].map((node) => (
          <Link
            key={node.href}
            href={node.href}
            className="group flex items-center justify-between gap-4 rounded-[1.8rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-sm transition-all hover:shadow-xl hover:border-brand-blue/20 hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-surface-2)] transition-colors group-hover:bg-white`}>
                 <div className={`h-2.5 w-2.5 rounded-full ${node.color.replace('text-', 'bg-')}`} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]">{node.label}</span>
            </div>
            <ArrowUpRight className="h-4 w-4 text-[color:var(--color-text)]/50 group-hover:text-brand-blue transition-colors" />
          </Link>
        ))}
      </nav>

      {/* 03. TERMINAL MAESTRA (CLIENT COMPONENT) */}
      <section className="relative pt-4">
         <div className="mb-8 flex items-center gap-4 px-2">
            <Activity className="h-5 w-5 text-brand-blue opacity-30" />
            <h2 className="font-heading text-2xl text-[color:var(--color-text)]">Live Operational Trace</h2>
         </div>
         
         {/* El cliente maneja la telemetría de tickets, tareas, aprobaciones y overrides */}
         <AdminOpsClient />
      </section>

      {/* FOOTER DE CONFORMIDAD TÉCNICA */}
      <footer className="mt-20 flex items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Operations Sovereignty
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> Ops Node v4.8
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Database className="h-3.5 w-3.5" /> Registry Integrity: 100%
        </div>
      </footer>
      
    </main>
  );
}
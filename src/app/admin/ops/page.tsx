/* src/app/admin/ops/page.tsx */
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
  ArrowUpRight,
  Zap,
  Cpu,
  ChevronRight
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminOpsClient } from './AdminOpsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Operations HQ | KCE Ops',
  description: 'Centro de soberanía operativa, gestión de SLA y control de integridad para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminOpsPage:
 * Shell de servidor para el control maestro de operaciones.
 * Establece el marco de soberanía técnica antes de montar el motor de Ops.
 */
export default async function AdminOpsPage() {
  // 🔒 Protocolo de seguridad: Verificación de identidad administrativa en el nodo raíz
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1500px] space-y-12 p-4 md:p-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA DE ALTO MANDO (OPS HQ - MISSION CONTROL) */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue backdrop-blur-xl shadow-inner">
            <Terminal className="h-4 w-4" /> High-Authority Lane: /ops-vault-main
          </div>
          <h1 className="font-heading text-5xl md:text-7xl text-main tracking-tighter leading-none">
            Operations <span className="text-brand-yellow italic font-light">HQ</span>
          </h1>
          <p className="text-lg text-muted font-light max-w-3xl leading-relaxed mt-2 border-l-2 border-brand-yellow/20 pl-6 italic">
            Consola central de resiliencia. Supervisa el cumplimiento de SLA, gestiona la deuda operativa 
            y audita la integridad del núcleo comercial de Knowing Cultures S.A.S.
          </p>
        </div>

        {/* Status Global del Nodo (Widget Premium) */}
        <div className="flex items-center gap-6 bg-surface border border-brand-dark/5 dark:border-white/5 p-8 rounded-[2.5rem] shadow-pop group hover:border-brand-blue/20 transition-all relative overflow-hidden">
           <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:scale-110 transition-transform duration-700">
              <Cpu className="h-24 w-24 text-brand-blue" />
           </div>
           <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 shadow-inner transition-transform group-hover:rotate-12">
              <ShieldCheck className="h-8 w-8 text-brand-blue animate-pulse" />
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">System Integrity</p>
              <p className="text-sm font-mono text-green-600 dark:text-green-400 font-bold uppercase tracking-widest">Sovereign Mode Active</p>
           </div>
        </div>
      </header>

      {/* 02. NAVEGACIÓN TÁCTICA (NODOS DE MISIÓN) */}
      <nav className="grid gap-6 grid-cols-1 sm:grid-cols-3">
        {[
          { href: '/admin/ops/metrics', label: 'Métricas & SLA', color: 'text-brand-blue', icon: Gauge, desc: 'Latencia y respuesta' },
          { href: '/admin/ops/incidents', label: 'Centro de Incidentes', color: 'text-red-500', icon: ShieldAlert, desc: 'Triaje de excepciones' },
          { href: '/admin/ops/runbooks', label: 'Protocolos Runbook', color: 'text-brand-blue', icon: BookOpen, desc: 'Manuales de mitigación' }
        ].map((node) => (
          <Link
            key={node.href}
            href={node.href}
            className="group flex flex-col justify-between gap-6 rounded-[2.5rem] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-soft transition-all hover:shadow-pop hover:border-brand-blue/20 hover:-translate-y-1 overflow-hidden relative"
          >
            <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform">
               <node.icon className="h-32 w-32" />
            </div>
            
            <div className="flex items-center justify-between relative z-10">
               <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 shadow-inner border border-brand-dark/5 transition-colors group-hover:bg-brand-dark group-hover:text-brand-yellow`}>
                  <node.icon className="h-6 w-6" />
               </div>
               <ArrowUpRight className="h-5 w-5 text-muted opacity-20 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
            </div>
            
            <div className="relative z-10">
               <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-main">{node.label}</h3>
               <p className="text-[10px] font-mono text-muted mt-1 uppercase tracking-widest opacity-60">{node.desc}</p>
            </div>
          </Link>
        ))}
      </nav>

      {/* 03. TERMINAL MAESTRA (LOGIC COMPONENT) */}
      <section className="relative pt-6 px-2">
         {/* Acento lateral de la Bóveda Ops */}
         <div className="absolute -left-6 top-0 h-full w-1.5 rounded-full bg-brand-yellow opacity-20 dark:opacity-40" />

         <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                  <Activity className="h-5 w-5 animate-pulse" />
               </div>
               <h2 className="font-heading text-3xl text-main tracking-tight uppercase">Live Operational Trace</h2>
            </div>
            <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-2 border border-brand-dark/5">
               <Zap className="h-3 w-3 text-brand-yellow fill-current" />
               <span className="text-[9px] font-mono font-bold text-muted uppercase tracking-widest">Real-time Stream</span>
            </div>
         </div>
         
         {/* El componente cliente centraliza la telemetría, el búnker de seguridad y la Two-Man Rule */}
         <AdminOpsClient />
      </section>

      {/* 04. FOOTER DE CONFORMIDAD TÉCNICA (Estilo Ops Core) */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Operations Sovereignty Verified
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Layers className="h-4 w-4 opacity-50" /> Ops Node v4.8
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Database className="h-4 w-4" /> Registry Integrity: 100%
        </div>
      </footer>
      
    </main>
  );
}
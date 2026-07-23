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
  ChevronRight,
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminOpsClient } from './AdminOpsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Operations HQ | KCE Ops',
  description:
    'Centro de soberanía operativa, gestión de SLA y control de integridad para Knowing Cultures S.A.S.',
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
    <main className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-[1500px] space-y-12 p-4 pb-24 duration-1000 md:p-6">
      {/* 01. CABECERA DE ALTO MANDO (OPS HQ - MISSION CONTROL) */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 px-2 pb-10 dark:border-white/5 lg:flex-row lg:items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue shadow-inner backdrop-blur-xl">
            <Terminal className="h-4 w-4" /> High-Authority Lane: /ops-vault-main
          </div>
          <h1 className="font-heading text-5xl leading-none tracking-tighter text-main md:text-7xl">
            Operations <span className="font-light italic text-brand-yellow">HQ</span>
          </h1>
          <p className="mt-2 max-w-3xl border-l-2 border-brand-yellow/20 pl-6 text-lg font-light italic leading-relaxed text-muted">
            Consola central de resiliencia. Supervisa el cumplimiento de SLA, gestiona la deuda
            operativa y audita la integridad del núcleo comercial de Knowing Cultures S.A.S.
          </p>
        </div>

        {/* Status Global del Nodo (Widget Premium) */}
        <div className="group relative flex items-center gap-6 overflow-hidden rounded-[2.5rem] border border-brand-dark/5 bg-surface p-8 shadow-pop transition-all hover:border-brand-blue/20 dark:border-white/5">
          <div className="absolute -right-4 -top-4 opacity-[0.02] transition-transform duration-700 group-hover:scale-110">
            <Cpu className="h-24 w-24 text-brand-blue" />
          </div>
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 shadow-inner transition-transform group-hover:rotate-12">
            <ShieldCheck className="h-8 w-8 animate-pulse text-brand-blue" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
              System Integrity
            </p>
            <p className="font-mono text-sm font-bold uppercase tracking-widest text-green-600 dark:text-green-400">
              Sovereign Mode Active
            </p>
          </div>
        </div>
      </header>

      {/* 02. NAVEGACIÓN TÁCTICA (NODOS DE MISIÓN) */}
      <nav className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          {
            href: '/admin/ops/metrics',
            label: 'Métricas & SLA',
            color: 'text-brand-blue',
            icon: Gauge,
            desc: 'Latencia y respuesta',
          },
          {
            href: '/admin/ops/incidents',
            label: 'Centro de Incidentes',
            color: 'text-red-500',
            icon: ShieldAlert,
            desc: 'Triaje de excepciones',
          },
          {
            href: '/admin/ops/runbooks',
            label: 'Protocolos Runbook',
            color: 'text-brand-blue',
            icon: BookOpen,
            desc: 'Manuales de mitigación',
          },
        ].map((node) => (
          <Link
            key={node.href}
            href={node.href}
            className="group relative flex flex-col justify-between gap-6 overflow-hidden rounded-[2.5rem] border border-brand-dark/5 bg-surface p-8 shadow-soft transition-all hover:-translate-y-1 hover:border-brand-blue/20 hover:shadow-pop dark:border-white/5"
          >
            <div className="absolute -right-4 -top-4 opacity-[0.03] transition-transform group-hover:scale-110">
              <node.icon className="h-32 w-32" />
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-dark/5 bg-surface-2 shadow-inner transition-colors group-hover:bg-brand-dark group-hover:text-brand-yellow`}
              >
                <node.icon className="h-6 w-6" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted opacity-20 transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:opacity-100" />
            </div>

            <div className="relative z-10">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-main">
                {node.label}
              </h3>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted opacity-60">
                {node.desc}
              </p>
            </div>
          </Link>
        ))}
      </nav>

      {/* 03. TERMINAL MAESTRA (LOGIC COMPONENT) */}
      <section className="relative px-2 pt-6">
        {/* Acento lateral de la Bóveda Ops */}
        <div className="absolute -left-6 top-0 h-full w-1.5 rounded-full bg-brand-yellow opacity-20 dark:opacity-40" />

        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <h2 className="font-heading text-3xl uppercase tracking-tight text-main">
              Live Operational Trace
            </h2>
          </div>
          <div className="hidden items-center gap-3 rounded-full border border-brand-dark/5 bg-surface-2 px-4 py-1.5 sm:flex">
            <Zap className="h-3 w-3 fill-current text-brand-yellow" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted">
              Real-time Stream
            </span>
          </div>
        </div>

        {/* El componente cliente centraliza la telemetría, el búnker de seguridad y la Two-Man Rule */}
        <AdminOpsClient />
      </section>

      {/* 04. FOOTER DE CONFORMIDAD TÉCNICA (Estilo Ops Core) */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Operations Sovereignty Verified
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Layers className="h-4 w-4 opacity-50" /> Ops Node v4.8
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Database className="h-4 w-4" /> Registry Integrity: 100%
        </div>
      </footer>
    </main>
  );
}

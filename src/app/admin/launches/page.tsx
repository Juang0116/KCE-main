/* src/app/admin/launches/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import {
  Rocket,
  Globe,
  Calendar,
  ClipboardList,
  Terminal,
  ShieldCheck,
  Sparkles,
  Zap,
  ArrowRight,
  MapPin,
  Activity,
  Layers,
  Hash,
} from 'lucide-react';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Market Launches | KCE Ops',
  description: 'Gestión de runbooks de despliegue de mercado para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

type LaunchRow = {
  id: string;
  name: string | null;
  market: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string | null;
};

export default async function AdminLaunchesPage() {
  const sb = getSupabaseAdmin();
  const sbAny = sb as any;

  const { data, error } = await sbAny
    .from('growth_launches')
    .select('id,name,market,status,start_date,end_date,notes,created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const launches = (data ?? []) as LaunchRow[];

  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-7xl space-y-12 p-4 pb-32 duration-1000 md:p-6">
      {/* 01. STATUS BAR: TELEMETRÍA DE EXPANSIÓN */}
      <div className="flex cursor-default items-center justify-between px-2 opacity-40 transition-opacity duration-500 hover:opacity-100">
        <div className="flex items-center gap-3">
          <Terminal className="h-3.5 w-3.5 text-brand-blue" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            Growth Lane: /market-launches-v1.2
          </span>
        </div>
        <div className="flex items-center gap-4 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-4 py-1.5">
          <Globe className="h-3 w-3 animate-pulse text-brand-blue" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-brand-blue/70">
            Expansion Engine: Operational
          </span>
        </div>
      </div>

      {/* 02. CABECERA ESTRATÉGICA */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <h1 className="font-heading text-5xl leading-none tracking-tighter text-main md:text-7xl">
            Market <span className="font-light italic text-brand-yellow">Launches</span>
          </h1>
          <p className="max-w-2xl text-lg font-light leading-relaxed text-muted">
            Runbooks de Go-To-Market. Gestiona checklists de despliegue y monitorea misiones de
            expansión por mercado objetivo para Knowing Cultures S.A.S.
          </p>
        </div>

        <div className="flex shrink-0 gap-4">
          <Button
            asChild
            className="h-14 rounded-full bg-brand-dark px-10 text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95"
          >
            <Link
              href="/admin/launches/new"
              className="flex items-center gap-3"
            >
              <Zap className="h-5 w-5 fill-current" />
              <span className="text-xs font-bold uppercase tracking-widest">Inyectar Misión</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* 03. TABLA DE DESPLIEGUES (BÓVEDA DE MISIONES) */}
      <section className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
        <div className="custom-scrollbar overflow-x-auto px-2 py-6">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-surface-2/50 border-b border-brand-dark/5 dark:border-white/5">
              <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                <th className="px-8 py-5">Misión / Nombre</th>
                <th className="px-8 py-5">Mercado Objetivo</th>
                <th className="px-8 py-5 text-center">Estatus Operativo</th>
                <th className="px-8 py-5">Ventana de Despliegue</th>
                <th className="px-8 py-5 text-right">Trazas Tácticas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
              {launches.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="bg-surface px-8 py-40 text-center"
                  >
                    <Rocket className="mx-auto mb-6 h-16 w-16 text-brand-blue opacity-10" />
                    <p className="font-heading text-xl tracking-tight text-main opacity-30">
                      Hangar Vacío
                    </p>
                    <p className="mt-2 text-sm font-light italic text-muted">
                      No hay misiones de lanzamiento registradas en este nodo.
                    </p>
                  </td>
                </tr>
              ) : (
                launches.map((x) => (
                  <tr
                    key={x.id}
                    className="hover:bg-surface-2/50 group cursor-default bg-surface transition-colors"
                  >
                    <td className="px-8 py-8 align-top">
                      <div className="font-heading text-xl leading-tight tracking-tight text-main transition-colors group-hover:text-brand-blue">
                        {x.name ?? 'Misión Innominada'}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 font-mono text-[9px] uppercase text-muted opacity-40">
                        <Hash className="h-2.5 w-2.5" /> ID: {x.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-8 py-8 align-top">
                      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-main">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue/10">
                          <MapPin className="h-4 w-4 text-brand-blue opacity-60" />
                        </div>
                        {x.market ?? 'GLOBAL_REACH'}
                      </div>
                    </td>
                    <td className="px-8 py-8 text-center align-top">
                      <span
                        className={`inline-flex items-center rounded-full border px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest shadow-sm ${
                          x.status === 'active'
                            ? 'border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400'
                            : 'border-brand-dark/10 bg-surface-2 text-muted dark:border-white/10'
                        }`}
                      >
                        <div
                          className={`mr-2 h-1.5 w-1.5 rounded-full ${x.status === 'active' ? 'animate-pulse bg-green-500' : 'bg-muted opacity-30'}`}
                        />
                        {x.status ?? 'PENDING'}
                      </span>
                    </td>
                    <td className="px-8 py-8 align-top">
                      <div className="flex items-center gap-3 font-mono text-[11px] text-brand-blue opacity-70">
                        {x.start_date ?? 'TBD'} <ArrowRight className="h-3 w-3 opacity-30" />{' '}
                        {x.end_date ?? 'TBD'}
                      </div>
                    </td>
                    <td className="max-w-[400px] px-8 py-8 text-right align-top">
                      <p
                        className="line-clamp-2 text-[13px] font-light italic leading-relaxed text-muted"
                        title={x.notes ?? ''}
                      >
                        &quot;{x.notes ?? 'Sin anotaciones tácticas registradas.'}&quot;
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 04. PASOS TÁCTICOS RECOMENDADOS (RUNBOOK LOOK) */}
      <section className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="group relative overflow-hidden rounded-[3.5rem] border border-brand-dark/20 bg-brand-dark p-12 text-white shadow-2xl">
          <div className="pointer-events-none absolute -bottom-10 -right-10 opacity-[0.03] transition-transform duration-1000 group-hover:scale-110">
            <ClipboardList className="h-80 w-80" />
          </div>
          <div className="relative z-10 space-y-10">
            <header className="space-y-3">
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-yellow">
                <Zap className="h-4 w-4 fill-current" /> Next Tactical Move
              </div>
              <h3 className="font-heading text-4xl tracking-tight">Protocolo de Despliegue</h3>
            </header>

            <div className="grid gap-8">
              {[
                {
                  t: 'Inyectar Misión',
                  d: 'Segmenta el tráfico creando un launch específico. Ejemplo: "Alemania-Colombia Premium Q2".',
                },
                {
                  t: 'Checklist de Activos',
                  d: 'Valida items en growth_launch_items para Ads, SEO y Operaciones antes del escalado masivo.',
                },
                {
                  t: 'Trazabilidad UTM',
                  d: 'Sincroniza parámetros UTM para blindar la atribución y evitar fugas de revenue.',
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="group/item flex gap-6"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-inner transition-colors group-hover/item:border-brand-yellow/50">
                    <span className="font-mono text-lg font-bold text-brand-yellow">{i + 1}</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold uppercase tracking-widest text-brand-blue/80">
                      {step.t}
                    </h4>
                    <p className="max-w-lg text-base font-light leading-relaxed text-white/40">
                      {step.d}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Módulo de Integridad de Datos */}
        <div className="relative flex flex-col justify-center space-y-8 overflow-hidden rounded-[3.5rem] border border-brand-dark/5 bg-surface p-10 shadow-soft dark:border-white/5">
          <div className="pointer-events-none absolute -right-6 -top-6 opacity-[0.02]">
            <ShieldCheck className="h-48 w-48 text-brand-blue" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4 text-brand-blue">
              <ShieldCheck className="h-8 w-8" />
              <h4 className="font-heading text-2xl tracking-tight">Expansion Guard</h4>
            </div>
            <p className="border-l-2 border-brand-blue/20 pl-6 text-base font-light italic leading-relaxed text-muted opacity-80">
              &quot;La expansión sin métricas de retorno es solo ruido operativo. Asegura que cada
              lanzamiento tenga un nodo de atribución validado para evitar fugas financieras.&quot;
            </p>
            <div className="flex items-center justify-between border-t border-brand-dark/5 pt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-40 dark:border-white/5">
              <span>DATABASE: GROWTH_CORE</span>
              <span className="text-green-600 dark:text-green-400">Integrity: 100%</span>
            </div>
          </div>
        </div>
      </section>

      {/* 05. FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Activity className="h-4 w-4 text-brand-blue" /> GTM Infrastructure Active
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Layers className="h-4 w-4" /> Expansion Unit v1.2
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-4 w-4" /> Growth Intelligence Node
        </div>
      </footer>
    </main>
  );
}

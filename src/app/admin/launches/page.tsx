/* src/app/admin/launches/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { 
  Rocket, Globe, Calendar, ClipboardList, 
  Terminal, ShieldCheck, Sparkles, Zap,
  ArrowRight, MapPin, Activity, Layers, Hash
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
    <main className="mx-auto max-w-7xl space-y-12 p-4 md:p-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. STATUS BAR: TELEMETRÍA DE EXPANSIÓN */}
      <div className="flex items-center justify-between px-2 opacity-40 hover:opacity-100 transition-opacity duration-500 cursor-default">
        <div className="flex items-center gap-3">
          <Terminal className="h-3.5 w-3.5 text-brand-blue" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            Growth Lane: /market-launches-v1.2
          </span>
        </div>
        <div className="flex items-center gap-4 px-4 py-1.5 rounded-full bg-brand-blue/5 border border-brand-blue/10">
           <Globe className="h-3 w-3 text-brand-blue animate-pulse" />
           <span className="text-[9px] font-mono text-brand-blue/70 uppercase tracking-widest">
             Expansion Engine: Operational
           </span>
        </div>
      </div>

      {/* 02. CABECERA ESTRATÉGICA */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div className="space-y-4">
          <h1 className="font-heading text-5xl md:text-7xl text-main tracking-tighter leading-none">
            Market <span className="text-brand-yellow italic font-light">Launches</span>
          </h1>
          <p className="text-lg text-muted font-light max-w-2xl leading-relaxed">
            Runbooks de Go-To-Market. Gestiona checklists de despliegue y monitorea misiones de expansión por mercado objetivo para Knowing Cultures S.A.S.
          </p>
        </div>

        <div className="flex gap-4 shrink-0">
          <Button asChild className="rounded-full bg-brand-dark text-brand-yellow px-10 h-14 shadow-pop hover:bg-brand-blue hover:text-white transition-all active:scale-95">
            <Link href="/admin/launches/new" className="flex items-center gap-3">
               <Zap className="h-5 w-5 fill-current" /> 
               <span className="text-xs font-bold uppercase tracking-widest">Inyectar Misión</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* 03. TABLA DE DESPLIEGUES (BÓVEDA DE MISIONES) */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar px-2 py-6">
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
                  <td colSpan={5} className="px-8 py-40 text-center bg-surface">
                    <Rocket className="mx-auto h-16 w-16 text-brand-blue opacity-10 mb-6" />
                    <p className="text-xl font-heading text-main tracking-tight opacity-30">Hangar Vacío</p>
                    <p className="text-sm font-light text-muted mt-2 italic">No hay misiones de lanzamiento registradas en este nodo.</p>
                  </td>
                </tr>
              ) : (
                launches.map((x) => (
                  <tr key={x.id} className="group transition-colors hover:bg-surface-2/50 cursor-default bg-surface">
                    <td className="px-8 py-8 align-top">
                      <div className="font-heading text-xl text-main group-hover:text-brand-blue transition-colors leading-tight tracking-tight">
                        {x.name ?? 'Misión Innominada'}
                      </div>
                      <div className="mt-2 text-[9px] font-mono text-muted opacity-40 uppercase flex items-center gap-1.5">
                         <Hash className="h-2.5 w-2.5" /> ID: {x.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-8 py-8 align-top">
                      <div className="flex items-center gap-3 text-main font-bold uppercase tracking-widest text-[10px]">
                         <div className="h-8 w-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-brand-blue opacity-60" />
                         </div>
                         {x.market ?? 'GLOBAL_REACH'}
                      </div>
                    </td>
                    <td className="px-8 py-8 align-top text-center">
                      <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest border shadow-sm ${
                        x.status === 'active' 
                          ? 'border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400' 
                          : 'border-brand-dark/10 dark:border-white/10 bg-surface-2 text-muted'
                      }`}>
                        <div className={`h-1.5 w-1.5 rounded-full mr-2 ${x.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-muted opacity-30'}`} />
                        {x.status ?? 'PENDING'}
                      </span>
                    </td>
                    <td className="px-8 py-8 align-top">
                      <div className="flex items-center gap-3 font-mono text-[11px] text-brand-blue opacity-70">
                        {x.start_date ?? 'TBD'} <ArrowRight className="h-3 w-3 opacity-30" /> {x.end_date ?? 'TBD'}
                      </div>
                    </td>
                    <td className="px-8 py-8 align-top text-right max-w-[400px]">
                      <p className="text-[13px] font-light text-muted line-clamp-2 italic leading-relaxed" title={x.notes ?? ''}>
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
        <div className="rounded-[3.5rem] border border-brand-dark/20 bg-brand-dark p-12 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
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
                { t: 'Inyectar Misión', d: 'Segmenta el tráfico creando un launch específico. Ejemplo: "Alemania-Colombia Premium Q2".' },
                { t: 'Checklist de Activos', d: 'Valida items en growth_launch_items para Ads, SEO y Operaciones antes del escalado masivo.' },
                { t: 'Trazabilidad UTM', d: 'Sincroniza parámetros UTM para blindar la atribución y evitar fugas de revenue.' }
              ].map((step, i) => (
                <div key={i} className="flex gap-6 group/item">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 group-hover/item:border-brand-yellow/50 transition-colors shadow-inner">
                    <span className="font-mono text-lg font-bold text-brand-yellow">{i + 1}</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-base uppercase tracking-widest text-brand-blue/80">{step.t}</h4>
                    <p className="text-base font-light text-white/40 leading-relaxed max-w-lg">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Módulo de Integridad de Datos */}
        <div className="rounded-[3.5rem] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 space-y-8 shadow-soft flex flex-col justify-center relative overflow-hidden">
           <div className="absolute -right-6 -top-6 opacity-[0.02] pointer-events-none">
              <ShieldCheck className="h-48 w-48 text-brand-blue" />
           </div>
           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4 text-brand-blue">
                 <ShieldCheck className="h-8 w-8" />
                 <h4 className="font-heading text-2xl tracking-tight">Expansion Guard</h4>
              </div>
              <p className="text-base font-light text-muted leading-relaxed italic border-l-2 border-brand-blue/20 pl-6 opacity-80">
                &quot;La expansión sin métricas de retorno es solo ruido operativo. Asegura que cada lanzamiento tenga un 
                nodo de atribución validado para evitar fugas financieras.&quot;
              </p>
              <div className="pt-6 border-t border-brand-dark/5 dark:border-white/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-40">
                <span>DATABASE: GROWTH_CORE</span>
                <span className="text-green-600 dark:text-green-400">Integrity: 100%</span>
              </div>
           </div>
        </div>
      </section>

      {/* 05. FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Activity className="h-4 w-4 text-brand-blue" /> GTM Infrastructure Active
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Layers className="h-4 w-4" /> Expansion Unit v1.2
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-4 w-4" /> Growth Intelligence Node
        </div>
      </footer>

    </main>
  );
}
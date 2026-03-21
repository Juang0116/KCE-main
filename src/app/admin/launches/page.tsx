import 'server-only';
import type { Metadata } from 'next';
import { 
  Rocket, Globe, Calendar, ClipboardList, 
  Terminal, ShieldCheck, Sparkles, Zap,
  ArrowRight, MapPin, Activity, Layers
} from 'lucide-react';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Market Launches | Growth KCE',
  description: 'Gestión de runbooks de despliegue de mercado para Knowing Cultures Enterprise.',
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
    <main className="mx-auto max-w-7xl space-y-12 p-6 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. NODO DE IDENTIFICACIÓN TÉCNICA */}
      <div className="flex items-center justify-between px-2 opacity-50 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
          <Terminal className="h-3.5 w-3.5 text-brand-blue" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            Growth Lane: /market-launches
          </span>
        </div>
        <div className="flex items-center gap-4 bg-brand-blue/5 border border-brand-blue/10 px-4 py-1.5 rounded-full">
           <Globe className="h-3 w-3 text-brand-blue animate-pulse" />
           <span className="text-[9px] font-mono text-brand-blue/60 uppercase tracking-tighter">
             Expansion Engine: Active
           </span>
        </div>
      </div>

      {/* 02. CABECERA ESTRATÉGICA */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[color:var(--color-border)] pb-10">
        <div className="space-y-4">
          <h1 className="font-heading text-5xl md:text-6xl text-brand-blue leading-tight">
            Market <span className="text-brand-yellow italic font-light">Launches</span>
          </h1>
          <p className="text-lg text-[color:var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Runbooks de Go-To-Market. Gestiona checklists de despliegue y monitorea misiones de expansión por mercado objetivo.
          </p>
        </div>

        <div className="flex gap-3">
          <Button asChild className="rounded-full bg-brand-dark text-brand-yellow px-8 py-6 shadow-xl hover:scale-105 transition-transform">
            <Link href="/admin/launches/new">
               <Zap className="mr-2 h-4 w-4" /> Inyectar Misión
            </Link>
          </Button>
        </div>
      </header>

      {/* 03. TABLA DE DESPLIEGUES (BÓVEDA DE MISIONES) */}
      <section className="rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-2xl overflow-hidden relative">
        <div className="overflow-x-auto px-6 py-8">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[color:var(--color-surface-2)] border-b border-[color:var(--color-border)]">
              <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                <th className="px-8 py-6">Misión / Nombre</th>
                <th className="px-8 py-6">Mercado Objetivo</th>
                <th className="px-8 py-6 text-center">Estado Operativo</th>
                <th className="px-8 py-6">Ventana (ISO)</th>
                <th className="px-8 py-6 text-right">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {launches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center text-[color:var(--color-text)]/50 italic">
                    <Rocket className="mx-auto h-12 w-12 opacity-10 mb-4" />
                    No hay misiones de lanzamiento registradas en este nodo.
                  </td>
                </tr>
              ) : (
                launches.map((x) => (
                  <tr key={x.id} className="group transition-all hover:bg-brand-blue/[0.01]">
                    <td className="px-8 py-6 align-top">
                      <div className="font-heading text-lg text-brand-blue group-hover:text-brand-yellow transition-colors leading-tight">
                        {x.name ?? 'Innominado'}
                      </div>
                      <div className="mt-1 text-[9px] font-mono text-[color:var(--color-text)]/30">TRACE_ID: {x.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-8 py-6 align-top">
                      <div className="flex items-center gap-2 text-[color:var(--color-text)] font-medium uppercase tracking-tighter">
                         <MapPin className="h-3.5 w-3.5 text-brand-blue/30" />
                         {x.market ?? 'Global'}
                      </div>
                    </td>
                    <td className="px-8 py-6 align-top text-center">
                      <span className={`inline-flex items-center rounded-lg border px-3 py-1 text-[9px] font-bold uppercase tracking-widest shadow-inner ${
                        x.status === 'active' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600' : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text-muted)]'
                      }`}>
                        {x.status ?? 'Pending'}
                      </span>
                    </td>
                    <td className="px-8 py-6 align-top">
                      <div className="flex items-center gap-3 font-mono text-[10px] text-brand-blue/60">
                        {x.start_date ?? 'TBD'} <ArrowRight className="h-3 w-3 opacity-30" /> {x.end_date ?? 'TBD'}
                      </div>
                    </td>
                    <td className="px-8 py-6 align-top text-right max-w-[400px]">
                      <p className="text-xs font-light text-[color:var(--color-text)]/60 line-clamp-2 italic" title={x.notes ?? ''}>
                        &quot;{x.notes ?? 'Sin trazas de notas tácticas.'}&quot;
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 04. PASOS TÁCTICOS RECOMENDADOS */}
      <section className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="rounded-[3rem] border border-[color:var(--color-border)] bg-brand-dark p-10 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
            <ClipboardList className="h-64 w-64" />
          </div>
          <div className="relative z-10 space-y-6">
            <header className="space-y-2">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-yellow">
                  <Zap className="h-4 w-4" /> Next Tactical Move
               </div>
               <h3 className="font-heading text-3xl">Protocolo de Despliegue</h3>
            </header>
            
            <div className="grid gap-6">
              {[
                { t: 'Inyectar Misión', d: 'Segmenta el tráfico creando un launch específico (Ej: Alemania-Colombia Premium Q2).' },
                { t: 'Checklist de Activos', d: 'Valida items en growth_launch_items para Ads, SEO y Operaciones antes del escalado.' },
                { t: 'Trazabilidad UTM', d: 'Sincroniza parámetros UTM + ref partners para blindar la atribución (Patch P81).' }
              ].map((step, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:border-brand-yellow/50 transition-colors">
                    <span className="font-mono text-sm font-bold text-brand-yellow">{i + 1}</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-brand-blue/80">{step.t}</h4>
                    <p className="text-sm font-light text-white/50 leading-relaxed max-w-lg">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Módulo de Integridad de Datos */}
        <div className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 space-y-6 shadow-sm flex flex-col justify-center">
           <div className="flex items-center gap-3 text-brand-blue">
              <ShieldCheck className="h-6 w-6" />
              <h4 className="font-heading text-xl">Expansion Guard</h4>
           </div>
           <p className="text-sm font-light text-[color:var(--color-text)]/60 leading-relaxed italic border-l-2 border-brand-blue/20 pl-4">
             &quot;La expansión sin métricas de retorno es solo ruido operativo. Asegura que cada lanzamiento tenga un 
             patch P82 alineado en el núcleo para evitar fugas de atribución.&quot;
           </p>
           <div className="pt-4 border-t border-[color:var(--color-border)] flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30">
              <span>DB: growth_launches</span>
              <span className="text-emerald-600">Integrity: 100%</span>
           </div>
        </div>
      </section>

      {/* FOOTER DE SOBERANÍA */}
      <footer className="mt-20 flex flex-wrap items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Activity className="h-3.5 w-3.5" /> GTM Infrastructure Active
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> Expansion Unit v1.2
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> Growth Intelligence Node
        </div>
      </footer>

    </main>
  );
}
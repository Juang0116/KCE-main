'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  TrendingUp, RefreshCw, BarChart2, Focus, 
  AlertCircle, Sparkles, Euro, Target, 
  MousePointer2, Zap, Clock, Terminal,
  ShieldCheck, ArrowUpRight, Layers,
  Cpu, Database, Hash, ChevronRight,
  Globe, Layout, Info, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE INTELIGENCIA DE REVENUE ---
type StageRow = { stage: string; deals: number; pipeline_minor: number; avg_age_days: number; stale_over_7d: number; };
type TemplateRow = { key: string; locale: string; channel: string; variant: string; sent: number; replied: number; paid: number; reply_rate: number; paid_rate: number; };
type RecommendationRow = { type: 'template_underperformer' | 'high_reply_low_paid'; key: string; locale: string; channel: string; variant: string; sent: number; reply_rate: number; paid_rate: number; note: string; };
type RevenueOpsResponse = { window: { days: number; fromISO: string; toISO: string }; totals: { activeDeals: number; pipeline_minor: number; wonDeals: number; won_minor: number; sent: number; replied: number; paid: number; reply_rate: number; paid_rate: number; }; byStage: StageRow[]; topTemplates: TemplateRow[]; recommendations?: RecommendationRow[]; };

// --- HELPERS ---
function moneyEUR(minor: number) {
  const value = (minor ?? 0) / 100;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function pct(x: number) {
  const value = Number.isFinite(x) ? x : 0;
  return `${(value * 100).toFixed(1)}%`;
}

function stagePriority(stage: StageRow) {
  return stage.stale_over_7d * 100000 + stage.pipeline_minor;
}

export function AdminRevenueOpsClient() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<RevenueOpsResponse | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const response = await adminFetch(`/api/admin/metrics/revenue-ops?days=${days}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || 'Node_RevOps_Failure');
      setData(json);
    } catch (error: any) {
      setErr(error.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { void load(); }, [load]);

  const summary = useMemo(() => data?.totals ?? null, [data]);

  const stageFocus = useMemo(() => {
    if (!data) return [] as StageRow[];
    return [...data.byStage].sort((a, b) => stagePriority(b) - stagePriority(a)).slice(0, 3);
  }, [data]);

  const revSignals = useMemo(() => [
    { label: 'Active Pipeline', value: summary ? moneyEUR(summary.pipeline_minor) : '—', note: `Valor de ${summary?.activeDeals || 0} deals.` },
    { label: 'Revenue Won', value: summary ? moneyEUR(summary.won_minor) : '—', note: `${summary?.wonDeals || 0} cierres confirmados.` },
    { label: 'Engage Rate', value: summary ? pct(summary.reply_rate) : '—', note: `Basado en ${summary?.sent || 0} envíos.` },
  ], [summary]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <TrendingUp className="h-4 w-4" /> Growth Lane: /revenue-ops-node
          </div>
          <h1 className="font-heading text-4xl md:text-7xl text-main tracking-tighter leading-none">
            Revenue <span className="text-brand-yellow italic font-light">& Analytics</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2">
            Unidad de monitoreo de capital para Knowing Cultures S.A.S. Detecta cuellos de botella en el pipeline, audita la eficacia de cierres y optimiza el ROI.
          </p>
        </div>
      </header>

      {/* 02. WORKBENCH DE OPTIMIZACIÓN */}
      <AdminOperatorWorkbench
        eyebrow="Revenue Sovereignty"
        title="Escritorio de Optimización Forense"
        description="Si el engagement es alto pero el paid-rate cae, la fricción reside en la pasarela o en la gestión de objeciones finales. Analiza el 'Stage Purgatory' para inyectar presión."
        actions={[
          { href: '/admin/deals/board', label: 'Bandeja de Pipeline', tone: 'primary' },
          { href: '/admin/templates', label: 'Refinar Copys' }
        ]}
        signals={revSignals}
      />

      {/* 03. INSTRUMENTACIÓN DE TIEMPO (LA BÓVEDA) */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-pop relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="h-14 w-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner border border-brand-blue/5 shrink-0">
            <Clock className="h-7 w-7" />
          </div>
          <div className="space-y-2 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50 ml-1">Ventana de Observación</span>
            <div className="relative group">
              <Database className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40 group-focus-within:opacity-100 transition-opacity" />
              <select
                className="w-full h-12 pl-12 pr-10 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-sm font-bold text-main outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                <option value={7}>Ciclo: Últimos 7 días</option>
                <option value={30}>Ciclo: Últimos 30 días</option>
                <option value={90}>Trimestre Operativo</option>
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-muted opacity-30 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-surface-2 border border-brand-dark/5">
           <div className={`h-2 w-2 rounded-full ${loading ? 'bg-brand-yellow animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
           <span className="text-[10px] font-mono text-muted uppercase tracking-[0.2em]">
             {loading ? 'Calculando Nodos...' : 'Telemetry: Nominal'}
           </span>
           <div className="w-px h-4 bg-brand-dark/10 mx-2" />
           <button onClick={() => void load()} className="text-brand-blue hover:scale-110 transition-transform">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </section>

      {err && (
        <div className="mx-2 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/10 p-6 flex items-center gap-4 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2 shadow-sm font-bold">
          <AlertCircle className="h-6 w-6 opacity-60" />
          <p className="text-sm font-medium">Falla de Enlace de Datos: <span className="font-light">{err}</span></p>
        </div>
      )}

      {data && summary ? (
        <>
          {/* 04. KPI GRID (ESTADO FINANCIERO) */}
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { l: 'Pipeline Visible', v: moneyEUR(summary.pipeline_minor), s: `${summary.activeDeals} deals activos`, c: 'text-brand-blue', i: Euro, bg: 'bg-brand-blue/5' },
              { l: 'Revenue Cerrado', v: moneyEUR(summary.won_minor), s: `${summary.wonDeals} cierres confirmados`, c: 'text-green-600', i: ShieldCheck, bg: 'bg-green-500/5' },
              { l: 'Engagement', v: pct(summary.reply_rate), s: `${summary.replied} respuestas`, c: 'text-main', i: MousePointer2, bg: 'bg-brand-dark/5' },
              { l: 'Paid Conversion', v: pct(summary.paid_rate), s: `${summary.paid} pagos liquidados`, c: 'text-brand-blue font-bold', i: Zap, bg: 'bg-brand-blue/5' }
            ].map((kpi, i) => (
              <div key={i} className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-soft transition-all hover:shadow-pop hover:-translate-y-1">
                <header className="flex items-center justify-between mb-8">
                   <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">{kpi.l}</div>
                   <div className={`h-10 w-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                      <kpi.i className={`h-5 w-5 ${kpi.c} opacity-40 group-hover:opacity-100 transition-opacity`} />
                   </div>
                </header>
                <div className={`text-4xl font-heading tracking-tighter ${kpi.c} mb-3`}>{kpi.v}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-40">{kpi.s}</div>
              </div>
            ))}
          </div>

          {/* 05. ANÁLISIS DE FOCO Y ESTANCAMIENTO */}
          <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
            
            {/* FOCOS DE ACCIÓN */}
            <section className="xl:col-span-2 rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 shadow-pop relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 opacity-[0.02] pointer-events-none"><Focus className="h-64 w-64 text-brand-blue" /></div>
              <header className="flex items-center gap-4 border-b border-brand-dark/5 dark:border-white/5 pb-8 mb-10 relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner">
                   <Target className="h-6 w-6" />
                </div>
                <div>
                   <h2 className="font-heading text-3xl text-main tracking-tight uppercase leading-none">Focos Estratégicos</h2>
                   <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40 mt-1">High-Impact Action Points</p>
                </div>
              </header>
              
              <div className="grid gap-6 sm:grid-cols-3 relative z-10">
                {[
                  { label: 'Etapa Crítica', value: stageFocus[0]?.stage || 'Nominal', note: stageFocus[0] ? `${stageFocus[0].stale_over_7d} deals estancados.` : 'Pipeline fluyendo.' },
                  { label: 'Node Recommendation', value: data.recommendations?.[0]?.key || 'Optimized', note: data.recommendations?.[0]?.note || 'Sin anomalías detectadas.' },
                  { label: 'Paid Health', value: pct(summary.paid_rate), note: summary.paid_rate < 0.08 ? 'Revisar cierres urgentes.' : 'Cierre comercial saludable.' }
                ].map((item, i) => (
                  <div key={i} className="rounded-[2.2rem] border border-brand-dark/5 bg-surface-2/50 p-8 shadow-sm group-hover:shadow-soft transition-all">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-40 mb-6">{item.label}</div>
                    <div className="text-xl font-heading text-main mb-4 truncate tracking-tight">{item.value}</div>
                    <p className="text-[12px] font-light leading-relaxed text-muted italic border-l-2 border-brand-blue/10 pl-4">{item.note}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* STAGE PURGATORY (LA ALERTA) */}
            <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 shadow-pop space-y-10 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 opacity-[0.02] pointer-events-none"><AlertCircle className="h-48 w-48 text-brand-blue" /></div>
              <header className="flex items-center gap-4 border-b border-brand-dark/5 dark:border-white/5 pb-8 relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-brand-yellow/10 flex items-center justify-center text-brand-yellow shadow-inner">
                   <Clock className="h-6 w-6" />
                </div>
                <div>
                   <h2 className="font-heading text-3xl text-main tracking-tight uppercase leading-none">Stage Purgatory</h2>
                   <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40 mt-1">Stale Pipeline Nodes</p>
                </div>
              </header>
              
              <div className="space-y-4 relative z-10">
                {stageFocus.map((stage) => (
                  <div key={stage.stage} className="p-6 rounded-2xl border border-brand-dark/5 bg-surface-2/30 transition-all hover:scale-[1.02] shadow-sm group/stage">
                    <div className="flex items-center justify-between mb-3">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue">{stage.stage}</span>
                       <span className="font-mono text-xs font-bold text-muted opacity-40">{stage.deals} deals</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="font-heading text-2xl text-main tracking-tight">{moneyEUR(stage.pipeline_minor)}</span>
                       <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border shadow-sm ${stage.stale_over_7d > 0 ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-green-500/10 text-green-600 border-green-500/20'}`}>
                          {stage.stale_over_7d > 0 ? `+${stage.stale_over_7d} STALE` : 'FLOW_OK'}
                       </span>
                    </div>
                    <div className="mt-5 pt-4 border-t border-brand-dark/5 flex items-center justify-between">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-30">Latencia Media</span>
                       <span className="text-sm font-mono font-bold text-main">{stage.avg_age_days.toFixed(1)} DÍAS</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* 06. NEURAL ENGINE INSIGHTS (SPARKLES) */}
          {data.recommendations?.length ? (
            <section className="rounded-[4rem] border border-brand-yellow/30 bg-brand-yellow/[0.02] p-12 md:p-16 shadow-2xl space-y-12 relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
                 <Sparkles className="h-[40rem] w-[40rem] text-brand-yellow" />
              </div>
              
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10 border-b border-brand-yellow/20 pb-10">
                <div className="flex items-center gap-6">
                   <div className="h-16 w-16 rounded-[2rem] bg-brand-yellow text-brand-dark flex items-center justify-center shadow-pop group-hover:rotate-12 transition-transform">
                      <Cpu className="h-8 w-8 animate-pulse" />
                   </div>
                   <div>
                      <h2 className="font-heading text-4xl text-main tracking-tight uppercase leading-none">Neural Insights</h2>
                      <p className="text-base text-muted font-light mt-2 italic">Análisis algorítmico de fricción y conversión comercial.</p>
                   </div>
                </div>
                <div className="px-6 py-2 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 text-[10px] font-black text-brand-yellow uppercase tracking-[0.4em] backdrop-blur-xl">
                   Strategy_Mode: Aggressive
                </div>
              </header>
              
              <div className="grid gap-8 md:grid-cols-3 relative z-10">
                {data.recommendations.map((rec, i) => (
                  <div key={i} className="p-10 rounded-[3rem] border border-brand-yellow/10 bg-surface shadow-soft hover:shadow-pop transition-all group/card hover:-translate-y-2">
                    <header className="flex items-center justify-between mb-8">
                       <span className="px-3 py-1 rounded-lg bg-surface-2 text-[10px] font-black uppercase tracking-widest text-brand-blue border border-brand-dark/5">{rec.type.replace(/_/g, ' ')}</span>
                       <div className="flex items-center gap-2 font-mono text-[10px] text-muted opacity-40 uppercase tracking-tighter">
                          <Globe className="h-3 w-3" /> {rec.locale}
                       </div>
                    </header>
                    <h3 className="font-heading text-2xl text-main mb-4 tracking-tight group-hover/card:text-brand-blue transition-colors">{rec.key}</h3>
                    <div className="flex gap-4 mb-8">
                       <div className="flex-1 p-3 rounded-2xl bg-surface-2 border border-brand-dark/5 text-center">
                          <p className="text-[9px] font-bold text-muted uppercase opacity-40 mb-1">Reply</p>
                          <p className="text-base font-mono font-bold text-brand-blue">{pct(rec.reply_rate)}</p>
                       </div>
                       <div className="flex-1 p-3 rounded-2xl bg-surface-2 border border-brand-dark/5 text-center">
                          <p className="text-[9px] font-bold text-muted uppercase opacity-40 mb-1">Paid</p>
                          <p className="text-base font-mono font-bold text-green-600">{pct(rec.paid_rate)}</p>
                       </div>
                    </div>
                    <p className="text-sm font-light text-main/70 leading-relaxed italic border-t border-brand-dark/5 pt-8 group-hover/card:text-main transition-colors">
                       &quot;{rec.note}&quot;
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* 07. TABLA DE RENDIMIENTO (BÓVEDA DE OUTBOUND) */}
          <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden flex flex-col group">
            <header className="p-10 border-b border-brand-dark/5 dark:border-white/5 flex items-center justify-between bg-surface-2/30 relative overflow-hidden">
               <div className="absolute -right-6 -top-6 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000"><Layers className="h-32 w-32 text-brand-blue" /></div>
               <div className="flex items-center gap-5 relative z-10">
                  <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner border border-brand-blue/5">
                     <Layout className="h-6 w-6" />
                  </div>
                  <div>
                     <h2 className="font-heading text-3xl text-main tracking-tight uppercase leading-none">Interacción de Outbound</h2>
                     <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40 mt-1">Template Efficiency Audit</p>
                  </div>
               </div>
            </header>
            
            <div className="overflow-x-auto custom-scrollbar p-4">
              <table className="w-full text-left text-sm border-separate border-spacing-y-3 px-4">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted opacity-50">
                    <th className="px-8 py-5 rounded-l-2xl">Plantilla & Variación</th>
                    <th className="px-8 py-5 text-center">Locale</th>
                    <th className="px-8 py-5 text-center">Protocolo</th>
                    <th className="px-8 py-5 text-right">Sent</th>
                    <th className="px-8 py-5 text-right">Engagement</th>
                    <th className="px-8 py-5 text-right rounded-r-2xl">Paid Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topTemplates.map((row, i) => (
                    <tr key={i} className="group/row">
                      <td className="px-8 py-8 bg-surface border-y border-l border-brand-dark/5 dark:border-white/5 rounded-l-[1.8rem] shadow-sm">
                        <div className="font-bold text-main text-sm uppercase tracking-tight group-hover/row:text-brand-blue transition-colors flex items-center gap-3">
                           <Hash className="h-4 w-4 opacity-20" />
                           {row.key} 
                           <span className="px-2 py-0.5 rounded bg-surface-2 text-[9px] font-mono font-black border border-brand-dark/5">V_{row.variant}</span>
                        </div>
                      </td>
                      <td className="px-8 py-8 bg-surface border-y border-brand-dark/5 dark:border-white/5 text-center font-mono text-[11px] text-muted uppercase tracking-widest">{row.locale}</td>
                      <td className="px-8 py-8 bg-surface border-y border-brand-dark/5 dark:border-white/5 text-center">
                         <span className="px-3 py-1 rounded-lg bg-surface-2 border border-brand-dark/5 text-[10px] font-black text-main uppercase tracking-tighter shadow-inner">{row.channel}</span>
                      </td>
                      <td className="px-8 py-8 bg-surface border-y border-brand-dark/5 dark:border-white/5 text-right font-mono text-xs text-muted opacity-40">{row.sent}</td>
                      <td className="px-8 py-8 bg-surface border-y border-brand-dark/5 dark:border-white/5 text-right">
                         <div className="flex flex-col items-end">
                            <span className="font-bold text-main text-base">{row.replied}</span>
                            <span className="text-[10px] font-mono text-brand-blue font-bold">({pct(row.reply_rate)})</span>
                         </div>
                      </td>
                      <td className="px-8 py-8 bg-surface border-y border-r border-brand-dark/5 dark:border-white/5 rounded-r-[1.8rem] text-right shadow-sm">
                         <div className="flex flex-col items-end">
                            <span className="font-heading text-xl text-green-600">{row.paid}</span>
                            <span className="text-[10px] font-mono text-green-600/50 font-bold">({pct(row.paid_rate)})</span>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <div className="py-48 flex flex-col items-center justify-center gap-6 animate-pulse">
           <RefreshCw className="h-16 w-16 text-brand-blue opacity-10 animate-spin" />
           <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted">Interrogando la Bóveda de Revenue...</p>
        </div>
      )}

      {/* 08. FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Confidence Revenue Metrics
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Terminal className="h-4 w-4 opacity-50" /> Neural Pipeline v2.4
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Zap className="h-4 w-4 animate-pulse" /> Live Attribution Active
        </div>
      </footer>
      
    </div>
  );
}
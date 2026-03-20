'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  TrendingUp, RefreshCw, BarChart2, Focus, 
  AlertCircle, Sparkles, Euro, Target, 
  MousePointer2, Zap, Clock, Terminal,
  ShieldCheck, ArrowUpRight, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE INTELIGENCIA DE REVENUE ---
type StageRow = { stage: string; deals: number; pipeline_minor: number; avg_age_days: number; stale_over_7d: number; };
type TemplateRow = { key: string; locale: string; channel: string; variant: string; sent: number; replied: number; paid: number; reply_rate: number; paid_rate: number; };
type RecommendationRow = { type: 'template_underperformer' | 'high_reply_low_paid'; key: string; locale: string; channel: string; variant: string; sent: number; reply_rate: number; paid_rate: number; note: string; };
type RevenueOpsResponse = { window: { days: number; fromISO: string; toISO: string }; totals: { activeDeals: number; pipeline_minor: number; wonDeals: number; won_minor: number; sent: number; replied: number; paid: number; reply_rate: number; paid_rate: number; }; byStage: StageRow[]; topTemplates: TemplateRow[]; recommendations?: RecommendationRow[]; };

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

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => data?.totals ?? null, [data]);

  const stageFocus = useMemo(() => {
    if (!data) return [] as StageRow[];
    return [...data.byStage].sort((a, b) => stagePriority(b) - stagePriority(a)).slice(0, 3);
  }, [data]);

  const revSignals = useMemo(() => [
    { label: 'Pipeline_Active', value: summary ? moneyEUR(summary.pipeline_minor) : '—', note: `Valor de ${summary?.activeDeals || 0} tratos.` },
    { label: 'Revenue_Won', value: summary ? moneyEUR(summary.won_minor) : '—', note: `${summary?.wonDeals || 0} cierres confirmados.` },
    { label: 'Engagement_Rate', value: summary ? pct(summary.reply_rate) : '—', note: `Basado en ${summary?.sent || 0} envíos.` },
  ], [summary]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER DE INTELIGENCIA COMERCIAL */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10 px-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <TrendingUp className="h-3.5 w-3.5" /> Growth Lane: /revenue-ops
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            Revenue <span className="text-brand-yellow italic font-light">& Analytics</span>
          </h1>
          <p className="mt-4 text-base text-[color:var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Unidad de monitoreo de capital. Detecta cuellos de botella en el pipeline, audita la eficacia 
            de cierres y optimiza el retorno de cada interacción comercial.
          </p>
        </div>
      </header>

      <AdminOperatorWorkbench
        eyebrow="Revenue Sovereignty"
        title="Escritorio de Optimización Forense"
        description="Si el engagement es alto pero el paid-rate cae, la fricción está en el checkout o en la gestión de objeciones. Analiza la 'Etapa Estancada' para inyectar presión."
        actions={[
          { href: '/admin/deals', label: 'Auditar Pipeline', tone: 'primary' },
          { href: '/admin/templates', label: 'Refinar Copys' }
        ]}
        signals={revSignals}
      />

      {/* INSTRUMENTACIÓN DE TIEMPO (BÓVEDA) */}
      <section className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 w-full sm:w-auto">
            <div className="h-12 w-12 rounded-2xl bg-brand-blue/5 flex items-center justify-center text-brand-blue shadow-inner border border-brand-blue/10">
              <BarChart2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 ml-1">Ventana de Análisis</span>
              <div className="relative group">
                <select
                  className="h-11 pl-4 pr-10 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-sm font-bold text-brand-blue outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/5 transition-all"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                >
                  <option value={7}>Ciclo 7 días</option>
                  <option value={30}>Ciclo 30 días</option>
                  <option value={90}>Trimestre Operativo</option>
                </select>
                <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-blue/30 pointer-events-none" />
              </div>
            </div>
          </div>
          <Button onClick={load} disabled={loading} className="h-11 rounded-xl px-8 bg-brand-dark text-brand-yellow shadow-lg hover:scale-105 transition-transform disabled:opacity-50">
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Sincronizar Nodo
          </Button>
        </div>
      </section>

      {err && (
        <div className="mx-2 rounded-[2rem] border border-rose-500/20 bg-rose-500/5 p-6 flex items-center gap-4 text-rose-700 animate-in zoom-in-95">
          <AlertCircle className="h-6 w-6 opacity-40" />
          <p className="text-sm font-medium">{err}</p>
        </div>
      )}

      {data && summary ? (
        <>
          {/* 01. KPI GRID (ESTADO FINANCIERO) */}
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { l: 'Pipeline Visible', v: moneyEUR(summary.pipeline_minor), s: `${summary.activeDeals} deals`, c: 'text-brand-blue', i: Euro },
              { l: 'Revenue Cerrado', v: moneyEUR(summary.won_minor), s: `${summary.wonDeals} ganados`, c: 'text-emerald-600', i: ShieldCheck },
              { l: 'Engagement', v: pct(summary.reply_rate), s: `${summary.replied} respuestas`, c: 'text-brand-blue', i: MousePointer2 },
              { l: 'Paid Conversion', v: pct(summary.paid_rate), s: `${summary.paid} pagos reales`, c: 'text-brand-blue', i: Zap }
            ].map((kpi, i) => (
              <div key={i} className="group rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-sm transition-all hover:shadow-xl hover:border-brand-blue/10">
                <header className="flex items-center justify-between mb-6">
                   <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30">{kpi.l}</div>
                   <kpi.i className={`h-4 w-4 ${kpi.c} opacity-30 group-hover:opacity-100 transition-opacity`} />
                </header>
                <div className={`text-4xl font-heading tracking-tight ${kpi.c} mb-2`}>{kpi.v}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40">{kpi.s}</div>
              </div>
            ))}
          </div>

          {/* 02. ANÁLISIS DE FOCO Y ESTANCAMIENTO */}
          <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-2xl overflow-hidden group">
              <header className="p-8 border-b border-[color:var(--color-border)] flex items-center gap-4">
                <Focus className="h-5 w-5 text-brand-blue" />
                <h2 className="font-heading text-2xl text-brand-blue">Focos de Acción Estratégica</h2>
              </header>
              <div className="grid gap-6 p-8 sm:grid-cols-3">
                {[
                  { label: 'Etapa Crítica', value: stageFocus[0]?.stage || 'Nominal', note: stageFocus[0] ? `${stageFocus[0].stale_over_7d} deals estancados.` : 'Pipeline fluido.' },
                  { label: 'Node Recommendation', value: data.recommendations?.[0]?.key || 'Optimized', note: data.recommendations?.[0]?.note || 'Sin anomalías.' },
                  { label: 'Paid Health', value: pct(summary.paid_rate), note: summary.paid_rate < 0.08 ? 'Revisar cierres urgentes.' : 'Cierre estable.' }
                ].map((item, i) => (
                  <div key={i} className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-sm group-hover:shadow-md transition-shadow">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 mb-4">{item.label}</div>
                    <div className="text-xl font-heading text-[color:var(--color-text)] mb-3 truncate">{item.value}</div>
                    <p className="text-[11px] font-light leading-relaxed text-[color:var(--color-text)]/60 italic">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* STAGE PURGATORY */}
            <div className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-2xl space-y-8">
              <header className="flex items-center gap-4 border-b border-[color:var(--color-border)] pb-6">
                <AlertCircle className="h-6 w-6 text-amber-500" />
                <h2 className="font-heading text-2xl text-brand-blue">Stage Purgatory</h2>
              </header>
              <div className="space-y-4">
                {stageFocus.map((stage) => (
                  <div key={stage.stage} className="p-5 rounded-2xl border border-black/[0.03] bg-[color:var(--color-surface)] transition-all hover:scale-[1.02] group/stage">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">{stage.stage}</span>
                       <span className="font-mono text-xs font-bold text-[color:var(--color-text)]/30">{stage.deals} deals</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="font-heading text-lg text-[color:var(--color-text)]">{moneyEUR(stage.pipeline_minor)}</span>
                       <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-[9px] font-bold uppercase tracking-widest border border-amber-500/20">+{stage.stale_over_7d} stale</span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-black/[0.03] flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30">
                       <span>Latencia Media</span>
                       <span className="text-[color:var(--color-text)]">{stage.avg_age_days.toFixed(1)} DÍAS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 03. INSIGHTS IA (SPARKLES) */}
          {data.recommendations?.length ? (
            <section className="rounded-[3.5rem] border border-brand-yellow/20 bg-brand-yellow/[0.02] p-10 shadow-2xl space-y-8 relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                 <Sparkles className="h-96 w-96 text-brand-yellow" />
              </div>
              <header className="flex items-center gap-4 relative z-10">
                <div className="h-10 w-10 rounded-2xl bg-brand-yellow text-[color:var(--color-text)] flex items-center justify-center shadow-lg">
                   <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="font-heading text-3xl text-[color:var(--color-text)]">Conversion Insights <span className="italic font-light text-brand-yellow/80">(Neural Engine)</span></h2>
              </header>
              
              <div className="grid gap-6 md:grid-cols-3 relative z-10">
                {data.recommendations.map((rec, i) => (
                  <div key={i} className="p-8 rounded-[2.5rem] border border-brand-yellow/10 bg-[color:var(--color-surface)] shadow-sm hover:shadow-xl transition-all">
                    <header className="flex items-center justify-between mb-6">
                       <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-blue">{rec.type}</span>
                       <span className="text-[9px] font-mono text-[color:var(--color-text)]/40">{rec.locale} / {rec.channel}</span>
                    </header>
                    <h3 className="font-heading text-xl text-[color:var(--color-text)] mb-2">{rec.key}</h3>
                    <div className="flex gap-3 mb-6">
                       <div className="px-3 py-1 rounded-lg bg-[color:var(--color-surface-2)] text-[10px] font-mono font-bold text-brand-blue">Reply: {pct(rec.reply_rate)}</div>
                       <div className="px-3 py-1 rounded-lg bg-[color:var(--color-surface-2)] text-[10px] font-mono font-bold text-emerald-600">Paid: {pct(rec.paid_rate)}</div>
                    </div>
                    <p className="text-sm font-light text-[color:var(--color-text)]/60 leading-relaxed border-t border-black/[0.03] pt-6 italic">"{rec.note}"</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* 04. TABLA DE RENDIMIENTO TOP PLANTILLAS */}
          <section className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-2xl overflow-hidden group">
            <header className="p-8 border-b border-[color:var(--color-border)] flex items-center gap-4">
               <Layers className="h-5 w-5 text-brand-blue" />
               <h2 className="font-heading text-2xl text-brand-blue">Métricas de Interacción de Outbound</h2>
            </header>
            <div className="overflow-x-auto p-6">
              <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                <thead className="bg-[color:var(--color-surface-2)]">
                  <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/40">
                    <th className="px-8 py-6 rounded-l-2xl">Plantilla & Variación</th>
                    <th className="px-8 py-6 text-center">Locale</th>
                    <th className="px-8 py-6 text-center">Protocolo</th>
                    <th className="px-8 py-6 text-right">Impactos (Sent)</th>
                    <th className="px-8 py-6 text-right">Engagement</th>
                    <th className="px-8 py-6 text-right rounded-r-2xl">Revenue (Paid)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.03]">
                  {data.topTemplates.map((row, i) => (
                    <tr key={i} className="group/row transition-all hover:bg-brand-blue/[0.01]">
                      <td className="px-8 py-6 font-bold text-brand-blue text-sm uppercase tracking-tight group-hover/row:text-brand-yellow transition-colors">{row.key} <span className="ml-2 font-mono text-[10px] opacity-30">v_{row.variant}</span></td>
                      <td className="px-8 py-6 text-center font-mono text-xs opacity-40 uppercase">{row.locale}</td>
                      <td className="px-8 py-6 text-center"><span className="px-3 py-1 rounded-md bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] text-[9px] font-bold text-[color:var(--color-text)] uppercase tracking-widest">{row.channel}</span></td>
                      <td className="px-8 py-6 text-right font-mono text-xs opacity-60">{row.sent}</td>
                      <td className="px-8 py-6 text-right"><span className="font-bold text-[color:var(--color-text)]">{row.replied}</span> <span className="text-[10px] opacity-30 ml-1">({pct(row.reply_rate)})</span></td>
                      <td className="px-8 py-6 text-right"><span className="font-heading text-lg text-emerald-600">{row.paid}</span> <span className="text-[10px] text-emerald-600/40 ml-1">({pct(row.paid_rate)})</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <div className="py-32 text-center">
           <RefreshCw className="h-12 w-12 text-brand-blue/10 mx-auto animate-spin mb-6" />
           <p className="text-sm font-light text-[color:var(--color-text)]/40 italic">Interrogando la base de revenue ops...</p>
        </div>
      )}

      <footer className="pt-12 flex items-center justify-center gap-12 border-t border-[color:var(--color-border)] opacity-20 hover:opacity-50 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Revenue Data
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Terminal className="h-3.5 w-3.5" /> Neural Node v2.4
        </div>
      </footer>
    </div>
  );
}
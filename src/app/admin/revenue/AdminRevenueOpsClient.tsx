'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import {
  TrendingUp,
  RefreshCw,
  BarChart2,
  Focus,
  AlertCircle,
  Sparkles,
  Euro,
  Target,
  MousePointer2,
  Zap,
  Clock,
  Terminal,
  ShieldCheck,
  ArrowUpRight,
  Layers,
  Cpu,
  Database,
  Hash,
  ChevronRight,
  Globe,
  Layout,
  Info,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE INTELIGENCIA DE REVENUE ---
type StageRow = {
  stage: string;
  deals: number;
  pipeline_minor: number;
  avg_age_days: number;
  stale_over_7d: number;
};
type TemplateRow = {
  key: string;
  locale: string;
  channel: string;
  variant: string;
  sent: number;
  replied: number;
  paid: number;
  reply_rate: number;
  paid_rate: number;
};
type RecommendationRow = {
  type: 'template_underperformer' | 'high_reply_low_paid';
  key: string;
  locale: string;
  channel: string;
  variant: string;
  sent: number;
  reply_rate: number;
  paid_rate: number;
  note: string;
};
type RevenueOpsResponse = {
  window: { days: number; fromISO: string; toISO: string };
  totals: {
    activeDeals: number;
    pipeline_minor: number;
    wonDeals: number;
    won_minor: number;
    sent: number;
    replied: number;
    paid: number;
    reply_rate: number;
    paid_rate: number;
  };
  byStage: StageRow[];
  topTemplates: TemplateRow[];
  recommendations?: RecommendationRow[];
};

// --- HELPERS ---
function moneyEUR(minor: number) {
  const value = (minor ?? 0) / 100;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
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
      const response = await adminFetch(`/api/admin/metrics/revenue-ops?days=${days}`, {
        cache: 'no-store',
      });
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

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => data?.totals ?? null, [data]);

  const stageFocus = useMemo(() => {
    if (!data) return [] as StageRow[];
    return [...data.byStage].sort((a, b) => stagePriority(b) - stagePriority(a)).slice(0, 3);
  }, [data]);

  const revSignals = useMemo(
    () => [
      {
        label: 'Active Pipeline',
        value: summary ? moneyEUR(summary.pipeline_minor) : '—',
        note: `Valor de ${summary?.activeDeals || 0} deals.`,
      },
      {
        label: 'Revenue Won',
        value: summary ? moneyEUR(summary.won_minor) : '—',
        note: `${summary?.wonDeals || 0} cierres confirmados.`,
      },
      {
        label: 'Engage Rate',
        value: summary ? pct(summary.reply_rate) : '—',
        note: `Basado en ${summary?.sent || 0} envíos.`,
      },
    ],
    [summary],
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-32 duration-1000">
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 px-2 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <TrendingUp className="h-4 w-4" /> Growth Lane: /revenue-ops-node
          </div>
          <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-7xl">
            Revenue <span className="font-light italic text-brand-yellow">& Analytics</span>
          </h1>
          <p className="mt-2 max-w-2xl text-base font-light leading-relaxed text-muted">
            Unidad de monitoreo de capital para Knowing Cultures S.A.S. Detecta cuellos de botella
            en el pipeline, audita la eficacia de cierres y optimiza el ROI.
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
          { href: '/admin/templates', label: 'Refinar Copys' },
        ]}
        signals={revSignals}
      />

      {/* 03. INSTRUMENTACIÓN DE TIEMPO (LA BÓVEDA) */}
      <section className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5 md:flex-row">
        <div className="flex w-full items-center gap-6 md:w-auto">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand-blue/5 bg-brand-blue/10 text-brand-blue shadow-inner">
            <Clock className="h-7 w-7" />
          </div>
          <div className="flex-1 space-y-2">
            <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
              Ventana de Observación
            </span>
            <div className="group relative">
              <Database className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue opacity-40 transition-opacity group-focus-within:opacity-100" />
              <select
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-brand-dark/10 bg-surface-2 pl-12 pr-10 text-sm font-bold text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                <option value={7}>Ciclo: Últimos 7 días</option>
                <option value={30}>Ciclo: Últimos 30 días</option>
                <option value={90}>Trimestre Operativo</option>
              </select>
              <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted opacity-30" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-full border border-brand-dark/5 bg-surface-2 px-6 py-3">
          <div
            className={`h-2 w-2 rounded-full ${loading ? 'animate-pulse bg-brand-yellow shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            {loading ? 'Calculando Nodos...' : 'Telemetry: Nominal'}
          </span>
          <div className="mx-2 h-4 w-px bg-brand-dark/10" />
          <button
            onClick={() => void load()}
            className="text-brand-blue transition-transform hover:scale-110"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </section>

      {err && (
        <div className="animate-in slide-in-from-top-2 mx-2 flex items-center gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-6 font-bold text-red-700 shadow-sm dark:bg-red-950/10 dark:text-red-400">
          <AlertCircle className="h-6 w-6 opacity-60" />
          <p className="text-sm font-medium">
            Falla de Enlace de Datos: <span className="font-light">{err}</span>
          </p>
        </div>
      )}

      {data && summary ? (
        <>
          {/* 04. KPI GRID (ESTADO FINANCIERO) */}
          <div className="grid gap-6 md:grid-cols-4">
            {[
              {
                l: 'Pipeline Visible',
                v: moneyEUR(summary.pipeline_minor),
                s: `${summary.activeDeals} deals activos`,
                c: 'text-brand-blue',
                i: Euro,
                bg: 'bg-brand-blue/5',
              },
              {
                l: 'Revenue Cerrado',
                v: moneyEUR(summary.won_minor),
                s: `${summary.wonDeals} cierres confirmados`,
                c: 'text-green-600',
                i: ShieldCheck,
                bg: 'bg-green-500/5',
              },
              {
                l: 'Engagement',
                v: pct(summary.reply_rate),
                s: `${summary.replied} respuestas`,
                c: 'text-main',
                i: MousePointer2,
                bg: 'bg-brand-dark/5',
              },
              {
                l: 'Paid Conversion',
                v: pct(summary.paid_rate),
                s: `${summary.paid} pagos liquidados`,
                c: 'text-brand-blue font-bold',
                i: Zap,
                bg: 'bg-brand-blue/5',
              },
            ].map((kpi, i) => (
              <div
                key={i}
                className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-soft transition-all hover:-translate-y-1 hover:shadow-pop dark:border-white/5"
              >
                <header className="mb-8 flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">
                    {kpi.l}
                  </div>
                  <div
                    className={`h-10 w-10 rounded-xl ${kpi.bg} flex items-center justify-center`}
                  >
                    <kpi.i
                      className={`h-5 w-5 ${kpi.c} opacity-40 transition-opacity group-hover:opacity-100`}
                    />
                  </div>
                </header>
                <div className={`font-heading text-4xl tracking-tighter ${kpi.c} mb-3`}>
                  {kpi.v}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-40">
                  {kpi.s}
                </div>
              </div>
            ))}
          </div>

          {/* 05. ANÁLISIS DE FOCO Y ESTANCAMIENTO */}
          <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
            {/* FOCOS DE ACCIÓN */}
            <section className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5 xl:col-span-2">
              <div className="pointer-events-none absolute -right-10 -top-10 opacity-[0.02]">
                <Focus className="h-64 w-64 text-brand-blue" />
              </div>
              <header className="relative z-10 mb-10 flex items-center gap-4 border-b border-brand-dark/5 pb-8 dark:border-white/5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue shadow-inner">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-heading text-3xl uppercase leading-none tracking-tight text-main">
                    Focos Estratégicos
                  </h2>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40">
                    High-Impact Action Points
                  </p>
                </div>
              </header>

              <div className="relative z-10 grid gap-6 sm:grid-cols-3">
                {[
                  {
                    label: 'Etapa Crítica',
                    value: stageFocus[0]?.stage || 'Nominal',
                    note: stageFocus[0]
                      ? `${stageFocus[0].stale_over_7d} deals estancados.`
                      : 'Pipeline fluyendo.',
                  },
                  {
                    label: 'Node Recommendation',
                    value: data.recommendations?.[0]?.key || 'Optimized',
                    note: data.recommendations?.[0]?.note || 'Sin anomalías detectadas.',
                  },
                  {
                    label: 'Paid Health',
                    value: pct(summary.paid_rate),
                    note:
                      summary.paid_rate < 0.08
                        ? 'Revisar cierres urgentes.'
                        : 'Cierre comercial saludable.',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-surface-2/50 rounded-[2.2rem] border border-brand-dark/5 p-8 shadow-sm transition-all group-hover:shadow-soft"
                  >
                    <div className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-40">
                      {item.label}
                    </div>
                    <div className="mb-4 truncate font-heading text-xl tracking-tight text-main">
                      {item.value}
                    </div>
                    <p className="border-l-2 border-brand-blue/10 pl-4 text-[12px] font-light italic leading-relaxed text-muted">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* STAGE PURGATORY (LA ALERTA) */}
            <section className="relative space-y-10 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5">
              <div className="pointer-events-none absolute -right-6 -top-6 opacity-[0.02]">
                <AlertCircle className="h-48 w-48 text-brand-blue" />
              </div>
              <header className="relative z-10 flex items-center gap-4 border-b border-brand-dark/5 pb-8 dark:border-white/5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-yellow/10 text-brand-yellow shadow-inner">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-heading text-3xl uppercase leading-none tracking-tight text-main">
                    Stage Purgatory
                  </h2>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40">
                    Stale Pipeline Nodes
                  </p>
                </div>
              </header>

              <div className="relative z-10 space-y-4">
                {stageFocus.map((stage) => (
                  <div
                    key={stage.stage}
                    className="bg-surface-2/30 group/stage rounded-2xl border border-brand-dark/5 p-6 shadow-sm transition-all hover:scale-[1.02]"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue">
                        {stage.stage}
                      </span>
                      <span className="font-mono text-xs font-bold text-muted opacity-40">
                        {stage.deals} deals
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-2xl tracking-tight text-main">
                        {moneyEUR(stage.pipeline_minor)}
                      </span>
                      <span
                        className={`rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-tighter shadow-sm ${stage.stale_over_7d > 0 ? 'border-red-500/20 bg-red-500/10 text-red-600' : 'border-green-500/20 bg-green-500/10 text-green-600'}`}
                      >
                        {stage.stale_over_7d > 0 ? `+${stage.stale_over_7d} STALE` : 'FLOW_OK'}
                      </span>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-brand-dark/5 pt-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-30">
                        Latencia Media
                      </span>
                      <span className="font-mono text-sm font-bold text-main">
                        {stage.avg_age_days.toFixed(1)} DÍAS
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* 06. NEURAL ENGINE INSIGHTS (SPARKLES) */}
          {data.recommendations?.length ? (
            <section className="group relative space-y-12 overflow-hidden rounded-[4rem] border border-brand-yellow/30 bg-brand-yellow/[0.02] p-12 shadow-2xl md:p-16">
              <div className="pointer-events-none absolute -right-20 -top-20 opacity-[0.03] transition-transform duration-1000 group-hover:scale-110">
                <Sparkles className="h-[40rem] w-[40rem] text-brand-yellow" />
              </div>

              <header className="relative z-10 flex flex-col justify-between gap-8 border-b border-brand-yellow/20 pb-10 md:flex-row md:items-center">
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-brand-yellow text-brand-dark shadow-pop transition-transform group-hover:rotate-12">
                    <Cpu className="h-8 w-8 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-heading text-4xl uppercase leading-none tracking-tight text-main">
                      Neural Insights
                    </h2>
                    <p className="mt-2 text-base font-light italic text-muted">
                      Análisis algorítmico de fricción y conversión comercial.
                    </p>
                  </div>
                </div>
                <div className="rounded-full border border-brand-yellow/20 bg-brand-yellow/10 px-6 py-2 text-[10px] font-black uppercase tracking-[0.4em] text-brand-yellow backdrop-blur-xl">
                  Strategy_Mode: Aggressive
                </div>
              </header>

              <div className="relative z-10 grid gap-8 md:grid-cols-3">
                {data.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="group/card rounded-[3rem] border border-brand-yellow/10 bg-surface p-10 shadow-soft transition-all hover:-translate-y-2 hover:shadow-pop"
                  >
                    <header className="mb-8 flex items-center justify-between">
                      <span className="rounded-lg border border-brand-dark/5 bg-surface-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-blue">
                        {rec.type.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-tighter text-muted opacity-40">
                        <Globe className="h-3 w-3" /> {rec.locale}
                      </div>
                    </header>
                    <h3 className="mb-4 font-heading text-2xl tracking-tight text-main transition-colors group-hover/card:text-brand-blue">
                      {rec.key}
                    </h3>
                    <div className="mb-8 flex gap-4">
                      <div className="flex-1 rounded-2xl border border-brand-dark/5 bg-surface-2 p-3 text-center">
                        <p className="mb-1 text-[9px] font-bold uppercase text-muted opacity-40">
                          Reply
                        </p>
                        <p className="font-mono text-base font-bold text-brand-blue">
                          {pct(rec.reply_rate)}
                        </p>
                      </div>
                      <div className="flex-1 rounded-2xl border border-brand-dark/5 bg-surface-2 p-3 text-center">
                        <p className="mb-1 text-[9px] font-bold uppercase text-muted opacity-40">
                          Paid
                        </p>
                        <p className="font-mono text-base font-bold text-green-600">
                          {pct(rec.paid_rate)}
                        </p>
                      </div>
                    </div>
                    <p className="text-main/70 border-t border-brand-dark/5 pt-8 text-sm font-light italic leading-relaxed transition-colors group-hover/card:text-main">
                      &quot;{rec.note}&quot;
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* 07. TABLA DE RENDIMIENTO (BÓVEDA DE OUTBOUND) */}
          <section className="group flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
            <header className="bg-surface-2/30 relative flex items-center justify-between overflow-hidden border-b border-brand-dark/5 p-10 dark:border-white/5">
              <div className="absolute -right-6 -top-6 opacity-[0.02] transition-transform duration-1000 group-hover:scale-110">
                <Layers className="h-32 w-32 text-brand-blue" />
              </div>
              <div className="relative z-10 flex items-center gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-blue/5 bg-brand-blue/10 text-brand-blue shadow-inner">
                  <Layout className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-heading text-3xl uppercase leading-none tracking-tight text-main">
                    Interacción de Outbound
                  </h2>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40">
                    Template Efficiency Audit
                  </p>
                </div>
              </div>
            </header>

            <div className="custom-scrollbar overflow-x-auto p-4">
              <table className="w-full border-separate border-spacing-y-3 px-4 text-left text-sm">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted opacity-50">
                    <th className="rounded-l-2xl px-8 py-5">Plantilla & Variación</th>
                    <th className="px-8 py-5 text-center">Locale</th>
                    <th className="px-8 py-5 text-center">Protocolo</th>
                    <th className="px-8 py-5 text-right">Sent</th>
                    <th className="px-8 py-5 text-right">Engagement</th>
                    <th className="rounded-r-2xl px-8 py-5 text-right">Paid Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topTemplates.map((row, i) => (
                    <tr
                      key={i}
                      className="group/row"
                    >
                      <td className="rounded-l-[1.8rem] border-y border-l border-brand-dark/5 bg-surface px-8 py-8 shadow-sm dark:border-white/5">
                        <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-tight text-main transition-colors group-hover/row:text-brand-blue">
                          <Hash className="h-4 w-4 opacity-20" />
                          {row.key}
                          <span className="rounded border border-brand-dark/5 bg-surface-2 px-2 py-0.5 font-mono text-[9px] font-black">
                            V_{row.variant}
                          </span>
                        </div>
                      </td>
                      <td className="border-y border-brand-dark/5 bg-surface px-8 py-8 text-center font-mono text-[11px] uppercase tracking-widest text-muted dark:border-white/5">
                        {row.locale}
                      </td>
                      <td className="border-y border-brand-dark/5 bg-surface px-8 py-8 text-center dark:border-white/5">
                        <span className="rounded-lg border border-brand-dark/5 bg-surface-2 px-3 py-1 text-[10px] font-black uppercase tracking-tighter text-main shadow-inner">
                          {row.channel}
                        </span>
                      </td>
                      <td className="border-y border-brand-dark/5 bg-surface px-8 py-8 text-right font-mono text-xs text-muted opacity-40 dark:border-white/5">
                        {row.sent}
                      </td>
                      <td className="border-y border-brand-dark/5 bg-surface px-8 py-8 text-right dark:border-white/5">
                        <div className="flex flex-col items-end">
                          <span className="text-base font-bold text-main">{row.replied}</span>
                          <span className="font-mono text-[10px] font-bold text-brand-blue">
                            ({pct(row.reply_rate)})
                          </span>
                        </div>
                      </td>
                      <td className="rounded-r-[1.8rem] border-y border-r border-brand-dark/5 bg-surface px-8 py-8 text-right shadow-sm dark:border-white/5">
                        <div className="flex flex-col items-end">
                          <span className="font-heading text-xl text-green-600">{row.paid}</span>
                          <span className="font-mono text-[10px] font-bold text-green-600/50">
                            ({pct(row.paid_rate)})
                          </span>
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
        <div className="flex animate-pulse flex-col items-center justify-center gap-6 py-48">
          <RefreshCw className="h-16 w-16 animate-spin text-brand-blue opacity-10" />
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
            Interrogando la Bóveda de Revenue...
          </p>
        </div>
      )}

      {/* 08. FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Confidence Revenue Metrics
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Terminal className="h-4 w-4 opacity-50" /> Neural Pipeline v2.4
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Zap className="h-4 w-4 animate-pulse" /> Live Attribution Active
        </div>
      </footer>
    </div>
  );
}

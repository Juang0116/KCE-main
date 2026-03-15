'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { TrendingUp, RefreshCw, BarChart2, Focus, AlertCircle, Sparkles } from 'lucide-react';

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

type FocusCard = {
  label: string;
  value: string;
  note: string;
};

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

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const response = await adminFetch(`/api/admin/metrics/revenue-ops?days=${days}`, { cache: 'no-store' });
      const json = (await response.json()) as RevenueOpsResponse & { error?: string };
      if (!response.ok) throw new Error(json?.error || 'Error cargando métricas');
      setData(json);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const summary = useMemo(() => data?.totals ?? null, [data]);

  const stageFocus = useMemo(() => {
    if (!data) return [] as StageRow[];
    return [...data.byStage].sort((a, b) => stagePriority(b) - stagePriority(a)).slice(0, 3);
  }, [data]);

  const focusCards = useMemo<FocusCard[]>(() => {
    if (!data || !summary) return [];

    const topStage = stageFocus[0];
    const firstRecommendation = data.recommendations?.[0];
    const lowPaid = summary.paid_rate < 0.08;

    return [
      {
        label: 'Etapa Estancada',
        value: topStage?.stage || 'Sin Alerta',
        note: topStage
          ? `${topStage.stale_over_7d} deals con >7 días y ${moneyEUR(topStage.pipeline_minor)} en juego.`
          : 'El pipeline fluye con normalidad.',
      },
      {
        label: 'Optimización de Copy',
        value: firstRecommendation?.key || 'Sin Alerta',
        note: firstRecommendation?.note || 'Todas las plantillas están rindiendo dentro de los márgenes esperados.',
      },
      {
        label: 'Salud de Cierre',
        value: pct(summary.paid_rate),
        note: lowPaid
          ? 'Mucha respuesta pero pocos pagos. Toca revisar los cierres y objeciones de precio.'
          : 'La tasa de pago mantiene una base sólida.',
      },
    ];
  }, [data, stageFocus, summary]);

  const revSignals = useMemo(() => [
    { label: 'Pipeline Activo', value: summary ? moneyEUR(summary.pipeline_minor) : '—', note: `Valor de los ${summary?.activeDeals || 0} tratos en curso.` },
    { label: 'Cierres Reales', value: summary ? moneyEUR(summary.won_minor) : '—', note: `Valor de los ${summary?.wonDeals || 0} tratos ganados.` },
    { label: 'Tasa de Respuesta', value: summary ? pct(summary.reply_rate) : '—', note: `Engagement sobre ${summary?.sent || 0} envíos.` },
  ], [summary]);

  return (
    <div className="space-y-10 pb-20">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Revenue Operations</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Descubre dónde se atasca el pipeline, qué copys venden y cómo acelerar los cobros.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Conversion Engine"
        title="Encuentra el Cuello de Botella"
        description="Si la tasa de respuesta es alta pero los pagos son bajos, tu equipo está perdiendo al cliente en el cierre. Usa estos datos para aplicar presión táctica o reescribir plantillas."
        actions={[
          { href: '/admin/deals', label: 'Ver Pipeline Completo', tone: 'primary' },
          { href: '/admin/templates', label: 'Optimizar Copys' }
        ]}
        signals={revSignals}
      />

      {/* Control de Tiempo */}
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <BarChart2 className="h-5 w-5 text-brand-blue" />
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Ventana de Análisis:</span>
            <select
              className="w-full sm:w-44 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 text-sm font-semibold outline-none focus:border-brand-blue transition-colors appearance-none cursor-pointer"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>Últimos 7 días</option>
              <option value={14}>Últimos 14 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={60}>Últimos 60 días</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={load} disabled={loading} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-[10px] font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50 shadow-md">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`}/> Sync
          </button>
        </div>
      </div>

      {err && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}

      {!data || !summary ? (
        <div className="py-20 text-center text-sm font-medium text-[var(--color-text)]/40">
          {loading ? 'Calculando inteligencia de revenue...' : 'Sin datos disponibles para esta ventana de tiempo.'}
        </div>
      ) : (
        <>
          {/* Tarjetas Principales */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">Pipeline Visible</div>
              <div className="text-3xl font-heading text-brand-blue">{moneyEUR(summary.pipeline_minor)}</div>
              <div className="mt-2 text-xs font-semibold text-[var(--color-text)]/60">{summary.activeDeals} deals en curso</div>
            </div>
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">Valor Cerrado (Won)</div>
              <div className="text-3xl font-heading text-emerald-600">{moneyEUR(summary.won_minor)}</div>
              <div className="mt-2 text-xs font-semibold text-[var(--color-text)]/60">{summary.wonDeals} deals ganados</div>
            </div>
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">Engagement General</div>
              <div className="text-3xl font-heading text-brand-blue">{pct(summary.reply_rate)}</div>
              <div className="mt-2 text-xs font-semibold text-[var(--color-text)]/60">{summary.replied} resp. / {summary.sent} sent</div>
            </div>
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">Conversión a Pago</div>
              <div className="text-3xl font-heading text-brand-blue">{pct(summary.paid_rate)}</div>
              <div className="mt-2 text-xs font-semibold text-[var(--color-text)]/60">{summary.paid} paid / {summary.sent} sent</div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {/* Action Focus */}
            <div className="xl:col-span-2 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Focus className="h-6 w-6 text-brand-blue" />
                  <h2 className="font-heading text-2xl text-[var(--color-text)]">Focos Estratégicos</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {focusCards.map((item) => (
                    <article key={item.label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5 transition hover:border-brand-blue/30">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">{item.label}</div>
                      <div className="text-xl font-semibold text-[var(--color-text)] truncate">{item.value}</div>
                      <p className="mt-3 text-xs leading-relaxed text-[var(--color-text)]/70 font-light">{item.note}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            {/* Stage Purgatory */}
            <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="h-6 w-6 text-amber-500" />
                <h2 className="font-heading text-2xl text-[var(--color-text)]">Etapas Estancadas</h2>
              </div>
              <div className="space-y-4">
                {stageFocus.length ? (
                  stageFocus.map((stage) => (
                    <article key={stage.stage} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 flex flex-col gap-2 transition hover:border-amber-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold uppercase tracking-widest text-brand-blue">{stage.stage}</span>
                        <span className="font-mono text-xs font-semibold text-[var(--color-text)]/60">{stage.deals} deals</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--color-text)]">{moneyEUR(stage.pipeline_minor)}</span>
                        <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">{stage.stale_over_7d} +7d stale</span>
                      </div>
                      <div className="text-xs text-[var(--color-text)]/50 font-light mt-1 border-t border-[var(--color-border)] pt-2">
                        Edad promedio: <span className="font-bold">{stage.avg_age_days.toFixed(1)} días</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="text-sm text-[var(--color-text)]/40 font-medium text-center py-6">El pipeline no reporta alertas críticas de estancamiento.</div>
                )}
              </div>
            </div>
          </div>

          {/* Recomendaciones A/B (Si existen) */}
          {data.recommendations?.length ? (
            <div className="rounded-[2.5rem] border border-brand-yellow/30 bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-6 w-6 text-brand-yellow" />
                <h2 className="font-heading text-2xl text-[var(--color-text)]">Insights de Conversión (IA)</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.recommendations.slice(0, 6).map((rec, index) => (
                  <article key={`${rec.type}:${rec.key}:${index}`} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5 transition hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">{rec.type}</span>
                      <span className="text-[10px] uppercase tracking-widest text-[var(--color-text)]/50 bg-[var(--color-surface)] px-2 py-0.5 rounded-md border border-[var(--color-border)]">{rec.locale} / {rec.channel}</span>
                    </div>
                    <div className="font-heading text-lg text-[var(--color-text)] mb-1">{rec.key}</div>
                    <div className="text-xs text-[var(--color-text)]/60 mb-3 font-mono">Var {rec.variant} · Sent: {rec.sent}</div>
                    
                    <div className="flex gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${rec.reply_rate > 0.4 ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}`}>Reply {pct(rec.reply_rate)}</span>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${rec.paid_rate > 0.2 ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-700'}`}>Paid {pct(rec.paid_rate)}</span>
                    </div>
                    <p className="text-sm font-light text-[var(--color-text)]/70 leading-relaxed border-t border-[var(--color-border)] pt-3">{rec.note}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {/* Tabla de Rendimiento de Plantillas */}
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="h-6 w-6 text-brand-blue" />
              <div>
                <h2 className="font-heading text-2xl text-[var(--color-text)]">Rendimiento Top Plantillas</h2>
                <div className="mt-1 text-xs text-[var(--color-text)]/50 uppercase tracking-widest font-bold">Ordenado por Paid Rate</div>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
              <table className="w-full text-left text-sm min-w-[800px]">
                <thead className="bg-[var(--color-surface-2)]">
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                    <th className="px-5 py-4">Plantilla / Key</th>
                    <th className="px-5 py-4 text-center">Locale</th>
                    <th className="px-5 py-4 text-center">Canal / Var</th>
                    <th className="px-5 py-4 text-right">Sent</th>
                    <th className="px-5 py-4 text-right">Reply (%)</th>
                    <th className="px-5 py-4 text-right">Paid (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                  {data.topTemplates.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--color-text)]/40 font-medium">No hay envíos suficientes en esta ventana.</td></tr>
                  ) : (
                    data.topTemplates.map((row, index) => (
                      <tr key={`${row.key}:${row.locale}:${row.channel}:${row.variant}:${index}`} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                        <td className="px-5 py-4 font-semibold text-brand-blue">{row.key}</td>
                        <td className="px-5 py-4 text-center font-mono uppercase text-xs text-[var(--color-text)]/60">{row.locale}</td>
                        <td className="px-5 py-4 text-center">
                          <span className="bg-[var(--color-surface-2)] border border-[var(--color-border)] px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-widest mr-2">{row.channel}</span>
                          <span className="font-mono text-xs">{row.variant}</span>
                        </td>
                        <td className="px-5 py-4 text-right text-[var(--color-text)]/70">{row.sent}</td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-semibold">{row.replied}</span> <span className="text-[10px] text-[var(--color-text)]/40">({pct(row.reply_rate)})</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-bold text-emerald-600">{row.paid}</span> <span className="text-[10px] text-emerald-600/50">({pct(row.paid_rate)})</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}
    </div>
  );
}
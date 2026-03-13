/* src/app/admin/revenue/AdminRevenueOpsClient.tsx */
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { adminFetch } from '@/lib/adminFetch.client';

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
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'EUR' }).format(value);
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
        label: 'Etapa prioritaria',
        value: topStage?.stage || 'Sin señal',
        note: topStage
          ? `${topStage.stale_over_7d} deals con más de 7 días y ${moneyEUR(topStage.pipeline_minor)} en juego.`
          : 'No hay suficiente señal para priorizar una etapa.',
      },
      {
        label: 'Plantilla a revisar',
        value: firstRecommendation?.key || 'Sin alerta fuerte',
        note: firstRecommendation?.note || 'Las plantillas top no muestran una alerta prioritaria en esta ventana.',
      },
      {
        label: 'Salud de cierre',
        value: pct(summary.paid_rate),
        note: lowPaid
          ? 'La conversación responde, pero está cerrando poco. Revisa oferta, CTA y presión final.'
          : 'La tasa de pago mantiene una base sana para la ventana actual.',
      },
    ];
  }, [data, stageFocus, summary]);

  return (
    <div className="mx-auto w-full max-w-6xl p-4">
      <section className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/60">
              revenue metrics
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-brand-blue">Revenue Ops</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/70">
              Pipeline, conversión y rendimiento de mensajes para decidir qué mover ahora mismo sin perder tiempo en lectura duplicada.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)]"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              <option value={7}>7 días</option>
              <option value={14}>14 días</option>
              <option value={30}>30 días</option>
              <option value={60}>60 días</option>
            </select>
            <Button onClick={load} disabled={loading}>
              {loading ? 'Cargando…' : 'Refrescar'}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Link href="/admin/templates" className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1.5 font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]">Templates</Link>
          <Link href="/admin/outbound" className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1.5 font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]">Outbound</Link>
          <Link href="/admin/deals" className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1.5 font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]">Deals</Link>
          <Link href="/admin/sales" className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1.5 font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]">Sales</Link>
        </div>
      </section>

      {err ? <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-200">{err}</div> : null}

      {!data || !summary ? (
        <div className="mt-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-sm text-[color:var(--color-text)]/75">
          {loading ? 'Cargando métricas…' : 'Sin datos disponibles para esta ventana.'}
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-soft">
              <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/55">Pipeline activo</div>
              <div className="mt-2 text-2xl font-semibold text-brand-blue">{moneyEUR(summary.pipeline_minor)}</div>
              <div className="mt-1 text-xs text-[color:var(--color-text)]/65">{summary.activeDeals} deals activos</div>
            </div>
            <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-soft">
              <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/55">Won</div>
              <div className="mt-2 text-2xl font-semibold text-brand-blue">{moneyEUR(summary.won_minor)}</div>
              <div className="mt-1 text-xs text-[color:var(--color-text)]/65">{summary.wonDeals} deals en la ventana</div>
            </div>
            <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-soft">
              <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/55">Reply rate</div>
              <div className="mt-2 text-2xl font-semibold text-brand-blue">{pct(summary.reply_rate)}</div>
              <div className="mt-1 text-xs text-[color:var(--color-text)]/65">{summary.replied}/{summary.sent} replies</div>
            </div>
            <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-soft">
              <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/55">Paid rate</div>
              <div className="mt-2 text-2xl font-semibold text-brand-blue">{pct(summary.paid_rate)}</div>
              <div className="mt-1 text-xs text-[color:var(--color-text)]/65">{summary.paid}/{summary.sent} paid</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
              <h3 className="text-base font-semibold text-[color:var(--color-text)]">Dónde actuar ahora</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {focusCards.map((item) => (
                  <article key={item.label} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                    <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/55">{item.label}</div>
                    <div className="mt-2 text-lg font-semibold text-brand-blue">{item.value}</div>
                    <p className="mt-2 text-xs leading-5 text-[color:var(--color-text)]/68">{item.note}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
              <h3 className="text-base font-semibold text-[color:var(--color-text)]">Etapas que piden atención</h3>
              <div className="mt-3 space-y-3">
                {stageFocus.length ? (
                  stageFocus.map((stage) => (
                    <article key={stage.stage} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-brand-blue">{stage.stage}</div>
                        <div className="text-xs text-[color:var(--color-text)]/60">{stage.deals} deals</div>
                      </div>
                      <div className="mt-2 text-sm text-[color:var(--color-text)]/72">{moneyEUR(stage.pipeline_minor)} · {stage.stale_over_7d} stale &gt; 7d · edad prom. {stage.avg_age_days.toFixed(1)} d</div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4 text-sm text-[color:var(--color-text)]/70">
                    Sin una presión de etapa clara en la ventana actual.
                  </div>
                )}
              </div>
            </section>
          </div>

          {data.recommendations?.length ? (
            <section className="mt-6 rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
              <h3 className="text-base font-semibold text-[color:var(--color-text)]">Recomendaciones prioritarias</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {data.recommendations.slice(0, 6).map((recommendation, index) => (
                  <article key={`${recommendation.type}:${recommendation.key}:${recommendation.locale}:${recommendation.channel}:${recommendation.variant}:${index}`} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/55">{recommendation.type}</div>
                      <div className="text-xs text-[color:var(--color-text)]/55">{recommendation.locale} · {recommendation.channel}</div>
                    </div>
                    <div className="mt-2 text-base font-semibold text-brand-blue">{recommendation.key}</div>
                    <div className="mt-1 text-sm text-[color:var(--color-text)]/70">Variante {recommendation.variant} · {recommendation.sent} envíos</div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--color-text)]/68">
                      <span className="rounded-full border border-[color:var(--color-border)] px-2 py-1">Reply {pct(recommendation.reply_rate)}</span>
                      <span className="rounded-full border border-[color:var(--color-border)] px-2 py-1">Paid {pct(recommendation.paid_rate)}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--color-text)]/70">{recommendation.note}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-6 rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-[color:var(--color-text)]">Top plantillas por paid rate</h3>
                <p className="mt-1 text-sm text-[color:var(--color-text)]/68">Mantén esta tabla como referencia comparativa, no como el punto de partida de cada decisión.</p>
              </div>
              <div className="text-xs text-[color:var(--color-text)]/55">Ventana {data.window.days} días</div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-[color:var(--color-border)]">
              <table className="w-full text-sm">
                <thead className="bg-[color:var(--color-surface-2)] text-left">
                  <tr>
                    <th className="px-3 py-2">Key</th>
                    <th className="px-3 py-2">Locale</th>
                    <th className="px-3 py-2">Canal</th>
                    <th className="px-3 py-2">Var</th>
                    <th className="px-3 py-2">Sent</th>
                    <th className="px-3 py-2">Reply</th>
                    <th className="px-3 py-2">Paid</th>
                    <th className="px-3 py-2">Reply%</th>
                    <th className="px-3 py-2">Paid%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topTemplates.map((row, index) => (
                    <tr key={`${row.key}:${row.locale}:${row.channel}:${row.variant}:${index}`} className="border-t border-[color:var(--color-border)]">
                      <td className="px-3 py-2 font-medium text-[color:var(--color-text)]">{row.key}</td>
                      <td className="px-3 py-2">{row.locale}</td>
                      <td className="px-3 py-2">{row.channel}</td>
                      <td className="px-3 py-2">{row.variant}</td>
                      <td className="px-3 py-2">{row.sent}</td>
                      <td className="px-3 py-2">{row.replied}</td>
                      <td className="px-3 py-2">{row.paid}</td>
                      <td className="px-3 py-2">{pct(row.reply_rate)}</td>
                      <td className="px-3 py-2">{pct(row.paid_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-[color:var(--color-text)]/60">
              Usa <Link href="/admin/sales" className="underline">/admin/sales</Link> para ejecutar presión comercial y <Link href="/admin/templates" className="underline">/admin/templates</Link> para corregir la pieza exacta que está perdiendo tracción.
            </div>
          </section>
        </>
      )}
    </div>
  );
}

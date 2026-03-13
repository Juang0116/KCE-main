'use client';

import * as React from 'react';

import CampaignContentOpsDeck from '@/components/admin/CampaignContentOpsDeck';
import GrowthOpsDeck from '@/components/admin/GrowthOpsDeck';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { adminFetch } from '@/lib/adminFetch.client';

type MarketingMetrics = {
  ok: boolean;
  requestId?: string;
  windowDays: number;
  sinceISO: string;
  counts: Record<string, number>;
  rates: Record<string, number>;
};

type UtmTop = {
  ok: boolean;
  items: Array<{ source: string; medium: string; campaign: string; count: number }>;
};

type CtaPerf = {
  ok: boolean;
  items: Array<{ cta: string; clicks: number; leads: number; paid: number }>;
};

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

function StatCard(props: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">{props.label}</div>
      <div className="mt-2 text-2xl font-semibold text-[color:var(--color-text)]">{props.value}</div>
      {props.hint ? <div className="mt-1 text-xs text-[color:var(--color-text)]/60">{props.hint}</div> : null}
    </div>
  );
}

export function AdminMarketingClient() {
  const [days, setDays] = React.useState(30);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [m, setM] = React.useState<MarketingMetrics | null>(null);
  const [utm, setUtm] = React.useState<UtmTop | null>(null);
  const [cta, setCta] = React.useState<CtaPerf | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [mm, ut, ct] = await Promise.all([
        adminFetch(`/api/admin/metrics/marketing?days=${days}`),
        adminFetch(`/api/admin/metrics/utm/top?days=${days}&limit=20`),
        adminFetch(`/api/admin/metrics/cta-performance?days=${days}&limit=20`),
      ]);

      const mj = (await mm.json().catch(() => null)) as MarketingMetrics | null;
      const uj = (await ut.json().catch(() => null)) as UtmTop | null;
      const cj = (await ct.json().catch(() => null)) as CtaPerf | null;

      if (!mm.ok || !mj?.ok) throw new Error((mj as { error?: string } | null)?.error || 'No pudimos cargar métricas.');
      setM(mj);
      setUtm(uj && uj.ok ? uj : null);
      setCta(cj && cj.ok ? cj : null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error.');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const counts = m?.counts || {};
  const utmCount = counts['marketing.utm_capture'] ?? 0;
  const tourViews = counts['tour.view'] ?? 0;
  const quizCompleted = counts['quiz.completed'] ?? 0;
  const paid = counts['checkout.paid'] ?? 0;

  const leadRate = m?.rates?.quiz_per_tourView ?? 0;
  const paidRate = m?.rates?.paid_per_tourView ?? 0;

  const lanes = [
    {
      eyebrow: 'Acquire',
      title: utmCount > 0 ? 'Double down on lanes with signal' : 'Seed new traffic lanes',
      body:
        utmCount > 0
          ? `KCE captured ${utmCount} UTM events in the last ${days} days. Push the markets and intent pages that are already opening the funnel.`
          : 'There is little UTM capture right now. Push discover lanes, partner links and campaign entries before expecting stronger downstream metrics.',
    },
    {
      eyebrow: 'Nurture',
      title: quizCompleted > 0 ? 'Move colder visitors into shortlist flow' : 'Increase matcher and lead magnet usage',
      body:
        quizCompleted > 0
          ? `Quiz completions reached ${quizCompleted}. Keep routing unsure visitors into matcher, newsletter and lead magnets until they are shortlist-ready.`
          : 'The funnel still needs more nurture. Push quiz, newsletter and lead-magnet entries on colder traffic pages.',
      tone: 'dark' as const,
    },
    {
      eyebrow: 'Close',
      title: paid > 0 ? 'Protect winning routes into checkout' : 'Tighten conversion path',
      body:
        paid > 0
          ? `${paid} paid sessions were recorded. Protect the routes that are generating bookings and align the messaging with tours, WhatsApp and secure checkout.`
          : 'Paid sessions are still light. Reduce friction between traffic pages, tours, handoff and checkout to improve close rate.',
    },
  ];

  const actionCards = [
    {
      title: 'Push now',
      body:
        tourViews > 0
          ? `Tour views are at ${tourViews}. Keep premium routes like UK, luxury and coffee visible across discover and destinations.`
          : 'Get more qualified traffic into /discover and the market pages before scaling more content effort.',
      tone: 'dark' as const,
    },
    {
      title: 'Fix next',
      body:
        paidRate < 2
          ? `Paid per view sits at ${fmtPct(paidRate)}. Tighten CTA continuity from discover → tours → quiz/WhatsApp → checkout.`
          : `Paid per view is ${fmtPct(paidRate)}. Focus on preserving winning lanes and improving handoff quality.`,
    },
    {
      title: 'Publish next',
      body:
        leadRate < 10
          ? `Quiz per view is ${fmtPct(leadRate)}. Publish more intent-first content and route colder traffic into matcher and lead magnets.`
          : `Quiz per view is ${fmtPct(leadRate)}. Publish more market-specific content to expand acquisition without hurting funnel quality.`,
    },
  ];

  const topCampaign = utm?.items?.[0];
  const topCta = cta?.items?.[0];
  const marketingSignals = [
    {
      label: 'Lane to push',
      value: topCampaign?.campaign || topCampaign?.source || (utmCount > 0 ? 'UTM con señal' : 'Sembrar demanda'),
      note:
        utmCount > 0
          ? 'Empuja primero la campaña o fuente que ya abrió el funnel con intención medible.'
          : 'Todavía falta abrir más entradas al funnel antes de exigir cierre downstream.',
    },
    {
      label: 'Bottleneck to fix',
      value: paidRate < 2 ? 'Checkout continuity' : leadRate < 10 ? 'Lead capture' : 'Protect winners',
      note:
        paidRate < 2
          ? 'El problema principal parece estar entre visita, handoff y pago.'
          : leadRate < 10
            ? 'El cuello sugiere más fricción en quiz, matcher o lead magnet.'
            : 'La prioridad es sostener rutas ganadoras sin diluir calidad.',
    },
    {
      label: 'Top CTA',
      value: topCta?.cta || 'Sin CTA dominante',
      note: topCta ? `${topCta.clicks} clicks · ${topCta.leads} leads · ${topCta.paid} paid.` : 'Todavía no hay un CTA claramente dominante en esta ventana.',
    },
    {
      label: 'Window',
      value: `${days} días`,
      note: m?.requestId ? `Lectura actual con request id ${m.requestId}.` : 'Usa esta ventana para comparar presión y continuidad del funnel.',
    },
  ];

  const marketingActions = [
    { href: '/admin/revenue', label: 'Revenue truth', tone: 'primary' as const },
    { href: '/admin/sales', label: 'Sales handoff' },
    { href: '/admin/templates', label: 'Templates' },
    { href: '/admin/outbound', label: 'Outbound' },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <AdminOperatorWorkbench
        eyebrow="marketing workbench"
        title="Choose the growth lane that deserves pressure"
        description="Read this area as a decision desk, not as a metrics museum: detect the lane with signal, identify the real bottleneck and keep message continuity intact until payment."
        actions={marketingActions}
        signals={marketingSignals}
      />

      <GrowthOpsDeck lanes={lanes} />

      <CampaignContentOpsDeck
        cards={actionCards.map((card) => ({
          title: card.title,
          body: card.body,
          ...(card.tone ? { tone: card.tone } : {}),
        }))}
      />

      <section className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold">Ventana</label>
          <select
            className="h-10 rounded-xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 text-sm"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>7 días</option>
            <option value={14}>14 días</option>
            <option value={30}>30 días</option>
            <option value={60}>60 días</option>
            <option value={90}>90 días</option>
          </select>

          <button
            onClick={() => {
              void load();
            }}
            className="h-10 rounded-xl bg-brand-blue px-4 text-sm font-semibold text-white"
            disabled={loading}
          >
            {loading ? 'Cargando…' : 'Recargar'}
          </button>

          {m?.requestId ? <span className="text-xs text-[color:var(--color-text)]/50">Req: {m.requestId}</span> : null}
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-200/40 bg-red-200/15 p-4 text-sm text-red-950">{err}</div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <StatCard label="UTM capturados" value={counts['marketing.utm_capture'] ?? 0} />
          <StatCard label="Vistas de tours" value={counts['tour.view'] ?? 0} hint={`Tour/view por UTM: ${fmtPct(m?.rates?.tourView_per_utm ?? 0)}`} />
          <StatCard label="Quiz completados" value={counts['quiz.completed'] ?? 0} hint={`Quiz por vista: ${fmtPct(m?.rates?.quiz_per_tourView ?? 0)}`} />
          <StatCard label="Pagos (paid)" value={counts['checkout.paid'] ?? 0} hint={`Paid por vista: ${fmtPct(m?.rates?.paid_per_tourView ?? 0)}`} />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-sm font-semibold">Top UTM (source/medium/campaign)</div>
            <div className="mt-3 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-[color:var(--color-text)]/60">
                  <tr>
                    <th className="py-2 pr-3">Source</th>
                    <th className="py-2 pr-3">Medium</th>
                    <th className="py-2 pr-3">Campaign</th>
                    <th className="py-2 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {(utm?.items || []).slice(0, 12).map((it, idx) => (
                    <tr key={idx} className="border-t border-[var(--color-border)]">
                      <td className="py-2 pr-3">{it.source || '—'}</td>
                      <td className="py-2 pr-3">{it.medium || '—'}</td>
                      <td className="py-2 pr-3">{it.campaign || '—'}</td>
                      <td className="py-2 text-right font-semibold">{it.count}</td>
                    </tr>
                  ))}
                  {(!utm?.items || utm.items.length === 0) && (
                    <tr>
                      <td className="py-3 text-sm text-[color:var(--color-text)]/60" colSpan={4}>
                        Sin datos aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-sm font-semibold">CTA performance</div>
            <div className="mt-3 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-[color:var(--color-text)]/60">
                  <tr>
                    <th className="py-2 pr-3">CTA</th>
                    <th className="py-2 text-right">Clicks</th>
                    <th className="py-2 text-right">Leads</th>
                    <th className="py-2 text-right">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {(cta?.items || []).slice(0, 12).map((it, idx) => (
                    <tr key={idx} className="border-t border-[var(--color-border)]">
                      <td className="py-2 pr-3">{it.cta || '—'}</td>
                      <td className="py-2 text-right font-semibold">{it.clicks}</td>
                      <td className="py-2 text-right font-semibold">{it.leads}</td>
                      <td className="py-2 text-right font-semibold">{it.paid}</td>
                    </tr>
                  ))}
                  {(!cta?.items || cta.items.length === 0) && (
                    <tr>
                      <td className="py-3 text-sm text-[color:var(--color-text)]/60" colSpan={4}>
                        Sin datos aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

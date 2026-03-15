'use client';

import * as React from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { TrendingUp, MousePointerClick, Target, BarChart2, Megaphone, Link as LinkIcon } from 'lucide-react';

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
  if (!Number.isFinite(n)) return '0%';
  return `${n.toFixed(1)}%`;
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

      if (!mm.ok || !mj?.ok) throw new Error((mj as { error?: string } | null)?.error || 'Error cargando métricas.');
      setM(mj);
      setUtm(uj?.ok ? uj : null);
      setCta(cj?.ok ? cj : null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error interno.');
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

  const topCampaign = utm?.items?.[0];
  const topCta = cta?.items?.[0];

  const marketingSignals = React.useMemo(() => [
    {
      label: 'Tráfico Calificado (UTMs)',
      value: String(utmCount),
      note: utmCount > 0 ? `Liderado por ${topCampaign?.source || 'varias fuentes'}.` : 'Tráfico no atribuido.',
    },
    {
      label: 'Top Conversión (CTA)',
      value: topCta?.cta || 'N/A',
      note: topCta ? `${topCta.clicks} clics generaron ${topCta.paid} pagos.` : 'Sin datos de CTA.',
    },
    {
      label: 'Salud del Funnel',
      value: fmtPct(paidRate),
      note: paidRate < 0.02 ? 'Alta fricción en el checkout o lead magnet.' : 'Conversión a pago saludable.',
    },
  ], [paidRate, topCampaign?.source, topCta, utmCount]);

  const marketingActions = [
    { href: '/admin/metrics', label: 'Ver Analytics Global', tone: 'primary' as const },
    { href: '/admin/content', label: 'CMS / Blog' },
    { href: '/admin/affiliates', label: 'Afiliados' },
  ];

  return (
    <div className="space-y-10 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Marketing & Growth</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Atribución de campañas, rendimiento de botones (CTAs) y embudos de captación.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Growth Engine"
        title="Escala lo que Funciona"
        description="Identifica exactamente qué campaña de anuncios o botón en la web te está trayendo clientes que pagan. Si un canal tiene tráfico pero no convierte, ajusta el copy o el diseño."
        actions={marketingActions}
        signals={marketingSignals}
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
              <option value={90}>Últimos 90 días</option>
            </select>
          </div>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">
          {loading ? 'Calculando...' : 'Sincronizado'}
        </div>
      </div>

      {err && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}

      {/* Tarjetas Principales del Embudo */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">Tráfico Atribuido</div>
          <div className="text-3xl font-heading text-brand-blue">{utmCount}</div>
          <div className="mt-2 text-xs font-semibold text-[var(--color-text)]/60">Clics con UTM</div>
        </div>
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">Atracción</div>
          <div className="text-3xl font-heading text-[var(--color-text)]">{tourViews}</div>
          <div className="mt-2 text-xs font-semibold text-[var(--color-text)]/60">Vistas de Tours</div>
        </div>
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">Captación (Leads)</div>
          <div className="text-3xl font-heading text-amber-600">{quizCompleted}</div>
          <div className="mt-2 text-xs font-semibold text-[var(--color-text)]/60">Conversión: {fmtPct(leadRate)}</div>
        </div>
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">Cierres Reales</div>
          <div className="text-3xl font-heading text-emerald-600">{paid}</div>
          <div className="mt-2 text-xs font-semibold text-[var(--color-text)]/60">Conversión Final: {fmtPct(paidRate)}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Atribución de Campañas (UTM) */}
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Megaphone className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Rendimiento por Campaña (UTMs)</h2>
          </div>
          
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-surface-2)]">
                <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                  <th className="px-4 py-3">Source / Medium</th>
                  <th className="px-4 py-3">Campaña</th>
                  <th className="px-4 py-3 text-right">Impactos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {utm?.items && utm.items.length > 0 ? (
                  utm.items.slice(0, 10).map((it, idx) => (
                    <tr key={idx} className="hover:bg-[var(--color-surface-2)]/50 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-brand-blue">{it.source || 'Directo'}</div>
                        <div className="text-[10px] text-[var(--color-text)]/50 uppercase tracking-widest mt-0.5">{it.medium || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--color-text)]/70 max-w-[200px] truncate">{it.campaign || '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-[var(--color-text)]">{it.count}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="p-6 text-center text-sm text-[var(--color-text)]/40">Sin datos de campañas registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rendimiento de CTAs */}
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <MousePointerClick className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Rendimiento de Botones (CTA)</h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-surface-2)]">
                <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                  <th className="px-4 py-3">ID Botón</th>
                  <th className="px-4 py-3 text-right">Clics</th>
                  <th className="px-4 py-3 text-right">Leads</th>
                  <th className="px-4 py-3 text-right">Pagos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {cta?.items && cta.items.length > 0 ? (
                  cta.items.slice(0, 10).map((it, idx) => (
                    <tr key={idx} className="hover:bg-[var(--color-surface-2)]/50 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-brand-blue flex items-center gap-1.5"><LinkIcon className="h-3 w-3"/> {it.cta}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--color-text)]/70">{it.clicks}</td>
                      <td className="px-4 py-3 text-right font-bold text-amber-600">{it.leads}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{it.paid}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="p-6 text-center text-sm text-[var(--color-text)]/40">Sin datos de botones registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
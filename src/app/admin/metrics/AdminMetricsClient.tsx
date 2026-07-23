'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Filter,
  Target,
  Activity,
  MapPin,
  Search,
  Calendar,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  RefreshCw,
  MousePointer2,
  Terminal,
  Hash,
  Globe,
  Layout,
  ChevronRight,
  CreditCard,
  PieChart,
  ArrowDown,
  Database, // ✅ Importado correctamente
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE TELEMETRÍA ---
type FunnelResponse = {
  window: { from: string; to: string };
  counts: { tourViews: number; checkoutStarted: number; checkoutPaid: number };
  rates: { startPerView: number; paidPerStart: number; paidPerView: number };
};
type DealsResponse = {
  ok: boolean;
  totals: {
    deals: number;
    stageCounts: Record<string, number>;
    wonCount: number;
    wonAmountMinor: number;
    wonCurrency: string;
  };
  avgAgeDaysByStage: Record<string, number>;
};
type CrmFunnelResponse = {
  ok: boolean;
  window: { from: string; to: string };
  counts: {
    leads: number;
    tickets: number;
    deals: number;
    checkoutSessions: number;
    checkoutPaid: number;
    bookingsPaid: number;
  };
  rates: {
    ticketsPerLead: number;
    dealsPerTicket: number;
    checkoutsPerDeal: number;
    paidPerCheckout: number;
    paidBookingsPerPaidEvent: number;
  };
};
type ByTourRow = {
  tour_slug: string;
  tour_title: string | null;
  city: string | null;
  tour_views: number;
  checkout_started: number;
  checkout_paid: number;
};
type ByTourResponse = {
  window: { from: string; to: string };
  items: ByTourRow[];
  truncated?: boolean;
};
type ByCityRow = {
  city: string;
  tour_views: number;
  checkout_started: number;
  checkout_paid: number;
};
type ByCityResponse = {
  window: { from: string; to: string };
  items: ByCityRow[];
  truncated?: boolean;
};
type UTMRow = {
  utm_key: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_captures: number;
  newsletter_confirmed: number;
  quiz_completed: number;
  checkout_paid: number;
  rates: {
    confirmPerCapture: number;
    quizPerCapture: number;
    paidPerCapture: number;
    paidPerQuiz: number;
  };
};
type UTMResponse = {
  ok: boolean;
  window: { from: string; to: string };
  summary: {
    totals: {
      utm_captures: number;
      newsletter_confirmed: number;
      quiz_completed: number;
      checkout_paid: number;
    };
    rates: {
      confirmPerCapture: number;
      quizPerCapture: number;
      paidPerCapture: number;
      paidPerQuiz: number;
    };
  };
  items: UTMRow[];
};
type UTMTopResponse = {
  ok: boolean;
  window: { from: string; to: string };
  params: { minCaptures: number; limit: number };
  items: UTMRow[];
};
type OutboundPerfResponse = {
  ok: boolean;
  window: { from: string; to: string };
  items: Array<{
    key: string;
    variant: string | null;
    channel: string;
    queued: number;
    sent: number;
    failed: number;
    replied: number;
    paid: number;
    won7d: number;
  }>;
};

function pct(n: number) {
  if (!Number.isFinite(n)) return '0%';
  return `${(n * 100).toFixed(1)}%`;
}

export function AdminMetricsClient() {
  const today = new Date().toISOString().slice(0, 10);
  const [to, setTo] = useState(today);
  const [from, setFrom] = useState('');

  const [funnel, setFunnel] = useState<FunnelResponse | null>(null);
  const [crmFunnel, setCrmFunnel] = useState<CrmFunnelResponse | null>(null);
  const [byTour, setByTour] = useState<ByTourResponse | null>(null);
  const [byCity, setByCity] = useState<ByCityResponse | null>(null);
  const [utm, setUtm] = useState<UTMResponse | null>(null);
  const [_deals, setDeals] = useState<DealsResponse | null>(null);
  const [utmTop, setUtmTop] = useState<UTMTopResponse | null>(null);
  const [outbound, setOutbound] = useState<OutboundPerfResponse | null>(null);

  const [minCaptures] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    return p.toString();
  }, [from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 01. Despacho de peticiones paralelas
      const [rf, rcrm, rd, rt, rc, ru, rup, ro] = await Promise.all([
        adminFetch(`/api/admin/metrics/funnel?${query}`),
        adminFetch(`/api/admin/metrics/crm-funnel?${query}`),
        adminFetch(`/api/admin/metrics/deals`),
        adminFetch(`/api/admin/metrics/by-tour?${query}&limit=50`),
        adminFetch(`/api/admin/metrics/by-city?${query}&limit=50`),
        adminFetch(`/api/admin/metrics/utm?${query}`),
        fetch(`/api/admin/metrics/utm/top?${query}&min_captures=${minCaptures}&limit=20`, {
          cache: 'no-store',
        }),
        adminFetch(`/api/admin/metrics/outbound-performance?days=30&limit=1000`),
      ]);

      // 02. Decodificación de Payloads (FIXED: Referenciando los objetos de respuesta 'rX')
      const [jf, jcrm, jd, jt, jc, ju, jup, jo] = await Promise.all([
        rf.json(),
        rcrm.json(),
        rd.json(),
        rt.json(),
        rc.json(),
        ru.json(),
        rup.json(),
        ro.json(),
      ]);

      setFunnel(jf as FunnelResponse);
      setCrmFunnel(jcrm?.ok ? jcrm : null);
      setDeals(jd?.ok ? jd : null);
      setByTour(jt as ByTourResponse);
      setByCity(jc as ByCityResponse);
      setUtm(ju?.ok ? ju : null);
      setUtmTop(jup?.ok ? jup : null);
      setOutbound(jo?.ok ? jo : null);

      if (!from && jf?.window?.from) setFrom(jf.window.from);
    } catch (e: any) {
      setError(e?.message || 'Fallo en la sincronización de nodos.');
    } finally {
      setLoading(false);
    }
  }, [query, minCaptures, from]);

  useEffect(() => {
    load();
  }, [load]);

  const watchouts = useMemo(() => {
    const startPerView = funnel?.rates.startPerView ?? 0;
    const paidPerStart = funnel?.rates.paidPerStart ?? 0;
    const checkoutGap = Math.max(
      (funnel?.counts.checkoutStarted ?? 0) - (funnel?.counts.checkoutPaid ?? 0),
      0,
    );
    const weakStage =
      (_deals?.totals.stageCounts?.proposal ?? 0) >= (_deals?.totals.stageCounts?.checkout ?? 0)
        ? 'proposal'
        : 'checkout';
    return [
      {
        title: 'Checkout Gap',
        value: String(checkoutGap),
        note: 'Abordajes sin pago. Requiere presión.',
        color: 'text-brand-yellow',
      },
      {
        title: 'Retención Interest',
        value: pct(startPerView),
        note: startPerView < 0.08 ? 'Fuga alta en Tour Views.' : 'Tracción saludable.',
        color: 'text-brand-blue',
      },
      {
        title: 'Eficacia Cierre',
        value: pct(paidPerStart),
        note: paidPerStart < 0.35 ? 'Revisar fricción en pasarela.' : 'Conversión óptima.',
        color: 'text-green-600',
      },
      {
        title: 'Nodo Crítico',
        value: weakStage.toUpperCase(),
        note: 'Mayor volumen de deals estancados.',
        color: 'text-brand-blue',
      },
    ];
  }, [funnel, _deals]);

  const signals = useMemo(
    () => [
      {
        label: 'Conversión L2P',
        value: pct(funnel?.rates.paidPerView ?? 0),
        note: 'Lead-to-Paid global.',
      },
      {
        label: 'Tour Traffic',
        value: String(funnel?.counts.tourViews ?? 0),
        note: 'Views en ventana temporal.',
      },
      {
        label: 'Ingesta CRM',
        value: String(crmFunnel?.counts.leads ?? 0),
        note: 'Nuevos prospectos registrados.',
      },
    ],
    [funnel, crmFunnel],
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-32 duration-1000">
      {/* 01. CABECERA EJECUTIVA */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <BarChart3 className="h-4 w-4" /> Intelligence Lane: /commercial-telemetry
          </div>
          <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-6xl">
            Executive <span className="font-light italic text-brand-blue">Analytics</span>
          </h1>
          <p className="mt-2 max-w-2xl text-base font-light leading-relaxed text-muted">
            Monitor de alto mando para Knowing Cultures S.A.S. Decodifica el rendimiento del
            catálogo, mide la eficacia de campañas e identifica los cuellos de botella del revenue.
          </p>
        </div>
      </header>

      {/* 02. WORKBENCH OPERATIVO */}
      <AdminOperatorWorkbench
        eyebrow="Growth Intelligence"
        title="Escala con Evidencia Forense"
        description="Analiza la salud del embudo de producto versus la gestión CRM. Si la conversión global cae, el problema suele estar en la transición de 'Proposal' a 'Checkout'."
        actions={[
          { href: '/admin/tours', label: 'Optimizar Tours', tone: 'primary' },
          { href: '/admin/marketing', label: 'Rendimiento UTM' },
        ]}
        signals={signals}
      />

      {/* 03. INSTRUMENTACIÓN DE TIEMPO (LA BÓVEDA) */}
      <section className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5 md:flex-row">
        <div className="flex w-full items-center gap-6 md:w-auto">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand-blue/5 bg-brand-blue/10 text-brand-blue shadow-inner">
            <Calendar className="h-7 w-7" />
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <div className="space-y-2">
              <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                Observación Inicial
              </span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-12 rounded-xl border border-brand-dark/10 bg-surface-2 px-4 text-sm font-bold text-brand-blue shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
              />
            </div>
            <div className="hidden pt-6 sm:block">
              <ArrowRight className="h-5 w-5 text-muted opacity-20" />
            </div>
            <div className="space-y-2">
              <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                Cierre de Ventana
              </span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-12 rounded-xl border border-brand-dark/10 bg-surface-2 px-4 text-sm font-bold text-brand-blue shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
              />
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

      {error && (
        <div className="animate-in slide-in-from-top-2 mx-2 flex items-center gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-6 font-bold text-red-700 shadow-sm dark:bg-red-950/10 dark:text-red-400">
          <ShieldCheck className="h-6 w-6 opacity-60" /> Protocolo de Error:{' '}
          <span className="font-light">{error}</span>
        </div>
      )}

      {/* 04. HUD DE ESTRATEGIA (WATCHOUTS) */}
      <section className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-2 shadow-pop dark:border-white/5">
        <header className="bg-surface-2/30 flex items-center gap-4 border-b border-brand-dark/5 p-8 dark:border-white/5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue shadow-inner">
            <Target className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-2xl uppercase tracking-tight text-main">
            Estrategia de Cierre Inmediato
          </h2>
        </header>
        <div className="bg-surface-2/10 grid gap-6 p-8 sm:grid-cols-2 lg:grid-cols-4">
          {watchouts.map((item) => (
            <div
              key={item.title}
              className="rounded-[2.2rem] border border-brand-dark/5 bg-surface p-8 shadow-soft transition-all hover:-translate-y-1 hover:shadow-pop dark:border-white/5"
            >
              <div className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">
                {item.title}
              </div>
              <div className={`font-heading text-5xl tracking-tighter ${item.color} mb-3`}>
                {item.value}
              </div>
              <div className="border-l-2 border-brand-blue/10 pl-4 text-[13px] font-light italic leading-relaxed text-muted opacity-80">
                {item.note}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 05. EMBUDOS DE ALTA RESOLUCIÓN */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Producto Funnel */}
        <section className="relative space-y-10 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5">
          <div className="pointer-events-none absolute -right-6 -top-6 opacity-[0.02]">
            <PieChart className="h-48 w-48 text-brand-blue" />
          </div>
          <header className="relative z-10 flex items-center gap-4 border-b border-brand-dark/5 pb-8 dark:border-white/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading text-3xl tracking-tight text-main">Embudo de Producto</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">
                Front-End Digital Traffic
              </p>
            </div>
          </header>

          {funnel ? (
            <div className="relative z-10 space-y-8">
              {[
                {
                  l: 'Tour Explorations',
                  v: funnel.counts.tourViews,
                  r: pct(funnel.rates.startPerView),
                  c: 'bg-surface-2 border-brand-dark/5',
                  ic: Target,
                },
                {
                  l: 'Checkout Intent',
                  v: funnel.counts.checkoutStarted,
                  r: pct(funnel.rates.paidPerStart),
                  c: 'bg-brand-blue/5 border-brand-blue/20 text-brand-blue',
                  ic: CreditCard,
                },
                {
                  l: 'Revenue Consolidado',
                  v: funnel.counts.checkoutPaid,
                  r: null,
                  c: 'bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-400',
                  ic: Zap,
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="group"
                >
                  <div
                    className={`flex items-center justify-between rounded-[2rem] border px-8 py-6 shadow-sm transition-all group-hover:shadow-soft ${step.c}`}
                  >
                    <div className="flex items-center gap-4">
                      <step.ic className="h-5 w-5 opacity-40" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em]">{step.l}</span>
                    </div>
                    <span className="font-heading text-3xl tracking-tighter">{step.v}</span>
                  </div>
                  {step.r && (
                    <div className="flex flex-col items-center py-2">
                      <div className="h-8 w-px bg-gradient-to-b from-brand-blue/30 to-transparent" />
                      <div className="flex items-center gap-2 rounded-full border border-brand-blue/10 bg-surface-2 px-5 py-1.5 text-[10px] font-bold text-brand-blue shadow-sm ring-4 ring-brand-blue/5">
                        <ArrowDown className="h-3 w-3 animate-bounce" /> {step.r} Conversión
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center italic opacity-20">Awaiting technical signal...</div>
          )}
        </section>

        {/* CRM Funnel */}
        <section className="relative space-y-10 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5">
          <div className="pointer-events-none absolute -right-6 -top-6 opacity-[0.02]">
            <Activity className="h-48 w-48 text-brand-blue" />
          </div>
          <header className="relative z-10 flex items-center gap-4 border-b border-brand-dark/5 pb-8 dark:border-white/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading text-3xl tracking-tight text-main">Flujo de Nodo CRM</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">
                Back-Office Operational Flow
              </p>
            </div>
          </header>

          {crmFunnel ? (
            <div className="relative z-10 space-y-4">
              {[
                {
                  l: 'Leads Capturados',
                  v: crmFunnel.counts.leads,
                  i: Sparkles,
                  color: 'text-brand-yellow',
                },
                {
                  l: 'Tickets de Soporte',
                  v: crmFunnel.counts.tickets,
                  i: MousePointer2,
                  color: 'text-muted',
                },
                {
                  l: 'Deals en Negociación',
                  v: crmFunnel.counts.deals,
                  i: TrendingUp,
                  active: true,
                  color: 'text-brand-blue',
                },
                {
                  l: 'Reservas Liquidadas',
                  v: crmFunnel.counts.bookingsPaid,
                  i: Zap,
                  success: true,
                  color: 'text-green-600',
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-[2rem] border px-8 py-5 shadow-sm transition-all hover:scale-[1.02] ${
                    row.success
                      ? 'border-green-500/20 bg-green-500/5'
                      : row.active
                        ? 'border-brand-blue/20 bg-brand-blue/5 shadow-soft'
                        : 'bg-surface-2/50 border-brand-dark/5 dark:border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <row.i className={`h-5 w-5 ${row.color} opacity-60`} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-main">
                      {row.l}
                    </span>
                  </div>
                  <span className={`font-heading text-2xl tracking-tighter ${row.color}`}>
                    {row.v}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center italic opacity-20">CRM Node Offline.</div>
          )}
        </section>
      </div>

      {/* 06. TABLAS DE RENDIMIENTO (BÓVEDAS) */}
      <div className="grid gap-8 xl:grid-cols-2">
        {/* Top Tours */}
        <section className="flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
          <header className="bg-surface-2/30 flex items-center justify-between border-b border-brand-dark/5 p-8 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue shadow-inner">
                <Layout className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-main">
                Top Performance Tours
              </h2>
            </div>
          </header>
          <div className="custom-scrollbar overflow-x-auto p-4">
            <table className="w-full border-separate border-spacing-y-2 px-4 text-left text-sm">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">
                  <th className="px-6 py-4">Tour Entity</th>
                  <th className="px-6 py-4 text-right">Views</th>
                  <th className="px-6 py-4 text-right">Cart</th>
                  <th className="px-6 py-4 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {byTour?.items.length ? (
                  byTour.items.map((r, i) => (
                    <tr
                      key={i}
                      className="group transition-colors hover:bg-brand-blue/5"
                    >
                      <td className="rounded-l-2xl border-y border-l border-brand-dark/5 bg-surface px-6 py-5 dark:border-white/5">
                        <div className="line-clamp-1 font-bold tracking-tight text-main transition-colors group-hover:text-brand-blue">
                          {r.tour_title || r.tour_slug}
                        </div>
                        <div className="mt-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-muted opacity-60">
                          <MapPin className="h-3 w-3 text-brand-blue" /> {r.city || 'COLOMBIA_NODE'}
                        </div>
                      </td>
                      <td className="border-y border-brand-dark/5 bg-surface px-6 py-5 text-right font-mono text-xs text-muted dark:border-white/5">
                        {r.tour_views}
                      </td>
                      <td className="border-y border-brand-dark/5 bg-surface px-6 py-5 text-right font-mono text-xs text-muted dark:border-white/5">
                        {r.checkout_started}
                      </td>
                      <td className="rounded-r-2xl border-y border-r border-brand-dark/5 bg-surface px-6 py-5 text-right dark:border-white/5">
                        <span className="inline-block font-heading text-xl text-green-600 transition-transform group-hover:scale-110 dark:text-green-400">
                          {r.checkout_paid}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-32 text-center text-sm italic text-muted opacity-40"
                    >
                      No technical data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Market nodes */}
        <section className="flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
          <header className="bg-surface-2/30 flex items-center justify-between border-b border-brand-dark/5 p-8 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue shadow-inner">
                <MapPin className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-main">
                Análisis Geográfico
              </h2>
            </div>
          </header>
          <div className="custom-scrollbar overflow-x-auto p-4">
            <table className="w-full border-separate border-spacing-y-2 px-4 text-left text-sm">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">
                  <th className="px-6 py-4">Market Node</th>
                  <th className="px-6 py-4 text-right">Traffic</th>
                  <th className="px-6 py-4 text-right">Liquidity</th>
                </tr>
              </thead>
              <tbody>
                {byCity?.items.length ? (
                  byCity.items.map((r, i) => (
                    <tr
                      key={i}
                      className="group transition-colors hover:bg-brand-blue/5"
                    >
                      <td className="rounded-l-2xl border-y border-l border-brand-dark/5 bg-surface px-6 py-5 dark:border-white/5">
                        <div className="flex items-center gap-3 font-bold uppercase tracking-tighter text-main">
                          <Globe className="h-4 w-4 text-brand-blue opacity-30" />
                          {r.city}
                        </div>
                      </td>
                      <td className="border-y border-brand-dark/5 bg-surface px-6 py-5 text-right font-mono text-xs text-muted dark:border-white/5">
                        {r.tour_views}
                      </td>
                      <td className="rounded-r-2xl border-y border-r border-brand-dark/5 bg-surface px-6 py-5 text-right dark:border-white/5">
                        <span className="font-heading text-xl text-green-600 dark:text-green-400">
                          {r.checkout_paid}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-32 text-center text-sm italic text-muted opacity-40"
                    >
                      Waiting for market signals...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Confidence Telemetry
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Terminal className="h-4 w-4 opacity-50" /> Metric Node v4.0
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Zap className="h-4 w-4" /> Live Signal: Active
        </div>
      </footer>
    </div>
  );
}

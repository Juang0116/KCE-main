/* src/app/admin/metrics/AdminMetricsClient.tsx */
'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState } from 'react';

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

type UTMByTourRow = {
  tour_slug: string;
  tour_title: string | null;
  city: string | null;
  tour_views: number;
  checkout_started: number;
  checkout_paid: number;
  rates: {
    startPerView: number;
    paidPerStart: number;
    paidPerView: number;
  };
};

type UTMByTourResponse = {
  ok: boolean;
  window: { from: string; to: string };
  utm_key: string;
  items: UTMByTourRow[];
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

function rate(a: number, b: number) {
  if (!b) return 0;
  return a / b;
}

function keyByTourRow(r: { tour_slug: string; city?: string | null }) {
  return `tour:${r.tour_slug}:${r.city ?? ''}`;
}

function keyByCityRow(r: { city: string }) {
  return `city:${r.city}`;
}

function keyByUtmRow(r: { utm_key: string }) {
  return `utm:${r.utm_key}`;
}

type AlertsState = {
  loading: boolean;
  items: any[];
  fired: any[];
  mitigations: any[];
};

type MitActionsState = {
  loading: boolean;
  items: any[];
};

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
  const [utmByTour, setUtmByTour] = useState<UTMByTourResponse | null>(null);
  const [selectedUtmKey, setSelectedUtmKey] = useState<string>('');

  const [outbound, setOutbound] = useState<OutboundPerfResponse | null>(null);

  const [minCaptures, setMinCaptures] = useState(30);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Alerts/Mitigations
  const [days, setDays] = useState(30);
  const [alerts, setAlerts] = useState<AlertsState>({
    loading: true,
    items: [],
    fired: [],
    mitigations: [],
  });
  const [mitActions, setMitActions] = useState<MitActionsState>({
    loading: true,
    items: [],
  });

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    return p.toString();
  }, [from, to]);

  // -------- main metrics load ----------
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const [
          rf,
          rcrm,
          rd,
          rt,
          rc,
          ru,
          rup,
          ro,
        ] = await Promise.all([
          adminFetch(`/api/admin/metrics/funnel?${query}`),
          adminFetch(`/api/admin/metrics/crm-funnel?${query}`),
          adminFetch(`/api/admin/metrics/deals`),
          adminFetch(`/api/admin/metrics/by-tour?${query}&limit=50`),
          adminFetch(`/api/admin/metrics/by-city?${query}&limit=50`),
          adminFetch(`/api/admin/metrics/utm?${query}`),
          fetch(
            `/api/admin/metrics/utm/top?${query}&min_captures=${encodeURIComponent(
              String(minCaptures),
            )}&limit=20`,
            { cache: 'no-store' },
          ),
          adminFetch(`/api/admin/metrics/outbound-performance?days=30&limit=1000`),
        ]);

        const jf = await rf.json().catch(() => null);
        const jcrm = await rcrm.json().catch(() => null);
        const jd = await rd.json().catch(() => null);
        const jt = await rt.json().catch(() => null);
        const jc = await rc.json().catch(() => null);
        const ju = await ru.json().catch(() => null);
        const jup = await rup.json().catch(() => null);
        const jo = await ro.json().catch(() => null);

        if (!rf.ok) throw new Error(jf?.error || `HTTP ${rf.status}`);
        if (!rcrm.ok) throw new Error(jcrm?.error || `HTTP ${rcrm.status}`);
        if (!rd.ok) throw new Error(jd?.error || `HTTP ${rd.status}`);
        if (!rt.ok) throw new Error(jt?.error || `HTTP ${rt.status}`);
        if (!rc.ok) throw new Error(jc?.error || `HTTP ${rc.status}`);
        if (!ru.ok) throw new Error(ju?.error || `HTTP ${ru.status}`);
        if (!rup.ok) throw new Error(jup?.error || `HTTP ${rup.status}`);
        if (!ro.ok) throw new Error(jo?.error || `HTTP ${ro.status}`);

        if (cancelled) return;

        setFunnel(jf as FunnelResponse);
        setCrmFunnel((jcrm as CrmFunnelResponse)?.ok ? (jcrm as CrmFunnelResponse) : null);
        setDeals((jd as DealsResponse)?.ok ? (jd as DealsResponse) : null);
        setByTour(jt as ByTourResponse);
        setByCity(jc as ByCityResponse);
        setUtm((ju as UTMResponse)?.ok ? (ju as UTMResponse) : null);
        setUtmTop((jup as UTMTopResponse)?.ok ? (jup as UTMTopResponse) : null);
        setOutbound((jo as OutboundPerfResponse)?.ok ? (jo as OutboundPerfResponse) : null);

        const winFrom = (jf as FunnelResponse)?.window?.from;
        const winTo = (jf as FunnelResponse)?.window?.to;

        if (!from && winFrom) setFrom(winFrom);
        if (winTo && to !== winTo) setTo(winTo);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Error');
        setFunnel(null);
        setCrmFunnel(null);
        setByTour(null);
        setByCity(null);
        setUtm(null);
        setUtmTop(null);
        setUtmByTour(null);
        setOutbound(null);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, minCaptures]);

  // choose initial utm key
  useEffect(() => {
    if (selectedUtmKey) return;
    const key = utmTop?.items?.[0]?.utm_key || utm?.items?.[0]?.utm_key || '';
    if (key) setSelectedUtmKey(key);
  }, [utm, utmTop, selectedUtmKey]);

  // utm by tour
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!selectedUtmKey) {
        setUtmByTour(null);
        return;
      }

      try {
        const r = await fetch(
          `/api/admin/metrics/utm/by-tour?${query}&utm_key=${encodeURIComponent(selectedUtmKey)}&limit=50`,
          { cache: 'no-store' },
        );
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        if (cancelled) return;
        setUtmByTour((j as UTMByTourResponse)?.ok ? (j as UTMByTourResponse) : null);
      } catch {
        if (cancelled) return;
        setUtmByTour(null);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [query, selectedUtmKey]);

  // -------- alerts / mitigations ----------
  async function loadAlerts(runNow: boolean) {
    try {
      setAlerts((s) => ({ ...s, loading: true }));
      const qs = new URLSearchParams({
        days: String(days),
        ...(runNow ? { run: '1', dryRun: 'true' } : {}),
      });

      const r = await adminFetch(`/api/admin/metrics/alerts?${qs.toString()}`, { cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);

      setAlerts({
        loading: false,
        items: Array.isArray(j.items) ? j.items : [],
        fired: Array.isArray(j.fired) ? j.fired : [],
        mitigations: Array.isArray(j.mitigations) ? j.mitigations : [],
      });
    } catch {
      setAlerts((s) => ({ ...s, loading: false }));
    }
  }

  async function ackAlert(id: string) {
    try {
      const r = await adminFetch(`/api/admin/metrics/alerts/${encodeURIComponent(id)}/ack`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      await loadAlerts(false);
    } catch {
      // ignore
    }
  }

  async function loadMitigations() {
    try {
      setMitActions((s) => ({ ...s, loading: true }));
      const qs = new URLSearchParams({ days: String(days) });
      const r = await adminFetch(`/api/admin/metrics/mitigations?${qs.toString()}`, { cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setMitActions({ loading: false, items: Array.isArray(j.items) ? j.items : [] });
    } catch {
      setMitActions((s) => ({ ...s, loading: false }));
    }
  }

  useEffect(() => {
    void loadAlerts(false);
    void loadMitigations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const campaignOptions = (utmTop?.items?.length ? utmTop.items : (utm?.items ?? [])).map((x) => ({
    utm_key: x.utm_key,
  }));

  const watchouts = useMemo(() => {
    const startPerView = funnel?.rates.startPerView ?? 0;
    const paidPerStart = funnel?.rates.paidPerStart ?? 0;
    const paidPerView = funnel?.rates.paidPerView ?? 0;
    const checkoutGap = Math.max((funnel?.counts.checkoutStarted ?? 0) - (funnel?.counts.checkoutPaid ?? 0), 0);
    const weakStage = (_deals?.totals.stageCounts?.proposal ?? 0) >= (_deals?.totals.stageCounts?.checkout ?? 0)
      ? 'proposal'
      : 'checkout';
    return [
      {
        title: 'Presión en checkout',
        value: String(checkoutGap),
        note: 'Sesiones iniciadas que todavía no pagan. Prioriza follow-up corto y soporte inmediato.',
      },
      {
        title: 'Gap en start',
        value: pct(startPerView),
        note: startPerView < 0.08 ? 'Muchos views y pocos inicios. Revisa CTAs y claridad de precio.' : 'El paso a checkout mantiene buen ritmo.',
      },
      {
        title: 'Cierre del funnel',
        value: pct(paidPerStart),
        note: paidPerStart < 0.35 ? 'Hay intención, pero el cierre puede estar perdiéndose en propuesta o soporte.' : 'El cierre desde checkout se ve sano.',
      },
      {
        title: 'Etapa a empujar',
        value: weakStage,
        note: weakStage === 'proposal' ? 'Conviene mover propuestas viejas con outbound y CTA de checkout.' : 'Empuja deals en checkout antes de que se enfríen.',
      },
      {
        title: 'Conversión final',
        value: pct(paidPerView),
        note: 'Usa este número como lectura rápida de eficiencia comercial global.',
      },
    ];
  }, [funnel, _deals]);

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-sm">
            <div className="text-[color:var(--color-text)]/70 mb-1">Desde</div>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-44 rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-3 py-2 text-sm"
            />
          </label>

          <label className="text-sm">
            <div className="text-[color:var(--color-text)]/70 mb-1">Hasta</div>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-44 rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="text-[color:var(--color-text)]/70 text-sm">
          {loading ? 'Cargando…' : 'Actualizado'}
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_.9fr]">
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-5">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-heading text-lg text-brand-blue">Prioridades comerciales</h2>
            <span className="text-[color:var(--color-text)]/60 text-xs">Qué revisar primero hoy</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {watchouts.map((item) => (
              <div key={item.title} className="rounded-2xl border border-black/10 bg-black/5 p-4">
                <div className="text-[color:var(--color-text)]/70 text-xs">{item.title}</div>
                <div className="mt-1 text-2xl font-semibold text-[color:var(--color-text)]">{item.value}</div>
                <div className="text-[color:var(--color-text)]/60 mt-2 text-xs">{item.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-5">
          <h2 className="font-heading text-lg text-brand-blue">Acciones rápidas</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/admin/sales" className="rounded-full border border-black/10 px-3 py-2 text-sm hover:bg-black/5">Empujar sales</a>
            <a href="/admin/deals" className="rounded-full border border-black/10 px-3 py-2 text-sm hover:bg-black/5">Revisar deals</a>
            <a href="/admin/outbound" className="rounded-full border border-black/10 px-3 py-2 text-sm hover:bg-black/5">Seguir outbound</a>
            <a href="/admin/revenue" className="rounded-full border border-black/10 px-3 py-2 text-sm hover:bg-black/5">Abrir Revenue Ops</a>
          </div>
          <div className="text-[color:var(--color-text)]/60 mt-4 text-xs">
            Usa este tablero para detectar fricción. Ejecuta la acción en Sales / Deals / Outbound donde el dato ya te indica el siguiente paso.
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-black/5 p-5">
          <div className="text-[color:var(--color-text)]/70 text-sm">tour.view</div>
          <div className="mt-1 text-3xl font-semibold text-[color:var(--color-text)]">
            {funnel?.counts.tourViews ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-black/5 p-5">
          <div className="text-[color:var(--color-text)]/70 text-sm">checkout.started</div>
          <div className="mt-1 text-3xl font-semibold text-[color:var(--color-text)]">
            {funnel?.counts.checkoutStarted ?? 0}
          </div>
          <div className="text-[color:var(--color-text)]/60 mt-2 text-xs">
            Start per view: {pct(funnel?.rates.startPerView ?? 0)}
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-black/5 p-5">
          <div className="text-[color:var(--color-text)]/70 text-sm">checkout.paid</div>
          <div className="mt-1 text-3xl font-semibold text-[color:var(--color-text)]">
            {funnel?.counts.checkoutPaid ?? 0}
          </div>
          <div className="text-[color:var(--color-text)]/60 mt-2 text-xs">
            Paid per start: {pct(funnel?.rates.paidPerStart ?? 0)} · Paid per view:{' '}
            {pct(funnel?.rates.paidPerView ?? 0)}
          </div>
        </div>
      </div>

      {crmFunnel ? (
        <div className="mt-4 rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-5">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-heading text-lg text-brand-blue">
              CRM funnel (Leads → Tickets → Deals → Checkout → Paid)
            </h2>
            <div className="text-[color:var(--color-text)]/60 text-xs">
              Ventana: {crmFunnel.window.from} → {crmFunnel.window.to}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
              <div className="text-[color:var(--color-text)]/70 text-xs">Leads capturados</div>
              <div className="mt-1 text-2xl font-semibold text-[color:var(--color-text)]">
                {crmFunnel.counts.leads}
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
              <div className="text-[color:var(--color-text)]/70 text-xs">Tickets creados</div>
              <div className="mt-1 text-2xl font-semibold text-[color:var(--color-text)]">
                {crmFunnel.counts.tickets}
              </div>
              <div className="text-[color:var(--color-text)]/60 mt-2 text-xs">
                Tickets/Lead: {pct(crmFunnel.rates.ticketsPerLead)}
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
              <div className="text-[color:var(--color-text)]/70 text-xs">Deals creados</div>
              <div className="mt-1 text-2xl font-semibold text-[color:var(--color-text)]">
                {crmFunnel.counts.deals}
              </div>
              <div className="text-[color:var(--color-text)]/60 mt-2 text-xs">
                Deals/Ticket: {pct(crmFunnel.rates.dealsPerTicket)}
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
              <div className="text-[color:var(--color-text)]/70 text-xs">Checkout creados</div>
              <div className="mt-1 text-2xl font-semibold text-[color:var(--color-text)]">
                {crmFunnel.counts.checkoutSessions}
              </div>
              <div className="text-[color:var(--color-text)]/60 mt-2 text-xs">
                Checkouts/Deal: {pct(crmFunnel.rates.checkoutsPerDeal)}
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
              <div className="text-[color:var(--color-text)]/70 text-xs">Checkout paid (evento)</div>
              <div className="mt-1 text-2xl font-semibold text-[color:var(--color-text)]">
                {crmFunnel.counts.checkoutPaid}
              </div>
              <div className="text-[color:var(--color-text)]/60 mt-2 text-xs">
                Paid/Checkout: {pct(crmFunnel.rates.paidPerCheckout)}
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
              <div className="text-[color:var(--color-text)]/70 text-xs">Bookings pagadas</div>
              <div className="mt-1 text-2xl font-semibold text-[color:var(--color-text)]">
                {crmFunnel.counts.bookingsPaid}
              </div>
            </div>
          </div>

          <div className="mt-3 text-[color:var(--color-text)]/60 text-xs">
            Nota: Checkout sessions incluye eventos <code>bot.checkout_session_created</code> y{' '}
            <code>checkout.started</code>.
          </div>
        </div>
      ) : null}

      <div className="text-[color:var(--color-text)]/70 mt-4 rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-5 text-sm">
        Ventana:{' '}
        <span className="font-medium text-[color:var(--color-text)]">{funnel?.window.from ?? '—'}</span>{' '}
        →{' '}
        <span className="font-medium text-[color:var(--color-text)]">{funnel?.window.to ?? '—'}</span>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-5">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-heading text-lg text-brand-blue">Por tour (Top 50)</h2>
            {byTour?.truncated ? (
              <span className="text-[color:var(--color-text)]/60 text-xs">(truncado)</span>
            ) : null}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[740px] text-sm">
              <thead className="bg-black/5 text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold">Tour</th>
                  <th className="px-3 py-2 font-semibold">Ciudad</th>
                  <th className="px-3 py-2 font-semibold">Views</th>
                  <th className="px-3 py-2 font-semibold">Started</th>
                  <th className="px-3 py-2 font-semibold">Paid</th>
                  <th className="px-3 py-2 font-semibold">Paid/View</th>
                </tr>
              </thead>

              <tbody>
                {(byTour?.items ?? []).map((r) => (
                  <tr key={keyByTourRow(r)} className="border-t border-black/10">
                    <td className="px-3 py-2">
                      <div className="font-medium text-[color:var(--color-text)]">
                        {r.tour_title || r.tour_slug}
                      </div>
                      <div className="text-[color:var(--color-text)]/60 mt-1 text-xs">{r.tour_slug}</div>
                    </td>
                    <td className="text-[color:var(--color-text)]/70 whitespace-nowrap px-3 py-2">
                      {r.city || '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{r.tour_views}</td>
                    <td className="whitespace-nowrap px-3 py-2">{r.checkout_started}</td>
                    <td className="whitespace-nowrap px-3 py-2">{r.checkout_paid}</td>
                    <td className="text-[color:var(--color-text)]/70 whitespace-nowrap px-3 py-2">
                      {pct(rate(r.checkout_paid, r.tour_views))}
                    </td>
                  </tr>
                ))}

                {!loading && (byTour?.items?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-[color:var(--color-text)]/70 px-3 py-8 text-center">
                      Sin datos.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-5">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-heading text-lg text-brand-blue">Por ciudad (Top 50)</h2>
            {byCity?.truncated ? (
              <span className="text-[color:var(--color-text)]/60 text-xs">(truncado)</span>
            ) : null}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-black/5 text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold">Ciudad</th>
                  <th className="px-3 py-2 font-semibold">Views</th>
                  <th className="px-3 py-2 font-semibold">Started</th>
                  <th className="px-3 py-2 font-semibold">Paid</th>
                  <th className="px-3 py-2 font-semibold">Paid/View</th>
                </tr>
              </thead>

              <tbody>
                {(byCity?.items ?? []).map((r) => (
                  <tr key={keyByCityRow(r)} className="border-t border-black/10">
                    <td className="px-3 py-2 font-medium text-[color:var(--color-text)]">{r.city}</td>
                    <td className="whitespace-nowrap px-3 py-2">{r.tour_views}</td>
                    <td className="whitespace-nowrap px-3 py-2">{r.checkout_started}</td>
                    <td className="whitespace-nowrap px-3 py-2">{r.checkout_paid}</td>
                    <td className="text-[color:var(--color-text)]/70 whitespace-nowrap px-3 py-2">
                      {pct(rate(r.checkout_paid, r.tour_views))}
                    </td>
                  </tr>
                ))}

                {!loading && (byCity?.items?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-[color:var(--color-text)]/70 px-3 py-8 text-center">
                      Sin datos.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* UTM / Campañas */}
      <div className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl text-brand-blue">UTM / Campañas</h2>
            <p className="text-[color:var(--color-text)]/70 mt-1 text-sm">
              Atribución básica por utm_source / utm_medium / utm_campaign (según cookie).
            </p>

            {utm ? (
              <div className="text-[color:var(--color-text)]/60 mt-2 text-xs">
                Totales:{' '}
                <span className="font-medium text-[color:var(--color-text)]">
                  {utm.summary.totals.utm_captures}
                </span>{' '}
                capturas ·{' '}
                <span className="font-medium text-[color:var(--color-text)]">
                  {utm.summary.totals.quiz_completed}
                </span>{' '}
                quiz ·{' '}
                <span className="font-medium text-[color:var(--color-text)]">
                  {utm.summary.totals.newsletter_confirmed}
                </span>{' '}
                newsletter ·{' '}
                <span className="font-medium text-[color:var(--color-text)]">
                  {utm.summary.totals.checkout_paid}
                </span>{' '}
                pagos · Paid/Capture:{' '}
                <span className="font-medium text-[color:var(--color-text)]">
                  {pct(utm.summary.rates.paidPerCapture)}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {!utm ? (
          <p className="text-[color:var(--color-text)]/60 mt-4 text-sm">Sin datos para la ventana seleccionada.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="text-[color:var(--color-text)]/70 text-left">
                  <th className="py-2 pr-4">UTM</th>
                  <th className="py-2 pr-4">Capturas</th>
                  <th className="py-2 pr-4">Newsletter confirmadas</th>
                  <th className="py-2 pr-4">Quiz completados</th>
                  <th className="py-2 pr-4">Pagos</th>
                  <th className="py-2 pr-4">Quiz/Capture</th>
                  <th className="py-2 pr-4">Confirm/Capture</th>
                  <th className="py-2 pr-4">Paid/Capture</th>
                  <th className="py-2 pr-4">Paid/Quiz</th>
                </tr>
              </thead>

              <tbody>
                {utm.items.map((r) => (
                  <tr key={keyByUtmRow(r)} className="border-t border-[color:var(--color-border)]">
                    <td className="text-[color:var(--color-text)]/85 py-2 pr-4 font-medium">{r.utm_key}</td>
                    <td className="py-2 pr-4">{r.utm_captures}</td>
                    <td className="py-2 pr-4">{r.newsletter_confirmed}</td>
                    <td className="py-2 pr-4">{r.quiz_completed}</td>
                    <td className="py-2 pr-4 font-medium">{r.checkout_paid}</td>
                    <td className="text-[color:var(--color-text)]/70 py-2 pr-4">{pct(r.rates.quizPerCapture)}</td>
                    <td className="text-[color:var(--color-text)]/70 py-2 pr-4">{pct(r.rates.confirmPerCapture)}</td>
                    <td className="py-2 pr-4 font-medium">{pct(r.rates.paidPerCapture)}</td>
                    <td className="text-[color:var(--color-text)]/70 py-2 pr-4">{pct(r.rates.paidPerQuiz)}</td>
                  </tr>
                ))}

                <tr className="border-t border-[color:var(--color-border)] bg-black/5">
                  <td className="py-2 pr-4 font-semibold">TOTAL</td>
                  <td className="py-2 pr-4 font-medium">{utm.summary.totals.utm_captures}</td>
                  <td className="py-2 pr-4 font-medium">{utm.summary.totals.newsletter_confirmed}</td>
                  <td className="py-2 pr-4 font-medium">{utm.summary.totals.quiz_completed}</td>
                  <td className="py-2 pr-4 font-semibold">{utm.summary.totals.checkout_paid}</td>
                  <td className="text-[color:var(--color-text)]/70 py-2 pr-4">{pct(utm.summary.rates.quizPerCapture)}</td>
                  <td className="text-[color:var(--color-text)]/70 py-2 pr-4">{pct(utm.summary.rates.confirmPerCapture)}</td>
                  <td className="py-2 pr-4 font-semibold">{pct(utm.summary.rates.paidPerCapture)}</td>
                  <td className="text-[color:var(--color-text)]/70 py-2 pr-4">{pct(utm.summary.rates.paidPerQuiz)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top campaigns */}
      <div className="mt-8 rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-heading text-lg text-brand-blue">Top campañas (por Paid/Capture)</h3>
            <p className="text-[color:var(--color-text)]/70 mt-1 text-sm">
              Filtra por mínimo de capturas para evitar ruido estadístico.
            </p>
          </div>

          <label className="text-sm">
            <div className="text-[color:var(--color-text)]/70 mb-1">Mín. capturas</div>
            <input
              type="number"
              min={0}
              max={100000}
              value={minCaptures}
              onChange={(e) => setMinCaptures(Number(e.target.value || 0))}
              className="w-32 rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-3 py-2 text-sm"
            />
          </label>
        </div>

        {!utmTop ? (
          <p className="text-[color:var(--color-text)]/60 mt-4 text-sm">Sin datos (o no cumple el mínimo).</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="text-[color:var(--color-text)]/70 text-left">
                  <th className="py-2 pr-4">UTM</th>
                  <th className="py-2 pr-4">Capturas</th>
                  <th className="py-2 pr-4">Quiz</th>
                  <th className="py-2 pr-4">Newsletter</th>
                  <th className="py-2 pr-4">Pagos</th>
                  <th className="py-2 pr-4">Paid/Capture</th>
                  <th className="py-2 pr-4">Paid/Quiz</th>
                </tr>
              </thead>

              <tbody>
                {(utmTop.items ?? []).map((r) => (
                  <tr
                    key={keyByUtmRow(r)}
                    className={`border-t border-[color:var(--color-border)] ${
                      r.utm_key === selectedUtmKey ? 'bg-black/5' : ''
                    }`}
                  >
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => setSelectedUtmKey(r.utm_key)}
                        className="text-[color:var(--color-text)]/85 text-left font-medium hover:underline"
                        title="Ver desglose por tour"
                      >
                        {r.utm_key}
                      </button>
                    </td>
                    <td className="py-2 pr-4">{r.utm_captures}</td>
                    <td className="py-2 pr-4">{r.quiz_completed}</td>
                    <td className="py-2 pr-4">{r.newsletter_confirmed}</td>
                    <td className="py-2 pr-4 font-medium">{r.checkout_paid}</td>
                    <td className="py-2 pr-4 font-semibold">{pct(r.rates.paidPerCapture)}</td>
                    <td className="text-[color:var(--color-text)]/70 py-2 pr-4">{pct(r.rates.paidPerQuiz)}</td>
                  </tr>
                ))}

                {!loading && (utmTop.items?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-[color:var(--color-text)]/60 py-8 text-center">
                      Ninguna campaña cumple minCaptures={minCaptures}.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaign → by tour */}
      <div className="mt-6 rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-heading text-lg text-brand-blue">Desglose por tour (campaña seleccionada)</h3>
            <p className="text-[color:var(--color-text)]/70 mt-1 text-sm">
              Views/Started/Paid atribuídos a la misma cookie UTM.
            </p>
          </div>

          <label className="text-sm">
            <div className="text-[color:var(--color-text)]/70 mb-1">Campaña</div>
            <select
              value={selectedUtmKey}
              onChange={(e) => setSelectedUtmKey(e.target.value)}
              className="w-[340px] max-w-full rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-3 py-2 text-sm"
            >
              {campaignOptions.map((x) => (
                <option key={keyByUtmRow(x)} value={x.utm_key}>
                  {x.utm_key}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!selectedUtmKey ? (
          <p className="text-[color:var(--color-text)]/60 mt-4 text-sm">Selecciona una campaña.</p>
        ) : !utmByTour ? (
          <p className="text-[color:var(--color-text)]/60 mt-4 text-sm">Sin datos para esta campaña en la ventana.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-black/5 text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold">Tour</th>
                  <th className="px-3 py-2 font-semibold">Ciudad</th>
                  <th className="px-3 py-2 font-semibold">Views</th>
                  <th className="px-3 py-2 font-semibold">Started</th>
                  <th className="px-3 py-2 font-semibold">Paid</th>
                  <th className="px-3 py-2 font-semibold">Start/View</th>
                  <th className="px-3 py-2 font-semibold">Paid/Start</th>
                  <th className="px-3 py-2 font-semibold">Paid/View</th>
                </tr>
              </thead>

              <tbody>
                {utmByTour.items.map((r) => (
                  <tr key={keyByTourRow(r)} className="border-t border-black/10">
                    <td className="px-3 py-2">
                      <div className="font-medium text-[color:var(--color-text)]">{r.tour_title || r.tour_slug}</div>
                      <div className="text-[color:var(--color-text)]/60 mt-1 text-xs">{r.tour_slug}</div>
                    </td>
                    <td className="text-[color:var(--color-text)]/70 whitespace-nowrap px-3 py-2">{r.city || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2">{r.tour_views}</td>
                    <td className="whitespace-nowrap px-3 py-2">{r.checkout_started}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-medium">{r.checkout_paid}</td>
                    <td className="text-[color:var(--color-text)]/70 whitespace-nowrap px-3 py-2">{pct(r.rates.startPerView)}</td>
                    <td className="text-[color:var(--color-text)]/70 whitespace-nowrap px-3 py-2">{pct(r.rates.paidPerStart)}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-medium">{pct(r.rates.paidPerView)}</td>
                  </tr>
                ))}

                {!loading && (utmByTour.items?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-[color:var(--color-text)]/70 px-3 py-8 text-center">
                      Sin datos.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Outbound performance */}
      <div className="mt-6 rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-5">
        <div>
          <h3 className="font-heading text-lg text-brand-blue">Rendimiento outbound (CRM)</h3>
          <p className="text-[color:var(--color-text)]/70 mt-1 text-sm">
            Performance por plantilla/variante/canal en los últimos 30 días (sent/replied/paid + won7d).
          </p>
        </div>

        {!outbound ? (
          <p className="text-[color:var(--color-text)]/60 mt-4 text-sm">Sin datos outbound.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-black/5 text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold">Template</th>
                  <th className="px-3 py-2 font-semibold">Variante</th>
                  <th className="px-3 py-2 font-semibold">Canal</th>
                  <th className="px-3 py-2 font-semibold">Sent</th>
                  <th className="px-3 py-2 font-semibold">Replied</th>
                  <th className="px-3 py-2 font-semibold">Paid</th>
                  <th className="px-3 py-2 font-semibold">Won7d</th>
                  <th className="px-3 py-2 font-semibold">Reply/Sent</th>
                  <th className="px-3 py-2 font-semibold">Paid/Sent</th>
                </tr>
              </thead>
              <tbody>
                {outbound.items.map((r, i) => (
                  <tr key={`${r.key}|${r.variant ?? ''}|${r.channel}|${i}`} className="border-t border-black/10">
                    <td className="px-3 py-2">
                      <div className="font-medium text-[color:var(--color-text)]">{r.key}</div>
                    </td>
                    <td className="text-[color:var(--color-text)]/70 whitespace-nowrap px-3 py-2">{r.variant || '—'}</td>
                    <td className="text-[color:var(--color-text)]/70 whitespace-nowrap px-3 py-2">{r.channel}</td>
                    <td className="whitespace-nowrap px-3 py-2">{r.sent}</td>
                    <td className="whitespace-nowrap px-3 py-2">{r.replied}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-medium">{r.paid}</td>
                    <td className="whitespace-nowrap px-3 py-2">{r.won7d}</td>
                    <td className="text-[color:var(--color-text)]/70 whitespace-nowrap px-3 py-2">
                      {pct(r.sent ? r.replied / r.sent : 0)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-medium">{pct(r.sent ? r.paid / r.sent : 0)}</td>
                  </tr>
                ))}

                {!loading && (outbound.items?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-[color:var(--color-text)]/70 px-3 py-8 text-center">
                      Sin datos.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alerts & auto-mitigation */}
      <div className="mt-8 rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Alerts & Auto-mitigation</h2>
            <p className="text-sm text-[color:var(--color-text)]/70">
              Señales tempranas: spikes de fallos y caídas de paid-rate, con mitigaciones automáticas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">
              <div className="text-[color:var(--color-text)]/70 mb-1">Ventana (días)</div>
              <input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(Number(e.target.value || 30))}
                className="w-28 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black/30"
              />
            </label>

            <button
              type="button"
              onClick={() => void loadAlerts(true)}
              className="mt-6 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-black/5 dark:border-white/10 dark:bg-black/30 dark:hover:bg-white/10"
            >
              Evaluar ahora (dry-run)
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-black/20">
            <div className="text-sm font-semibold">Últimas alertas</div>
            <div className="mt-2 text-xs text-[color:var(--color-text)]/70">Ventana: últimos {days} días</div>

            {alerts.loading ? (
              <div className="mt-3 text-sm text-[color:var(--color-text)]/70">Cargando…</div>
            ) : (
              <div className="mt-3 space-y-2">
                {(alerts.items || []).slice(0, 10).map((a: any) => (
                  <div key={a.id} className="rounded-xl border border-black/10 px-3 py-2 dark:border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold">{a.type}</div>
                      <div className="text-xs text-[color:var(--color-text)]/60">
                        {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                      </div>
                    </div>
                    <div className="mt-1 text-sm">{a.message}</div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-[color:var(--color-text)]/60">Severity: {a.severity}</div>
                      <div className="flex items-center gap-2 text-xs">
                        {a.acknowledged_at ? (
                          <span className="rounded-full border border-black/10 bg-black/5 px-2 py-0.5 text-[color:var(--color-text)]/70 dark:border-white/10 dark:bg-white/10">
                            ACK
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void ackAlert(a.id)}
                            className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[color:var(--color-text)]/70 shadow-sm hover:bg-black/5 dark:border-white/10 dark:bg-black/30 dark:hover:bg-white/10"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {(alerts.items || []).length === 0 ? (
                  <div className="text-sm text-[color:var(--color-text)]/70">Sin alertas recientes.</div>
                ) : null}
              </div>
            )}

            {(alerts.fired || []).length ? (
              <div className="mt-4 rounded-xl border border-black/10 bg-black/5 p-3 text-sm dark:border-white/10 dark:bg-white/10">
                <div className="text-xs font-semibold">Fired (dry-run)</div>
                <div className="mt-2 space-y-2">
                  {(alerts.fired || []).map((a: any, i: number) => (
                    <div key={i} className="text-xs">
                      <div className="font-medium">{a.type}</div>
                      <div className="text-[color:var(--color-text)]/70">{a.message}</div>
                    </div>
                  ))}
                </div>
                {(alerts.mitigations || []).length ? (
                  <div className="mt-3 text-xs text-[color:var(--color-text)]/70">
                    Mitigations (dry-run): {(alerts.mitigations || []).length}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-black/20">
            <div className="text-sm font-semibold">Acciones aplicadas</div>
            <div className="mt-2 text-xs text-[color:var(--color-text)]/70">Registro: últimos {days} días</div>

            {mitActions.loading ? (
              <div className="mt-3 text-sm text-[color:var(--color-text)]/70">Cargando…</div>
            ) : (
              <div className="mt-3 space-y-2">
                {(mitActions.items || []).slice(0, 12).map((m: any) => (
                  <div key={m.id} className="rounded-xl border border-black/10 px-3 py-2 dark:border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold">{m.action}</div>
                      <div className="text-xs text-[color:var(--color-text)]/60">
                        {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-[color:var(--color-text)]/70">Alert: {m.alert_type}</div>
                    <div className="mt-1 text-xs text-[color:var(--color-text)]/60">Status: {m.status}</div>
                  </div>
                ))}

                {(mitActions.items || []).length === 0 ? (
                  <div className="text-sm text-[color:var(--color-text)]/70">Sin acciones aplicadas.</div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

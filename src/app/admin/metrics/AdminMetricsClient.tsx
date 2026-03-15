'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { useEffect, useMemo, useState } from 'react';
import { BarChart3, TrendingUp, Filter, Target, Activity, MapPin, Search } from 'lucide-react';

type FunnelResponse = { window: { from: string; to: string }; counts: { tourViews: number; checkoutStarted: number; checkoutPaid: number }; rates: { startPerView: number; paidPerStart: number; paidPerView: number }; };
type DealsResponse = { ok: boolean; totals: { deals: number; stageCounts: Record<string, number>; wonCount: number; wonAmountMinor: number; wonCurrency: string; }; avgAgeDaysByStage: Record<string, number>; };
type CrmFunnelResponse = { ok: boolean; window: { from: string; to: string }; counts: { leads: number; tickets: number; deals: number; checkoutSessions: number; checkoutPaid: number; bookingsPaid: number; }; rates: { ticketsPerLead: number; dealsPerTicket: number; checkoutsPerDeal: number; paidPerCheckout: number; paidBookingsPerPaidEvent: number; }; };
type ByTourRow = { tour_slug: string; tour_title: string | null; city: string | null; tour_views: number; checkout_started: number; checkout_paid: number; };
type ByTourResponse = { window: { from: string; to: string }; items: ByTourRow[]; truncated?: boolean; };
type ByCityRow = { city: string; tour_views: number; checkout_started: number; checkout_paid: number; };
type ByCityResponse = { window: { from: string; to: string }; items: ByCityRow[]; truncated?: boolean; };
type UTMRow = { utm_key: string; utm_source: string; utm_medium: string; utm_campaign: string; utm_captures: number; newsletter_confirmed: number; quiz_completed: number; checkout_paid: number; rates: { confirmPerCapture: number; quizPerCapture: number; paidPerCapture: number; paidPerQuiz: number; }; };
type UTMResponse = { ok: boolean; window: { from: string; to: string }; summary: { totals: { utm_captures: number; newsletter_confirmed: number; quiz_completed: number; checkout_paid: number; }; rates: { confirmPerCapture: number; quizPerCapture: number; paidPerCapture: number; paidPerQuiz: number; }; }; items: UTMRow[]; };
type UTMTopResponse = { ok: boolean; window: { from: string; to: string }; params: { minCaptures: number; limit: number }; items: UTMRow[]; };
type UTMByTourRow = { tour_slug: string; tour_title: string | null; city: string | null; tour_views: number; checkout_started: number; checkout_paid: number; rates: { startPerView: number; paidPerStart: number; paidPerView: number; }; };
type UTMByTourResponse = { ok: boolean; window: { from: string; to: string }; utm_key: string; items: UTMByTourRow[]; };
type OutboundPerfResponse = { ok: boolean; window: { from: string; to: string }; items: Array<{ key: string; variant: string | null; channel: string; queued: number; sent: number; failed: number; replied: number; paid: number; won7d: number; }>; };

function pct(n: number) { if (!Number.isFinite(n)) return '0%'; return `${(n * 100).toFixed(1)}%`; }

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

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    return p.toString();
  }, [from, to]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true); setError(null);
      try {
        const [rf, rcrm, rd, rt, rc, ru, rup, ro] = await Promise.all([
          adminFetch(`/api/admin/metrics/funnel?${query}`), adminFetch(`/api/admin/metrics/crm-funnel?${query}`),
          adminFetch(`/api/admin/metrics/deals`), adminFetch(`/api/admin/metrics/by-tour?${query}&limit=50`),
          adminFetch(`/api/admin/metrics/by-city?${query}&limit=50`), adminFetch(`/api/admin/metrics/utm?${query}`),
          fetch(`/api/admin/metrics/utm/top?${query}&min_captures=${encodeURIComponent(String(minCaptures))}&limit=20`, { cache: 'no-store' }),
          adminFetch(`/api/admin/metrics/outbound-performance?days=30&limit=1000`),
        ]);

        const [jf, jcrm, jd, jt, jc, ju, jup, jo] = await Promise.all([ rf.json().catch(()=>null), rcrm.json().catch(()=>null), rd.json().catch(()=>null), rt.json().catch(()=>null), rc.json().catch(()=>null), ru.json().catch(()=>null), rup.json().catch(()=>null), ro.json().catch(()=>null) ]);

        if (cancelled) return;
        setFunnel(jf as FunnelResponse); setCrmFunnel((jcrm as CrmFunnelResponse)?.ok ? jcrm : null); setDeals((jd as DealsResponse)?.ok ? jd : null); setByTour(jt as ByTourResponse); setByCity(jc as ByCityResponse); setUtm((ju as UTMResponse)?.ok ? ju : null); setUtmTop((jup as UTMTopResponse)?.ok ? jup : null); setOutbound((jo as OutboundPerfResponse)?.ok ? jo : null);
        
        const winFrom = (jf as FunnelResponse)?.window?.from; const winTo = (jf as FunnelResponse)?.window?.to;
        if (!from && winFrom) setFrom(winFrom); if (winTo && to !== winTo) setTo(winTo);
      } catch (e: any) {
        if (cancelled) return; setError(e?.message || 'Error'); setFunnel(null); setCrmFunnel(null); setByTour(null); setByCity(null); setUtm(null); setUtmTop(null); setUtmByTour(null); setOutbound(null);
      } finally { if (!cancelled) setLoading(false); }
    }
    void run(); return () => { cancelled = true; };
  }, [query, minCaptures, from, to]);

  useEffect(() => {
    if (selectedUtmKey) return;
    const key = utmTop?.items?.[0]?.utm_key || utm?.items?.[0]?.utm_key || '';
    if (key) setSelectedUtmKey(key);
  }, [utm, utmTop, selectedUtmKey]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!selectedUtmKey) { setUtmByTour(null); return; }
      try {
        const r = await fetch(`/api/admin/metrics/utm/by-tour?${query}&utm_key=${encodeURIComponent(selectedUtmKey)}&limit=50`, { cache: 'no-store' });
        const j = await r.json().catch(() => null);
        if (cancelled) return; setUtmByTour((j as UTMByTourResponse)?.ok ? j : null);
      } catch { if (!cancelled) setUtmByTour(null); }
    }
    void run(); return () => { cancelled = true; };
  }, [query, selectedUtmKey]);

  const watchouts = useMemo(() => {
    const startPerView = funnel?.rates.startPerView ?? 0;
    const paidPerStart = funnel?.rates.paidPerStart ?? 0;
    const checkoutGap = Math.max((funnel?.counts.checkoutStarted ?? 0) - (funnel?.counts.checkoutPaid ?? 0), 0);
    const weakStage = (_deals?.totals.stageCounts?.proposal ?? 0) >= (_deals?.totals.stageCounts?.checkout ?? 0) ? 'proposal' : 'checkout';
    return [
      { title: 'Presión en checkout', value: String(checkoutGap), note: 'Inicios sin pago. Urge follow-up.' },
      { title: 'Paso a Checkout', value: pct(startPerView), note: startPerView < 0.08 ? 'Muchos views, pocos inician el pago.' : 'Interés y retención sanos.' },
      { title: 'Cierre del funnel', value: pct(paidPerStart), note: paidPerStart < 0.35 ? 'Pérdida en checkout. Revisar Stripe o soporte.' : 'Tasa de cierre aceptable.' },
      { title: 'Etapa Estancada', value: weakStage.toUpperCase(), note: 'Aplica presión sobre los deals atascados aquí.' },
    ];
  }, [funnel, _deals]);

  const workbenchSignals = useMemo(() => [
    { label: 'Conversión Global', value: pct(funnel?.rates.paidPerView ?? 0), note: 'Tasa general de Views a Compras Pagadas.' },
    { label: 'Views Totales', value: String(funnel?.counts.tourViews ?? 0), note: 'Tráfico de Tours en el periodo.' },
    { label: 'Leads Capturados', value: String(crmFunnel?.counts.leads ?? 0), note: 'Nuevos contactos en CRM.' }
  ], [funnel, crmFunnel]);

  return (
    <section className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Executive Analytics</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Inteligencia comercial, rendimiento de campañas y embudos de conversión.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Data & Growth"
        title="Decisiones Basadas en Datos"
        description="Analiza el rendimiento del catálogo, mide la efectividad de las campañas y descubre los cuellos de botella exactos donde KCE está perdiendo ventas."
        actions={[
          { href: '/admin/catalog', label: 'Optimizar Catálogo', tone: 'primary' },
          { href: '/admin/marketing', label: 'Ver Campañas' }
        ]}
        signals={workbenchSignals}
      />

      {/* Control de Tiempo */}
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Filter className="h-5 w-5 text-brand-blue" />
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full sm:w-44 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 text-sm outline-none focus:border-brand-blue transition-colors" />
            <span className="text-[var(--color-text)]/40 font-bold text-xs uppercase">Hasta</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full sm:w-44 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 text-sm outline-none focus:border-brand-blue transition-colors" />
          </div>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">
          {loading ? 'Calculando Métricas...' : 'Datos Sincronizados'}
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{error}</div>}

      {/* Prioridades Comerciales */}
      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Target className="h-6 w-6 text-brand-blue" />
          <h2 className="font-heading text-2xl text-[var(--color-text)]">Prioridades de Acción</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {watchouts.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5 transition hover:border-brand-blue/30">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">{item.title}</div>
              <div className="text-3xl font-heading text-brand-blue">{item.value}</div>
              <div className="mt-3 text-xs text-[var(--color-text)]/60 leading-relaxed font-light">{item.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Embudos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Marketing Funnel */}
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Embudo de Producto</h2>
          </div>
          {funnel ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-2)] px-5 py-4 border border-[var(--color-border)]">
                <span className="text-sm font-semibold text-[var(--color-text)]">Vistas de Tour</span>
                <span className="font-heading text-xl">{funnel.counts.tourViews}</span>
              </div>
              <div className="flex justify-center text-[var(--color-text)]/30">↓ {pct(funnel.rates.startPerView)}</div>
              <div className="flex items-center justify-between rounded-xl bg-brand-blue/5 px-5 py-4 border border-brand-blue/20">
                <span className="text-sm font-semibold text-brand-blue">Inicios de Checkout</span>
                <span className="font-heading text-xl text-brand-blue">{funnel.counts.checkoutStarted}</span>
              </div>
              <div className="flex justify-center text-[var(--color-text)]/30">↓ {pct(funnel.rates.paidPerStart)}</div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-5 py-4 border border-emerald-500/20">
                <span className="text-sm font-semibold text-emerald-700">Compras Pagadas</span>
                <span className="font-heading text-xl text-emerald-700">{funnel.counts.checkoutPaid}</span>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-[var(--color-text)]/40">Sin datos del embudo.</div>
          )}
        </div>

        {/* CRM Funnel */}
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Embudo CRM</h2>
          </div>
          {crmFunnel ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-[var(--color-surface-2)] px-4 py-3 rounded-xl border border-[var(--color-border)]">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text)]/60">Leads Capturados</span>
                <span className="font-semibold text-base">{crmFunnel.counts.leads}</span>
              </div>
              <div className="flex justify-between items-center bg-[var(--color-surface-2)] px-4 py-3 rounded-xl border border-[var(--color-border)]">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text)]/60">Tickets (Soporte)</span>
                <span className="font-semibold text-base">{crmFunnel.counts.tickets}</span>
              </div>
              <div className="flex justify-between items-center bg-brand-blue/5 px-4 py-3 rounded-xl border border-brand-blue/20">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-blue">Deals Abiertos</span>
                <span className="font-semibold text-base text-brand-blue">{crmFunnel.counts.deals}</span>
              </div>
              <div className="flex justify-between items-center bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-500/20">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Reservas Finales</span>
                <span className="font-semibold text-base text-emerald-700">{crmFunnel.counts.bookingsPaid}</span>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-[var(--color-text)]/40">Sin datos de CRM.</div>
          )}
        </div>
      </div>

      {/* Rendimiento por Tour / Ciudad */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-5 w-5 text-brand-blue" />
            <h2 className="font-heading text-xl text-[var(--color-text)]">Rendimiento por Tour</h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-surface-2)]">
                <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                  <th className="px-4 py-3">Tour</th>
                  <th className="px-4 py-3 text-right">Views</th>
                  <th className="px-4 py-3 text-right">Cart</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {byTour?.items.length ? byTour.items.map((r, i) => (
                  <tr key={i} className="hover:bg-[var(--color-surface-2)]/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-brand-blue line-clamp-1">{r.tour_title || r.tour_slug}</div>
                      <div className="text-[10px] text-[var(--color-text)]/40">{r.city || 'Colombia'}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text)]/70">{r.tour_views}</td>
                    <td className="px-4 py-3 text-right text-[var(--color-text)]/70">{r.checkout_started}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{r.checkout_paid}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="p-6 text-center text-[var(--color-text)]/40">Sin datos.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="h-5 w-5 text-brand-blue" />
            <h2 className="font-heading text-xl text-[var(--color-text)]">Top Ciudades</h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-surface-2)]">
                <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                  <th className="px-4 py-3">Ciudad</th>
                  <th className="px-4 py-3 text-right">Views</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {byCity?.items.length ? byCity.items.map((r, i) => (
                  <tr key={i} className="hover:bg-[var(--color-surface-2)]/50 transition">
                    <td className="px-4 py-3 font-semibold text-brand-blue">{r.city}</td>
                    <td className="px-4 py-3 text-right text-[var(--color-text)]/70">{r.tour_views}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{r.checkout_paid}</td>
                  </tr>
                )) : <tr><td colSpan={3} className="p-6 text-center text-[var(--color-text)]/40">Sin datos.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  BarChart3, TrendingUp, Filter, Target, 
  Activity, MapPin, Search, Calendar, 
  ShieldCheck, Zap, ArrowRight, Sparkles,
  RefreshCw, MousePointer2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE TELEMETRÍA ---
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
    setLoading(true); setError(null);
    try {
      const [rf, rcrm, rd, rt, rc, ru, rup, ro] = await Promise.all([
        adminFetch(`/api/admin/metrics/funnel?${query}`), 
        adminFetch(`/api/admin/metrics/crm-funnel?${query}`),
        adminFetch(`/api/admin/metrics/deals`), 
        adminFetch(`/api/admin/metrics/by-tour?${query}&limit=50`),
        adminFetch(`/api/admin/metrics/by-city?${query}&limit=50`), 
        adminFetch(`/api/admin/metrics/utm?${query}`),
        fetch(`/api/admin/metrics/utm/top?${query}&min_captures=${minCaptures}&limit=20`, { cache: 'no-store' }),
        adminFetch(`/api/admin/metrics/outbound-performance?days=30&limit=1000`),
      ]);

      const [jf, jcrm, jd, jt, jc, ju, jup, jo] = await Promise.all([ 
        rf.json(), rcrm.json(), rd.json(), rt.json(), rc.json(), ru.json(), rup.json(), ro.json() 
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

  useEffect(() => { load(); }, [load]);

  const watchouts = useMemo(() => {
    const startPerView = funnel?.rates.startPerView ?? 0;
    const paidPerStart = funnel?.rates.paidPerStart ?? 0;
    const checkoutGap = Math.max((funnel?.counts.checkoutStarted ?? 0) - (funnel?.counts.checkoutPaid ?? 0), 0);
    const weakStage = (_deals?.totals.stageCounts?.proposal ?? 0) >= (_deals?.totals.stageCounts?.checkout ?? 0) ? 'proposal' : 'checkout';
    return [
      { title: 'Checkout Gap', value: String(checkoutGap), note: 'Abordajes sin pago. Requiere presión.', color: 'text-amber-600' },
      { title: 'Retención Interest', value: pct(startPerView), note: startPerView < 0.08 ? 'Fuga alta en Tour Views.' : 'Tracción saludable.', color: 'text-brand-blue' },
      { title: 'Eficacia Cierre', value: pct(paidPerStart), note: paidPerStart < 0.35 ? 'Revisar fricción en pasarela.' : 'Conversión óptima.', color: 'text-emerald-600' },
      { title: 'Nodo Crítico', value: weakStage.toUpperCase(), note: 'Mayor volumen de deals estancados.', color: 'text-brand-blue' },
    ];
  }, [funnel, _deals]);

  const signals = useMemo(() => [
    { label: 'Conversión L2P', value: pct(funnel?.rates.paidPerView ?? 0), note: 'Lead-to-Paid global.' },
    { label: 'Tour Traffic', value: String(funnel?.counts.tourViews ?? 0), note: 'Views en ventana temporal.' },
    { label: 'Ingesta CRM', value: String(crmFunnel?.counts.leads ?? 0), note: 'Nuevos prospectos registrados.' }
  ], [funnel, crmFunnel]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA EJECUTIVA */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10 px-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <BarChart3 className="h-3.5 w-3.5" /> Intelligence Lane: /commercial-telemetry
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            Executive <span className="text-brand-blue italic font-light">Analytics</span>
          </h1>
          <p className="mt-4 text-base text-[color:var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Monitor de alto mando. Decodifica el rendimiento del catálogo, mide la eficacia de campañas 
            e identifica los cuellos de botella exactos de KCE.
          </p>
        </div>
      </header>

      <AdminOperatorWorkbench
        eyebrow="Growth Intelligence"
        title="Escala con Precisión Forense"
        description="Analiza la salud del embudo de producto versus la gestión CRM. Si la conversión global cae, el problema suele estar en el paso de 'Proposal' a 'Checkout'."
        actions={[
          { href: '/admin/catalog', label: 'Optimizar Tours', tone: 'primary' },
          { href: '/admin/marketing', label: 'Rendimiento UTM' }
        ]}
        signals={signals}
      />

      {/* 02. INSTRUMENTACIÓN DE TIEMPO (BÓVEDA) */}
      <section className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 w-full sm:w-auto">
            <div className="h-12 w-12 rounded-2xl bg-brand-blue/5 flex items-center justify-center text-brand-blue shadow-inner border border-brand-blue/10">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                 <span className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 ml-1">Origen</span>
                 <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-11 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 text-sm font-bold text-brand-blue outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all" />
              </div>
              <ArrowRight className="h-4 w-4 text-[color:var(--color-text)]/50 mt-4" />
              <div className="space-y-1">
                 <span className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 ml-1">Límite</span>
                 <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-11 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 text-sm font-bold text-brand-blue outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className={`flex items-center gap-2 px-4 py-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]`}>
                <div className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-[10px] font-mono text-[color:var(--color-text)]/50 uppercase tracking-widest">
                  {loading ? 'Calculando Nodos' : 'Telemetry: Nominal'}
                </span>
             </div>
             <Button variant="ghost" onClick={load} className="h-11 w-11 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm">
                <RefreshCw className={`h-4 w-4 text-brand-blue ${loading ? 'animate-spin' : ''}`} />
             </Button>
          </div>
        </div>
      </section>

      {error && (
        <div className="mx-2 rounded-[2rem] border border-rose-500/20 bg-rose-500/5 p-6 flex items-center gap-4 text-rose-700 animate-in zoom-in-95">
          <ShieldCheck className="h-6 w-6 opacity-40" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* 03. PRIORIDADES DE ACCIÓN */}
      <div className="rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-2xl relative overflow-hidden group">
        <header className="p-8 border-b border-[color:var(--color-border)] flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-brand-blue/5 text-brand-blue flex items-center justify-center shadow-inner">
             <Target className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-2xl text-brand-blue">Estrategia de Cierre Inmediato</h2>
        </header>
        <div className="grid gap-6 p-8 sm:grid-cols-2 lg:grid-cols-4">
          {watchouts.map((item) => (
            <div key={item.title} className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-sm transition-all hover:shadow-xl hover:border-brand-blue/10">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 mb-4">{item.title}</div>
              <div className={`text-4xl font-heading ${item.color} mb-3`}>{item.value}</div>
              <div className="text-xs text-[color:var(--color-text)]/50 leading-relaxed italic">{item.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 04. EMBUDOS COMPARATIVOS */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Producto */}
        <div className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-2xl space-y-8">
          <header className="flex items-center gap-4 border-b border-[color:var(--color-border)] pb-6">
            <BarChart3 className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-brand-blue">Embudo de Producto</h2>
          </header>
          {funnel ? (
            <div className="space-y-6">
              {[
                { l: 'Tour Views', v: funnel.counts.tourViews, r: pct(funnel.rates.startPerView), c: 'bg-[color:var(--color-surface-2)]' },
                { l: 'Checkout Intent', v: funnel.counts.checkoutStarted, r: pct(funnel.rates.paidPerStart), c: 'bg-brand-blue/5 border-brand-blue/20' },
                { l: 'Revenue Consolidado', v: funnel.counts.checkoutPaid, r: null, c: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' }
              ].map((step, i) => (
                <div key={i} className="space-y-2">
                  <div className={`flex items-center justify-between rounded-[1.5rem] border border-[color:var(--color-border)] px-6 py-5 ${step.c}`}>
                    <span className="text-sm font-bold uppercase tracking-widest opacity-60">{step.l}</span>
                    <span className="font-heading text-2xl">{step.v}</span>
                  </div>
                  {step.r && (
                    <div className="flex justify-center">
                       <div className="px-4 py-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[10px] font-bold text-brand-blue shadow-sm animate-bounce">
                         ↓ {step.r} Conversión
                       </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <div className="py-20 text-center opacity-20 italic">No signal detected.</div>}
        </div>

        {/* CRM */}
        <div className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-2xl space-y-8">
          <header className="flex items-center gap-4 border-b border-[color:var(--color-border)] pb-6">
            <Activity className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-brand-blue">Flujo de Nodo CRM</h2>
          </header>
          {crmFunnel ? (
            <div className="space-y-4">
              {[
                { l: 'Leads Capturados', v: crmFunnel.counts.leads, i: Sparkles },
                { l: 'Tickets Soporte', v: crmFunnel.counts.tickets, i: MousePointer2 },
                { l: 'Deals Abiertos', v: crmFunnel.counts.deals, i: TrendingUp, active: true },
                { l: 'Reservas Pagadas', v: crmFunnel.counts.bookingsPaid, i: Zap, success: true }
              ].map((row, i) => (
                <div key={i} className={`flex justify-between items-center px-6 py-4 rounded-2xl border transition-all hover:scale-[1.02] ${
                  row.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 
                  row.active ? 'bg-brand-blue/5 border-brand-blue/20 text-brand-blue font-bold' : 
                  'bg-[color:var(--color-surface)] border-[color:var(--color-border)]'
                }`}>
                  <div className="flex items-center gap-3">
                    <row.i className="h-4 w-4 opacity-40" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em]">{row.l}</span>
                  </div>
                  <span className="font-heading text-xl">{row.v}</span>
                </div>
              ))}
            </div>
          ) : <div className="py-20 text-center opacity-20 italic">No CRM signal.</div>}
        </div>
      </div>

      {/* 05. RENDIMIENTO GEOGRÁFICO Y POR TOUR */}
      <div className="grid gap-8 xl:grid-cols-2">
        <div className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-2xl overflow-hidden group">
          <header className="p-8 border-b border-[color:var(--color-border)] flex items-center gap-4">
             <TrendingUp className="h-5 w-5 text-brand-blue" />
             <h2 className="font-heading text-2xl text-brand-blue">Top Performance Tours</h2>
          </header>
          <div className="overflow-x-auto p-6">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead className="bg-[color:var(--color-surface-2)]">
                <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/40">
                  <th className="px-6 py-4 rounded-l-xl">Tour Entity</th>
                  <th className="px-6 py-4 text-right">Views</th>
                  <th className="px-6 py-4 text-right">Cart</th>
                  <th className="px-6 py-4 text-right rounded-r-xl">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {byTour?.items.length ? byTour.items.map((r, i) => (
                  <tr key={i} className="group/row transition-all hover:bg-brand-blue/[0.01]">
                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-brand-blue line-clamp-1 group-hover/row:text-brand-blue transition-colors">{r.tour_title || r.tour_slug}</div>
                      <div className="text-[9px] text-[color:var(--color-text)]/30 font-mono mt-1 italic flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" /> {r.city || 'Colombia'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-top font-mono text-xs opacity-60">{r.tour_views}</td>
                    <td className="px-6 py-4 text-right align-top font-mono text-xs opacity-60">{r.checkout_started}</td>
                    <td className="px-6 py-4 text-right align-top">
                      <span className="font-heading text-lg text-emerald-600 group-hover/row:scale-110 transition-transform inline-block">{r.checkout_paid}</span>
                    </td>
                  </tr>
                )) : <tr><td colSpan={4} className="px-6 py-20 text-center text-xs italic opacity-30">No tour data.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-2xl overflow-hidden group">
          <header className="p-8 border-b border-[color:var(--color-border)] flex items-center gap-4">
             <MapPin className="h-5 w-5 text-brand-blue" />
             <h2 className="font-heading text-2xl text-brand-blue">Análisis Geográfico</h2>
          </header>
          <div className="overflow-x-auto p-6">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead className="bg-[color:var(--color-surface-2)]">
                <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/40">
                  <th className="px-6 py-4 rounded-l-xl">Market Node</th>
                  <th className="px-6 py-4 text-right">Views</th>
                  <th className="px-6 py-4 text-right rounded-r-xl">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {byCity?.items.length ? byCity.items.map((r, i) => (
                  <tr key={i} className="group/row transition-all hover:bg-brand-blue/[0.01]">
                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-brand-blue uppercase tracking-tighter">{r.city}</div>
                    </td>
                    <td className="px-6 py-4 text-right align-top font-mono text-xs opacity-60">{r.tour_views}</td>
                    <td className="px-6 py-4 text-right align-top">
                      <span className="font-heading text-lg text-emerald-600">{r.checkout_paid}</span>
                    </td>
                  </tr>
                )) : <tr><td colSpan={3} className="px-6 py-20 text-center text-xs italic opacity-30">No market data.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="pt-12 flex items-center justify-center gap-12 border-t border-[color:var(--color-border)] opacity-20 hover:opacity-50 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Metrics
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Zap className="h-3.5 w-3.5" /> Real-Time Node v4.0
        </div>
      </footer>
    </div>
  );
}
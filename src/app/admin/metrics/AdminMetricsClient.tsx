'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  BarChart3, TrendingUp, Filter, Target, 
  Activity, MapPin, Search, Calendar, 
  ShieldCheck, Zap, ArrowRight, Sparkles,
  RefreshCw, MousePointer2, Terminal,
  Hash, Globe, Layout, ChevronRight,
  CreditCard, PieChart, ArrowDown,
  Database // ✅ Importado correctamente
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
      // 01. Despacho de peticiones paralelas
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

      // 02. Decodificación de Payloads (FIXED: Referenciando los objetos de respuesta 'rX')
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
      { title: 'Checkout Gap', value: String(checkoutGap), note: 'Abordajes sin pago. Requiere presión.', color: 'text-brand-yellow' },
      { title: 'Retención Interest', value: pct(startPerView), note: startPerView < 0.08 ? 'Fuga alta en Tour Views.' : 'Tracción saludable.', color: 'text-brand-blue' },
      { title: 'Eficacia Cierre', value: pct(paidPerStart), note: paidPerStart < 0.35 ? 'Revisar fricción en pasarela.' : 'Conversión óptima.', color: 'text-green-600' },
      { title: 'Nodo Crítico', value: weakStage.toUpperCase(), note: 'Mayor volumen de deals estancados.', color: 'text-brand-blue' },
    ];
  }, [funnel, _deals]);

  const signals = useMemo(() => [
    { label: 'Conversión L2P', value: pct(funnel?.rates.paidPerView ?? 0), note: 'Lead-to-Paid global.' },
    { label: 'Tour Traffic', value: String(funnel?.counts.tourViews ?? 0), note: 'Views en ventana temporal.' },
    { label: 'Ingesta CRM', value: String(crmFunnel?.counts.leads ?? 0), note: 'Nuevos prospectos registrados.' }
  ], [funnel, crmFunnel]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA EJECUTIVA */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <BarChart3 className="h-4 w-4" /> Intelligence Lane: /commercial-telemetry
          </div>
          <h1 className="font-heading text-4xl md:text-6xl text-main tracking-tighter leading-none">
            Executive <span className="text-brand-blue italic font-light">Analytics</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2">
            Monitor de alto mando para Knowing Cultures S.A.S. Decodifica el rendimiento del catálogo, mide la eficacia de campañas e identifica los cuellos de botella del revenue.
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
          { href: '/admin/marketing', label: 'Rendimiento UTM' }
        ]}
        signals={signals}
      />

      {/* 03. INSTRUMENTACIÓN DE TIEMPO (LA BÓVEDA) */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-pop relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="h-14 w-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner border border-brand-blue/5 shrink-0">
            <Calendar className="h-7 w-7" />
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <div className="space-y-2">
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-60 ml-1">Observación Inicial</span>
               <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-12 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 px-4 text-sm font-bold text-brand-blue outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner" />
            </div>
            <div className="pt-6 hidden sm:block">
               <ArrowRight className="h-5 w-5 text-muted opacity-20" />
            </div>
            <div className="space-y-2">
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-60 ml-1">Cierre de Ventana</span>
               <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-12 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 px-4 text-sm font-bold text-brand-blue outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-surface-2 border border-brand-dark/5">
           <div className={`h-2 w-2 rounded-full ${loading ? 'bg-brand-yellow animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
           <span className="text-[10px] font-mono text-muted uppercase tracking-[0.2em]">
             {loading ? 'Calculando Nodos...' : 'Telemetry: Nominal'}
           </span>
           <div className="w-px h-4 bg-brand-dark/10 mx-2" />
           <button onClick={() => void load()} className="text-brand-blue hover:scale-110 transition-transform">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </section>

      {error && (
        <div className="mx-2 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/10 p-6 flex items-center gap-4 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2 shadow-sm font-bold">
          <ShieldCheck className="h-6 w-6 opacity-60" /> Protocolo de Error: <span className="font-light">{error}</span>
        </div>
      )}

      {/* 04. HUD DE ESTRATEGIA (WATCHOUTS) */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-2 shadow-pop relative overflow-hidden group">
        <header className="p-8 border-b border-brand-dark/5 dark:border-white/5 flex items-center gap-4 bg-surface-2/30">
          <div className="h-10 w-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shadow-inner">
             <Target className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-2xl text-main tracking-tight uppercase">Estrategia de Cierre Inmediato</h2>
        </header>
        <div className="grid gap-6 p-8 sm:grid-cols-2 lg:grid-cols-4 bg-surface-2/10">
          {watchouts.map((item) => (
            <div key={item.title} className="rounded-[2.2rem] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-soft transition-all hover:shadow-pop hover:-translate-y-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50 mb-6">{item.title}</div>
              <div className={`text-5xl font-heading tracking-tighter ${item.color} mb-3`}>{item.value}</div>
              <div className="text-[13px] text-muted font-light leading-relaxed italic opacity-80 border-l-2 border-brand-blue/10 pl-4">{item.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 05. EMBUDOS DE ALTA RESOLUCIÓN */}
      <div className="grid gap-8 lg:grid-cols-2">
        
        {/* Producto Funnel */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 shadow-pop space-y-10 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 opacity-[0.02] pointer-events-none">
             <PieChart className="h-48 w-48 text-brand-blue" />
          </div>
          <header className="flex items-center gap-4 border-b border-brand-dark/5 dark:border-white/5 pb-8 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
               <Globe className="h-6 w-6" />
            </div>
            <div>
               <h2 className="font-heading text-3xl text-main tracking-tight">Embudo de Producto</h2>
               <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">Front-End Digital Traffic</p>
            </div>
          </header>
          
          {funnel ? (
            <div className="space-y-8 relative z-10">
              {[
                { l: 'Tour Explorations', v: funnel.counts.tourViews, r: pct(funnel.rates.startPerView), c: 'bg-surface-2 border-brand-dark/5', ic: Target },
                { l: 'Checkout Intent', v: funnel.counts.checkoutStarted, r: pct(funnel.rates.paidPerStart), c: 'bg-brand-blue/5 border-brand-blue/20 text-brand-blue', ic: CreditCard },
                { l: 'Revenue Consolidado', v: funnel.counts.checkoutPaid, r: null, c: 'bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-400', ic: Zap }
              ].map((step, i) => (
                <div key={i} className="group">
                  <div className={`flex items-center justify-between rounded-[2rem] border px-8 py-6 shadow-sm transition-all group-hover:shadow-soft ${step.c}`}>
                    <div className="flex items-center gap-4">
                       <step.ic className="h-5 w-5 opacity-40" />
                       <span className="text-xs font-bold uppercase tracking-[0.2em]">{step.l}</span>
                    </div>
                    <span className="font-heading text-3xl tracking-tighter">{step.v}</span>
                  </div>
                  {step.r && (
                    <div className="flex flex-col items-center py-2">
                       <div className="h-8 w-px bg-gradient-to-b from-brand-blue/30 to-transparent" />
                       <div className="px-5 py-1.5 rounded-full border border-brand-blue/10 bg-surface-2 text-[10px] font-bold text-brand-blue shadow-sm ring-4 ring-brand-blue/5 flex items-center gap-2">
                         <ArrowDown className="h-3 w-3 animate-bounce" /> {step.r} Conversión
                       </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <div className="py-24 text-center opacity-20 italic">Awaiting technical signal...</div>}
        </section>

        {/* CRM Funnel */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 shadow-pop space-y-10 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 opacity-[0.02] pointer-events-none">
             <Activity className="h-48 w-48 text-brand-blue" />
          </div>
          <header className="flex items-center gap-4 border-b border-brand-dark/5 dark:border-white/5 pb-8 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
               <Database className="h-6 w-6" />
            </div>
            <div>
               <h2 className="font-heading text-3xl text-main tracking-tight">Flujo de Nodo CRM</h2>
               <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">Back-Office Operational Flow</p>
            </div>
          </header>
          
          {crmFunnel ? (
            <div className="space-y-4 relative z-10">
              {[
                { l: 'Leads Capturados', v: crmFunnel.counts.leads, i: Sparkles, color: 'text-brand-yellow' },
                { l: 'Tickets de Soporte', v: crmFunnel.counts.tickets, i: MousePointer2, color: 'text-muted' },
                { l: 'Deals en Negociación', v: crmFunnel.counts.deals, i: TrendingUp, active: true, color: 'text-brand-blue' },
                { l: 'Reservas Liquidadas', v: crmFunnel.counts.bookingsPaid, i: Zap, success: true, color: 'text-green-600' }
              ].map((row, i) => (
                <div key={i} className={`flex justify-between items-center px-8 py-5 rounded-[2rem] border transition-all hover:scale-[1.02] shadow-sm ${
                  row.success ? 'bg-green-500/5 border-green-500/20' : 
                  row.active ? 'bg-brand-blue/5 border-brand-blue/20 shadow-soft' : 
                  'bg-surface-2/50 border-brand-dark/5 dark:border-white/5'
                }`}>
                  <div className="flex items-center gap-4">
                    <row.i className={`h-5 w-5 ${row.color} opacity-60`} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-main">{row.l}</span>
                  </div>
                  <span className={`font-heading text-2xl tracking-tighter ${row.color}`}>{row.v}</span>
                </div>
              ))}
            </div>
          ) : <div className="py-24 text-center opacity-20 italic">CRM Node Offline.</div>}
        </section>
      </div>

      {/* 06. TABLAS DE RENDIMIENTO (BÓVEDAS) */}
      <div className="grid gap-8 xl:grid-cols-2">
        
        {/* Top Tours */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden flex flex-col">
          <header className="p-8 border-b border-brand-dark/5 dark:border-white/5 flex items-center justify-between bg-surface-2/30">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner">
                  <Layout className="h-5 w-5" />
               </div>
               <h2 className="font-heading text-2xl text-main tracking-tight uppercase">Top Performance Tours</h2>
            </div>
          </header>
          <div className="overflow-x-auto p-4 custom-scrollbar">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2 px-4">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">
                  <th className="px-6 py-4">Tour Entity</th>
                  <th className="px-6 py-4 text-right">Views</th>
                  <th className="px-6 py-4 text-right">Cart</th>
                  <th className="px-6 py-4 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {byTour?.items.length ? byTour.items.map((r, i) => (
                  <tr key={i} className="group hover:bg-brand-blue/5 transition-colors">
                    <td className="px-6 py-5 rounded-l-2xl border-l border-y border-brand-dark/5 dark:border-white/5 bg-surface">
                      <div className="font-bold text-main line-clamp-1 group-hover:text-brand-blue transition-colors tracking-tight">{r.tour_title || r.tour_slug}</div>
                      <div className="text-[9px] text-muted font-mono mt-1 flex items-center gap-2 uppercase tracking-widest opacity-60">
                        <MapPin className="h-3 w-3 text-brand-blue" /> {r.city || 'COLOMBIA_NODE'}
                      </div>
                    </td>
                    <td className="px-6 py-5 border-y border-brand-dark/5 dark:border-white/5 bg-surface text-right font-mono text-xs text-muted">{r.tour_views}</td>
                    <td className="px-6 py-5 border-y border-brand-dark/5 dark:border-white/5 bg-surface text-right font-mono text-xs text-muted">{r.checkout_started}</td>
                    <td className="px-6 py-5 rounded-r-2xl border-r border-y border-brand-dark/5 dark:border-white/5 bg-surface text-right">
                      <span className="font-heading text-xl text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform inline-block">{r.checkout_paid}</span>
                    </td>
                  </tr>
                )) : <tr><td colSpan={4} className="px-6 py-32 text-center text-sm italic text-muted opacity-40">No technical data available.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {/* Market nodes */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden flex flex-col">
          <header className="p-8 border-b border-brand-dark/5 dark:border-white/5 flex items-center justify-between bg-surface-2/30">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner">
                  <MapPin className="h-5 w-5" />
               </div>
               <h2 className="font-heading text-2xl text-main tracking-tight uppercase">Análisis Geográfico</h2>
            </div>
          </header>
          <div className="overflow-x-auto p-4 custom-scrollbar">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2 px-4">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">
                  <th className="px-6 py-4">Market Node</th>
                  <th className="px-6 py-4 text-right">Traffic</th>
                  <th className="px-6 py-4 text-right">Liquidity</th>
                </tr>
              </thead>
              <tbody>
                {byCity?.items.length ? byCity.items.map((r, i) => (
                  <tr key={i} className="group hover:bg-brand-blue/5 transition-colors">
                    <td className="px-6 py-5 rounded-l-2xl border-l border-y border-brand-dark/5 dark:border-white/5 bg-surface">
                      <div className="font-bold text-main uppercase tracking-tighter flex items-center gap-3">
                         <Globe className="h-4 w-4 text-brand-blue opacity-30" />
                         {r.city}
                      </div>
                    </td>
                    <td className="px-6 py-5 border-y border-brand-dark/5 dark:border-white/5 bg-surface text-right font-mono text-xs text-muted">{r.tour_views}</td>
                    <td className="px-6 py-5 rounded-r-2xl border-r border-y border-brand-dark/5 dark:border-white/5 bg-surface text-right">
                      <span className="font-heading text-xl text-green-600 dark:text-green-400">{r.checkout_paid}</span>
                    </td>
                  </tr>
                )) : <tr><td colSpan={3} className="px-6 py-32 text-center text-sm italic text-muted opacity-40">Waiting for market signals...</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Confidence Telemetry
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Terminal className="h-4 w-4 opacity-50" /> Metric Node v4.0
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Zap className="h-4 w-4" /> Live Signal: Active
        </div>
      </footer>

    </div>
  );
}
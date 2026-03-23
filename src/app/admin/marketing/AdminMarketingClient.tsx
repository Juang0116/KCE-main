'use client';

import * as React from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  TrendingUp, MousePointerClick, Target, BarChart2, 
  Megaphone, Link as LinkIcon, Sparkles, Filter, 
  RefreshCw, Zap, ShieldCheck, Activity,
  AlertCircle, Terminal, Globe, Hash, Layout,
  ChevronRight, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TIPADO DEL NODO DE MÉTRICAS ---
type MarketingMetrics = {
  ok: boolean;
  requestId?: string;
  windowDays: number;
  sinceISO: string;
  counts: Record<string, number>;
  rates: Record<string, number>;
  error?: string;
};

type UtmTop = {
  ok: boolean;
  items: Array<{ source: string; medium: string; campaign: string; count: number }>;
};

type CtaPerf = {
  ok: boolean;
  items: Array<{ cta: string; clicks: number; leads: number; paid: number }>;
};

// --- HELPERS ---
function fmtPct(n: number) {
  if (!Number.isFinite(n)) return '0%';
  return `${(n * 100).toFixed(1)}%`;
}

export function AdminMarketingClient() {
  const [days, setDays] = React.useState(30);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  
  // Estado de Datos
  const [m, setM] = React.useState<MarketingMetrics | null>(null);
  const [utm, setUtm] = React.useState<UtmTop | null>(null);
  const [cta, setCta] = React.useState<CtaPerf | null>(null);

  const reqIdRef = React.useRef(0);

  const load = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    const myReqId = ++reqIdRef.current;

    try {
      // Petición paralela para máxima velocidad de respuesta
      const [mm, ut, ct] = await Promise.all([
        adminFetch(`/api/admin/metrics/marketing?days=${days}`),
        adminFetch(`/api/admin/metrics/utm/top?days=${days}&limit=20`),
        adminFetch(`/api/admin/metrics/cta-performance?days=${days}&limit=20`),
      ]);

      const mj = (await mm.json().catch(() => ({}))) as MarketingMetrics;
      const uj = (await ut.json().catch(() => ({}))) as UtmTop;
      const cj = (await ct.json().catch(() => ({}))) as CtaPerf;

      if (myReqId !== reqIdRef.current) return;

      if (!mm.ok || !mj?.ok) {
        throw new Error(mj?.error || 'Falla en el nodo de métricas de adquisición');
      }
      
      setM(mj);
      setUtm(uj?.ok ? uj : null);
      setCta(cj?.ok ? cj : null);
    } catch (e: unknown) {
      if (myReqId !== reqIdRef.current) return;
      setErr(e instanceof Error ? e.message : 'Error interno de telemetría.');
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  }, [days]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Derivación de señales tácticas
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
      label: 'Atribución UTM',
      value: String(utmCount),
      note: utmCount > 0 ? `Canal líder: ${topCampaign?.source || 'Orgánico'}.` : 'Sin tráfico atribuido.',
    },
    {
      label: 'Ganador CTA',
      value: topCta?.cta || 'N/A',
      note: topCta ? `${topCta.clicks} clics hacia conversion.` : 'Datos insuficientes.',
    },
    {
      label: 'Fuerza Funnel',
      value: fmtPct(paidRate),
      note: paidRate < 0.02 ? 'Revisar fricción técnica.' : 'Conversión óptima.',
    },
  ], [paidRate, topCampaign?.source, topCta, utmCount]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Megaphone className="h-4 w-4" /> Growth Intelligence Lane
          </div>
          <h1 className="font-heading text-4xl md:text-6xl text-main tracking-tighter leading-none">
            Marketing <span className="text-brand-yellow italic font-light">& Atribución</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2">
            Monitor de rendimiento táctico para Knowing Cultures S.A.S. Identifica qué canales inyectan valor real y optimiza la inversión basándote en la verdad del revenue.
          </p>
        </div>
      </header>

      {/* 02. WORKBENCH OPERATIVO */}
      <AdminOperatorWorkbench
        eyebrow="Market Performance"
        title="Escala con Evidencia"
        description="Analiza la correlación entre campañas y pagos finalizados. Si un canal tiene volumen pero baja conversión, ajusta el 'Hook' creativo en el CMS."
        actions={[
          { href: '/admin/metrics', label: 'Telemetría Global', tone: 'primary' },
          { href: '/admin/content', label: 'Editar Experiencias' }
        ]}
        signals={marketingSignals}
      />

      {/* 03. INSTRUMENTACIÓN DE VENTANA TEMPORAL */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-pop relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner border border-brand-blue/5">
            <Calendar className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">Horizonte de Análisis</span>
            <div className="relative group">
              <Filter className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40 group-focus-within:opacity-100 transition-opacity" />
              <select
                className="pl-8 pr-10 py-1 text-base font-bold text-main bg-transparent outline-none appearance-none cursor-pointer border-b border-dashed border-brand-dark/10 hover:border-brand-blue transition-all"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                <option value={7}>Ciclo: Últimos 7 días</option>
                <option value={30}>Ciclo: Últimos 30 días</option>
                <option value={90}>Ciclo: Últimos 90 días</option>
              </select>
              <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-muted opacity-30 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-surface-2 border border-brand-dark/5">
           <div className={`h-2 w-2 rounded-full ${loading ? 'bg-brand-yellow animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
           <span className="text-[10px] font-mono text-muted uppercase tracking-[0.2em]">
             {loading ? 'Sincronizando Nodo...' : 'Data Sync: Nominal'}
           </span>
           <div className="w-px h-4 bg-brand-dark/10 mx-2" />
           <button onClick={() => void load()} className="text-brand-blue hover:scale-110 transition-transform">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </section>

      {err && (
        <div className="rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/10 p-6 text-sm text-red-700 dark:text-red-400 animate-in slide-in-from-top-2 flex items-center gap-4 shadow-sm font-bold">
          <AlertCircle className="h-6 w-6 opacity-60" /> Protocolo de Error: <span className="font-light">{err}</span>
        </div>
      )}

      {/* 04. MÉTRICAS DE FUNNEL (WIDGETS PREMIUM) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: 'Adquisición UTM', v: utmCount, s: 'Impactos Únicos', c: 'text-brand-blue', i: Megaphone, bg: 'bg-brand-blue/5' },
          { l: 'Exploración Tour', v: tourViews, s: 'Intención Activa', c: 'text-main', i: Target, bg: 'bg-brand-dark/5' },
          { l: 'Conversión Lead', v: quizCompleted, s: `Rate: ${fmtPct(leadRate)}`, c: 'text-brand-yellow', i: Sparkles, bg: 'bg-brand-yellow/5' },
          { l: 'Ventas Liquidadas', v: paid, s: `Funnel: ${fmtPct(paidRate)}`, c: 'text-green-600', i: Zap, bg: 'bg-green-500/5' },
        ].map((stat, i) => (
          <div key={i} className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-soft transition-all hover:shadow-pop hover:-translate-y-1">
            <header className="flex items-center justify-between mb-8">
               <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">{stat.l}</div>
               <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.i className={`h-5 w-5 ${stat.c} opacity-40 group-hover:opacity-100 transition-opacity`} />
               </div>
            </header>
            <div className={`text-5xl font-heading tracking-tighter ${stat.c} mb-3`}>{stat.v}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-40 flex items-center gap-2">
               <TrendingUp className="h-3 w-3" /> {stat.s}
            </div>
          </div>
        ))}
      </div>

      {/* 05. TABLAS DE RENDIMIENTO (LA BÓVEDA) */}
      <div className="grid gap-8 lg:grid-cols-2">
        
        {/* Tabla UTM */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden flex flex-col">
          <header className="p-8 border-b border-brand-dark/5 dark:border-white/5 flex items-center justify-between bg-surface-2/30">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                  <Globe className="h-5 w-5" />
               </div>
               <h2 className="font-heading text-2xl text-main tracking-tight uppercase">Atribución de Tráfico</h2>
            </div>
            <div className="px-3 py-1 rounded-full bg-brand-blue/5 border border-brand-blue/10 text-[9px] font-bold text-brand-blue uppercase tracking-widest">UTM Tracking</div>
          </header>
          <div className="overflow-x-auto p-4 custom-scrollbar">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2 px-4">
              <thead className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">
                <tr>
                  <th className="px-6 py-4">Source / Medium</th>
                  <th className="px-6 py-4">Campaña</th>
                  <th className="px-6 py-4 text-right">Volumen</th>
                </tr>
              </thead>
              <tbody>
                {utm?.items && utm.items.length > 0 ? (
                  utm.items.slice(0, 10).map((it, idx) => (
                    <tr key={idx} className="group hover:bg-brand-blue/5 transition-colors">
                      <td className="px-6 py-5 rounded-l-2xl border-l border-y border-brand-dark/5 dark:border-white/5 bg-surface">
                        <div className="font-bold text-main uppercase tracking-tight">{it.source || 'DIRECT'}</div>
                        <div className="text-[9px] text-muted font-mono mt-1">{it.medium || 'NONE'}</div>
                      </td>
                      <td className="px-6 py-5 border-y border-brand-dark/5 dark:border-white/5 bg-surface">
                         <div className="font-mono text-[11px] text-brand-blue opacity-70">
                            <Hash className="h-3 w-3 inline mr-1 opacity-30" />
                            {it.campaign || '—'}
                         </div>
                      </td>
                      <td className="px-6 py-5 text-right rounded-r-2xl border-r border-y border-brand-dark/5 dark:border-white/5 bg-surface font-heading text-xl text-main">
                        {it.count}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="px-6 py-32 text-center text-sm italic text-muted opacity-40 bg-surface rounded-2xl border border-dashed border-brand-dark/10">No se han detectado trazas de campañas en este nodo.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tabla CTAs */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden flex flex-col">
          <header className="p-8 border-b border-brand-dark/5 dark:border-white/5 flex items-center justify-between bg-surface-2/30">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                  <MousePointerClick className="h-5 w-5" />
               </div>
               <h2 className="font-heading text-2xl text-main tracking-tight uppercase">Eficacia de CTAs</h2>
            </div>
            <div className="px-3 py-1 rounded-full bg-green-500/5 border border-green-500/10 text-[9px] font-bold text-green-600 uppercase tracking-widest">Engagement Rate</div>
          </header>
          <div className="overflow-x-auto p-4 custom-scrollbar">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2 px-4">
              <thead className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">
                <tr>
                  <th className="px-6 py-4">Trigger (Botón)</th>
                  <th className="px-6 py-4 text-right">Clics</th>
                  <th className="px-6 py-4 text-right">Leads</th>
                  <th className="px-6 py-4 text-right">Sales</th>
                </tr>
              </thead>
              <tbody>
                {cta?.items && cta.items.length > 0 ? (
                  cta.items.slice(0, 10).map((it, idx) => (
                    <tr key={idx} className="group hover:bg-green-500/5 transition-colors">
                      <td className="px-6 py-5 rounded-l-2xl border-l border-y border-brand-dark/5 dark:border-white/5 bg-surface font-bold text-main flex items-center gap-3">
                        <LinkIcon className="h-4 w-4 text-muted opacity-30" /> {it.cta}
                      </td>
                      <td className="px-6 py-5 border-y border-brand-dark/5 dark:border-white/5 bg-surface text-right font-mono text-[11px] text-muted">
                        {it.clicks}
                      </td>
                      <td className="px-6 py-5 border-y border-brand-dark/5 dark:border-white/5 bg-surface text-right font-bold text-brand-yellow">
                        {it.leads}
                      </td>
                      <td className="px-6 py-5 rounded-r-2xl border-r border-y border-brand-dark/5 dark:border-white/5 bg-surface text-right font-heading text-xl text-green-600">
                        {it.paid}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="px-6 py-32 text-center text-sm italic text-muted opacity-40 bg-surface rounded-2xl border border-dashed border-brand-dark/10">Esperando señales de interacción de usuario...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* FOOTER DE INTEGRIDAD CORPORATIVA */}
      <footer className="pt-16 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 opacity-40 hover:opacity-100 duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Confidence Attribution Active
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Terminal className="h-4 w-4" /> Growth Intelligence Node v4.1
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Activity className="h-4 w-4 text-brand-yellow" /> Live Market Signal Validated
        </div>
      </footer>

    </div>
  );
}
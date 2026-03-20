'use client';

import * as React from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  TrendingUp, MousePointerClick, Target, BarChart2, 
  Megaphone, Link as LinkIcon, Sparkles, Filter, 
  RefreshCw, Zap, ShieldCheck, Activity,
  AlertCircle // ✅ Importación restaurada
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
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  
  // Estado de Datos
  const [m, setM] = React.useState<MarketingMetrics | null>(null);
  const [utm, setUtm] = React.useState<UtmTop | null>(null);
  const [cta, setCta] = React.useState<CtaPerf | null>(null);

  // UX Pro: Control de Race Conditions
  const reqIdRef = React.useRef(0);

  const load = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    const myReqId = ++reqIdRef.current;

    try {
      // Petición paralela para máxima velocidad
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
        throw new Error(mj?.error || 'Falla en el nodo de métricas');
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

  // Derivación de señales
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
      note: utmCount > 0 ? `Liderado por ${topCampaign?.source || 'fuentes orgánicas'}.` : 'Sin tráfico atribuido.',
    },
    {
      label: 'Ganador CTA',
      value: topCta?.cta || 'N/A',
      note: topCta ? `${topCta.clicks} clics -> ${topCta.paid} ventas.` : 'Datos insuficientes.',
    },
    {
      label: 'Fuerza del Funnel',
      value: fmtPct(paidRate),
      note: paidRate < 0.02 ? 'Revisar fricción en checkout.' : 'Conversión de alto impacto.',
    },
  ], [paidRate, topCampaign?.source, topCta, utmCount]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10 px-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Megaphone className="h-3.5 w-3.5" /> Acquisition Lane: /marketing-metrics
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            Marketing <span className="text-brand-yellow italic font-light">& Atribución</span>
          </h1>
          <p className="mt-4 text-base text-[color:var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Monitor de rendimiento táctico. Identifica qué canales inyectan valor real y optimiza la inversión basándote en la verdad del revenue.
          </p>
        </div>
      </header>

      <AdminOperatorWorkbench
        eyebrow="Market Performance"
        title="Escala con Datos"
        description="Analiza la correlación entre campañas y pagos. Si un canal tiene tráfico pero no genera leads, ajusta el 'Hook' de marketing."
        actions={[
          { href: '/admin/metrics', label: 'Telemetría Global', tone: 'primary' },
          { href: '/admin/content', label: 'Gestionar CMS' }
        ]}
        signals={marketingSignals}
      />

      {/* 02. CONTROL DE VENTANA TEMPORAL */}
      <section className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-brand-blue/5 flex items-center justify-center text-brand-blue shadow-inner border border-brand-blue/10">
              <BarChart2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue/50">Ventana de Observación</span>
              <div className="relative group">
                <Filter className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                <select
                  className="pl-7 pr-4 py-1 text-sm font-bold text-brand-blue bg-transparent outline-none appearance-none cursor-pointer border-b border-dashed border-brand-blue/20 hover:border-brand-blue transition-all"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                >
                  <option value={7}>Últimos 7 días</option>
                  <option value={30}>Últimos 30 días</option>
                  <option value={90}>Últimos 90 días</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
             <span className="text-[10px] font-mono text-[color:var(--color-text)]/40 uppercase tracking-widest">
               {loading ? 'Sincronizando Nodo...' : 'Data Sync: Nominal'}
             </span>
             <Button variant="ghost" onClick={() => void load()} className="h-9 w-9 p-0 rounded-xl">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
             </Button>
          </div>
        </div>
      </section>

      {err && (
        <div className="rounded-[2rem] border border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-700 animate-in zoom-in-95 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 opacity-40" /> {err}
        </div>
      )}

      {/* 03. MÉTRICAS DE FUNNEL */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: 'Atribución UTM', v: utmCount, s: 'Impactos', c: 'text-brand-blue', i: Megaphone },
          { l: 'Vistas de Tour', v: tourViews, s: 'Engagement', c: 'text-[color:var(--color-text)]', i: Target },
          { l: 'Quiz Leads', v: quizCompleted, s: `Conv: ${fmtPct(leadRate)}`, c: 'text-amber-600', i: Sparkles },
          { l: 'Paid Checkout', v: paid, s: `Total: ${fmtPct(paidRate)}`, c: 'text-emerald-600', i: Zap },
        ].map((stat, i) => (
          <div key={i} className="group rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-sm transition-all hover:shadow-xl hover:border-brand-blue/10">
            <header className="flex items-center justify-between mb-6">
               <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30">{stat.l}</div>
               <stat.i className={`h-4 w-4 ${stat.c} opacity-30 group-hover:opacity-100 transition-opacity`} />
            </header>
            <div className={`text-4xl font-heading ${stat.c} mb-2`}>{stat.v}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40">{stat.s}</div>
          </div>
        ))}
      </div>

      {/* 04. TABLAS DE RENDIMIENTO */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-2xl overflow-hidden group">
          <header className="p-8 border-b border-[color:var(--color-border)] flex items-center gap-4">
            <TrendingUp className="h-5 w-5 text-brand-blue" />
            <h2 className="font-heading text-2xl text-brand-blue">Tráfico Atribuido</h2>
          </header>
          <div className="overflow-x-auto p-6">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead className="bg-[color:var(--color-surface-2)]">
                <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/40">
                  <th className="px-6 py-4 rounded-l-xl uppercase">Source / Medium</th>
                  <th className="px-6 py-4 uppercase">Campaña</th>
                  <th className="px-6 py-4 text-right rounded-r-xl uppercase">Impactos</th>
                </tr>
              </thead>
              <tbody>
                {utm?.items && utm.items.length > 0 ? (
                  utm.items.slice(0, 10).map((it, idx) => (
                    <tr key={idx} className="group/row hover:bg-brand-blue/[0.01]">
                      <td className="px-6 py-4">
                        <div className="font-bold text-brand-blue uppercase">{it.source || 'Directo'}</div>
                        <div className="text-[9px] text-[color:var(--color-text)]/30 font-mono italic">{it.medium || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-[color:var(--color-text)]/60">{it.campaign || '—'}</td>
                      <td className="px-6 py-4 text-right font-heading text-lg">{it.count}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="px-6 py-20 text-center text-xs italic opacity-30">Sin datos de campañas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-2xl overflow-hidden group">
          <header className="p-8 border-b border-[color:var(--color-border)] flex items-center gap-4">
            <MousePointerClick className="h-5 w-5 text-emerald-600" />
            <h2 className="font-heading text-2xl text-emerald-600">Eficacia de CTAs</h2>
          </header>
          <div className="overflow-x-auto p-6">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead className="bg-[color:var(--color-surface-2)]">
                <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/40">
                  <th className="px-6 py-4 rounded-l-xl uppercase">Botón</th>
                  <th className="px-6 py-4 text-right uppercase">Clics</th>
                  <th className="px-6 py-4 text-right uppercase">Leads</th>
                  <th className="px-8 py-4 text-right rounded-r-xl uppercase">Pagos</th>
                </tr>
              </thead>
              <tbody>
                {cta?.items && cta.items.length > 0 ? (
                  cta.items.slice(0, 10).map((it, idx) => (
                    <tr key={idx} className="group/row hover:bg-emerald-500/[0.01]">
                      <td className="px-6 py-4 font-bold text-[color:var(--color-text)] flex items-center gap-2">
                        <LinkIcon className="h-3 w-3 opacity-30" /> {it.cta}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs opacity-60">{it.clicks}</td>
                      <td className="px-6 py-4 text-right font-bold text-amber-600">{it.leads}</td>
                      <td className="px-8 py-4 text-right font-heading text-lg text-emerald-600">{it.paid}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="px-6 py-20 text-center text-xs italic opacity-30">Sin actividad.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="pt-12 flex flex-wrap items-center justify-center gap-12 border-t border-[color:var(--color-border)] opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Attribution
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Activity className="h-3.5 w-3.5" /> Growth Node v3.0
        </div>
      </footer>
    </div>
  );
}
'use client';

import * as React from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import {
  TrendingUp,
  MousePointerClick,
  Target,
  BarChart2,
  Megaphone,
  Link as LinkIcon,
  Sparkles,
  Filter,
  RefreshCw,
  Zap,
  ShieldCheck,
  Activity,
  AlertCircle,
  Terminal,
  Globe,
  Hash,
  Layout,
  ChevronRight,
  Calendar,
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

  const marketingSignals = React.useMemo(
    () => [
      {
        label: 'Atribución UTM',
        value: String(utmCount),
        note:
          utmCount > 0
            ? `Canal líder: ${topCampaign?.source || 'Orgánico'}.`
            : 'Sin tráfico atribuido.',
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
    ],
    [paidRate, topCampaign?.source, topCta, utmCount],
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-32 duration-1000">
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Megaphone className="h-4 w-4" /> Growth Intelligence Lane
          </div>
          <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-6xl">
            Marketing <span className="font-light italic text-brand-yellow">& Atribución</span>
          </h1>
          <p className="mt-2 max-w-2xl text-base font-light leading-relaxed text-muted">
            Monitor de rendimiento táctico para Knowing Cultures S.A.S. Identifica qué canales
            inyectan valor real y optimiza la inversión basándote en la verdad del revenue.
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
          { href: '/admin/content', label: 'Editar Experiencias' },
        ]}
        signals={marketingSignals}
      />

      {/* 03. INSTRUMENTACIÓN DE VENTANA TEMPORAL */}
      <section className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5 md:flex-row">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-blue/5 bg-brand-blue/10 text-brand-blue shadow-inner">
            <Calendar className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
              Horizonte de Análisis
            </span>
            <div className="group relative">
              <Filter className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue opacity-40 transition-opacity group-focus-within:opacity-100" />
              <select
                className="cursor-pointer appearance-none border-b border-dashed border-brand-dark/10 bg-transparent py-1 pl-8 pr-10 text-base font-bold text-main outline-none transition-all hover:border-brand-blue"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                <option value={7}>Ciclo: Últimos 7 días</option>
                <option value={30}>Ciclo: Últimos 30 días</option>
                <option value={90}>Ciclo: Últimos 90 días</option>
              </select>
              <ChevronRight className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted opacity-30" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-full border border-brand-dark/5 bg-surface-2 px-6 py-3">
          <div
            className={`h-2 w-2 rounded-full ${loading ? 'animate-pulse bg-brand-yellow shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            {loading ? 'Sincronizando Nodo...' : 'Data Sync: Nominal'}
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

      {err && (
        <div className="animate-in slide-in-from-top-2 flex items-center gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-6 text-sm font-bold text-red-700 shadow-sm dark:bg-red-950/10 dark:text-red-400">
          <AlertCircle className="h-6 w-6 opacity-60" /> Protocolo de Error:{' '}
          <span className="font-light">{err}</span>
        </div>
      )}

      {/* 04. MÉTRICAS DE FUNNEL (WIDGETS PREMIUM) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            l: 'Adquisición UTM',
            v: utmCount,
            s: 'Impactos Únicos',
            c: 'text-brand-blue',
            i: Megaphone,
            bg: 'bg-brand-blue/5',
          },
          {
            l: 'Exploración Tour',
            v: tourViews,
            s: 'Intención Activa',
            c: 'text-main',
            i: Target,
            bg: 'bg-brand-dark/5',
          },
          {
            l: 'Conversión Lead',
            v: quizCompleted,
            s: `Rate: ${fmtPct(leadRate)}`,
            c: 'text-brand-yellow',
            i: Sparkles,
            bg: 'bg-brand-yellow/5',
          },
          {
            l: 'Ventas Liquidadas',
            v: paid,
            s: `Funnel: ${fmtPct(paidRate)}`,
            c: 'text-green-600',
            i: Zap,
            bg: 'bg-green-500/5',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-soft transition-all hover:-translate-y-1 hover:shadow-pop dark:border-white/5"
          >
            <header className="mb-8 flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">
                {stat.l}
              </div>
              <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.i
                  className={`h-5 w-5 ${stat.c} opacity-40 transition-opacity group-hover:opacity-100`}
                />
              </div>
            </header>
            <div className={`font-heading text-5xl tracking-tighter ${stat.c} mb-3`}>{stat.v}</div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted opacity-40">
              <TrendingUp className="h-3 w-3" /> {stat.s}
            </div>
          </div>
        ))}
      </div>

      {/* 05. TABLAS DE RENDIMIENTO (LA BÓVEDA) */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Tabla UTM */}
        <section className="flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
          <header className="bg-surface-2/30 flex items-center justify-between border-b border-brand-dark/5 p-8 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                <Globe className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-main">
                Atribución de Tráfico
              </h2>
            </div>
            <div className="rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-brand-blue">
              UTM Tracking
            </div>
          </header>
          <div className="custom-scrollbar overflow-x-auto p-4">
            <table className="w-full border-separate border-spacing-y-2 px-4 text-left text-sm">
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
                    <tr
                      key={idx}
                      className="group transition-colors hover:bg-brand-blue/5"
                    >
                      <td className="rounded-l-2xl border-y border-l border-brand-dark/5 bg-surface px-6 py-5 dark:border-white/5">
                        <div className="font-bold uppercase tracking-tight text-main">
                          {it.source || 'DIRECT'}
                        </div>
                        <div className="mt-1 font-mono text-[9px] text-muted">
                          {it.medium || 'NONE'}
                        </div>
                      </td>
                      <td className="border-y border-brand-dark/5 bg-surface px-6 py-5 dark:border-white/5">
                        <div className="font-mono text-[11px] text-brand-blue opacity-70">
                          <Hash className="mr-1 inline h-3 w-3 opacity-30" />
                          {it.campaign || '—'}
                        </div>
                      </td>
                      <td className="rounded-r-2xl border-y border-r border-brand-dark/5 bg-surface px-6 py-5 text-right font-heading text-xl text-main dark:border-white/5">
                        {it.count}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="rounded-2xl border border-dashed border-brand-dark/10 bg-surface px-6 py-32 text-center text-sm italic text-muted opacity-40"
                    >
                      No se han detectado trazas de campañas en este nodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tabla CTAs */}
        <section className="flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
          <header className="bg-surface-2/30 flex items-center justify-between border-b border-brand-dark/5 p-8 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                <MousePointerClick className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-main">
                Eficacia de CTAs
              </h2>
            </div>
            <div className="rounded-full border border-green-500/10 bg-green-500/5 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-green-600">
              Engagement Rate
            </div>
          </header>
          <div className="custom-scrollbar overflow-x-auto p-4">
            <table className="w-full border-separate border-spacing-y-2 px-4 text-left text-sm">
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
                    <tr
                      key={idx}
                      className="group transition-colors hover:bg-green-500/5"
                    >
                      <td className="flex items-center gap-3 rounded-l-2xl border-y border-l border-brand-dark/5 bg-surface px-6 py-5 font-bold text-main dark:border-white/5">
                        <LinkIcon className="h-4 w-4 text-muted opacity-30" /> {it.cta}
                      </td>
                      <td className="border-y border-brand-dark/5 bg-surface px-6 py-5 text-right font-mono text-[11px] text-muted dark:border-white/5">
                        {it.clicks}
                      </td>
                      <td className="border-y border-brand-dark/5 bg-surface px-6 py-5 text-right font-bold text-brand-yellow dark:border-white/5">
                        {it.leads}
                      </td>
                      <td className="rounded-r-2xl border-y border-r border-brand-dark/5 bg-surface px-6 py-5 text-right font-heading text-xl text-green-600 dark:border-white/5">
                        {it.paid}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="rounded-2xl border border-dashed border-brand-dark/10 bg-surface px-6 py-32 text-center text-sm italic text-muted opacity-40"
                    >
                      Esperando señales de interacción de usuario...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* FOOTER DE INTEGRIDAD CORPORATIVA */}
      <footer className="flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Confidence Attribution Active
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Terminal className="h-4 w-4" /> Growth Intelligence Node v4.1
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Activity className="h-4 w-4 text-brand-yellow" /> Live Market Signal Validated
        </div>
      </footer>
    </div>
  );
}

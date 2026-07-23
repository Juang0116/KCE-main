'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import {
  TrendingUp,
  RefreshCw,
  DollarSign,
  Target,
  Activity,
  PieChart,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Briefcase,
  BarChart3,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Row = {
  k: string;
  spend_minor: number;
  revenue_minor: number;
  paid: number;
  cac_minor: number | null;
  roas: number | null;
};

type Summary = {
  spend_minor: number;
  revenue_minor: number;
  paid: number;
  roas: number | null;
};

type Payload = {
  rows: Row[];
  summary: Summary | null;
};

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function fmtMinor(n: number) {
  const val = n / 100;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(val);
}

function fmtNum(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return n.toLocaleString();
}

function fmtRoas(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return `${n.toFixed(2)}x`;
}

function isPayload(x: unknown): x is Payload {
  if (!x || typeof x !== 'object') return false;
  const o = x as { rows?: unknown; summary?: unknown };
  return Array.isArray(o.rows) && 'summary' in o;
}

export function AdminAnalyticsClient() {
  const [days, setDays] = useState<number>(30);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reqIdRef = useRef(0);

  const refresh = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const myReqId = ++reqIdRef.current;

    try {
      const res = await adminFetch(`/api/admin/analytics/executive?days=${days}`);
      if (myReqId !== reqIdRef.current) return;
      if (!res.ok) throw new Error(`Falla técnica (HTTP ${res.status})`);

      const data: unknown = await res.json();
      if (!isPayload(data)) throw new Error('Carga de datos corrupta.');

      setRows(data.rows ?? []);
      setSummary(data.summary ?? null);
    } catch (e: unknown) {
      if (myReqId !== reqIdRef.current) return;
      setErr(e instanceof Error ? e.message : 'Error de sincronización.');
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const analyticsSignals = useMemo(
    () => [
      {
        label: 'Eficiencia Global',
        value: fmtRoas(summary?.roas),
        note: 'Multiplicador ROAS actual.',
        icon: Target,
      },
      {
        label: 'Revenue Bruto',
        value: summary ? fmtMinor(summary.revenue_minor) : '—',
        note: `En los últimos ${days} días.`,
        icon: TrendingUp,
      },
      {
        label: 'Adquisiciones',
        value: String(summary?.paid || 0),
        note: 'Pagos confirmados.',
        icon: ShieldCheck,
      },
    ],
    [summary, days],
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10 pb-24 duration-700">
      {/* 01. HEADER INSTITUCIONAL */}
      <header className="flex flex-col justify-between gap-6 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Briefcase className="h-3.5 w-3.5" /> Financial Intelligence Unit
          </div>
          <h1 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
            FinOps <span className="font-light italic text-brand-yellow">Analytics</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base font-light leading-relaxed text-muted">
            Control de rentabilidad unitaria por viajero. Cruce directo de inversión en Ads contra
            ingresos reales liquidados en la plataforma.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-12 rounded-full border-brand-dark/10 px-8 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-surface-2"
          >
            Exportar P&L
          </Button>
        </div>
      </header>

      {/* 02. WORKBENCH DE ALINEACIÓN ESTRATÉGICA */}
      <AdminOperatorWorkbench
        eyebrow="North Star Metric"
        title="Objetivo: ROAS ≥ 3.5x"
        description="Si el multiplicador desciende por debajo de 3.0x, la operación se considera en riesgo. Revisa el CAC por canal y optimiza el flujo de checkout o la oferta de tours."
        actions={[
          { href: '/admin/revenue', label: 'Cierre de Caja', tone: 'primary' },
          { href: '/admin/marketing', label: 'Ver Campañas' },
        ]}
        signals={analyticsSignals}
      />

      {/* 03. PANEL ANALÍTICO (LA BÓVEDA) */}
      <section className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5 md:p-12">
        <div className="pointer-events-none absolute right-0 top-0 p-8 opacity-[0.02]">
          <BarChart3 className="h-64 w-64 text-brand-blue" />
        </div>

        {/* Controles de Filtro */}
        <div className="relative z-10 mb-12 flex flex-col justify-between gap-6 border-b border-brand-dark/5 pb-8 dark:border-white/5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 rounded-2xl border border-brand-dark/5 bg-surface-2 px-4 py-2 shadow-inner dark:border-white/5">
              <CalendarDays className="h-4 w-4 text-brand-blue/50" />
              <select
                className="cursor-pointer appearance-none bg-transparent pr-4 text-sm font-bold text-brand-blue outline-none"
                value={String(days)}
                onChange={(e) => setDays(clampInt(Number(e.target.value) || 30, 1, 365))}
              >
                <option value="7">Últimos 7 Días</option>
                <option value="14">Últimos 14 Días</option>
                <option value="30">Últimos 30 Días</option>
                <option value="90">Último Trimestre</option>
                <option value="365">Año Completo</option>
              </select>
            </div>
          </div>

          <button
            onClick={refresh}
            disabled={loading}
            className="flex h-12 items-center justify-center gap-3 rounded-full bg-brand-dark px-8 text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Calculando...' : 'Sincronizar Datos'}
          </button>
        </div>

        {err && (
          <div className="animate-in fade-in slide-in-from-bottom-2 mb-10 flex items-center gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-6 text-red-700 shadow-sm dark:bg-red-500/10 dark:text-red-400">
            <AlertCircle className="h-6 w-6 shrink-0" />
            <p className="text-sm font-bold">{err}</p>
          </div>
        )}

        {/* DASHBOARD DE INDICADORES CLAVE */}
        {summary && (
          <div className="relative z-10 mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Inversión (Spend)',
                value: fmtMinor(summary.spend_minor),
                color: 'text-red-600 dark:text-red-400',
                icon: DollarSign,
              },
              {
                label: 'Ingresos (Revenue)',
                value: fmtMinor(summary.revenue_minor),
                color: 'text-green-600 dark:text-green-400',
                icon: TrendingUp,
              },
              {
                label: 'Ventas Cerradas',
                value: `${summary.paid} Checkouts`,
                color: 'text-brand-blue',
                icon: Activity,
              },
              {
                label: 'Multiplicador ROAS',
                value: fmtRoas(summary.roas),
                color: 'text-brand-blue',
                icon: Target,
                highlight: true,
              },
            ].map((stat, i) => (
              <div
                key={i}
                className={`rounded-[var(--radius-2xl)] border p-8 transition-all duration-300 hover:shadow-soft ${stat.highlight ? 'border-brand-blue/10 bg-brand-blue/5 shadow-inner' : 'border-brand-dark/5 bg-surface dark:border-white/5'}`}
              >
                <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  <stat.icon className="h-3.5 w-3.5 opacity-50" /> {stat.label}
                </div>
                <div className={`font-heading text-3xl tracking-tight ${stat.color}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TABLA DE RENDIMIENTO POR CANAL */}
        <div className="relative z-10 space-y-6">
          <div className="mb-6 flex items-center gap-3 px-2">
            <PieChart className="h-6 w-6 text-brand-blue opacity-50" />
            <h2 className="font-heading text-2xl tracking-tight text-main">
              Rendimiento por Fuente
            </h2>
          </div>

          <div className="custom-scrollbar overflow-x-auto">
            <div className="bg-surface-2/30 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 shadow-sm dark:border-white/5">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-surface-2/50 border-b border-brand-dark/5 dark:border-white/5">
                  <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                    <th className="px-8 py-6">Source / Canal</th>
                    <th className="px-8 py-6 text-right">Inversión</th>
                    <th className="px-8 py-6 text-right">Revenue</th>
                    <th className="px-8 py-6 text-center">Pagos</th>
                    <th className="px-8 py-6 text-right">CAC Unitario</th>
                    <th className="px-8 py-6 text-right">Eficiencia (ROAS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
                  {rows.length === 0 ? (
                    <tr key="empty">
                      <td
                        colSpan={6}
                        className="bg-surface px-8 py-32 text-center"
                      >
                        <Activity className="mx-auto mb-6 h-12 w-12 text-brand-blue opacity-20" />
                        <p className="mb-2 font-heading text-lg tracking-tight text-main">
                          Aún no hay datos
                        </p>
                        <p className="text-sm font-light text-muted">
                          Esperando sincronización de la API financiera...
                        </p>
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      const isGood = r.roas && r.roas >= 3.5;
                      const isWarning = r.roas && r.roas < 1.5;
                      return (
                        <tr
                          key={r.k}
                          className="hover:bg-surface-2/50 group cursor-default bg-surface transition-colors"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-[10px] font-bold uppercase text-brand-blue">
                                {(r.k ?? '??').slice(0, 2)}
                              </span>
                              <div className="text-xs font-bold uppercase tracking-widest text-main transition-colors group-hover:text-brand-blue">
                                {r.k ?? '—'}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right font-medium text-red-600/70 dark:text-red-400/70">
                            {fmtMinor(r.spend_minor)}
                          </td>
                          <td className="px-8 py-6 text-right font-bold text-green-600 dark:text-green-400">
                            {fmtMinor(r.revenue_minor)}
                          </td>
                          <td className="px-8 py-6 text-center font-heading text-xl text-main">
                            {fmtNum(r.paid)}
                          </td>
                          <td className="px-8 py-6 text-right font-mono italic text-muted">
                            {r.cac_minor === null ? '—' : fmtMinor(r.cac_minor)}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span
                              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-sm font-bold shadow-sm ${
                                isGood
                                  ? 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400'
                                  : isWarning
                                    ? 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400'
                                    : 'border-brand-dark/5 bg-surface-2 text-muted dark:border-white/5'
                              }`}
                            >
                              {isGood && <ArrowUpRight className="h-3 w-3" />}
                              {fmtRoas(r.roas)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* NOTA AL PIE TÉCNICA */}
        <footer className="relative z-10 mt-16 flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-50">
          <Activity className="h-3 w-3" /> Real-Time P&L Tracking • KCE Ledger v4.1
        </footer>
      </section>
    </div>
  );
}

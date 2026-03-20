'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  TrendingUp, RefreshCw, DollarSign, 
  Target, Activity, PieChart, ArrowUpRight, 
  ShieldCheck, AlertCircle, Briefcase, BarChart3,
  CalendarDays
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
    maximumFractionDigits: 0 
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
  return Array.isArray(o.rows) && ('summary' in o);
}

export function AdminAnalyticsClient() {
  const [days, setDays] = useState<number>(30);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reqIdRef = useRef(0);

  // UX Pro: Envolvemos en useCallback para optimizar renders
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

  useEffect(() => { refresh(); }, [refresh]);

  const analyticsSignals = useMemo(() => [
    { label: 'Eficiencia Global', value: fmtRoas(summary?.roas), note: 'Multiplicador ROAS actual.', icon: Target },
    { label: 'Revenue Bruto', value: summary ? fmtMinor(summary.revenue_minor) : '—', note: `En los últimos ${days} días.`, icon: TrendingUp },
    { label: 'Adquisiciones', value: String(summary?.paid || 0), note: 'Pagos confirmados.', icon: ShieldCheck }
  ], [summary, days]);

  return (
    <div className="space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER INSTITUCIONAL */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Briefcase className="h-3.5 w-3.5" /> Financial Intelligence Unit
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue">FinOps <span className="text-brand-yellow italic font-light">Analytics</span></h1>
          <p className="mt-4 text-base text-[color:var(--color-text)]/50 font-light leading-relaxed max-w-2xl">
            Control de rentabilidad unitaria por viajero. Cruce directo de inversión en Ads contra ingresos reales liquidados en la plataforma.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-full shadow-sm">Exportar P&L</Button>
        </div>
      </header>

      {/* WORKBENCH DE ALINEACIÓN ESTRATÉGICA */}
      <AdminOperatorWorkbench
        eyebrow="North Star Metric"
        title="Objetivo: ROAS ≥ 3.5x"
        description="Si el multiplicador desciende por debajo de 3.0x, la operación se considera en riesgo. Revisa el CAC por canal y optimiza el flujo de checkout o la oferta de tours."
        actions={[
          { href: '/admin/revenue', label: 'Cierre de Caja', tone: 'primary' },
          { href: '/admin/marketing', label: 'Ver Campañas' }
        ]}
        signals={analyticsSignals}
      />

      {/* PANEL ANALÍTICO (LA BÓVEDA) */}
      <section className="rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
          <BarChart3 className="h-64 w-64 text-brand-blue" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 border-b border-[color:var(--color-border)] pb-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] px-4 py-2 rounded-2xl">
              <CalendarDays className="h-4 w-4 text-brand-blue/40" />
              <select
                className="bg-transparent text-sm font-bold text-brand-blue outline-none cursor-pointer appearance-none pr-4"
                value={String(days)}
                onChange={(e) => setDays(clampInt(Number(e.target.value) || 30, 1, 365))}
              >
                <option value="7">7 Días</option>
                <option value="14">14 Días</option>
                <option value="30">30 Días</option>
                <option value="90">90 Días</option>
                <option value="365">Anual</option>
              </select>
            </div>
          </div>

          <button 
            onClick={refresh} 
            disabled={loading} 
            className="flex h-12 items-center justify-center gap-3 rounded-2xl bg-brand-dark px-8 text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-xl transition hover:scale-105 disabled:opacity-30"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
            {loading ? 'Calculando...' : 'Sincronizar'}
          </button>
        </div>

        {err && (
          <div className="mb-10 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 flex items-center gap-4 text-rose-700 animate-in fade-in zoom-in-95">
            <AlertCircle className="h-6 w-6" />
            <p className="text-sm font-medium">{err}</p>
          </div>
        )}

        {/* DASHBOARD DE INDICADORES CLAVE */}
        {summary && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-16">
            {[
              { label: 'Inversión (Spend)', value: fmtMinor(summary.spend_minor), color: 'text-rose-600', icon: DollarSign },
              { label: 'Ingresos (Revenue)', value: fmtMinor(summary.revenue_minor), color: 'text-emerald-600', icon: TrendingUp },
              { label: 'Ventas Cerradas', value: `${summary.paid} Checkouts`, color: 'text-brand-blue', icon: Activity },
              { label: 'Multiplicador ROAS', value: fmtRoas(summary.roas), color: 'text-brand-blue', icon: Target, highlight: true }
            ].map((stat, i) => (
              <div key={i} className={`rounded-[2.5rem] border p-8 transition-all hover:shadow-lg ${stat.highlight ? 'bg-brand-blue/5 border-brand-blue/10 shadow-inner' : 'bg-[color:var(--color-surface)] border-[color:var(--color-border)]'}`}>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/30 mb-4">
                  <stat.icon className="h-3.5 w-3.5" /> {stat.label}
                </div>
                <div className={`text-3xl font-heading ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* TABLA DE RENDIMIENTO POR CANAL */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-4">
            <PieChart className="h-5 w-5 text-brand-blue/40" />
            <h2 className="font-heading text-2xl text-brand-blue">Rendimiento por Fuente</h2>
          </div>

          <div className="overflow-x-auto">
            <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm min-w-[900px]">
                <thead className="bg-[color:var(--color-surface-2)] border-b border-[color:var(--color-border)]">
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40">
                    <th className="px-8 py-6">Source / Canal</th>
                    <th className="px-8 py-6 text-right">Inversión</th>
                    <th className="px-8 py-6 text-right">Revenue</th>
                    <th className="px-8 py-6 text-center">Pagos</th>
                    <th className="px-8 py-6 text-right">CAC Unitario</th>
                    <th className="px-8 py-6 text-right">Eficiencia (ROAS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-24 text-center">
                        <Activity className="mx-auto h-12 w-12 text-brand-blue/10 mb-6" />
                        <p className="text-lg font-light text-[color:var(--color-text)]/30 italic">Esperando datos de la API financiera...</p>
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      const isGood = r.roas && r.roas >= 3.5;
                      const isWarning = r.roas && r.roas < 1.5;
                      return (
                        <tr key={r.k} className="group transition-all hover:bg-brand-blue/[0.02]">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/5 text-brand-blue font-bold text-[10px] uppercase">
                                {(r.k ?? '??').slice(0, 2)}
                              </span>
                              <div className="font-bold text-brand-blue group-hover:text-brand-yellow transition-colors uppercase tracking-widest text-xs">
                                {r.k ?? '—'}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right text-rose-600/70 font-medium">{fmtMinor(r.spend_minor)}</td>
                          <td className="px-8 py-6 text-right text-emerald-600 font-bold">{fmtMinor(r.revenue_minor)}</td>
                          <td className="px-8 py-6 text-center font-heading text-lg">{fmtNum(r.paid)}</td>
                          <td className="px-8 py-6 text-right font-mono text-[color:var(--color-text)]/40 italic">{r.cac_minor === null ? '—' : fmtMinor(r.cac_minor)}</td>
                          <td className="px-8 py-6 text-right">
                            <span className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-sm font-bold shadow-sm border ${
                              isGood ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' : 
                              isWarning ? 'bg-rose-500/10 text-rose-700 border-rose-500/20' : 
                              'bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]/60 border-[color:var(--color-border)]'
                            }`}>
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
        <footer className="mt-12 flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[color:var(--color-text)]/50">
           <Activity className="h-3 w-3" /> Real-Time P&L Tracking • KCE Ledger v4.1
        </footer>
      </section>
    </div>
  );
}
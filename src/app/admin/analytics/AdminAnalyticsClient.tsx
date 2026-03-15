'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { TrendingUp, Filter, RefreshCw, DollarSign, Target, Activity, PieChart } from 'lucide-react';

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
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
}

function fmtNum(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString();
}

function fmtRoas(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(2)}x`;
}

function isPayload(x: unknown): x is Payload {
  if (!x || typeof x !== 'object') return false;
  const o = x as { rows?: unknown; summary?: unknown };
  return Array.isArray(o.rows) && ('summary' in o);
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const j = (await res.json()) as any;
      return String(j?.error || j?.message || res.statusText || 'Error');
    }
    const t = await res.text();
    return t ? t.slice(0, 300) : String(res.statusText || 'Error');
  } catch {
    return String(res.statusText || 'Error');
  }
}

export function AdminAnalyticsClient() {
  const [days, setDays] = useState<number>(30);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reqIdRef = useRef(0);
  const daysInputValue = useMemo(() => String(days), [days]);

  async function refresh() {
    setErr(null);
    setLoading(true);
    const myReqId = ++reqIdRef.current;

    try {
      const res = await adminFetch(`/api/admin/analytics/executive?days=${days}`);
      if (myReqId !== reqIdRef.current) return;
      if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const data: unknown = await res.json();
      if (!isPayload(data)) {
        throw new Error('Respuesta inesperada del servidor (payload inválido).');
      }

      setRows(data.rows ?? []);
      setSummary(data.summary ?? null);
    } catch (e: unknown) {
      if (myReqId !== reqIdRef.current) return;
      const msg = e instanceof Error ? e.message : 'Error';
      setErr(msg);
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const analyticsSignals = useMemo(() => [
    { label: 'ROAS Global', value: fmtRoas(summary?.roas), note: 'Retorno sobre la Inversión Publicitaria.' },
    { label: 'Revenue', value: summary ? fmtMinor(summary.revenue_minor) : '—', note: `Generado en los últimos ${days} días.` },
    { label: 'Canales', value: String(rows.length), note: 'Fuentes de adquisición analizadas.' }
  ], [summary, rows, days]);

  return (
    <div className="space-y-10 pb-20">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Executive Financials</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Control de rentabilidad, Costo de Adquisición (CAC) y ROAS por canal.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Financial Intelligence"
        title="Mide el Pulso Financiero"
        description="Si el ROAS baja de 3.0x, pausa las campañas y revisa la conversión del catálogo. Este panel consolida la inversión publicitaria y la cruza con el revenue real pagado en Stripe."
        actions={[
          { href: '/admin/marketing', label: 'Dashboard Marketing', tone: 'primary' },
          { href: '/admin/revenue', label: 'Revenue Ops' }
        ]}
        signals={analyticsSignals}
      />

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* Controles de Filtro */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[var(--color-border)] pb-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-brand-blue" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Ventana:</span>
              <select
                className="w-32 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 text-sm font-semibold outline-none focus:border-brand-blue appearance-none cursor-pointer"
                value={daysInputValue}
                onChange={(e) => setDays(clampInt(Number(e.target.value) || 30, 1, 365))}
              >
                <option value="7">7 Días</option>
                <option value="14">14 Días</option>
                <option value="30">30 Días</option>
                <option value="90">90 Días</option>
                <option value="365">1 Año</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={refresh} disabled={loading} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-[10px] font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50 shadow-md">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Calculando...' : 'Sync'}
            </button>
          </div>
        </div>

        {err && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}

        {/* Tarjetas Resumen */}
        {summary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">
                <DollarSign className="h-3 w-3"/> Inversión (Spend)
              </div>
              <div className="text-3xl font-heading text-rose-600">{fmtMinor(summary.spend_minor)}</div>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">
                <TrendingUp className="h-3 w-3"/> Ingresos (Revenue)
              </div>
              <div className="text-3xl font-heading text-emerald-600">{fmtMinor(summary.revenue_minor)}</div>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">
                <Activity className="h-3 w-3"/> Conversiones
              </div>
              <div className="text-3xl font-heading text-brand-blue">{fmtNum(summary.paid)} <span className="text-sm text-[var(--color-text)]/40 font-sans font-normal">Pagos</span></div>
            </div>
            {/* CORRECCIÓN: Usamos un solo borde aquí */}
            <div className="rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-blue mb-2">
                <Target className="h-3 w-3"/> Multiplicador ROAS
              </div>
              <div className="text-3xl font-heading text-brand-blue">{fmtRoas(summary.roas)}</div>
            </div>
          </div>
        )}

        {/* Tabla de Rendimiento por Canal */}
        <div className="flex items-center gap-3 mb-6">
          <PieChart className="h-5 w-5 text-brand-blue" />
          <h2 className="font-heading text-2xl text-[var(--color-text)]">Rendimiento por Canal de Adquisición</h2>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-6 py-5">Canal / Source</th>
                <th className="px-6 py-5 text-right">Inversión (Spend)</th>
                <th className="px-6 py-5 text-right">Revenue</th>
                <th className="px-6 py-5 text-center">Compras</th>
                <th className="px-6 py-5 text-right">Costo Adq. (CAC)</th>
                <th className="px-6 py-5 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {loading && rows.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm font-medium text-[var(--color-text)]/40">Sincronizando datos de inversión...</td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-[var(--color-text)]/40 italic border border-dashed border-[var(--color-border)] rounded-2xl">
                    <div className="mb-2">Sin datos financieros para los últimos {days} días.</div>
                    <div className="text-[10px] uppercase font-bold tracking-widest">Asegúrate de registrar eventos checkout.paid.</div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const isGoodRoas = r.roas && r.roas >= 3;
                  const isBadRoas = r.roas && r.roas < 1;
                  return (
                    <tr key={r.k} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                      <td className="px-6 py-5 font-semibold text-brand-blue uppercase tracking-wide">{r.k}</td>
                      <td className="px-6 py-5 text-right text-rose-600 font-medium">{fmtMinor(r.spend_minor)}</td>
                      <td className="px-6 py-5 text-right text-emerald-600 font-bold">{fmtMinor(r.revenue_minor)}</td>
                      <td className="px-6 py-5 text-center font-heading text-lg">{fmtNum(r.paid)}</td>
                      <td className="px-6 py-5 text-right font-mono text-[var(--color-text)]/70">{r.cac_minor === null ? '—' : fmtMinor(r.cac_minor)}</td>
                      <td className="px-6 py-5 text-right">
                        <span className={`inline-flex px-3 py-1 rounded-lg font-bold font-mono text-sm ${isGoodRoas ? 'bg-emerald-500/10 text-emerald-700' : isBadRoas ? 'bg-rose-500/10 text-rose-700' : 'bg-[var(--color-surface-2)] text-[var(--color-text)]/80'}`}>
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

        <div className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 flex justify-center items-center gap-1.5">
          <Activity className="h-3 w-3"/> Nota: Para modelos multi-moneda, asegúrate de aplicar el FX daily (P78).
        </div>

      </div>
    </div>
  );
}
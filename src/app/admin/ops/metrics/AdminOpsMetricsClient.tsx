'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { Activity, Clock, ShieldAlert, AlertTriangle, RefreshCw, BarChart2, Server } from 'lucide-react';

type Metrics = {
  requestId: string;
  window: { hours: number; since: string };
  totals: {
    incidents: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
  };
  sla: { avgAckMs: number | null; avgResolveMs: number | null };
  topKinds: Array<{ kind: string; total: number }>;
  pauses: Array<{ channel: string; paused_until: string; reason?: string | null }>;
};

function fmtMs(ms: number | null) {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  return `${h}h`;
}

function kpi(title: string, value: string, hint?: string, alert?: boolean) {
  return (
    <div className={`rounded-[2rem] border ${alert ? 'border-rose-500/30 bg-rose-500/5' : 'border-[var(--color-border)] bg-[var(--color-surface)]'} p-6 transition-transform hover:-translate-y-1 hover:shadow-md`}>
      <div className={`text-[10px] font-bold uppercase tracking-widest ${alert ? 'text-rose-600' : 'text-[var(--color-text)]/50'}`}>{title}</div>
      <div className={`mt-2 text-4xl font-heading ${alert ? 'text-rose-700' : 'text-brand-blue'}`}>{value}</div>
      {hint ? <div className={`mt-3 text-[10px] font-mono uppercase tracking-widest ${alert ? 'text-rose-600/60' : 'text-[var(--color-text)]/40'}`}>{hint}</div> : null}
    </div>
  );
}

export function AdminOpsMetricsClient() {
  const [hours, setHours] = useState<number>(24);
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/metrics?hours=${encodeURIComponent(String(hours))}`, { cache: 'no-store' });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setData(j as Metrics);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours]);

  const sevPairs = useMemo(() => {
    const m = data?.totals.bySeverity || {};
    return Object.keys(m).map((k) => [k, m[k] ?? 0] as const);
  }, [data]);

  const statusPairs = useMemo(() => {
    const m = data?.totals.byStatus || {};
    return Object.keys(m).map((k) => [k, m[k] ?? 0] as const);
  }, [data]);

  const opsSignals = useMemo(() => [
    { label: 'Incidentes Totales', value: String(data?.totals.incidents ?? (loading ? '...' : '0')), note: `Registrados en las últimas ${hours}h` },
    { label: 'Tiempo de Respuesta', value: fmtMs(data?.sla.avgAckMs ?? null), note: 'SLA Promedio (ACK)' },
    { label: 'Pausas Activas', value: String(data?.pauses?.length ?? 0), note: 'Sistemas en modo degradado' },
  ], [data, loading, hours]);

  return (
    <section className="space-y-10 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Salud Operacional (SLA)</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Monitor de estabilidad, tiempos de respuesta a incidentes y pausas del sistema.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="System Health"
        title="Monitor de Estabilidad de KCE"
        description="Evalúa la rapidez con la que el equipo responde a fallas del sistema. Mantén el SLA de 'Resolve' por debajo de 4 horas para incidentes críticos para evitar pérdida de ingresos."
        actions={[
          { href: '/admin/ops/incidents', label: 'Ver Incidentes', tone: 'primary' },
          { href: '/admin/system', label: 'Monitor de Sistema' }
        ]}
        signals={opsSignals}
      />

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* Controles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[var(--color-border)] pb-6">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-brand-blue" />
            <h2 className="font-heading text-xl text-[var(--color-text)]">Rendimiento Técnico</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-text)]/50">
              Ventana:
              <select
                className="w-32 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 text-xs font-semibold outline-none focus:border-brand-blue appearance-none cursor-pointer"
                value={String(hours)}
                onChange={(e) => setHours(Number(e.target.value) || 24)}
              >
                <option value="1">Última 1h</option>
                <option value="6">Últimas 6h</option>
                <option value="24">Últimas 24h</option>
                <option value="72">Últimas 72h</option>
                <option value="168">Últimos 7 días</option>
              </select>
            </label>

            <button
              type="button"
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-dark px-5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow hover:scale-105 transition-transform disabled:opacity-50 shadow-md"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Sync
            </button>
          </div>
        </div>

        {err && <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-700">{err}</div>}

        {/* Tarjetas KPI */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {kpi('Volumen de Fallas', String(data?.totals.incidents ?? (loading ? '...' : '0')), `Últimas ${hours}h`)}
          {kpi('SLA Respuesta', fmtMs(data?.sla.avgAckMs ?? null), 'Promedio hasta Asumir (ACK)')}
          {kpi('SLA Resolución', fmtMs(data?.sla.avgResolveMs ?? null), 'Promedio hasta Resolver')}
          {kpi('Pausas Activas', String(data?.pauses?.length ?? 0), 'Sistemas en modo degradado', (data?.pauses?.length ?? 0) > 0)}
        </div>

        {/* Gráficos de Distribución */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 shadow-inner">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)] mb-4">
              <AlertTriangle className="h-4 w-4 text-brand-blue" /> Por Severidad
            </div>
            <div className="grid grid-cols-3 gap-3">
              {sevPairs.length === 0 && !loading ? <div className="col-span-3 text-xs italic text-[var(--color-text)]/40">Sin datos.</div> : null}
              {sevPairs.map(([k, v]) => (
                <div key={k} className={`rounded-2xl border p-4 text-center ${k === 'critical' && v > 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-700' : k === 'warn' && v > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-700' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">{k}</div>
                  <div className="mt-2 text-2xl font-heading">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 shadow-inner">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)] mb-4">
              <ShieldAlert className="h-4 w-4 text-brand-blue" /> Por Estado
            </div>
            <div className="grid grid-cols-3 gap-3">
              {statusPairs.length === 0 && !loading ? <div className="col-span-3 text-xs italic text-[var(--color-text)]/40">Sin datos.</div> : null}
              {statusPairs.map(([k, v]) => (
                <div key={k} className={`rounded-2xl border p-4 text-center ${k === 'open' && v > 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-700' : k === 'resolved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">{k}</div>
                  <div className="mt-2 text-2xl font-heading">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tablas de Detalles */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)] mb-4">
              <BarChart2 className="h-4 w-4 text-brand-blue" /> Top Causas (Por Kind)
            </div>
            <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
              <table className="w-full text-sm text-left">
                <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                    <th className="px-4 py-3">Clase de Error (Kind)</th>
                    <th className="px-4 py-3 text-right">Ocurrencias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {(data?.topKinds || []).map((row) => (
                    <tr key={row.kind} className="hover:bg-[var(--color-surface-2)] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-brand-blue">{row.kind}</td>
                      <td className="px-4 py-3 text-right font-semibold">{row.total}</td>
                    </tr>
                  ))}
                  {!loading && (data?.topKinds || []).length === 0 && (
                    <tr>
                      <td className="px-4 py-8 text-center text-xs font-medium text-[var(--color-text)]/40 italic" colSpan={2}>
                        Sistema estable. No hay errores en esta ventana.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)] mb-4">
              <Server className="h-4 w-4 text-brand-blue" /> Pausas de Sistema (Degradación)
            </div>
            <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
              <table className="w-full text-sm text-left">
                <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                    <th className="px-4 py-3">Servicio / Canal</th>
                    <th className="px-4 py-3">Pausado Hasta</th>
                    <th className="px-4 py-3">Motivo (Razón)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {(data?.pauses || []).map((p) => (
                    <tr key={p.channel} className="hover:bg-[var(--color-surface-2)] transition-colors bg-rose-500/5">
                      <td className="px-4 py-3 font-bold text-rose-700 uppercase tracking-wide text-xs">{p.channel}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono">{new Date(p.paused_until).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text)]/70 line-clamp-1" title={p.reason || ''}>{p.reason || '—'}</td>
                    </tr>
                  ))}
                  {!loading && (data?.pauses || []).length === 0 && (
                    <tr>
                      <td className="px-4 py-8 text-center text-xs font-medium text-[var(--color-text)]/40 italic" colSpan={3}>
                        Todos los servicios operando normalmente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className="mt-8 text-right text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--color-text)]/30 border-t border-[var(--color-border)] pt-4">
          Req ID: {data?.requestId || '—'}
        </div>
      </div>
    </section>
  );
}
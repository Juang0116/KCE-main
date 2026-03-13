/* src/app/admin/ops/metrics/AdminOpsMetricsClient.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';

import { adminFetch } from '@/lib/adminFetch.client';

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

function kpi(title: string, value: string, hint?: string) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
      <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/60">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-[color:var(--color-text)]">{value}</div>
      {hint ? <div className="mt-1 text-xs text-[color:var(--color-text)]/60">{hint}</div> : null}
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
  }, []);

  const sevPairs = useMemo(() => {
    const m = data?.totals.bySeverity || {};
    return Object.keys(m).map((k) => [k, m[k] ?? 0] as const);
  }, [data]);

  const statusPairs = useMemo(() => {
    const m = data?.totals.byStatus || {};
    return Object.keys(m).map((k) => [k, m[k] ?? 0] as const);
  }, [data]);

  return (
    <section className="space-y-6">
      {err ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200">
          {err}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="text-xs text-[color:var(--color-text)]/70">
          Ventana
          <select
            className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm dark:bg-black/30"
            value={String(hours)}
            onChange={(e) => setHours(Number(e.target.value) || 24)}
          >
            <option value="1">1h</option>
            <option value="6">6h</option>
            <option value="24">24h</option>
            <option value="72">72h</option>
            <option value="168">7d</option>
          </select>
        </label>

        <button
          type="button"
          className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm hover:bg-black/10"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? 'Cargando…' : 'Refrescar'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpi('Incidentes (total)', String(data?.totals.incidents ?? (loading ? '…' : '0')), `últimas ${hours}h`)}
        {kpi('SLA ack (prom)', fmtMs(data?.sla.avgAckMs ?? null), 'first_seen → acknowledged')}
        {kpi('SLA resolve (prom)', fmtMs(data?.sla.avgResolveMs ?? null), 'first_seen → resolved')}
        {kpi('Pausas activas', String(data?.pauses?.length ?? 0), 'checkout/email')}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
          <div className="text-sm font-semibold text-[color:var(--color-text)]">Por severidad</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {sevPairs.map(([k, v]) => (
              <div key={k} className="rounded-xl border border-black/10 bg-black/5 p-3">
                <div className="text-xs text-[color:var(--color-text)]/60">{k}</div>
                <div className="text-lg font-semibold text-[color:var(--color-text)]">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
          <div className="text-sm font-semibold text-[color:var(--color-text)]">Por estado</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {statusPairs.map(([k, v]) => (
              <div key={k} className="rounded-xl border border-black/10 bg-black/5 p-3">
                <div className="text-xs text-[color:var(--color-text)]/60">{k}</div>
                <div className="text-lg font-semibold text-[color:var(--color-text)]">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
          <div className="text-sm font-semibold text-[color:var(--color-text)]">Top causas (kind)</div>
          <div className="mt-3 overflow-auto rounded-xl border border-black/10">
            <table className="min-w-[640px] w-full text-sm">
              <thead className="bg-black/5">
                <tr>
                  <th className="p-3 text-left">Kind</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topKinds || []).map((row) => (
                  <tr key={row.kind} className="border-t border-black/10">
                    <td className="p-3 font-mono text-xs">{row.kind}</td>
                    <td className="p-3 text-right">{row.total}</td>
                  </tr>
                ))}
                {!loading && (data?.topKinds || []).length === 0 ? (
                  <tr>
                    <td className="p-4 text-[color:var(--color-text)]/60" colSpan={2}>
                      Sin datos en esta ventana.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
          <div className="text-sm font-semibold text-[color:var(--color-text)]">Pausas activas</div>
          <div className="mt-3 overflow-auto rounded-xl border border-black/10">
            <table className="min-w-[640px] w-full text-sm">
              <thead className="bg-black/5">
                <tr>
                  <th className="p-3 text-left">Canal</th>
                  <th className="p-3 text-left">Hasta</th>
                  <th className="p-3 text-left">Razón</th>
                </tr>
              </thead>
              <tbody>
                {(data?.pauses || []).map((p) => (
                  <tr key={p.channel} className="border-t border-black/10">
                    <td className="p-3 font-medium">{p.channel}</td>
                    <td className="p-3 whitespace-nowrap">{new Date(p.paused_until).toLocaleString()}</td>
                    <td className="p-3 text-xs text-[color:var(--color-text)]/70 truncate max-w-[420px]">{p.reason || '—'}</td>
                  </tr>
                ))}
                {!loading && (data?.pauses || []).length === 0 ? (
                  <tr>
                    <td className="p-4 text-[color:var(--color-text)]/60" colSpan={3}>
                      No hay pausas activas.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="text-xs text-[color:var(--color-text)]/60">requestId: {data?.requestId || '—'}</div>
    </section>
  );
}

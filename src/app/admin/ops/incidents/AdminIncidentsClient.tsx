/* src/app/admin/ops/incidents/AdminIncidentsClient.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { adminFetch } from '@/lib/adminFetch.client';

type Incident = {
  id: string;
  request_id: string | null;
  severity: 'info' | 'warn' | 'critical';
  kind: string;
  actor: string | null;
  path: string | null;
  method: string | null;
  ip: string | null;
  message: string;
  fingerprint: string;
  status: 'open' | 'acked' | 'resolved';
  count: number;
  first_seen_at: string;
  last_seen_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  meta: any;
};

type Resp = { items: Incident[]; requestId: string };

function badge(s: string) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border';
  if (s === 'critical') return `${base} border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-200`;
  if (s === 'warn') return `${base} border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200`;
  return `${base} border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-200`;
}

export function AdminIncidentsClient() {
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');
  const [status, setStatus] = useState<string>('open');
  const [severity, setSeverity] = useState<string>('');
  const [kind, setKind] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const qs = new URLSearchParams();
      if (status) qs.set('status', status);
      if (severity) qs.set('severity', severity);
      if (kind) qs.set('kind', kind);
      qs.set('limit', '100');
      const r = await adminFetch(`/api/admin/ops/incidents?${qs.toString()}`, { cache: 'no-store' });
      const j = (await r.json().catch(() => null)) as Resp | any;
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setItems(Array.isArray(j?.items) ? j.items : []);
      setRequestId(String(j?.requestId || ''));
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const mutate = async (id: string, action: 'ack' | 'resolve') => {
    try {
      setErr('');
      const r = await adminFetch(`/api/admin/ops/incidents/${id}/${action}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      await load();
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kinds = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) s.add(it.kind);
    return Array.from(s).sort();
  }, [items]);

  return (
    <section className="space-y-4">
      {err ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200">
          {err}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label className="text-xs text-[color:var(--color-text)]/70">
            Estado
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm dark:bg-black/30"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="open">open</option>
              <option value="acked">acked</option>
              <option value="resolved">resolved</option>
            </select>
          </label>

          <label className="text-xs text-[color:var(--color-text)]/70">
            Severidad
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm dark:bg-black/30"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="critical">critical</option>
              <option value="warn">warn</option>
              <option value="info">info</option>
            </select>
          </label>

          <label className="text-xs text-[color:var(--color-text)]/70">
            Tipo
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm dark:bg-black/30"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="">Todos</option>
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm hover:bg-black/10"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? 'Cargando…' : 'Refrescar'}
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border border-black/10">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="p-3 text-left">Última vez</th>
              <th className="p-3 text-left">Sev</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Kind</th>
              <th className="p-3 text-left">Mensaje</th>
              <th className="p-3 text-left">Count</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-black/10">
                <td className="p-3 whitespace-nowrap">
                  {new Date(it.last_seen_at).toLocaleString()}
                  <div className="text-xs text-[color:var(--color-text)]/60">{it.path || ''}</div>
                </td>
                <td className="p-3">
                  <span className={badge(it.severity)}>{it.severity}</span>
                </td>
                <td className="p-3">
                  <span className={badge(it.status)}>{it.status}</span>
                </td>
                <td className="p-3 font-mono text-xs">{it.kind}</td>
                <td className="p-3">
                  <div className="font-medium truncate max-w-[460px]">{it.message}</div>
                  <div className="text-xs text-[color:var(--color-text)]/60 truncate max-w-[460px]">
                    fingerprint: {it.fingerprint}
                  </div>
                </td>
                <td className="p-3">{it.count}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Link
                    href={`/admin/ops/runbooks#${encodeURIComponent(it.kind)}`}
                    className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-xs hover:bg-black/5 dark:bg-black/30"
                  >
                    Runbook
                  </Link>
                  <button
                    type="button"
                    className="ml-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-xs hover:bg-black/5 dark:bg-black/30"
                    onClick={() => void mutate(it.id, 'ack')}
                    disabled={it.status !== 'open'}
                  >
                    Ack
                  </button>
                  <button
                    type="button"
                    className="ml-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-xs hover:bg-black/5 dark:bg-black/30"
                    onClick={() => void mutate(it.id, 'resolve')}
                    disabled={it.status === 'resolved'}
                  >
                    Resolver
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 ? (
              <tr>
                <td className="p-4 text-[color:var(--color-text)]/60" colSpan={7}>
                  No hay incidentes para los filtros actuales.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-[color:var(--color-text)]/60">requestId: {requestId || '—'}</div>
    </section>
  );
}

'use client';


import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState } from 'react';

type EventItem = {
  id: string;
  type: string;
  source: string | null;
  entity_id: string | null;
  dedupe_key: string | null;
  created_at: string | null;
  payload: unknown;
};

export function AdminEventsClient() {
  const [sessionId, setSessionId] = useState('');
  const [entityIds, setEntityIds] = useState('');
  const [limit, setLimit] = useState(200);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedEntityIds, setUsedEntityIds] = useState<string[]>([]);
  const [items, setItems] = useState<EventItem[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);

  const canSearch = useMemo(() => sessionId.trim() || entityIds.trim(), [sessionId, entityIds]);

  useEffect(() => {
    // Allow deep-linking from /admin/ops or other tools.
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const sid = url.searchParams.get('session_id')?.trim();
    const eid = url.searchParams.get('entity_id')?.trim();
    const lim = url.searchParams.get('limit')?.trim();

    if (sid) setSessionId(sid);
    if (eid) setEntityIds(eid);
    if (lim) {
      const n = Number(lim);
      if (Number.isFinite(n) && n >= 10 && n <= 500) setLimit(n);
    }
  }, []);

  async function run() {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    setItems([]);

    try {
      const qs = new URLSearchParams();
      if (sessionId.trim()) qs.set('session_id', sessionId.trim());
      if (entityIds.trim()) qs.set('entity_id', entityIds.trim());
      qs.set('limit', String(limit));

      const res = await adminFetch(`/api/admin/events/timeline?${qs.toString()}`, { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Request failed');
        setRequestId(data?.requestId || null);
        return;
      }

      setUsedEntityIds(Array.isArray(data?.entityIds) ? data.entityIds : []);
      setItems(Array.isArray(data?.items) ? data.items : []);
      setRequestId(data?.requestId || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white/60 p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-[color:var(--color-text)]/70 text-xs font-semibold">
            Stripe session_id
          </span>
          <input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="cs_test_..."
            className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm"
          />
        </label>

        <label className="grid gap-1 md:col-span-2">
          <span className="text-[color:var(--color-text)]/70 text-xs font-semibold">
            entity_id (coma-separado)
          </span>
          <input
            value={entityIds}
            onChange={(e) => setEntityIds(e.target.value)}
            placeholder="bookingId, customerId, leadId, conversationId..."
            className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-[color:var(--color-text)]/70 text-xs font-semibold">Límite</span>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            min={10}
            max={500}
            className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm"
          />
        </label>

        <div className="flex items-end">
          <button
            onClick={run}
            disabled={!canSearch || loading}
            className="h-10 rounded-xl bg-brand-blue px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>

        {requestId ? (
          <div className="text-[color:var(--color-text)]/60 text-xs md:col-span-3">
            requestId: <span className="font-mono">{requestId}</span>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 md:col-span-3">
            {error}
          </div>
        ) : null}
      </div>

      {usedEntityIds.length ? (
        <div className="text-[color:var(--color-text)]/70 mt-4 text-xs">
          EntityIds usados: <span className="font-mono">{usedEntityIds.join(', ')}</span>
        </div>
      ) : null}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[900px] border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-[color:var(--color-text)]/60 text-left text-xs">
              <th className="px-3">Fecha</th>
              <th className="px-3">Type</th>
              <th className="px-3">Source</th>
              <th className="px-3">Entity</th>
              <th className="px-3">Dedupe</th>
              <th className="px-3">Payload</th>
            </tr>
          </thead>
          <tbody>
            {items.map((ev) => (
              <tr
                key={ev.id}
                className="rounded-xl border border-black/10 bg-white"
              >
                <td className="px-3 py-2 font-mono text-xs">
                  {ev.created_at ? new Date(ev.created_at).toLocaleString() : '-'}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{ev.type}</td>
                <td className="px-3 py-2 font-mono text-xs">{ev.source ?? '-'}</td>
                <td className="px-3 py-2 font-mono text-xs">{ev.entity_id ?? '-'}</td>
                <td className="px-3 py-2 font-mono text-xs">{ev.dedupe_key ?? '-'}</td>
                <td className="px-3 py-2">
                  <details>
                    <summary className="text-[color:var(--color-text)]/70 cursor-pointer text-xs">
                      ver
                    </summary>
                    <pre className="mt-2 max-w-[520px] overflow-x-auto rounded-xl bg-black/5 p-3 text-xs">
                      {JSON.stringify(ev.payload, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}

            {!items.length && !loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-[color:var(--color-text)]/60 px-3 py-4 text-center text-xs"
                >
                  Sin eventos
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

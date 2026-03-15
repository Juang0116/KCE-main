'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { Activity, Search, RefreshCw, AlertCircle, Database, Eye } from 'lucide-react';

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

  const eventsSignals = useMemo(() => [
    { label: 'Eventos Recuperados', value: String(items.length), note: 'Traza de eventos logueados en la base de datos.' },
    { label: 'Entidades Detectadas', value: String(usedEntityIds.length), note: 'IDs relacionados automáticamente (Deals, Booking, Ticket).' }
  ], [items.length, usedEntityIds.length]);

  return (
    <div className="space-y-10 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Visor de Eventos / Logs</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Traza de auditoría profunda por ID de Entidad o Sesión de Pago.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="System Forensics"
        title="Rastrea Fallos de Conversión"
        description="Si un cliente pagó pero no recibió el link o no se creó la reserva, pega aquí el Session_ID de Stripe para reconstruir toda la historia exacta de lo que ocurrió en los milisegundos siguientes al pago."
        actions={[
          { href: '/admin/qa', label: 'Ejecutar QA de Integridad', tone: 'primary' },
          { href: '/admin/audit', label: 'Auditoría Global' }
        ]}
        signals={eventsSignals}
      />

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        <div className="flex flex-col xl:flex-row gap-4 xl:items-end justify-between mb-8 border-b border-[var(--color-border)] pb-8">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 w-full xl:w-3/4">
            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Stripe Session ID</div>
              <input
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="cs_test_..."
                className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 font-mono text-sm outline-none focus:border-brand-blue transition-colors"
              />
            </label>

            <label className="text-sm md:col-span-2">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Entity IDs (Separados por coma)</div>
              <div className="relative">
                <Database className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text)]/40" />
                <input
                  value={entityIds}
                  onChange={(e) => setEntityIds(e.target.value)}
                  placeholder="booking_id, deal_id, customer_id..."
                  className="w-full h-12 pl-12 rounded-xl border border-[var(--color-border)] bg-transparent px-4 outline-none focus:border-brand-blue transition-colors font-mono text-sm"
                />
              </div>
            </label>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label className="text-sm w-24">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Límite</div>
              <input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} min={10} max={500} className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 outline-none text-center" />
            </label>
            <button onClick={run} disabled={!canSearch || loading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50 shadow-md">
              <Search className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} /> {loading ? 'Rastreando...' : 'Investigar'}
            </button>
          </div>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{error}</div>}

        {(usedEntityIds.length > 0 || requestId) && (
          <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-4 text-sm font-mono text-brand-blue">
            {usedEntityIds.length > 0 && <div><span className="font-bold">Entities:</span> {usedEntityIds.join(', ')}</div>}
            {requestId && <div><span className="font-bold">Req_ID:</span> {requestId}</div>}
          </div>
        )}

        <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-6 py-5">Fecha (ISO)</th>
                <th className="px-6 py-5">Tipo / Acción</th>
                <th className="px-6 py-5">Origen (Source)</th>
                <th className="px-6 py-5">Entidad (ID)</th>
                <th className="px-6 py-5">Deduplicación</th>
                <th className="px-6 py-5 text-right">Payload (Meta)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {loading && items.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-sm font-medium text-[var(--color-text)]/40">Realizando análisis forense...</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Activity className="mx-auto h-12 w-12 text-[var(--color-text)]/10 mb-4" />
                    <div className="text-sm font-medium text-[var(--color-text)]/40">No hay trazas de eventos para esta consulta.</div>
                  </td>
                </tr>
              ) : (
                items.map((ev) => (
                  <tr key={ev.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-6 py-5 align-top text-[10px] font-mono text-[var(--color-text)]/60">
                      {ev.created_at ? new Date(ev.created_at).toISOString().replace('T', '\n').slice(0, 19) : '—'}
                    </td>
                    <td className="px-6 py-5 align-top">
                      <span className="inline-flex items-center rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-blue">
                        {ev.type}
                      </span>
                    </td>
                    <td className="px-6 py-5 align-top font-mono text-xs text-[var(--color-text)]/70">{ev.source ?? '—'}</td>
                    <td className="px-6 py-5 align-top font-mono text-xs text-emerald-600">{ev.entity_id ?? '—'}</td>
                    <td className="px-6 py-5 align-top font-mono text-[10px] text-[var(--color-text)]/40 max-w-[150px] truncate" title={ev.dedupe_key ?? ''}>{ev.dedupe_key ?? '—'}</td>
                    <td className="px-6 py-5 align-top text-right">
                      {ev.payload && Object.keys(ev.payload as any).length > 0 ? (
                        <details className="group relative inline-block text-left cursor-pointer">
                          <summary className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/70 hover:bg-[var(--color-border)] transition-colors list-none">
                            <Eye className="h-3 w-3"/> Ver Payload
                          </summary>
                          <div className="absolute right-0 top-full z-50 mt-2 w-[400px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
                            <div className="bg-[var(--color-surface-2)] px-4 py-2 border-b border-[var(--color-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Datos del Evento</div>
                            <pre className="max-h-[300px] overflow-auto p-4 text-[10px] font-mono text-[var(--color-text)]/80 leading-relaxed whitespace-pre-wrap">
                              {JSON.stringify(ev.payload, null, 2)}
                            </pre>
                          </div>
                        </details>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text)]/30">— Empty —</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
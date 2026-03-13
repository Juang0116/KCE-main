/* src/app/admin/ops/incidents/[id]/AdminIncidentDetailClient.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch.client';

type Incident = {
  id: string;
  request_id: string | null;
  severity: 'info' | 'warn' | 'critical';
  kind: string;
  status: string;
  message: string;
  actor: string | null;
  path: string | null;
  method: string | null;
  ip: string | null;
  user_agent: string | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  count: number | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  meta: any;
};

type Update = {
  id: string;
  incident_id: string;
  kind: 'note' | 'action' | 'status';
  actor: string | null;
  message: string;
  meta: any;
  created_at: string;
};

type Postmortem = {
  incident_id: string;
  owner: string | null;
  summary: string | null;
  customer_impact: string | null;
  root_cause: string | null;
  timeline: string | null;
  what_went_well: string | null;
  what_went_wrong: string | null;
  action_items: any[];
  updated_at?: string | null;
};

type DetailResp = {
  ok: boolean;
  requestId: string;
  incident: Incident;
  updates: Update[];
  postmortem: Postmortem | null;
  error?: string;
};

function fmt(ts: string | null | undefined) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export function AdminIncidentDetailClient({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [detail, setDetail] = useState<DetailResp | null>(null);

  const [note, setNote] = useState('');
  const [noteKind, setNoteKind] = useState<'note' | 'action' | 'status'>('note');

  const [pm, setPm] = useState<Postmortem>({
    incident_id: id,
    owner: '',
    summary: '',
    customer_impact: '',
    root_cause: '',
    timeline: '',
    what_went_well: '',
    what_went_wrong: '',
    action_items: [],
  });

  const [syncing, setSyncing] = useState(false);
  const [_syncInfo, setSyncInfo] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}`, { cache: 'no-store' });
      const j = (await r.json().catch(() => null)) as DetailResp | any;
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setDetail(j);
      if (j.postmortem) setPm({ ...pm, ...j.postmortem });
    } catch (e: any) {
      setErr(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canAck = useMemo(() => {
    const st = detail?.incident?.status || '';
    return st === 'open';
  }, [detail?.incident?.status]);

  const canResolve = useMemo(() => {
    const st = detail?.incident?.status || '';
    return st === 'open' || st === 'acked';
  }, [detail?.incident?.status]);

  const ack = async () => {
    setLoading(true);
    setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}/ack`, { method: 'POST' });
      const j = (await r.json().catch(() => null)) as any;
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const resolve = async () => {
    setLoading(true);
    setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}/resolve`, { method: 'POST' });
      const j = (await r.json().catch(() => null)) as any;
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const addUpdate = async () => {
    const msg = note.trim();
    if (!msg) return;
    setLoading(true);
    setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}/updates`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: noteKind, message: msg }),
      });
      const j = (await r.json().catch(() => null)) as any;
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setNote('');
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const savePostmortem = async () => {
    setLoading(true);
    setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}/postmortem`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(pm),
      });
      const j = (await r.json().catch(() => null)) as any;
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };


const syncActionItemsToTasks = async () => {
  setSyncing(true);
  setSyncInfo('');
  setErr('');
  try {
    const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}/postmortem/action-items/sync`, {
      method: 'POST',
    });
    const j = (await r.json().catch(() => null)) as any;
    if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    setSyncInfo(`Tareas creadas: ${j.created || 0}`);
    // refresh postmortem payload
    if (Array.isArray(j.action_items)) setPm((prev) => ({ ...prev, action_items: j.action_items }));
  } catch (e: any) {
    setErr(e?.message || 'Error');
  } finally {
    setSyncing(false);
  }
};

  return (
    <section className="space-y-6">
      {err ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200">
          {err}
        </div>
      ) : null}

      <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/60">Kind</div>
            <div className="font-mono text-sm text-[color:var(--color-text)]">{detail?.incident?.kind || '—'}</div>
            <div className="text-xs text-[color:var(--color-text)]/60">ID: <span className="font-mono">{id}</span></div>
          </div>

          <div className="flex gap-2">
            <button
              className="px-3 py-2 rounded-xl border border-black/10 text-sm disabled:opacity-50"
              onClick={load}
              disabled={loading}
              type="button"
            >
              Recargar
            </button>
            <button
              className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm disabled:opacity-50"
              onClick={ack}
              disabled={loading || !canAck}
              type="button"
              title="ACK"
            >
              ACK
            </button>
            <button
              className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm disabled:opacity-50"
              onClick={resolve}
              disabled={loading || !canResolve}
              type="button"
              title="Resolve"
            >
              Resolver
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="text-sm">
            <div className="text-xs text-[color:var(--color-text)]/60">Severidad / Estado</div>
            <div className="mt-1">
              <span className="rounded-full border border-black/10 px-2 py-1 text-xs">{detail?.incident?.severity || '—'}</span>
              <span className="ml-2 rounded-full border border-black/10 px-2 py-1 text-xs">{detail?.incident?.status || '—'}</span>
            </div>
          </div>
          <div className="text-sm">
            <div className="text-xs text-[color:var(--color-text)]/60">First / Last seen</div>
            <div className="mt-1 text-xs">
              {fmt(detail?.incident?.first_seen_at)} → {fmt(detail?.incident?.last_seen_at)}{' '}
              {detail?.incident?.count ? <span className="ml-2">({detail?.incident?.count} hits)</span> : null}
            </div>
          </div>
          <div className="text-sm sm:col-span-2">
            <div className="text-xs text-[color:var(--color-text)]/60">Mensaje</div>
            <div className="mt-1 text-sm text-[color:var(--color-text)]">{detail?.incident?.message || '—'}</div>
          </div>

          <div className="text-sm">
            <div className="text-xs text-[color:var(--color-text)]/60">Ruta</div>
            <div className="mt-1 font-mono text-xs">{detail?.incident?.method || '—'} {detail?.incident?.path || ''}</div>
          </div>
          <div className="text-sm">
            <div className="text-xs text-[color:var(--color-text)]/60">Actor / IP</div>
            <div className="mt-1 text-xs">
              {detail?.incident?.actor || '—'} · <span className="font-mono">{detail?.incident?.ip || '—'}</span>
            </div>
          </div>

          <div className="text-sm">
            <div className="text-xs text-[color:var(--color-text)]/60">ACK / Resuelto</div>
            <div className="mt-1 text-xs">
              {fmt(detail?.incident?.acknowledged_at)} · {fmt(detail?.incident?.resolved_at)}
            </div>
          </div>

          <div className="text-sm">
            <div className="text-xs text-[color:var(--color-text)]/60">Runbook</div>
            <div className="mt-1 text-xs">
              <Link className="underline" href={`/admin/ops/runbooks#${encodeURIComponent(detail?.incident?.kind || '')}`}>
                Abrir runbook para {detail?.incident?.kind || '—'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-5 space-y-3">
        <h2 className="text-lg font-semibold text-[color:var(--color-text)]">Timeline</h2>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="text-xs text-[color:var(--color-text)]/70">
            Tipo
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm dark:bg-black/30"
              value={noteKind}
              onChange={(e) => setNoteKind(e.target.value as any)}
            >
              <option value="note">Nota</option>
              <option value="action">Acción</option>
              <option value="status">Estado</option>
            </select>
          </label>

          <label className="flex-1 text-xs text-[color:var(--color-text)]/70">
            Mensaje
            <input
              className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm dark:bg-black/30"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Qué pasó / qué harás / resultado..."
            />
          </label>

          <button
            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm disabled:opacity-50"
            onClick={addUpdate}
            disabled={loading || !note.trim()}
            type="button"
          >
            Agregar
          </button>
        </div>

        <div className="space-y-2">
          {(detail?.updates || []).length === 0 ? (
            <div className="text-sm text-[color:var(--color-text)]/60">No hay entradas todavía.</div>
          ) : (
            (detail?.updates || []).map((u) => (
              <div key={u.id} className="rounded-xl border border-black/10 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[color:var(--color-text)]/60">
                    <span className="font-mono">{u.kind}</span> · {fmt(u.created_at)} · {u.actor || '—'}
                  </div>
                </div>
                <div className="mt-1 text-sm text-[color:var(--color-text)]">{u.message}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--color-text)]">Postmortem</h2>
            <p className="text-xs text-[color:var(--color-text)]/60">
              Recomendado si severidad = critical o hubo impacto cliente.
            </p>
          </div>
          <button
            className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm disabled:opacity-50"
            onClick={savePostmortem}
            disabled={loading}
            type="button"
          >
            Guardar
          </button>
<button
  className="px-3 py-2 rounded-xl border border-black/10 text-sm disabled:opacity-50"
  onClick={syncActionItemsToTasks}
  disabled={loading || syncing}
  type="button"
  title="Crea tareas en /admin/tasks a partir de los action items del postmortem"
>
  {syncing ? 'Creando…' : 'Crear tareas'}
</button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs text-[color:var(--color-text)]/70">
            Owner
            <input
              className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm dark:bg-black/30"
              value={pm.owner || ''}
              onChange={(e) => setPm({ ...pm, owner: e.target.value })}
            />
          </label>
          <label className="text-xs text-[color:var(--color-text)]/70">
            Summary
            <input
              className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm dark:bg-black/30"
              value={pm.summary || ''}
              onChange={(e) => setPm({ ...pm, summary: e.target.value })}
            />
          </label>
          <label className="text-xs text-[color:var(--color-text)]/70 sm:col-span-2">
            Customer impact
            <textarea
              className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm dark:bg-black/30"
              rows={3}
              value={pm.customer_impact || ''}
              onChange={(e) => setPm({ ...pm, customer_impact: e.target.value })}
            />
          </label>
          <label className="text-xs text-[color:var(--color-text)]/70 sm:col-span-2">
            Root cause
            <textarea
              className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm dark:bg-black/30"
              rows={3}
              value={pm.root_cause || ''}
              onChange={(e) => setPm({ ...pm, root_cause: e.target.value })}
            />
          </label>
          <label className="text-xs text-[color:var(--color-text)]/70 sm:col-span-2">
            Timeline
            <textarea
              className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm dark:bg-black/30"
              rows={3}
              value={pm.timeline || ''}
              onChange={(e) => setPm({ ...pm, timeline: e.target.value })}
            />
          </label>
          <label className="text-xs text-[color:var(--color-text)]/70">
            What went well
            <textarea
              className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm dark:bg-black/30"
              rows={3}
              value={pm.what_went_well || ''}
              onChange={(e) => setPm({ ...pm, what_went_well: e.target.value })}
            />
          </label>
          <label className="text-xs text-[color:var(--color-text)]/70">
            What went wrong
            <textarea
              className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm dark:bg-black/30"
              rows={3}
              value={pm.what_went_wrong || ''}
              onChange={(e) => setPm({ ...pm, what_went_wrong: e.target.value })}
            />
          </label>
        </div>

        {detail?.postmortem?.updated_at ? (
          <div className="text-xs text-[color:var(--color-text)]/60">Última actualización: {fmt(detail.postmortem.updated_at)}</div>
        ) : null}
      </div>
    </section>
  );
}

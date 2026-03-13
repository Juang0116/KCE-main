'use client';


import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';

type TaskStatus = 'open' | 'in_progress' | 'done' | 'canceled';
type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

type TaskRow = {
  id: string;
  deal_id: string | null;
  ticket_id: string | null;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  due_at: string | null;
  updated_at: string;
  created_at: string;
  deals?: { title?: string | null; stage?: string | null; tour_slug?: string | null } | null;
};

const STATUSES: TaskStatus[] = ['open', 'in_progress', 'done', 'canceled'];
const PRIORITIES: TaskPriority[] = ['low', 'normal', 'high', 'urgent'];

export function AdminTasksClient() {
  const [items, setItems] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [q, setQ] = useState('');
  const [dealId, setDealId] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    if (q.trim()) params.set('q', q.trim());
    if (dealId) params.set('deal_id', dealId);
    if (ticketId) params.set('ticket_id', ticketId);
    const qs = params.toString();
    return `/api/admin/tasks/export${qs ? `?${qs}` : ''}`;
  }, [status, priority, q, dealId, ticketId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      if (q.trim()) params.set('q', q.trim());
      if (dealId) params.set('deal_id', dealId);
      if (ticketId) params.set('ticket_id', ticketId);
      params.set('limit', '50');

      const res = await adminFetch(`/api/admin/tasks?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to load tasks');
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      setDealId(sp.get('deal_id') || '');
      setTicketId(sp.get('ticket_id') || '');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId, ticketId]);

  async function patchTask(id: string, patch: any) {
    const prev = items;
    setItems((cur) => cur.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    try {
      const res = await adminFetch(`/api/admin/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to update task');
    } catch (e: any) {
      setItems(prev);
      alert(e?.message || 'Error updating task');
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
      {(dealId || ticketId) ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-sm">
          <span className="text-[color:var(--color-text)]/70">Scope:</span>
          {dealId ? (
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs text-[color:var(--color-text)]">
              deal_id {dealId.slice(0, 8)}…
            </span>
          ) : null}
          {ticketId ? (
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs text-[color:var(--color-text)]">
              ticket_id {ticketId.slice(0, 8)}…
            </span>
          ) : null}
          <button
            type="button"
            className="ml-auto rounded-lg border border-black/10 bg-black/5 px-2 py-1 text-xs hover:bg-black/10"
            onClick={() => {
              setDealId('');
              setTicketId('');
              try {
                const url = new URL(window.location.href);
                url.searchParams.delete('deal_id');
                url.searchParams.delete('ticket_id');
                window.history.replaceState({}, '', url.toString());
              } catch {
                // ignore
              }
            }}
          >
            Limpiar
          </button>
        </div>
      ) : null}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[color:var(--color-text)]/70">Status</span>
            <select
              className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-[color:var(--color-text)]"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option
                  key={s}
                  value={s}
                >
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[color:var(--color-text)]/70">Priority</span>
            <select
              className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-[color:var(--color-text)]"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="">All</option>
              {PRIORITIES.map((p) => (
                <option
                  key={p}
                  value={p}
                >
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[color:var(--color-text)]/70">Search</span>
            <input
              className="placeholder:text-[color:var(--color-text)]/40 h-10 w-full min-w-[240px] rounded-xl border border-white/10 bg-black/20 px-3 text-[color:var(--color-text)]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="title"
            />
          </label>

          <Button
            onClick={load}
            disabled={loading}
            variant="secondary"
          >
            {loading ? 'Loading…' : 'Apply'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <a
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-[color:var(--color-text)] hover:bg-black/30"
            href={exportUrl}
          >
            Export CSV
          </a>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-[color:var(--color-text)]/70 text-left">
              <th className="px-3 py-2">Task</th>
              <th className="px-3 py-2">Deal</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Due</th>
              <th className="px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  className="text-[color:var(--color-text)]/60 px-3 py-6"
                  colSpan={6}
                >
                  No tasks found.
                </td>
              </tr>
            ) : null}

            {items.map((t) => (
              <tr
                key={t.id}
                className="rounded-2xl bg-black/20"
              >
                <td className="p-3 align-top">
                  <div className="font-medium text-[color:var(--color-text)]">{t.title}</div>
                  <div className="text-[color:var(--color-text)]/50 mt-1 font-mono">
                    {t.id.slice(0, 8)}
                  </div>
                </td>

                <td className="text-[color:var(--color-text)]/80 p-3 align-top">
                  {t.deals?.title || '—'}
                  <div className="text-[color:var(--color-text)]/60 mt-1">
                    {t.deals?.tour_slug ? (
                      <span className="font-mono">{t.deals.tour_slug}</span>
                    ) : (
                      ''
                    )}
                  </div>
                </td>

                <td className="p-3 align-top">
                  <select
                    className="h-9 rounded-xl border border-white/10 bg-black/20 px-2 text-[color:var(--color-text)]"
                    value={t.status}
                    onChange={(e) => patchTask(t.id, { status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option
                        key={s}
                        value={s}
                      >
                        {s}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="p-3 align-top">
                  <select
                    className="h-9 rounded-xl border border-white/10 bg-black/20 px-2 text-[color:var(--color-text)]"
                    value={t.priority}
                    onChange={(e) => patchTask(t.id, { priority: e.target.value })}
                  >
                    {PRIORITIES.map((p) => (
                      <option
                        key={p}
                        value={p}
                      >
                        {p}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="text-[color:var(--color-text)]/80 p-3 align-top">
                  {t.due_at ? new Date(t.due_at).toLocaleString('es-CO') : '—'}
                </td>

                <td className="text-[color:var(--color-text)]/80 p-3 align-top">
                  {new Date(t.updated_at).toLocaleString('es-CO')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

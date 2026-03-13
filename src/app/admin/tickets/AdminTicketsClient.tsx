/*src/app/admin/tickets/AdminTicketsClient.tsx*/
'use client';


import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Ticket = {
  id: string;
  conversation_id: string | null;
  subject: string | null;
  summary: string | null;
  status: string | null;
  priority: string | null;
  channel: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ApiResp = {
  items: Ticket[];
  page: number;
  limit: number;
  total: number | null;
};

function badge(kind: 'status' | 'priority', value: string) {
  const v = (value || '').toLowerCase();
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  if (kind === 'status') {
    if (v === 'open') return `${base} bg-rose-500/15 text-rose-800 dark:text-rose-200`;
    if (v === 'pending') return `${base} bg-amber-500/15 text-amber-800 dark:text-amber-200`;
    if (v === 'in_progress') return `${base} bg-sky-500/15 text-sky-800 dark:text-sky-200`;
    if (v === 'resolved') return `${base} bg-emerald-500/15 text-emerald-800 dark:text-emerald-200`;
  }
  if (kind === 'priority') {
    if (v === 'urgent') return `${base} bg-rose-500/15 text-rose-800 dark:text-rose-200`;
    if (v === 'high') return `${base} bg-amber-500/15 text-amber-800 dark:text-amber-200`;
    if (v === 'normal') return `${base} bg-sky-500/15 text-sky-800 dark:text-sky-200`;
    if (v === 'low') return `${base} bg-black/10 text-[color:var(--color-text)]/80`;
  }
  return `${base} bg-black/10 text-[color:var(--color-text)]/80`;
}

function fmtDate(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

const SLA_WARN_HOURS = 24;
const SLA_BREACH_HOURS = 48;

function ageHours(createdAt: string | null | undefined): number | null {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return (Date.now() - d.getTime()) / (1000 * 60 * 60);
}

function fmtAge(h: number | null): string {
  if (h == null) return '—';
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m`;
  if (h < 24) return `${Math.round(h)}h`;
  const days = h / 24;
  return `${days.toFixed(1)}d`;
}

function slaBadgeFor(ticket: Ticket) {
  const st = (ticket.status || '').toLowerCase();
  if (st === 'resolved') {
    return { label: 'RESUELTO', className: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200' };
  }
  const h = ageHours(ticket.created_at);
  if (h == null) return { label: '—', className: 'bg-black/10 text-[color:var(--color-text)]/80' };
  if (h >= SLA_BREACH_HOURS)
    return { label: 'BREACH', className: 'bg-rose-500/15 text-rose-800 dark:text-rose-200' };
  if (h >= SLA_WARN_HOURS)
    return { label: 'AT RISK', className: 'bg-amber-500/15 text-amber-800 dark:text-amber-200' };
  return { label: 'OK', className: 'bg-sky-500/15 text-sky-800 dark:text-sky-200' };
}

export function AdminTicketsClient() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [q, setQ] = useState<string>('');
  const [page, setPage] = useState(1);

  const limit = 20;

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (status) sp.set('status', status);
    if (priority) sp.set('priority', priority);
    if (q.trim()) sp.set('q', q.trim());
    sp.set('page', String(page));
    sp.set('limit', String(limit));
    return sp.toString();
  }, [status, priority, q, page]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminFetch(`/api/admin/tickets?${query}`)
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return j as ApiResp;
      })
      .then((j) => {
        setItems(j.items || []);
        setTotal(typeof j.total === 'number' ? j.total : null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, [query]);

  const hasPrev = page > 1;
  const hasNext = total == null ? items.length === limit : page * limit < total;

  const ticketSignals = useMemo(
    () => [
      {
        label: 'Visible queue',
        value: total != null ? String(total) : String(items.length),
        note: 'Tickets currently represented by this filtered view.',
      },
      {
        label: 'Active now',
        value: String(items.filter((ticket) => (ticket.status || '').toLowerCase() !== 'resolved').length),
        note: 'Open, pending or in-progress cases still needing operator attention.',
      },
      {
        label: 'SLA breach',
        value: String(items.filter((ticket) => slaBadgeFor(ticket).label === 'BREACH').length),
        note: 'Cases that already crossed the breach threshold and deserve immediate review.',
      },
      {
        label: 'Urgent priority',
        value: String(items.filter((ticket) => (ticket.priority || '').toLowerCase() === 'urgent').length),
        note: 'Urgent items visible right now in the queue.',
      },
    ],
    [items, total],
  );

  return (
    <section className="space-y-4">
      <AdminOperatorWorkbench
        eyebrow="support workbench"
        title="Start from the cases that can damage trust today"
        description="Use this queue as a triage desk: handle the aging or urgent tickets first, reconnect them to conversations and bookings, then resolve only when the traveler promise is safe again."
        actions={[
          { href: '/admin/conversations', label: 'Conversations', tone: 'primary' },
          { href: '/admin/customers', label: 'Customers' },
          { href: '/admin/bookings', label: 'Bookings' },
          { href: '/admin/launch-hq', label: 'Launch HQ' },
        ]}
        signals={ticketSignals}
      />
      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <div className="text-[color:var(--color-text)]/60 text-xs">Status</div>
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className="mt-1 w-full rounded-xl border border-black/10 bg-[color:var(--color-surface)] p-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="open">open</option>
              <option value="pending">pending</option>
              <option value="in_progress">in_progress</option>
              <option value="resolved">resolved</option>
            </select>
          </div>

          <div>
            <div className="text-[color:var(--color-text)]/60 text-xs">Priority</div>
            <select
              value={priority}
              onChange={(e) => {
                setPage(1);
                setPriority(e.target.value);
              }}
              className="mt-1 w-full rounded-xl border border-black/10 bg-[color:var(--color-surface)] p-2 text-sm"
            >
              <option value="">Todas</option>
              <option value="urgent">urgent</option>
              <option value="high">high</option>
              <option value="normal">normal</option>
              <option value="low">low</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="text-[color:var(--color-text)]/60 text-xs">
              Buscar (subject/summary)
            </div>
            <input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="e.g. refund, pago, error…"
              className="mt-1 w-full rounded-xl border border-black/10 bg-[color:var(--color-surface)] p-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-black/10">
        <div className="border-b border-black/10 bg-black/5 px-4 py-3 text-sm font-semibold">
          Tickets{typeof total === 'number' ? ` (${total})` : ''}
        </div>

        {loading ? (
          <div className="text-[color:var(--color-text)]/70 p-4 text-sm">Cargando…</div>
        ) : null}

        {!loading && items.length === 0 ? (
          <div className="text-[color:var(--color-text)]/70 p-4 text-sm">No hay tickets.</div>
        ) : null}

        <div className="divide-y divide-black/10">
          {items.map((t) => (
            <Link
              key={t.id}
              href={`/admin/tickets/${t.id}`}
              className="block bg-[color:var(--color-surface)] p-4 hover:bg-black/5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={badge('status', t.status || '')}>{t.status || '—'}</span>
                    <span className={badge('priority', t.priority || '')}>{t.priority || '—'}</span>
                    <span className="text-[color:var(--color-text)]/50 text-xs">
                      #{t.id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="mt-2 line-clamp-2 text-sm font-semibold text-[color:var(--color-text)]">
                    {t.subject || '—'}
                  </div>

                  <div className="text-[color:var(--color-text)]/60 mt-1 line-clamp-2 text-xs">
                    {t.summary || '—'}
                  </div>
                </div>

                <div className="text-[color:var(--color-text)]/60 text-xs">
                  <div>Canal: {t.channel || '—'}</div>
                  <div>Creado: {fmtDate(t.created_at)}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${slaBadgeFor(t).className}`}>
                      SLA {slaBadgeFor(t).label}
                    </span>
                    <span className="text-[color:var(--color-text)]/60 text-[10px]">Edad: {fmtAge(ageHours(t.created_at))}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-[color:var(--color-text)]/70 flex items-center justify-between border-t border-black/10 bg-black/5 px-4 py-3 text-xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 disabled:opacity-50"
            disabled={!hasPrev}
            type="button"
          >
            Prev
          </button>
          <div>
            Página {page}
            {typeof total === 'number' ? ` · Total ${total}` : ''}
          </div>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5"
            disabled={!hasNext}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

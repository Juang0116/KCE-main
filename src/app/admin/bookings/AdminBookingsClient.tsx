'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { adminFetch } from '@/lib/adminFetch.client';

type BookingItem = {
  id: string;
  status: 'pending' | 'paid' | 'canceled' | string;
  stripe_session_id: string;
  total: number | null;
  currency: string | null;
  origin_currency: string | null;
  tour_price_minor: number | null;
  date: string;
  persons: number;
  customer_email: string | null;
  customer_name: string | null;
  phone: string | null;
  created_at: string;
  tour_id: string | null;
  tours?: { title: string | null; slug: string | null; city?: string | null } | null;
};

type ApiResponse = {
  items: BookingItem[];
  page: number;
  limit: number;
  total: number | null;
};

function fmtMoney(totalMinor: number | null, currency: string | null) {
  if (typeof totalMinor !== 'number') return '—';
  const cur = (currency || 'EUR').toUpperCase();
  const amount = totalMinor / 100;
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: cur }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${cur}`;
  }
}

function badge(status: string) {
  const s = (status || '').toLowerCase();
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  if (s === 'paid') return `${base} bg-emerald-500/15 text-emerald-800 dark:text-emerald-200`;
  if (s === 'pending') return `${base} bg-amber-500/15 text-amber-800 dark:text-amber-200`;
  if (s === 'canceled') return `${base} bg-rose-500/15 text-rose-800 dark:text-rose-200`;
  return `${base} bg-black/10 text-[color:var(--color-text)]/80`;
}

export function AdminBookingsClient() {
  const today = new Date().toISOString().slice(0, 10);

  const [status, setStatus] = useState<string>('');
  const [q, setQ] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState(today);
  const [tourSlug, setTourSlug] = useState('');

  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    if (q.trim()) p.set('q', q.trim());
    if (createdFrom) p.set('from', createdFrom);
    if (createdTo) p.set('to', createdTo);
    if (tourSlug.trim()) p.set('tour', tourSlug.trim());
    p.set('page', String(page));
    p.set('limit', String(limit));
    return p.toString();
  }, [status, q, createdFrom, createdTo, tourSlug, page, limit]);

  const exportHref = useMemo(() => {
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    if (q.trim()) p.set('q', q.trim());
    if (createdFrom) p.set('from', createdFrom);
    if (createdTo) p.set('to', createdTo);
    if (tourSlug.trim()) p.set('tour', tourSlug.trim());
    p.set('limit', '20000');
    return `/api/admin/bookings/export?${p.toString()}`;
  }, [status, q, createdFrom, createdTo, tourSlug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    adminFetch(`/api/admin/bookings?${query}`)
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return j as ApiResponse;
      })
      .then((j) => {
        if (cancelled) return;
        setData(j);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Error');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const total = data?.total ?? null;
  const hasPrev = page > 1;
  const hasNext = total == null ? (data?.items?.length ?? 0) === limit : page * limit < total;
  const visible = data?.items ?? [];
  const paidNow = visible.filter((item) => (item.status || '').toLowerCase() === 'paid').length;
  const pendingNow = visible.filter((item) => (item.status || '').toLowerCase() === 'pending').length;
  const withSessionNow = visible.filter((item) => !!item.stripe_session_id).length;
  const missingCustomerNow = visible.filter((item) => !item.customer_email && !item.customer_name).length;

  const nextPriority = useMemo(() => {
    if (!visible.length) return 'No hay resultados';
    if (pendingNow > 0) return 'Revisar pending';
    if (missingCustomerNow > 0) return 'Completar traza';
    return 'Validar entrega';
  }, [missingCustomerNow, pendingNow, visible.length]);

  const workbenchSignals = useMemo(
    () => [
      {
        label: 'Paid visibles',
        value: String(paidNow),
        note: 'Bookings pagados dentro del corte y filtros actuales.',
      },
      {
        label: 'Pending a revisar',
        value: String(pendingNow),
        note: 'Estas reservas pueden pedir recovery, seguimiento o confirmación adicional.',
      },
      {
        label: 'Con session trace',
        value: String(withSessionNow),
        note: 'Casos más fáciles de seguir en QA, revenue y soporte.',
      },
      {
        label: 'Prioridad operativa',
        value: nextPriority,
        note: 'Qué conviene atacar primero en esta lectura actual.',
      },
    ],
    [nextPriority, paidNow, pendingNow, withSessionNow],
  );

  const bookingActions = [
    { href: '/admin/revenue', label: 'Revenue truth', tone: 'primary' as const },
    { href: '/admin/qa', label: 'QA truth' },
    { href: '/admin/tickets', label: 'Tickets' },
    { href: '/admin/reviews', label: 'Reviews' },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 px-4">
      <AdminOperatorWorkbench
        eyebrow="bookings workbench"
        title="Read the cases that actually need intervention"
        description="Use this table as a working desk, not as a gallery: inspect pending bookings first, confirm the trace exists and only escalate when payment or delivery continuity looks uncertain."
        actions={bookingActions}
        signals={workbenchSignals}
      />

      <div className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <label className="text-sm">
              <div className="mb-1 text-[color:var(--color-text)]/70">Status</div>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                <option value="paid">paid</option>
                <option value="pending">pending</option>
                <option value="canceled">canceled</option>
              </select>
            </label>

            <label className="text-sm">
              <div className="mb-1 text-[color:var(--color-text)]/70">Desde</div>
              <input
                type="date"
                value={createdFrom}
                onChange={(e) => {
                  setCreatedFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-sm"
              />
            </label>

            <label className="text-sm">
              <div className="mb-1 text-[color:var(--color-text)]/70">Hasta</div>
              <input
                type="date"
                value={createdTo}
                onChange={(e) => {
                  setCreatedTo(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-sm"
              />
            </label>

            <label className="text-sm">
              <div className="mb-1 text-[color:var(--color-text)]/70">Tour (slug)</div>
              <input
                value={tourSlug}
                onChange={(e) => {
                  setTourSlug(e.target.value);
                  setPage(1);
                }}
                placeholder="ej: bogota-city-tour"
                className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-sm"
              />
            </label>

            <label className="text-sm">
              <div className="mb-1 text-[color:var(--color-text)]/70">Buscar</div>
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="email, nombre o session_id"
                className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <a
              href={exportHref}
              className="inline-flex items-center justify-center rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm hover:bg-[color:var(--color-surface)]"
            >
              Exportar CSV
            </a>

            <button
              onClick={() => {
                setStatus('');
                setQ('');
                setCreatedFrom('');
                setCreatedTo(today);
                setTourSlug('');
                setPage(1);
              }}
              className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm hover:bg-[color:var(--color-surface-2)]"
            >
              Limpiar filtros
            </button>

            <div className="text-sm text-[color:var(--color-text)]/70">
              {loading ? 'Cargando…' : total != null ? `${total} resultados` : 'Resultados'}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="mt-4 overflow-x-auto rounded-2xl border border-[color:var(--color-border)]">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="bg-[color:var(--color-surface-2)] text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Creada</th>
                <th className="px-4 py-3 font-semibold">Tour</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Fecha / Pax</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => {
                const tourTitle = b.tours?.title || b.tours?.slug || '—';
                const tourMeta = [b.tours?.city, b.tours?.slug].filter(Boolean).join(' · ');
                const bookingLink = b.stripe_session_id ? `/booking/${encodeURIComponent(b.stripe_session_id)}` : null;
                return (
                  <tr key={b.id} className="border-t border-[color:var(--color-border)]">
                    <td className="whitespace-nowrap px-4 py-3 text-[color:var(--color-text)]/70">
                      {new Date(b.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[color:var(--color-text)]">{tourTitle}</div>
                      <div className="mt-1 text-xs text-[color:var(--color-text)]/60">{tourMeta || b.stripe_session_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[color:var(--color-text)]">{b.customer_name || '—'}</div>
                      <div className="mt-1 text-xs text-[color:var(--color-text)]/60">{b.customer_email || '—'}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="text-[color:var(--color-text)]">{b.date}</div>
                      <div className="mt-1 text-xs text-[color:var(--color-text)]/60">{b.persons} pax</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {fmtMoney(b.total, b.currency)}
                      {b.origin_currency && b.origin_currency !== (b.currency || '').toUpperCase() ? (
                        <div className="mt-1 text-xs text-[color:var(--color-text)]/60">Origen: {b.origin_currency}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className={badge(b.status)}>{b.status}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {bookingLink ? (
                        <Link
                          href={bookingLink}
                          target="_blank"
                          className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1.5 text-xs hover:bg-[color:var(--color-surface)]"
                        >
                          Ver booking
                        </Link>
                      ) : (
                        <span className="text-[color:var(--color-text)]/60">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!loading && visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[color:var(--color-text)]/70">
                    No hay resultados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            disabled={!hasPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm disabled:opacity-50"
          >
            Anterior
          </button>

          <div className="text-sm text-[color:var(--color-text)]/70">Página {page}</div>

          <button
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}

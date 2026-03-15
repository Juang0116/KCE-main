'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { adminFetch } from '@/lib/adminFetch.client';
import { CalendarDays, Download, Search, User, RefreshCw, ExternalLink, Activity } from 'lucide-react';

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
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toFixed(0)} ${cur}`;
  }
}

function badge(status: string) {
  const s = (status || '').toLowerCase();
  const base = 'inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border';
  if (s === 'paid') return `${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-700`;
  if (s === 'pending') return `${base} border-amber-500/20 bg-amber-500/10 text-amber-700`;
  if (s === 'canceled') return `${base} border-rose-500/20 bg-rose-500/10 text-rose-700`;
  return `${base} border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/70`;
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

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const r = await adminFetch(`/api/admin/bookings?${query}`);
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setData(j as ApiResponse);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const total = data?.total ?? null;
  const pages = useMemo(() => {
    if (total == null) return null;
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

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
      { label: 'Paid visibles', value: String(paidNow), note: 'Bookings pagados dentro del corte.' },
      { label: 'Pending a revisar', value: String(pendingNow), note: 'Requieren recovery o confirmación.' },
      { label: 'Con session trace', value: String(withSessionNow), note: 'Casos trazables en revenue/soporte.' },
      { label: 'Prioridad operativa', value: nextPriority, note: 'Siguiente acción recomendada.' },
    ],
    [nextPriority, paidNow, pendingNow, withSessionNow],
  );

  return (
    <section className="mx-auto w-full max-w-7xl space-y-10 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Monitor de Reservas</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Central de facturación y control de entregas de tours.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="bookings workbench"
        title="Interviene solo cuando sea necesario"
        description="Usa esta tabla como un escritorio de trabajo: inspecciona primero las reservas 'pending', confirma que la traza exista y solo escala a soporte si la entrega o el pago parecen estar fallando."
        actions={[
          { href: '/admin/revenue', label: 'Revenue Truth', tone: 'primary' },
          { href: '/admin/tickets', label: 'Tickets' },
        ]}
        signals={workbenchSignals}
      />

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* Filtros */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between mb-8 border-b border-[var(--color-border)] pb-8">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 w-full xl:w-auto flex-1">
            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Status</div>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 font-semibold outline-none focus:border-brand-blue appearance-none cursor-pointer">
                <option value="">Todos</option><option value="paid">Pagados (Paid)</option><option value="pending">Pendientes (Pending)</option><option value="canceled">Cancelados</option>
              </select>
            </label>

            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Desde</div>
              <input type="date" value={createdFrom} onChange={(e) => { setCreatedFrom(e.target.value); setPage(1); }} className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 outline-none focus:border-brand-blue font-mono text-xs" />
            </label>

            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Hasta</div>
              <input type="date" value={createdTo} onChange={(e) => { setCreatedTo(e.target.value); setPage(1); }} className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 outline-none focus:border-brand-blue font-mono text-xs" />
            </label>

            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Tour (Slug)</div>
              <input value={tourSlug} onChange={(e) => { setTourSlug(e.target.value); setPage(1); }} placeholder="ej: bogota-city" className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-transparent px-4 outline-none focus:border-brand-blue" />
            </label>

            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Buscar</div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text)]/40" />
                <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Email, nombre..." className="w-full h-12 pl-12 rounded-xl border border-[var(--color-border)] bg-transparent px-4 outline-none focus:border-brand-blue" />
              </div>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button onClick={refresh} disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-[10px] font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-md disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Sync
            </button>
            <a href={exportHref} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--color-surface)]">
              <Download className="h-4 w-4" /> CSV
            </a>
            <button onClick={() => { setStatus(''); setQ(''); setCreatedFrom(''); setCreatedTo(today); setTourSlug(''); setPage(1); }} className="h-12 rounded-xl border border-[var(--color-border)] bg-transparent px-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--color-surface-2)] text-[var(--color-text)]/60">
              Limpiar
            </button>
          </div>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-medium text-rose-800">{error}</div>}

        {/* Tabla */}
        <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">
          <table className="w-full min-w-[1100px] text-sm text-left">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-6 py-5">Creada</th>
                <th className="px-6 py-5">Tour</th>
                <th className="px-6 py-5">Cliente</th>
                <th className="px-6 py-5">Fecha / Pax</th>
                <th className="px-6 py-5 text-right">Total</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {loading && visible.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-[var(--color-text)]/40 font-medium">Buscando reservas...</td></tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Activity className="mx-auto h-12 w-12 text-[var(--color-text)]/10 mb-4"/>
                    <div className="font-medium text-[var(--color-text)]/40">No hay reservas para estos filtros.</div>
                  </td>
                </tr>
              ) : (
                visible.map((b) => {
                  const tourTitle = b.tours?.title || b.tours?.slug || 'Tour N/A';
                  const tourMeta = [b.tours?.city, b.tours?.slug].filter(Boolean).join(' · ');
                  const bookingLink = b.stripe_session_id ? `/booking/${encodeURIComponent(b.stripe_session_id)}` : null;
                  
                  return (
                    <tr key={b.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                      <td className="px-6 py-5 align-top text-[var(--color-text)]/70 font-mono text-xs">
                        {new Date(b.created_at).toLocaleString('es-ES')}
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="font-heading text-base text-brand-blue">{tourTitle}</div>
                        <div className="mt-1 text-xs text-[var(--color-text)]/50 max-w-[200px] truncate" title={tourMeta || b.stripe_session_id}>{tourMeta || b.stripe_session_id}</div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="font-medium text-[var(--color-text)]">{b.customer_name || '—'}</div>
                        <div className="mt-1 text-xs text-[var(--color-text)]/60">{b.customer_email || '—'}</div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="flex items-center gap-2 text-[var(--color-text)] font-semibold"><CalendarDays className="h-4 w-4 text-[var(--color-text)]/40" /> {b.date}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text)]/60"><User className="h-3 w-3 text-[var(--color-text)]/40" /> {b.persons} pax</div>
                      </td>
                      <td className="px-6 py-5 align-top text-right">
                        <div className="font-heading text-lg">{fmtMoney(b.total, b.currency)}</div>
                        {b.origin_currency && b.origin_currency !== (b.currency || '').toUpperCase() && (
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">Origen: {b.origin_currency}</div>
                        )}
                      </td>
                      <td className="px-6 py-5 align-top text-center">
                        <span className={badge(b.status)}>{b.status}</span>
                      </td>
                      <td className="px-6 py-5 align-top text-right">
                        {bookingLink ? (
                          <Link href={bookingLink} target="_blank" className="inline-flex rounded-xl bg-brand-blue px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 shadow-sm">
                            Ver Ticket <ExternalLink className="ml-1.5 h-3 w-3"/>
                          </Link>
                        ) : (
                          <span className="text-xs text-[var(--color-text)]/30 font-light italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pages && pages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border)] pt-6">
            <button disabled={!hasPrev || loading} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 transition hover:bg-[var(--color-surface)]">
              ← Anterior
            </button>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
              Página {page} de {pages}
            </div>
            <button disabled={!hasNext || loading} onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 transition hover:bg-[var(--color-surface)]">
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
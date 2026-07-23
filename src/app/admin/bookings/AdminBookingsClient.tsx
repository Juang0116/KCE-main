'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Download,
  Search,
  RefreshCw,
  ExternalLink,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Banknote,
  MapPin,
  Users,
  Terminal,
  ShieldCheck as Shield,
  X,
  ShieldAlert,
} from 'lucide-react';

import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { adminFetch } from '@/lib/adminFetch.client';
import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser'; // IMPORTANTE

type BookingItem = {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'canceled' | string;
  stripe_session_id: string;
  total: number | null;
  currency: string | null;
  origin_currency: string | null;
  tour_price_minor: number | null;
  date: string;
  start_date?: string | null;
  end_date?: string | null;
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
  error?: string;
};

function fmtMoney(totalMinor: number | null, currency: string | null) {
  if (typeof totalMinor !== 'number') return '—';
  const cur = (currency || 'EUR').toUpperCase();
  const amount = totalMinor / 100;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: cur,
    maximumFractionDigits: 0,
  }).format(amount);
}

function badge(status: string) {
  const s = (status || '').toLowerCase().trim();
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-sm border';

  if (s === 'approved' || s === 'paid')
    return `${base} border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400`;
  if (s === 'pending')
    return `${base} border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-brand-yellow`;
  if (s === 'rejected' || s === 'canceled')
    return `${base} border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400`;
  return `${base} border-brand-dark/10 bg-surface-2 text-muted`;
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

  // ESTADO DEL MODAL DE IDENTIDAD
  const [idModal, setIdModal] = useState<{
    isOpen: boolean;
    loading: boolean;
    customerId: string | null;
    status: string;
    docUrl: string | null;
    email: string;
  }>({ isOpen: false, loading: false, customerId: null, status: 'none', docUrl: null, email: '' });

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

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await adminFetch(`/api/admin/bookings?${query}`);
      const j = (await r.json().catch(() => ({}))) as ApiResponse;
      if (!r.ok) throw new Error(j.error || `Error ${r.status}`);
      setData(j);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ─── FUNCIONES PARA LA RESERVA ───
  const updateStatus = async (id: string, newStatus: string) => {
    const actionEs = newStatus === 'approved' ? 'aprobar' : 'rechazar';
    if (!window.confirm(`¿Seguro que deseas ${actionEs} esta reserva?`)) return;

    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Error al actualizar el estado');
      await refresh();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  // ─── FUNCIONES PARA LA IDENTIDAD (MODAL) ───
  const openIdentityModal = async (email: string | null) => {
    if (!email) return;
    setIdModal((m) => ({ ...m, isOpen: true, loading: true, email }));
    try {
      const supabase = supabaseBrowser();
      if (!supabase) throw new Error('Supabase client no disponible');

      const { data: customer } = await supabase
        .from('customers')
        .select('id, identity_status, identity_doc_path')
        .eq('email', email)
        .maybeSingle();

      if (customer && customer.identity_doc_path) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('identity_vault').getPublicUrl(customer.identity_doc_path);
        setIdModal((m) => ({
          ...m,
          loading: false,
          customerId: customer.id,
          status: customer.identity_status,
          docUrl: publicUrl,
        }));
      } else {
        setIdModal((m) => ({
          ...m,
          loading: false,
          customerId: customer?.id || null,
          status: 'none',
          docUrl: null,
        }));
      }
    } catch (err) {
      console.error(err);
      setIdModal((m) => ({ ...m, loading: false }));
    }
  };

  const updateIdentityStatus = async (newStatus: 'verified' | 'rejected') => {
    if (!idModal.customerId) return;
    try {
      const res = await adminFetch(`/api/admin/customers/${idModal.customerId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Error al actualizar');
      setIdModal((m) => ({ ...m, status: newStatus }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const visible = data?.items ?? [];
  const signals = useMemo(() => {
    const approvedCount = visible.filter((i) => {
      const s = (i.status || '').toLowerCase().trim();
      return s === 'approved' || s === 'paid';
    }).length;
    const pendingCount = visible.filter(
      (i) => (i.status || '').toLowerCase().trim() === 'pending',
    ).length;

    return [
      {
        label: 'Aprobados',
        value: String(approvedCount),
        note: 'Reservas confirmadas.',
        icon: CheckCircle2,
      },
      {
        label: 'Pendientes',
        value: String(pendingCount),
        note: 'Requieren revisión.',
        icon: Clock,
      },
      {
        label: 'Volumen',
        value: data?.total ? String(data.total) : '0',
        note: 'Reservas totales.',
        icon: Activity,
      },
      {
        label: 'Prioridad',
        value: pendingCount > 0 ? 'Urgent' : 'Nominal',
        note: 'Acción sugerida.',
        icon: ShieldCheck,
      },
    ];
  }, [visible, data?.total]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10 pb-24 duration-700">
      {/* MODAL DE IDENTIDAD FLOTANTE */}
      {idModal.isOpen && (
        <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-brand-dark/10 bg-surface p-6 shadow-2xl dark:border-white/10">
            <div className="mb-4 flex items-center justify-between border-b border-brand-dark/5 pb-4">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-main">
                  <ShieldCheck className="size-5 text-brand-blue" /> Verificación de Identidad
                </h3>
                <p className="text-xs text-muted">{idModal.email}</p>
              </div>
              <button
                onClick={() => setIdModal((m) => ({ ...m, isOpen: false }))}
                className="rounded-full bg-surface-2 p-2 transition-colors hover:bg-brand-dark/5"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto py-2">
              {idModal.loading ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <RefreshCw className="mb-2 size-8 animate-spin" />
                  <p className="text-sm">Buscando documento...</p>
                </div>
              ) : idModal.docUrl ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 rounded-lg border border-brand-dark/5 bg-surface-2 px-3 py-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted">
                      Estado actual:
                    </span>
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-bold ${
                        idModal.status === 'verified'
                          ? 'bg-green-100 text-green-700'
                          : idModal.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {idModal.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-brand-dark/10 bg-surface-2">
                    <img
                      src={idModal.docUrl}
                      alt="Documento de identidad"
                      className="h-full w-full object-contain"
                    />
                    <a
                      href={idModal.docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                    >
                      <Button
                        variant="outline"
                        className="border-transparent bg-white text-black"
                      >
                        Abrir en grande
                      </Button>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                  <ShieldAlert className="mb-2 size-12 text-rose-500" />
                  <p className="text-sm font-bold">Sin documento</p>
                  <p className="text-xs">El cliente aún no ha subido su pasaporte.</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-brand-dark/5 pt-4">
              <Button
                variant="outline"
                onClick={() => updateIdentityStatus('rejected')}
                disabled={!idModal.docUrl || idModal.status === 'rejected'}
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                Rechazar Documento
              </Button>
              <Button
                onClick={() => updateIdentityStatus('verified')}
                disabled={!idModal.docUrl || idModal.status === 'verified'}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <CheckCircle2 className="mr-2 size-4" /> Aprobar Identidad
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 01. HEADER INSTITUCIONAL */}
      <header className="flex flex-col justify-between gap-6 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Banknote className="h-3.5 w-3.5" /> Booking Fulfillment Center
          </div>
          <h1 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
            Monitor de Reservas
          </h1>
          <p className="mt-3 max-w-2xl text-base font-light text-muted">
            Control central de operaciones. Aprueba reservas, verifica identidades y sincroniza con
            guías locales.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="h-12 rounded-full border-brand-dark/10 px-8 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-surface-2"
            asChild
          >
            <a
              href={`/api/admin/bookings/export?${query}&limit=5000`}
              target="_blank"
              rel="noreferrer"
            >
              <Download className="mr-2 h-4 w-4" /> Exportar CSV
            </a>
          </Button>
        </div>
      </header>

      {/* 02. WORKBENCH DE SEÑALES */}
      <AdminOperatorWorkbench
        eyebrow="Compliance & Revenue"
        title="Torre de Control de Reservas"
        description="Filtra por 'Pendientes' o 'Confirmados' para realizar la aprobación manual de las reservas. Al aprobarlas, las fechas quedarán bloqueadas."
        actions={[
          { href: '/admin/revenue', label: 'Ver Ledger', tone: 'primary' },
          { href: '/admin/tickets', label: 'Incidencias' },
        ]}
        signals={signals}
      />

      {error && (
        <div className="animate-in fade-in flex items-center gap-4 rounded-[var(--radius-2xl)] border border-rose-500/20 bg-rose-50 p-6 text-rose-700 shadow-sm dark:bg-rose-950/20 dark:text-rose-400">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <p className="text-sm font-bold">
            Protocolo de Error: <span className="font-light">{error}</span>
          </p>
        </div>
      )}

      {/* 03. BÓVEDA DE DATOS */}
      <section className="flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
        <div className="bg-surface-2/30 border-b border-brand-dark/5 p-8 dark:border-white/5">
          <div className="grid items-end gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                Estado Operativo
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-12 w-full cursor-pointer rounded-2xl border border-brand-dark/10 bg-surface px-4 text-sm font-bold text-main outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="paid">Pagadas (Sin aprobar)</option>
                <option value="approved">Aprobadas</option>
                <option value="rejected">Rechazadas / Canceladas</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                Fecha Inicial
              </label>
              <input
                type="date"
                value={createdFrom}
                onChange={(e) => setCreatedFrom(e.target.value)}
                className="h-12 w-full rounded-2xl border border-brand-dark/10 bg-surface px-4 text-sm text-main outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
              />
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                Fecha Final
              </label>
              <input
                type="date"
                value={createdTo}
                onChange={(e) => setCreatedTo(e.target.value)}
                className="h-12 w-full rounded-2xl border border-brand-dark/10 bg-surface px-4 text-sm text-main outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
              />
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                Búsqueda Global
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted opacity-50" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Email, Nombre..."
                  className="placeholder:text-muted/30 h-12 w-full rounded-2xl border border-brand-dark/10 bg-surface px-4 pl-11 text-sm text-main outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                />
              </div>
            </div>
            <Button
              onClick={refresh}
              disabled={loading}
              className="h-12 w-full rounded-2xl bg-brand-dark text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-lg transition-all hover:bg-brand-blue hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />{' '}
              {loading ? '...' : 'Sincronizar'}
            </Button>
          </div>
        </div>

        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-surface-2/50 border-b border-brand-dark/5 dark:border-white/5">
              <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5">Expedición / Destino</th>
                <th className="px-8 py-5">Cliente & Verificación</th>
                <th className="px-8 py-5 text-center">Viaje</th>
                <th className="px-8 py-5 text-right">Inversión</th>
                <th className="px-8 py-5 text-center">Estado</th>
                <th className="px-8 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
              {visible.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="bg-surface px-8 py-32 text-center"
                  >
                    <div className="flex flex-col items-center justify-center opacity-40 grayscale">
                      <Activity className="mb-6 h-16 w-16 text-brand-blue" />
                      <p className="font-heading text-xl tracking-tight text-main">
                        Cero Registros
                      </p>
                      <p className="mt-2 text-sm font-light text-muted">
                        No hay reservas que coincidan con los filtros.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                visible.map((b) => {
                  const currentStatus = (b.status || '').toLowerCase().trim();

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-surface-2/50 group cursor-default bg-surface transition-colors"
                    >
                      <td className="px-8 py-6 align-middle font-mono text-[10px] text-muted transition-colors group-hover:text-main">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 opacity-30" />
                          {new Date(b.created_at).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-8 py-6 align-middle">
                        <div className="max-w-[220px] truncate font-heading text-base text-main transition-colors group-hover:text-brand-blue">
                          {b.tours?.title || 'Personalized Experience'}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted">
                          <MapPin className="h-3 w-3 opacity-50" /> {b.tours?.city || 'Colombia'}
                        </div>
                      </td>
                      <td className="px-8 py-6 align-middle">
                        <div className="font-bold text-main">{b.customer_name || 'Voyager'}</div>
                        <div className="text-xs font-light text-muted">
                          {b.customer_email || '—'}
                        </div>

                        {/* BOTÓN NUEVO DE VERIFICACIÓN DE IDENTIDAD */}
                        <button
                          onClick={() => openIdentityModal(b.customer_email)}
                          className="mt-2 flex items-center gap-1 rounded-md border border-brand-blue/20 bg-brand-blue/10 px-2 py-0.5 text-[9px] font-bold text-brand-blue transition-colors hover:bg-brand-blue hover:text-white"
                        >
                          <ShieldCheck className="size-3" /> VER ID DEL CLIENTE
                        </button>
                      </td>
                      <td className="px-8 py-6 text-center align-middle">
                        <div className="bg-surface-2/80 inline-flex flex-col items-center rounded-lg border border-brand-dark/5 px-3 py-1.5 dark:border-white/5">
                          <span className="text-[11px] font-bold text-main">
                            {b.start_date && b.end_date
                              ? `${new Date(b.start_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} al ${new Date(b.end_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}`
                              : b.date || 'Sin fecha'}
                          </span>
                          <div className="mt-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">
                            <Users className="h-3 w-3" /> {b.persons} PAX
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right align-middle">
                        <div className="font-heading text-xl tracking-tight text-main">
                          {fmtMoney(b.total, b.currency)}
                        </div>
                        {b.origin_currency && b.origin_currency !== b.currency && (
                          <div className="mt-1 font-mono text-[9px] uppercase text-muted opacity-50">
                            BASE: {b.origin_currency}
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-center align-middle">
                        <span className={badge(b.status)}>
                          {currentStatus === 'approved' || currentStatus === 'paid' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {currentStatus}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center align-middle">
                        <div className="flex items-center justify-center gap-2">
                          {(currentStatus === 'pending' || currentStatus === 'paid') && (
                            <Button
                              onClick={() => updateStatus(b.id, 'approved')}
                              className="h-8 rounded-lg bg-green-600 px-3 text-xs text-white shadow-sm hover:bg-green-700"
                            >
                              Aprobar
                            </Button>
                          )}
                          {(currentStatus === 'pending' ||
                            currentStatus === 'paid' ||
                            currentStatus === 'approved') && (
                            <Button
                              variant="outline"
                              onClick={() => updateStatus(b.id, 'rejected')}
                              className="h-8 rounded-lg border-rose-200 bg-white px-3 text-xs text-rose-600 shadow-sm hover:bg-rose-50"
                            >
                              Rechazar
                            </Button>
                          )}
                          {(currentStatus === 'rejected' || currentStatus === 'canceled') && (
                            <span className="rounded-md border border-brand-dark/5 bg-surface-2 px-2 py-1 text-xs font-medium text-muted">
                              Cancelada
                            </span>
                          )}
                          {b.stripe_session_id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-muted transition-all hover:bg-brand-blue/10 hover:text-brand-blue"
                              asChild
                            >
                              <Link
                                href={`/booking/${b.stripe_session_id}`}
                                target="_blank"
                                title="Verify Gateway"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {data?.total != null && data.total > limit && (
          <footer className="bg-surface-2/30 flex items-center justify-between border-t border-brand-dark/5 p-6 dark:border-white/5">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Page <span className="text-main">{page}</span> of {Math.ceil(data.total / limit)}{' '}
              <span className="mx-3 opacity-30">|</span> Records: {data.total}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="h-10 w-10 rounded-xl border-brand-dark/10"
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page * limit >= (data.total ?? 0) || loading}
                onClick={() => setPage((p) => p + 1)}
                className="h-10 w-10 rounded-xl border-brand-dark/10"
              >
                →
              </Button>
            </div>
          </footer>
        )}
      </section>

      <footer className="mt-12 flex items-center justify-center gap-10 border-t border-brand-dark/10 pt-12 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-3 w-3" /> Booking Ops v5.2
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Shield className="h-3 w-3" /> Fulfillment Protocol Active
        </div>
      </footer>
    </div>
  );
}

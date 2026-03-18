'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  CalendarDays, Download, Search, 
  RefreshCw, ExternalLink, Activity, 
  CheckCircle2, Clock, AlertCircle,
  ShieldCheck
} from 'lucide-react';

import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { adminFetch } from '@/lib/adminFetch.client';
import { Button } from '@/components/ui/Button';

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
  error?: string;
};

function fmtMoney(totalMinor: number | null, currency: string | null) {
  if (typeof totalMinor !== 'number') return '—';
  const cur = (currency || 'EUR').toUpperCase();
  const amount = totalMinor / 100;
  return new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: cur, 
    maximumFractionDigits: 0 
  }).format(amount);
}

function badge(status: string) {
  const s = (status || '').toLowerCase();
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm border';
  
  if (s === 'paid') return `${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-700`;
  if (s === 'pending') return `${base} border-amber-500/20 bg-amber-500/10 text-amber-700`;
  if (s === 'canceled') return `${base} border-rose-500/20 bg-rose-500/10 text-rose-700`;
  return `${base} border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/40`;
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

  useEffect(() => { refresh(); }, [refresh]);

  const visible = data?.items ?? [];
  const signals = useMemo(() => {
    const paidCount = visible.filter(i => i.status === 'paid').length;
    const pendingCount = visible.filter(i => i.status === 'pending').length;
    
    return [
      { label: 'Confirmados', value: String(paidCount), note: 'Pagos liquidados.', icon: CheckCircle2 },
      { label: 'Pendientes', value: String(pendingCount), note: 'Requieren seguimiento.', icon: Clock },
      { label: 'Tracción', value: data?.total ? String(data.total) : '0', note: 'Reservas totales en vista.', icon: Activity },
      { label: 'Prioridad', value: pendingCount > 0 ? 'Recovery' : 'Entrega', note: 'Acción sugerida.', icon: ShieldCheck },
    ];
  }, [visible, data?.total]);

  return (
    <div className="space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER INSTITUCIONAL */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue/50">
            <Activity className="h-3 w-3" /> Booking Fulfillment Center
          </div>
          <h1 className="font-heading text-4xl text-brand-blue">Monitor de Reservas</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/50 font-light max-w-xl">
            Control maestro de ventas y logística. Aquí es donde los sueños de los viajeros se convierten en itinerarios confirmados.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-full" asChild>
            <a href={`/api/admin/bookings/export?${query}&limit=5000`} target="_blank" rel="noreferrer">
              <Download className="mr-2 h-4 w-4" /> Exportar CSV
            </a>
          </Button>
        </div>
      </header>

      {/* WORKBENCH DE SEÑALES OPERATIVAS */}
      <AdminOperatorWorkbench
        eyebrow="Compliance & Revenue"
        title="Escritorio de Control"
        description="Filtra por 'pending' para iniciar campañas de recuperación de carrito o valida los 'paid' para asegurar que el guía local ya tenga la notificación de salida."
        actions={[
          { href: '/admin/revenue', label: 'Ver Revenue Truth', tone: 'primary' },
          { href: '/admin/tickets', label: 'Gestionar Tickets' }
        ]}
        signals={signals}
      />

      {/* Manejo de Errores Visual */}
      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 flex items-center gap-4 text-rose-700 shadow-inner">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <p className="text-sm font-bold">Alerta del Sistema: <span className="font-light">{error}</span></p>
        </div>
      )}

      {/* LA BÓVEDA DE DATOS */}
      <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl overflow-hidden">
        
        {/* BARRA DE FILTROS TÁCTICOS */}
        <div className="p-8 pb-10 border-b border-[var(--color-border)] mb-4">
          <div className="grid gap-6 xl:grid-cols-[1fr_auto]">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase text-[var(--color-text)]/40 ml-1">Estado</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-xs font-bold text-brand-blue outline-none cursor-pointer">
                  <option value="">Cualquiera</option>
                  <option value="paid">Confirmados</option>
                  <option value="pending">Pendientes</option>
                  <option value="canceled">Cancelados</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase text-[var(--color-text)]/40 ml-1">Desde</label>
                <input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} className="w-full h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-4 text-[11px] outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase text-[var(--color-text)]/40 ml-1">Hasta</label>
                <input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} className="w-full h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-4 text-[11px] outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase text-[var(--color-text)]/40 ml-1">Buscador</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-blue/30" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Email o Nombre..." className="w-full h-11 pl-10 rounded-xl border border-[var(--color-border)] bg-transparent px-4 text-xs outline-none focus:ring-2 focus:ring-brand-blue/5" />
                </div>
              </div>

              <div className="flex items-end">
                <button onClick={refresh} disabled={loading} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-brand-dark text-brand-yellow text-[10px] font-bold uppercase tracking-widest transition hover:scale-[1.02] shadow-lg disabled:opacity-50">
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="overflow-x-auto px-6 pb-6">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm min-w-[1000px]">
              <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40">
                  <th className="px-8 py-6">Fecha Registro</th>
                  <th className="px-8 py-6">Experiencia / Tour</th>
                  <th className="px-8 py-6">Viajero (Cliente)</th>
                  <th className="px-8 py-6 text-center">Itinerario</th>
                  <th className="px-8 py-6 text-right">Inversión</th>
                  <th className="px-8 py-6 text-center">Estado</th>
                  <th className="px-8 py-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-24 text-center">
                      <Activity className="mx-auto h-12 w-12 text-brand-blue/10 mb-4" />
                      <p className="text-lg font-light text-[var(--color-text)]/30 italic">No se encontraron reservas con el filtro actual.</p>
                    </td>
                  </tr>
                ) : (
                  visible.map((b) => (
                    <tr key={b.id} className="group transition-all hover:bg-brand-blue/[0.01]">
                      <td className="px-8 py-6 align-top">
                        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-text)]/60">
                          <Clock className="h-3 w-3 opacity-30" />
                          {new Date(b.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-8 py-6 align-top">
                        <div className="font-heading text-base text-brand-blue group-hover:text-brand-yellow transition-colors">
                          {b.tours?.title || 'Tour General'}
                        </div>
                        <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">
                          {b.tours?.city || 'Colombia'}
                        </div>
                      </td>
                      <td className="px-8 py-6 align-top">
                        <div className="font-bold text-brand-dark">{b.customer_name || '—'}</div>
                        <div className="text-xs font-light text-[var(--color-text)]/60">{b.customer_email || 'N/A'}</div>
                      </td>
                      <td className="px-8 py-6 align-top text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-brand-blue">
                            <CalendarDays className="h-3 w-3 opacity-40" /> {b.date}
                          </span>
                          <span className="mt-1 text-[10px] font-bold uppercase tracking-tighter text-[var(--color-text)]/30">
                            {b.persons} Viajeros
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 align-top text-right">
                        <div className="font-heading text-lg text-brand-dark">{fmtMoney(b.total, b.currency)}</div>
                        {b.origin_currency && b.origin_currency !== b.currency && (
                          <div className="mt-1 text-[9px] font-mono text-[var(--color-text)]/30 uppercase">
                            Original: {b.origin_currency}
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 align-top text-center">
                        <span className={badge(b.status)}>
                          {b.status === 'paid' && <CheckCircle2 className="h-3 w-3" />}
                          {b.status === 'pending' && <AlertCircle className="h-3 w-3" />}
                          {b.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 align-top text-right">
                        {b.stripe_session_id ? (
                          <Button variant="ghost" size="sm" className="rounded-xl hover:bg-brand-blue/5 text-brand-blue" asChild>
                            <Link href={`/booking/${b.stripe_session_id}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        ) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINACIÓN ESTRATÉGICA */}
        {data?.total != null && data.total > limit && (
          <footer className="p-8 flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/50">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/30">
              Página {page} de {Math.ceil(data.total / limit)} <span className="mx-2">·</span> Total: {data.total}
            </div>
            <div className="flex gap-2">
              <button 
                disabled={page <= 1 || loading} 
                onClick={() => setPage(p => p - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white shadow-sm transition hover:bg-brand-blue hover:text-white disabled:opacity-30"
              >
                ←
              </button>
              <button 
                disabled={page * limit >= (data.total ?? 0) || loading} 
                onClick={() => setPage(p => p + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white shadow-sm transition hover:bg-brand-blue hover:text-white disabled:opacity-30"
              >
                →
              </button>
            </div>
          </footer>
        )}
      </section>

    </div>
  );
}
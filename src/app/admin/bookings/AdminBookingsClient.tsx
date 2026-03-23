/* src/app/admin/bookings/AdminBookingsClient.tsx */
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  CalendarDays, Download, Search, 
  RefreshCw, ExternalLink, Activity, 
  CheckCircle2, Clock, AlertCircle,
  ShieldCheck, Banknote, MapPin, Users,
  Terminal, ShieldCheck as Shield
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
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-sm border';
  
  if (s === 'paid') return `${base} border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400`;
  if (s === 'pending') return `${base} border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-brand-yellow`;
  if (s === 'canceled') return `${base} border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400`;
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
      { label: 'Pendientes', value: String(pendingCount), note: 'Recovery activo.', icon: Clock },
      { label: 'Volumen', value: data?.total ? String(data.total) : '0', note: 'Reservas totales.', icon: Activity },
      { label: 'Prioridad', value: pendingCount > 0 ? 'Urgent' : 'Nominal', note: 'Acción sugerida.', icon: ShieldCheck },
    ];
  }, [visible, data?.total]);

  return (
    <div className="space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 01. HEADER INSTITUCIONAL */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Banknote className="h-3.5 w-3.5" /> Booking Fulfillment Center
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tight">Monitor de Reservas</h1>
          <p className="mt-3 text-base text-muted font-light max-w-2xl">
            Control central de operaciones. Monitorea pagos, sincroniza con guías locales y gestiona la logística de tus viajeros en tiempo real.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-full shadow-sm hover:bg-surface-2 border-brand-dark/10 h-12 px-8 text-[10px] font-bold uppercase tracking-widest transition-all" asChild>
            <a href={`/api/admin/bookings/export?${query}&limit=5000`} target="_blank" rel="noreferrer">
              <Download className="mr-2 h-4 w-4" /> Exportar CSV
            </a>
          </Button>
        </div>
      </header>

      {/* 02. WORKBENCH DE SEÑALES */}
      <AdminOperatorWorkbench
        eyebrow="Compliance & Revenue"
        title="Torre de Control de Ventas"
        description="Filtra por 'Pendientes' para realizar el seguimiento manual o valida los 'Confirmados' para enviar el itinerario final al viajero."
        actions={[
          { href: '/admin/revenue', label: 'Ver Ledger', tone: 'primary' },
          { href: '/admin/tickets', label: 'Incidencias' }
        ]}
        signals={signals}
      />

      {error && (
        <div className="rounded-[var(--radius-2xl)] border border-rose-500/20 bg-rose-50 dark:bg-rose-950/20 p-6 flex items-center gap-4 text-rose-700 dark:text-rose-400 shadow-sm animate-in fade-in">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <p className="text-sm font-bold">Protocolo de Error: <span className="font-light">{error}</span></p>
        </div>
      )}

      {/* 03. LA BÓVEDA DE DATOS */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden flex flex-col">
        
        {/* Barra de Filtros Tácticos */}
        <div className="p-8 border-b border-brand-dark/5 dark:border-white/5 bg-surface-2/30">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Estado Operativo</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-12 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface px-4 text-sm font-bold text-main outline-none cursor-pointer focus:ring-2 focus:ring-brand-blue/20 transition-all">
                <option value="">Todos los estados</option>
                <option value="paid">Confirmados (Paid)</option>
                <option value="pending">Pendientes (Pending)</option>
                <option value="canceled">Cancelados</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Fecha Inicial</label>
              <input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} className="w-full h-12 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface px-4 text-sm text-main outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Fecha Final</label>
              <input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} className="w-full h-12 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface px-4 text-sm text-main outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Búsqueda Global</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted opacity-50" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Email, Nombre..." className="w-full h-12 pl-11 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface px-4 text-sm text-main outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all placeholder:text-muted/30" />
              </div>
            </div>

            <Button onClick={refresh} disabled={loading} className="w-full h-12 rounded-2xl bg-brand-dark text-brand-yellow hover:bg-brand-blue hover:text-white shadow-lg disabled:opacity-50 text-[10px] font-bold uppercase tracking-widest transition-all">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> {loading ? '...' : 'Sincronizar'}
            </Button>
          </div>
        </div>

        {/* Tabla de Resultados */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[1100px]">
            <thead className="bg-surface-2/50 border-b border-brand-dark/5 dark:border-white/5">
              <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5">Expedición / Destino</th>
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5 text-center">Viaje</th>
                <th className="px-8 py-5 text-right">Inversión</th>
                <th className="px-8 py-5 text-center">Estado</th>
                <th className="px-8 py-5 text-center">Stripe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
              {visible.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center bg-surface">
                    <div className="flex flex-col items-center justify-center opacity-40 grayscale">
                      <Activity className="h-16 w-16 text-brand-blue mb-6" />
                      <p className="text-xl font-heading text-main tracking-tight">Cero Registros</p>
                      <p className="text-sm font-light text-muted mt-2">No hay reservas que coincidan con la telemetría actual.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                visible.map((b) => (
                  <tr key={b.id} className="group transition-colors hover:bg-surface-2/50 cursor-default bg-surface">
                    <td className="px-8 py-6 align-middle font-mono text-[10px] text-muted group-hover:text-main transition-colors">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 opacity-30" />
                        {new Date(b.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-8 py-6 align-middle">
                      <div className="font-heading text-base text-main group-hover:text-brand-blue transition-colors truncate max-w-[220px]">
                        {b.tours?.title || 'Personalized Experience'}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted">
                        <MapPin className="h-3 w-3 opacity-50" /> {b.tours?.city || 'Colombia'}
                      </div>
                    </td>
                    <td className="px-8 py-6 align-middle">
                      <div className="font-bold text-main">{b.customer_name || 'Voyager'}</div>
                      <div className="text-xs font-light text-muted">{b.customer_email || '—'}</div>
                    </td>
                    <td className="px-8 py-6 align-middle text-center">
                      <div className="inline-flex flex-col items-center bg-surface-2/80 px-3 py-1.5 rounded-lg border border-brand-dark/5 dark:border-white/5">
                        <span className="text-[11px] font-bold text-main">{b.date}</span>
                        <div className="mt-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">
                          <Users className="h-3 w-3" /> {b.persons} PAX
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 align-middle text-right">
                      <div className="font-heading text-xl text-main tracking-tight">{fmtMoney(b.total, b.currency)}</div>
                      {b.origin_currency && b.origin_currency !== b.currency && (
                        <div className="mt-1 text-[9px] font-mono text-muted uppercase opacity-50">
                          BASE: {b.origin_currency}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 align-middle text-center">
                      <span className={badge(b.status)}>
                        {b.status === 'paid' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {b.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 align-middle text-center">
                      {b.stripe_session_id ? (
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-brand-blue/10 hover:text-brand-blue text-muted transition-all" asChild>
                          <Link href={`/booking/${b.stripe_session_id}`} target="_blank" title="Verify Gateway">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : <span className="text-muted opacity-20">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Premium */}
        {data?.total != null && data.total > limit && (
          <footer className="p-6 flex items-center justify-between border-t border-brand-dark/5 dark:border-white/5 bg-surface-2/30">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Page <span className="text-main">{page}</span> of {Math.ceil(data.total / limit)} <span className="mx-3 opacity-30">|</span> Records: {data.total}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)} className="rounded-xl border-brand-dark/10 h-10 w-10">
                ←
              </Button>
              <Button variant="outline" size="icon" disabled={page * limit >= (data.total ?? 0) || loading} onClick={() => setPage(p => p + 1)} className="rounded-xl border-brand-dark/10 h-10 w-10">
                →
              </Button>
            </div>
          </footer>
        )}
      </section>

      {/* 04. FOOTER TÉCNICO (Estilo SOC-2 / Auditoría) */}
      <footer className="mt-12 flex items-center justify-center gap-10 border-t border-brand-dark/10 dark:border-white/10 pt-12 opacity-40 transition-opacity hover:opacity-100 duration-500">
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
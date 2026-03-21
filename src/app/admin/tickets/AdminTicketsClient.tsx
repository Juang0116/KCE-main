'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clock, LifeBuoy, Search, ShieldCheck } from 'lucide-react';

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
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest';
  if (kind === 'status') {
    if (v === 'open') return `${base} border border-rose-500/20 bg-rose-500/10 text-rose-700`;
    if (v === 'pending') return `${base} border border-amber-500/20 bg-amber-500/10 text-amber-700`;
    if (v === 'in_progress') return `${base} border border-brand-blue/20 bg-brand-blue/10 text-brand-blue`;
    if (v === 'resolved') return `${base} border border-emerald-500/20 bg-emerald-500/10 text-emerald-700`;
  }
  if (kind === 'priority') {
    if (v === 'urgent') return `${base} border border-rose-500/20 bg-rose-500/10 text-rose-700`;
    if (v === 'high') return `${base} border border-amber-500/20 bg-amber-500/10 text-amber-700`;
    if (v === 'normal') return `${base} border border-sky-500/20 bg-sky-500/10 text-sky-700`;
    if (v === 'low') return `${base} border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]/70`;
  }
  return `${base} border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]/70`;
}

function fmtDate(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
    return { label: 'RESUELTO', className: 'text-emerald-600 bg-emerald-50' };
  }
  const h = ageHours(ticket.created_at);
  if (h == null) return { label: '—', className: 'text-[color:var(--color-text)]/50 bg-[color:var(--color-surface-2)]' };
  if (h >= SLA_BREACH_HOURS)
    return { label: 'BREACH', className: 'text-white bg-rose-600 animate-pulse' };
  if (h >= SLA_WARN_HOURS)
    return { label: 'AT RISK', className: 'text-amber-800 bg-amber-200' };
  return { label: 'OK', className: 'text-brand-blue bg-brand-blue/10' };
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
        note: 'Tickets representados en esta vista.',
      },
      {
        label: 'Active now',
        value: String(items.filter((ticket) => (ticket.status || '').toLowerCase() !== 'resolved').length),
        note: 'Casos abiertos esperando atención.',
      },
      {
        label: 'SLA breach',
        value: String(items.filter((ticket) => slaBadgeFor(ticket).label === 'BREACH').length),
        note: 'Casos críticos con límite de tiempo excedido.',
      },
      {
        label: 'Urgent priority',
        value: String(items.filter((ticket) => (ticket.priority || '').toLowerCase() === 'urgent').length),
        note: 'Elementos marcados como prioridad alta.',
      },
    ],
    [items, total],
  );

  return (
    <div className="space-y-10 pb-20">
      
      {/* 1. CABECERA EJECUTIVA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Support Desk</h1>
          <p className="mt-2 text-sm text-[color:var(--color-text)]/60 font-light">
            Protege la confianza. Gestiona incidentes y conversaciones con los clientes.
          </p>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{error}</div>}

      <AdminOperatorWorkbench
        eyebrow="Triage Station"
        title="Prioriza Casos Críticos"
        description="Resuelve primero los tickets que están en BREACH o tienen prioridad urgente para evitar daños a la marca."
        actions={[
          { href: '/admin/conversations', label: 'Ver Conversaciones', tone: 'primary' },
          { href: '/admin/bookings', label: 'Revisar Reservas' }
        ]}
        signals={ticketSignals}
      />

      {/* 2. FILTROS */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-sm">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 block mb-2">Estado</label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2.5 text-sm outline-none focus:border-brand-blue appearance-none">
            <option value="">Todos</option>
            <option value="open">Abierto</option>
            <option value="pending">Pendiente</option>
            <option value="in_progress">En Progreso</option>
            <option value="resolved">Resuelto</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 block mb-2">Prioridad</label>
          <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2.5 text-sm outline-none focus:border-brand-blue appearance-none">
            <option value="">Todas</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="normal">Normal</option>
            <option value="low">Baja</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 block mb-2">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--color-text)]/30" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Asunto, resumen, ID..." className="w-full pl-10 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2.5 text-sm outline-none focus:border-brand-blue" />
          </div>
        </div>
      </div>

      {/* 3. MATRIZ DE TICKETS */}
      <div className="overflow-x-auto rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm">
        <div className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-6 py-4 flex justify-between items-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50">
            Bandeja Principal {typeof total === 'number' ? `(${total} tickets)` : ''}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[color:var(--color-text-muted)] text-sm">Cargando tickets...</div>
        ) : items.length === 0 ? (
          <div className="p-20 text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-emerald-500/30 mb-4" />
            <h3 className="font-heading text-xl text-[color:var(--color-text)]">Todo en orden</h3>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/50">No hay tickets pendientes en esta vista.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {items.map((t) => (
              <Link key={t.id} href={`/admin/tickets/${t.id}`} className="block bg-[color:var(--color-surface)] p-6 transition-colors hover:bg-[color:var(--color-surface-2)]/60">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={badge('status', t.status || '')}>{t.status || '—'}</span>
                      <span className={badge('priority', t.priority || '')}>{t.priority || '—'}</span>
                      <span className="text-[10px] font-mono text-[color:var(--color-text)]/30">#{t.id.slice(0, 8)}</span>
                    </div>
                    <div className="text-base font-semibold text-[color:var(--color-text)] leading-tight">{t.subject || 'Sin Asunto'}</div>
                    <div className="text-[color:var(--color-text)]/60 mt-1 line-clamp-1 text-sm font-light">{t.summary || 'Sin resumen...'}</div>
                  </div>

                  <div className="shrink-0 flex flex-col items-start sm:items-end text-right">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${slaBadgeFor(t).className}`}>
                      <Clock className="h-3 w-3" /> SLA: {slaBadgeFor(t).label}
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--color-text)]/50">Creado: {fmtDate(t.created_at)}</div>
                    <div className="mt-1 text-xs font-semibold text-[color:var(--color-text-muted)]">Abierto hace {fmtAge(ageHours(t.created_at))}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* PAGINACIÓN */}
        {total != null && total > limit && (
          <div className="flex items-center justify-between border-t border-[color:var(--color-border)] px-6 py-4 bg-[color:var(--color-surface-2)]/50">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!hasPrev || loading} className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50">
              ← Anterior
            </button>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50">
              Página {page}
            </div>
            <button onClick={() => setPage((p) => p + 1)} disabled={!hasNext || loading} className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50">
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState } from 'react';
import { Download, Search, CheckCircle2, RefreshCw, XCircle, Clock, AlertTriangle, Filter } from 'lucide-react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';

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

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function badgePriority(p: string) {
  const base = 'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border';
  if (p === 'urgent') return `${base} border-rose-500/20 bg-rose-500/10 text-rose-700`;
  if (p === 'high') return `${base} border-amber-500/20 bg-amber-500/10 text-amber-700`;
  if (p === 'normal') return `${base} border-sky-500/20 bg-sky-500/10 text-sky-700`;
  return `${base} border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]/50`;
}

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
    } catch { }
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

  const tasksSignals = useMemo(() => {
    const active = items.filter(t => t.status !== 'done' && t.status !== 'canceled');
    const urgent = active.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
    const isOverdue = (d: string | null) => {
      if(!d) return false;
      const due = new Date(d).getTime();
      return !Number.isNaN(due) && due < Date.now();
    };
    const overdueCount = active.filter(t => isOverdue(t.due_at)).length;

    return [
      { label: 'Tareas Abiertas', value: String(active.length), note: 'Pendientes por resolver.' },
      { label: 'Alta Prioridad', value: String(urgent), note: 'Marcadas como urgent o high.' },
      { label: 'Vencidas (SLA)', value: String(overdueCount), note: 'Tareas que excedieron su tiempo límite.' }
    ];
  }, [items]);

  return (
    <div className="space-y-10 pb-20">
      
      {/* Cabecera Ejecutiva */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Centro de Tareas</h1>
          <p className="mt-2 text-sm text-[color:var(--color-text)]/60 font-light">
            Control de follow-ups, pendientes operativos y resolución de problemas.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="task management"
        title="El Sistema Nervioso Central"
        description="Aquí se reflejan todas las acciones manuales requeridas (Deals, Tickets, Operaciones). Una tarea vencida es dinero en riesgo o un cliente molesto."
        actions={[
          { href: '/admin/sales', label: 'Sales Cockpit', tone: 'primary' },
          { href: '/admin/tickets', label: 'Support Desk' }
        ]}
        signals={tasksSignals}
      />

      <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* Scope Context Banner */}
        {(dealId || ticketId) && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue flex items-center gap-1.5"><Filter className="h-3 w-3"/> Contexto Filtrado:</span>
              {dealId && <span className="rounded-lg bg-white/80 px-3 py-1.5 text-[10px] font-mono font-bold text-brand-blue border border-brand-blue/15 shadow-sm">DEAL: {dealId.slice(0, 8)}</span>}
              {ticketId && <span className="rounded-lg bg-white/80 px-3 py-1.5 text-[10px] font-mono font-bold text-brand-blue border border-brand-blue/15 shadow-sm">TICKET: {ticketId.slice(0, 8)}</span>}
            </div>
            <button
              onClick={() => {
                setDealId(''); setTicketId('');
                try {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('deal_id'); url.searchParams.delete('ticket_id');
                  window.history.replaceState({}, '', url.toString());
                } catch {}
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[color:var(--color-surface)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-rose-600 transition hover:bg-rose-50 border border-rose-500/20 shadow-sm"
            >
              <XCircle className="h-3 w-3"/> Quitar Filtro
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col xl:flex-row gap-4 xl:items-end justify-between mb-8 border-b border-[color:var(--color-border)] pb-6">
          <div className="grid gap-4 sm:grid-cols-3 w-full xl:w-2/3">
            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50">Estado</div>
              <select className="h-12 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 font-semibold outline-none appearance-none cursor-pointer" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Todos</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50">Prioridad</div>
              <select className="h-12 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 font-semibold outline-none appearance-none cursor-pointer" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="">Todas</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50">Buscar</div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--color-text-muted)]" />
                <input className="h-12 w-full pl-12 rounded-xl border border-[color:var(--color-border)] bg-transparent px-4 outline-none focus:border-brand-blue transition-colors text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Título de tarea..." />
              </div>
            </label>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button onClick={load} disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50 shadow-sm">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Buscando...' : 'Aplicar'}
            </button>
            <a href={exportUrl} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 text-xs font-bold uppercase tracking-widest text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]">
              <Download className="h-4 w-4" /> CSV
            </a>
          </div>
        </div>

        {error ? <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{error}</div> : null}

        {/* Tabla */}
        <div className="overflow-x-auto rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[color:var(--color-surface-2)] border-b border-[color:var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50">
                <th className="px-6 py-5">Info Tarea</th>
                <th className="px-6 py-5">Contexto (Deal)</th>
                <th className="px-6 py-5 text-center">Estado</th>
                <th className="px-6 py-5 text-center">Prioridad</th>
                <th className="px-6 py-5 text-right">Vencimiento (SLA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[color:var(--color-surface)]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-[color:var(--color-text-muted)]">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-[color:var(--color-text)]/50 mb-4" />
                    No se encontraron tareas.
                  </td>
                </tr>
              ) : null}

              {items.map((t) => {
                const isOverdue = t.due_at && new Date(t.due_at).getTime() < Date.now() && t.status !== 'done' && t.status !== 'canceled';
                
                return (
                  <tr key={t.id} className={`transition-colors hover:bg-[color:var(--color-surface-2)]/50 ${isOverdue ? 'bg-rose-500/5 hover:bg-rose-500/10' : ''}`}>
                    <td className="px-6 py-5 align-top">
                      <div className="font-heading text-lg text-brand-blue line-clamp-2 pr-4">{t.title}</div>
                      <div className="mt-2 text-[10px] font-mono text-[color:var(--color-text)]/30">ID: {t.id.slice(0, 8)}</div>
                    </td>

                    <td className="px-6 py-5 align-top">
                      {t.deals ? (
                        <>
                          <div className="font-medium text-[color:var(--color-text)] line-clamp-1">{t.deals.title || 'Deal Sin Nombre'}</div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-[color:var(--color-text)]/60">
                            {t.deals.tour_slug && <span className="bg-[color:var(--color-surface-2)] px-2 py-0.5 rounded-md border border-[color:var(--color-border)]">{t.deals.tour_slug}</span>}
                            <span className="uppercase tracking-widest text-[10px]">{t.deals.stage}</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs italic text-[color:var(--color-text-muted)]">—</span>
                      )}
                    </td>

                    <td className="px-6 py-5 align-top text-center">
                      <select className="h-10 w-full max-w-[140px] rounded-xl border border-[color:var(--color-border)] bg-transparent px-3 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-brand-blue transition-colors cursor-pointer appearance-none text-center" value={t.status} onChange={(e) => patchTask(t.id, { status: e.target.value })}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>

                    <td className="px-6 py-5 align-top text-center">
                      <select className={`h-10 w-full max-w-[120px] rounded-xl border border-[color:var(--color-border)] bg-transparent px-3 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-brand-blue transition-colors cursor-pointer appearance-none text-center ${t.priority === 'urgent' ? 'text-rose-600 border-rose-500/30 bg-rose-50' : ''}`} value={t.priority} onChange={(e) => patchTask(t.id, { priority: e.target.value })}>
                        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>

                    <td className="px-6 py-5 align-top text-right">
                      <div className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-[color:var(--color-text)]/70'}`}>
                        {fmtDate(t.due_at)}
                      </div>
                      {isOverdue && (
                        <div className="mt-1 inline-flex rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rose-600">
                          Vencida
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
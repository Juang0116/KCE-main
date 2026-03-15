'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { ShieldAlert, AlertTriangle, Activity, RefreshCw, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

type Incident = {
  id: string;
  request_id: string | null;
  severity: 'info' | 'warn' | 'critical';
  kind: string;
  actor: string | null;
  path: string | null;
  method: string | null;
  ip: string | null;
  message: string;
  fingerprint: string;
  status: 'open' | 'acked' | 'resolved';
  count: number;
  first_seen_at: string;
  last_seen_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  meta: any;
};

type Resp = { items: Incident[]; requestId: string };

function badgeSeverity(s: string) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border';
  if (s === 'critical') return `${base} border-rose-500/40 bg-rose-500/10 text-rose-700`;
  if (s === 'warn') return `${base} border-amber-500/40 bg-amber-500/10 text-amber-800`;
  return `${base} border-sky-500/30 bg-sky-500/10 text-sky-700`;
}

function badgeStatus(s: string) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border';
  if (s === 'open') return `${base} border-rose-500/40 bg-rose-500/10 text-rose-700`;
  if (s === 'acked') return `${base} border-amber-500/40 bg-amber-500/10 text-amber-800`;
  if (s === 'resolved') return `${base} border-emerald-500/40 bg-emerald-500/10 text-emerald-700`;
  return `${base} border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/70`;
}

export function AdminIncidentsClient() {
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');
  const [status, setStatus] = useState<string>('open');
  const [severity, setSeverity] = useState<string>('');
  const [kind, setKind] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const qs = new URLSearchParams();
      if (status) qs.set('status', status);
      if (severity) qs.set('severity', severity);
      if (kind) qs.set('kind', kind);
      qs.set('limit', '100');
      const r = await adminFetch(`/api/admin/ops/incidents?${qs.toString()}`, { cache: 'no-store' });
      const j = (await r.json().catch(() => null)) as Resp | any;
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setItems(Array.isArray(j?.items) ? j.items : []);
      setRequestId(String(j?.requestId || ''));
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const mutate = async (id: string, action: 'ack' | 'resolve') => {
    try {
      setErr('');
      const r = await adminFetch(`/api/admin/ops/incidents/${id}/${action}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      await load();
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kinds = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) s.add(it.kind);
    return Array.from(s).sort();
  }, [items]);

  const incidentSignals = useMemo(() => [
    { label: 'Visibles', value: String(items.length), note: 'Incidentes en la vista actual.' },
    { label: 'Críticos (Open)', value: String(items.filter(i => i.severity === 'critical' && i.status === 'open').length), note: 'Requieren atención inmediata.' },
    { label: 'Filtro Actual', value: status.toUpperCase() || 'TODOS', note: 'Estado de resolución.' },
  ], [items, status]);

  return (
    <div className="space-y-10 pb-20">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Centro de Incidentes</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Monitoreo de excepciones, errores y alertas operativas del sistema.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Incident Response"
        title="Triaje y Resolución"
        description="Reconoce (Ack) los incidentes para indicar que estás investigando, y resuélvelos cuando el parche esté en producción. Los errores críticos disparan notificaciones automáticas."
        actions={[
          { href: '/admin/ops/notifications', label: 'Simulador de Alertas', tone: 'primary' },
          { href: '/admin/system', label: 'Sanidad del Servidor' }
        ]}
        signals={incidentSignals}
      />

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* Filtros */}
        <div className="flex flex-col xl:flex-row gap-4 xl:items-end justify-between mb-8 border-b border-[var(--color-border)] pb-6">
          <div className="grid gap-4 sm:grid-cols-3 w-full xl:w-2/3">
            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Estado</div>
              <select className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 font-semibold outline-none focus:border-brand-blue appearance-none cursor-pointer" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Todos</option>
                <option value="open">Abiertos (Open)</option>
                <option value="acked">En Revisión (Acked)</option>
                <option value="resolved">Resueltos (Resolved)</option>
              </select>
            </label>

            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Severidad</div>
              <select className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 font-semibold outline-none focus:border-brand-blue appearance-none cursor-pointer" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="">Todas</option>
                <option value="critical">Crítica (Critical)</option>
                <option value="warn">Advertencia (Warn)</option>
                <option value="info">Informativa (Info)</option>
              </select>
            </label>

            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Clase (Kind)</div>
              <select className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 font-semibold outline-none focus:border-brand-blue appearance-none cursor-pointer" value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="">Todos</option>
                {kinds.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button type="button" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50 shadow-md" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Sincronizando...' : 'Refrescar'}
            </button>
          </div>
        </div>

        {err && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}

        {/* Tabla */}
        <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-5 py-4">Última Vez / Ruta</th>
                <th className="px-5 py-4 text-center">Estado / Sev</th>
                <th className="px-5 py-4">Fallo (Kind & Message)</th>
                <th className="px-5 py-4 text-center">Count</th>
                <th className="px-5 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {loading && items.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-[var(--color-text)]/40 font-medium">Cargando incidentes...</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <ShieldCheck className="mx-auto h-12 w-12 text-[var(--color-text)]/10 mb-4" />
                    <div className="text-sm font-medium text-[var(--color-text)]/40">Sistemas operativos. No hay incidentes para esta vista.</div>
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-5 py-4 align-top">
                      <div className="font-semibold text-[var(--color-text)] flex items-center gap-1.5"><Clock className="h-3 w-3 opacity-50"/> {new Date(it.last_seen_at).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="mt-1 text-[10px] font-mono text-[var(--color-text)]/50 max-w-[180px] truncate" title={it.path || ''}>{it.path || '—'}</div>
                    </td>
                    
                    <td className="px-5 py-4 align-top text-center space-y-1.5">
                      <div><span className={badgeStatus(it.status)}>{it.status}</span></div>
                      <div><span className={badgeSeverity(it.severity)}>{it.severity}</span></div>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="font-mono text-[10px] font-bold text-brand-blue mb-1 uppercase tracking-widest">{it.kind}</div>
                      <div className="font-medium text-[var(--color-text)]/80 text-sm leading-relaxed max-w-[400px] line-clamp-2" title={it.message}>{it.message}</div>
                      <div className="mt-2 text-[9px] font-mono text-[var(--color-text)]/40 truncate max-w-[400px]">ID: {it.fingerprint}</div>
                    </td>

                    <td className="px-5 py-4 align-top text-center">
                      <span className="font-heading text-lg text-[var(--color-text)]/70">{it.count}</span>
                    </td>

                    <td className="px-5 py-4 align-top text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link href={`/admin/ops/runbooks#${encodeURIComponent(it.kind)}`} className="flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)]">
                          Runbook
                        </Link>
                        {it.status === 'open' && (
                          <button type="button" className="flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-amber-700 transition hover:bg-amber-500/20" onClick={() => void mutate(it.id, 'ack')}>
                            Ack
                          </button>
                        )}
                        {it.status !== 'resolved' && (
                          <button type="button" className="flex items-center justify-center rounded-xl bg-emerald-500 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-emerald-600 shadow-sm" onClick={() => void mutate(it.id, 'resolve')}>
                            Resolver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {requestId && <div className="mt-6 text-[10px] font-mono text-[var(--color-text)]/40 uppercase tracking-widest text-right">Req ID: {requestId}</div>}
      </div>
    </div>
  );
}
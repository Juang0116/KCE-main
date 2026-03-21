'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  ShieldAlert, AlertTriangle, Activity, RefreshCw, 
  CheckCircle2, Clock, ShieldCheck, Terminal, 
  Filter, Search, ArrowUpRight, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border shadow-sm';
  if (s === 'critical') return `${base} border-rose-500/40 bg-rose-500/10 text-rose-700 animate-pulse`;
  if (s === 'warn') return `${base} border-amber-500/40 bg-amber-500/10 text-amber-800`;
  return `${base} border-sky-500/30 bg-sky-500/10 text-sky-700`;
}

function badgeStatus(s: string) {
  const base = 'inline-flex items-center rounded-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border';
  if (s === 'open') return `${base} border-rose-500/40 bg-rose-500/5 text-rose-600`;
  if (s === 'acked') return `${base} border-amber-500/40 bg-amber-500/5 text-amber-700`;
  if (s === 'resolved') return `${base} border-emerald-500/40 bg-emerald-500/5 text-emerald-600`;
  return `${base} border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text-muted)]`;
}

export function AdminIncidentsClient() {
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');
  const [status, setStatus] = useState<string>('open');
  const [severity, setSeverity] = useState<string>('');
  const [kind, setKind] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const qs = new URLSearchParams({ limit: '100' });
      if (status) qs.set('status', status);
      if (severity) qs.set('severity', severity);
      if (kind) qs.set('kind', kind);
      
      const r = await adminFetch(`/api/admin/ops/incidents?${qs.toString()}`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || `Node Error: ${r.status}`);
      setItems(Array.isArray(j?.items) ? j.items : []);
      setRequestId(String(j?.requestId || ''));
    } catch (e: any) {
      setErr(e.message || 'Error de conexión con el nodo de incidentes.');
    } finally {
      setLoading(false);
    }
  }, [status, severity, kind]);

  const mutate = async (id: string, action: 'ack' | 'resolve') => {
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${id}/${action}`, { method: 'POST' });
      if (!r.ok) throw new Error(`Falla en transición: ${r.status}`);
      await load();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  useEffect(() => { load(); }, [load]);

  const kinds = useMemo(() => Array.from(new Set(items.map(i => i.kind))).sort(), [items]);

  const incidentSignals = useMemo(() => [
    { label: 'Señales Activas', value: String(items.length), note: 'Eventos bajo el radar actual.' },
    { label: 'Critical Open', value: String(items.filter(i => i.severity === 'critical' && i.status === 'open').length), note: 'Requieren triaje inmediato.' },
    { label: 'Filtro Operativo', value: status.toUpperCase() || 'MODO GLOBAL', note: 'Estado de resolución.' },
  ], [items, status]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER DE INTELIGENCIA OPERATIVA */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10 px-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <ShieldAlert className="h-3.5 w-3.5" /> Stability Lane: /incident-response
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            Centro de <span className="text-brand-yellow italic font-light">Incidentes</span>
          </h1>
          <p className="mt-4 text-base text-[color:var(--color-text)]/50 font-light max-w-2xl italic">
            Monitor de resiliencia sistémica. Rastrea excepciones, fallos de infraestructura y alertas 
            operativas en tiempo real.
          </p>
        </div>
      </header>

      <AdminOperatorWorkbench
        eyebrow="Stability Protocol"
        title="Triaje y Mitigación Forense"
        description="Acepta (Ack) para informar que el nodo está bajo investigación. Resuelve solo cuando el parche esté verificado en producción."
        actions={[
          { href: '/admin/ops/notifications', label: 'Dashboard de Alertas', tone: 'primary' },
          { href: '/admin/system/health', label: 'Sanidad de Servidor' }
        ]}
        signals={incidentSignals}
      />

      {/* FILTROS TÁCTICOS (BÓVEDA) */}
      <section className="rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-2xl overflow-hidden relative">
        <div className="p-8 pb-10 border-b border-[color:var(--color-border)]">
          <div className="flex flex-col xl:flex-row gap-6 xl:items-end justify-between">
            <div className="grid gap-6 sm:grid-cols-3 w-full xl:w-4/5">
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1">Estado del Evento</label>
                <div className="relative group">
                  <Activity className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                  <select className="w-full h-14 pl-12 pr-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-sm font-bold text-brand-blue outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/5 transition-all" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">Todos los Estados</option>
                    <option value="open">ABIERTOS (OPEN)</option>
                    <option value="acked">EN REVISIÓN (ACKED)</option>
                    <option value="resolved">RESUELTOS (RESOLVED)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1">Nivel de Gravedad</label>
                <div className="relative group">
                  <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                  <select className="w-full h-14 pl-12 pr-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-sm font-bold text-brand-blue outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/5 transition-all" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                    <option value="">Cualquier Severidad</option>
                    <option value="critical">CRÍTICA (CRITICAL)</option>
                    <option value="warn">ADVERTENCIA (WARN)</option>
                    <option value="info">INFORMATIVA (INFO)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1">Clase de Error (Kind)</label>
                <div className="relative group">
                  <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                  <select className="w-full h-14 pl-12 pr-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-sm font-bold text-brand-blue outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/5 transition-all" value={kind} onChange={(e) => setKind(e.target.value)}>
                    <option value="">Todas las Clases</option>
                    {kinds.map((k) => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

            </div>

            <Button onClick={load} disabled={loading} className="h-14 rounded-2xl px-8 bg-brand-dark text-brand-yellow shadow-xl hover:scale-105 transition-transform disabled:opacity-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
            </Button>
          </div>
        </div>

        {err && (
          <div className="mx-8 mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 flex items-center gap-4 text-rose-700 animate-in zoom-in-95">
            <Zap className="h-6 w-6 opacity-40" />
            <p className="text-sm font-medium">{err}</p>
          </div>
        )}

        {/* TABLA DE INCIDENCIAS */}
        <div className="overflow-x-auto px-6 py-8">
          <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden shadow-sm">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-[color:var(--color-surface-2)] border-b border-[color:var(--color-border)]">
                <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                  <th className="px-8 py-6">Rastro Temporal / Ruta</th>
                  <th className="px-8 py-6 text-center">Severidad & Estado</th>
                  <th className="px-8 py-6">Fallo Operativo</th>
                  <th className="px-8 py-6 text-center">Hits</th>
                  <th className="px-8 py-6 text-right">Maniobras</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {loading && items.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-24 text-center animate-pulse text-xs font-bold uppercase tracking-widest text-brand-blue/20">Interrogando al núcleo operativo...</td></tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center text-[color:var(--color-text)]/50 italic">
                      <ShieldCheck className="mx-auto h-12 w-12 opacity-10 mb-4" />
                      Sistemas operativos. No se han detectado anomalías.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id} className="group transition-all hover:bg-brand-blue/[0.01]">
                      <td className="px-8 py-6 align-top">
                        <div className="font-bold text-[color:var(--color-text)] flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 opacity-30" />
                          {new Date(it.last_seen_at).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="mt-2 font-mono text-[10px] text-brand-blue/60 bg-brand-blue/5 px-2 py-1 rounded-md inline-block max-w-[200px] truncate" title={it.path || ''}>
                          {it.path || '/root'}
                        </div>
                      </td>

                      <td className="px-8 py-6 align-top text-center space-y-3">
                        <div><span className={badgeSeverity(it.severity)}>{it.severity}</span></div>
                        <div><span className={badgeStatus(it.status)}>{it.status}</span></div>
                      </td>

                      <td className="px-8 py-6 align-top">
                        <div className="font-mono text-[10px] font-bold text-brand-blue mb-2 uppercase tracking-widest flex items-center gap-2">
                           <Terminal className="h-3 w-3 opacity-40" /> {it.kind}
                        </div>
                        <div className="font-medium text-[color:var(--color-text)] leading-relaxed max-w-[450px] line-clamp-2 italic" title={it.message}>
                          "{it.message}"
                        </div>
                        <div className="mt-2 text-[9px] font-mono text-[color:var(--color-text)]/50 uppercase tracking-tighter">Fingerprint: {it.fingerprint.slice(0, 16)}...</div>
                      </td>

                      <td className="px-8 py-6 align-top text-center">
                        <span className="font-heading text-2xl text-[color:var(--color-text-muted)] group-hover:text-rose-600 transition-colors">{it.count}</span>
                      </td>

                      <td className="px-8 py-6 align-top">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link href={`/admin/ops/incidents/${it.id}`} className="h-10 px-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[9px] font-bold uppercase tracking-widest text-brand-blue flex items-center gap-2 hover:bg-brand-blue hover:text-white transition-all shadow-sm">
                            Detalle <ArrowUpRight className="h-3 w-3" />
                          </Link>
                          {it.status === 'open' && (
                            <button onClick={() => mutate(it.id, 'ack')} className="h-10 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold uppercase tracking-widest text-amber-700 hover:bg-amber-500/20 transition-all">
                              Ack
                            </button>
                          )}
                          {it.status !== 'resolved' && (
                            <button onClick={() => mutate(it.id, 'resolve')} className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg">
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
        </div>

        {requestId && <div className="mx-8 mt-2 text-[9px] font-mono text-[color:var(--color-text)]/50 uppercase tracking-[0.3em] text-right">Trace ID: {requestId}</div>}
      </section>

      {/* FOOTER DE INTEGRIDAD */}
      <footer className="mt-12 flex items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldAlert className="h-3.5 w-3.5" /> Active Threat Monitoring
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Activity className="h-3.5 w-3.5" /> Registry Node v2.8
        </div>
      </footer>

    </div>
  );
}
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Terminal,
  Filter,
  Search,
  ArrowUpRight,
  Zap,
  Hash,
  Database,
  ChevronRight,
  Cpu,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TIPADO DEL NODO DE INCIDENTES ---
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

// --- HELPERS DE UI ---
function badgeSeverity(s: string) {
  const base =
    'inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border shadow-sm';
  if (s === 'critical') return `${base} border-red-500/40 bg-red-500/10 text-red-700 animate-pulse`;
  if (s === 'warn') return `${base} border-amber-500/40 bg-amber-500/10 text-amber-800`;
  return `${base} border-sky-500/30 bg-sky-500/10 text-sky-700`;
}

function badgeStatus(s: string) {
  const base =
    'inline-flex items-center rounded-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border';
  if (s === 'open')
    return `${base} border-red-500/40 bg-red-500/5 text-red-600 font-black ring-4 ring-red-500/5`;
  if (s === 'acked') return `${base} border-amber-500/40 bg-amber-500/5 text-amber-700`;
  if (s === 'resolved') return `${base} border-green-500/40 bg-green-500/5 text-green-600`;
  return `${base} border-brand-dark/10 bg-surface-2 text-muted`;
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

      const r = await adminFetch(`/api/admin/ops/incidents?${qs.toString()}`, {
        cache: 'no-store',
      });
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

  useEffect(() => {
    void load();
  }, [load]);

  const kinds = useMemo(() => Array.from(new Set(items.map((i) => i.kind))).sort(), [items]);

  const incidentSignals = useMemo(
    () => [
      { label: 'Alertas Activas', value: String(items.length), note: 'Eventos bajo el radar.' },
      {
        label: 'Critical Open',
        value: String(items.filter((i) => i.severity === 'critical' && i.status === 'open').length),
        note: 'Requieren triaje inmediato.',
      },
      { label: 'SLA Status', value: 'NOMINAL', note: 'Tiempo de respuesta óptimo.' },
    ],
    [items],
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-32 duration-1000">
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <ShieldAlert className="h-3.5 w-3.5" /> Stability Lane: /incident-response
          </div>
          <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-6xl">
            Centro de <span className="font-light italic text-brand-yellow">Incidentes</span>
          </h1>
          <p className="mt-2 max-w-2xl text-base font-light leading-relaxed text-muted">
            Monitor de resiliencia sistémica para Knowing Cultures S.A.S. Rastrea excepciones de
            código, fallos de infraestructura y anomalías operativas en tiempo real.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => void load()}
            disabled={loading}
            variant="outline"
            className="h-12 rounded-full border-brand-dark/10 px-8 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-surface-2"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin text-brand-blue' : ''}`}
            />{' '}
            Sincronizar Radar
          </Button>
        </div>
      </header>

      {/* 02. WORKBENCH OPERATIVO */}
      <AdminOperatorWorkbench
        eyebrow="Stability Protocol"
        title="Triaje y Mitigación Forense"
        description="Acepta (Ack) para informar al comando central que el nodo está bajo investigación. Resuelve solo cuando la corrección haya sido validada en producción."
        actions={[
          { href: '/admin/events', label: 'Ver Trazas Forenses', tone: 'primary' },
          { href: '/admin/qa', label: 'Monitor de Integridad' },
        ]}
        signals={incidentSignals}
      />

      {/* 03. INSTRUMENTACIÓN DE FILTROS (LA BÓVEDA) */}
      <section className="relative flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
        <div className="bg-surface-2/30 border-b border-brand-dark/5 p-8 dark:border-white/5">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="grid w-full gap-6 sm:grid-cols-3 lg:w-4/5">
              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                  Estado del Evento
                </label>
                <div className="relative">
                  <Activity className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue opacity-40" />
                  <select
                    className="h-12 w-full cursor-pointer appearance-none rounded-2xl border border-brand-dark/10 bg-surface pl-12 pr-6 text-sm font-bold text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">Todos los Estados</option>
                    <option value="open">ABIERTOS (OPEN)</option>
                    <option value="acked">EN REVISIÓN (ACKED)</option>
                    <option value="resolved">RESUELTOS (RESOLVED)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                  Nivel de Gravedad
                </label>
                <div className="relative">
                  <AlertTriangle className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue opacity-40" />
                  <select
                    className="h-12 w-full cursor-pointer appearance-none rounded-2xl border border-brand-dark/10 bg-surface pl-12 pr-6 text-sm font-bold text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                  >
                    <option value="">Cualquier Severidad</option>
                    <option value="critical">CRÍTICA (CRITICAL)</option>
                    <option value="warn">ADVERTENCIA (WARN)</option>
                    <option value="info">INFORMATIVA (INFO)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                  Clase de Error (Node_Kind)
                </label>
                <div className="relative">
                  <Terminal className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue opacity-40" />
                  <select
                    className="h-12 w-full cursor-pointer appearance-none rounded-2xl border border-brand-dark/10 bg-surface pl-12 pr-6 text-sm font-bold text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                  >
                    <option value="">Todas las Clases</option>
                    {kinds.map((k) => (
                      <option
                        key={k}
                        value={k}
                      >
                        {k.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {err && (
          <div className="animate-in slide-in-from-top-2 mx-8 mt-6 flex items-center gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-5 text-sm font-bold text-red-700 shadow-sm dark:bg-red-950/10 dark:text-red-400">
            <Flame className="h-6 w-6 opacity-60" />
            <p className="font-light">Error de Enlace: {err}</p>
          </div>
        )}

        {/* TABLA DE INCIDENCIAS (LA BÓVEDA) */}
        <div className="custom-scrollbar overflow-x-auto px-2 pb-6">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-surface-2/50 border-b border-brand-dark/5 dark:border-white/5">
              <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                <th className="px-8 py-5">Rastro Temporal / Nodo</th>
                <th className="px-8 py-5 text-center">Clasificación</th>
                <th className="px-8 py-5">Fallo Operativo</th>
                <th className="px-8 py-5 text-center">Hits</th>
                <th className="px-8 py-5 text-right">Mando Táctico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
              {loading && items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="animate-pulse bg-surface px-8 py-40 text-center text-[11px] font-bold uppercase tracking-[0.5em] text-muted"
                  >
                    Interrogando al búnker de logs...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="bg-surface px-8 py-40 text-center"
                  >
                    <ShieldCheck className="mx-auto mb-6 h-16 w-16 text-brand-blue opacity-10" />
                    <p className="font-heading text-xl tracking-tight text-main opacity-30">
                      Cero Anomalías Detectadas
                    </p>
                    <p className="mt-2 text-sm font-light italic text-muted">
                      El sistema está operando bajo parámetros nominales.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr
                    key={it.id}
                    className="hover:bg-surface-2/50 group cursor-default bg-surface transition-colors"
                  >
                    <td className="px-8 py-8 align-top">
                      <div className="flex items-center gap-3 font-bold text-main">
                        <Clock className="h-4 w-4 opacity-30" />
                        {new Date(it.last_seen_at).toLocaleDateString('es-CO', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div
                        className="mt-3 inline-block max-w-[250px] truncate rounded-lg border border-brand-blue/10 bg-brand-blue/5 px-3 py-1.5 font-mono text-[10px] font-bold text-brand-blue shadow-inner"
                        title={it.path || ''}
                      >
                        {it.method || 'GET'} {it.path || '/root'}
                      </div>
                    </td>

                    <td className="space-y-3 px-8 py-8 text-center align-top">
                      <div>
                        <span className={badgeSeverity(it.severity)}>{it.severity}</span>
                      </div>
                      <div>
                        <span className={badgeStatus(it.status)}>{it.status}</span>
                      </div>
                    </td>

                    <td className="px-8 py-8 align-top">
                      <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-blue">
                        <Terminal className="h-3.5 w-3.5 opacity-40" /> {it.kind}
                      </div>
                      <p className="line-clamp-3 max-w-[450px] border-l-2 border-brand-blue/10 pl-5 font-medium italic leading-relaxed text-main opacity-80">
                        &quot;{it.message}&quot;
                      </p>
                      <div className="mt-4 flex items-center gap-3 font-mono text-[9px] uppercase tracking-tighter text-muted opacity-40">
                        <Hash className="h-3 w-3" /> Fingerprint: {it.fingerprint.slice(0, 20)}...
                      </div>
                    </td>

                    <td className="px-8 py-8 text-center align-top">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-heading text-4xl tracking-tighter text-main transition-colors group-hover:text-red-600">
                          {it.count}
                        </span>
                        <span className="text-[9px] font-bold uppercase text-muted opacity-40">
                          Eventos
                        </span>
                      </div>
                    </td>

                    <td className="px-8 py-8 align-top">
                      <div className="flex flex-col items-end gap-3">
                        <Link
                          href={`/admin/ops/incidents/${it.id}`}
                          className="group/btn flex h-11 items-center gap-2 rounded-xl bg-brand-dark px-6 text-[9px] font-bold uppercase tracking-widest text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95"
                        >
                          Analizar Detalle{' '}
                          <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        </Link>

                        <div className="flex gap-2">
                          {it.status === 'open' && (
                            <button
                              onClick={() => void mutate(it.id, 'ack')}
                              className="h-10 rounded-xl border border-brand-dark/10 bg-surface-2 px-4 text-[9px] font-bold uppercase tracking-widest text-muted transition-all hover:border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-700"
                            >
                              Asumir (Ack)
                            </button>
                          )}
                          {it.status !== 'resolved' && (
                            <button
                              onClick={() => void mutate(it.id, 'resolve')}
                              className="h-10 rounded-xl bg-green-600 px-4 text-[9px] font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-green-700 active:scale-95"
                            >
                              Resolver
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {requestId && (
          <div className="bg-surface-2/50 border-t border-brand-dark/5 p-6 text-right font-mono text-[9px] uppercase tracking-[0.4em] text-muted">
            Active Trace ID: {requestId}
          </div>
        )}
      </section>

      {/* FOOTER DE INTEGRIDAD CORPORATIVA */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldAlert className="h-4 w-4 text-red-500" /> Active Threat Monitoring
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Database className="h-4 w-4 text-brand-blue" /> Registry Node v2.8
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Activity className="h-4 w-4 text-brand-yellow" /> Operational Sovereignty
        </div>
      </footer>
    </div>
  );
}

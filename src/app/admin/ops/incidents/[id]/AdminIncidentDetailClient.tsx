'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch.client';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Save,
  Activity,
  Settings,
  Network,
  ArrowLeft,
  XCircle,
  Terminal,
  User,
  Database,
  Zap,
  ShieldCheck,
  Flame,
  Hash,
  ChevronRight,
  Layout,
  Info,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE INCIDENCIA ---
type Incident = {
  id: string;
  request_id: string | null;
  severity: 'info' | 'warn' | 'critical';
  kind: string;
  status: string;
  message: string;
  actor: string | null;
  path: string | null;
  method: string | null;
  ip: string | null;
  user_agent: string | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  count: number | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  meta: any;
};

type Update = {
  id: string;
  incident_id: string;
  kind: 'note' | 'action' | 'status';
  actor: string | null;
  message: string;
  meta: any;
  created_at: string;
};

type Postmortem = {
  incident_id: string;
  owner: string | null;
  summary: string | null;
  customer_impact: string | null;
  root_cause: string | null;
  timeline: string | null;
  what_went_well: string | null;
  what_went_wrong: string | null;
  action_items: any[];
  updated_at?: string | null;
};

type DetailResp = {
  ok: boolean;
  requestId: string;
  incident: Incident;
  updates: Update[];
  postmortem: Postmortem | null;
  error?: string;
};

// --- HELPERS ---
function fmt(ts: string | null | undefined) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('es-CO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return ts;
  }
}

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
  if (s === 'open') return `${base} border-red-500/40 bg-red-500/5 text-red-600`;
  if (s === 'acked') return `${base} border-amber-500/40 bg-amber-500/5 text-amber-700`;
  if (s === 'resolved') return `${base} border-green-500/40 bg-green-500/5 text-green-600`;
  return `${base} border-brand-dark/10 bg-surface-2 text-muted`;
}

export function AdminIncidentDetailClient({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [detail, setDetail] = useState<DetailResp | null>(null);
  const [note, setNote] = useState('');
  const [noteKind, setNoteKind] = useState<'note' | 'action' | 'status'>('note');

  const [pm, setPm] = useState<Postmortem>({
    incident_id: id,
    owner: '',
    summary: '',
    customer_impact: '',
    root_cause: '',
    timeline: '',
    what_went_well: '',
    what_went_wrong: '',
    action_items: [],
  });

  const load = useCallback(async () => {
    setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || `Error nodo: ${r.status}`);
      setDetail(j);
      if (j.postmortem) setPm({ ...pm, ...j.postmortem });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, pm]);

  useEffect(() => {
    load();
  }, [id]);

  const mutateAction = async (endpoint: string) => {
    setLoading(true);
    setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}/${endpoint}`, {
        method: 'POST',
      });
      if (!r.ok) throw new Error(`Falla en transición de estado: ${r.status}`);
      await load();
    } catch (e: any) {
      setErr(e.message);
      setLoading(false);
    }
  };

  const addUpdate = async () => {
    const msg = note.trim();
    if (!msg) return;
    setLoading(true);
    setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}/updates`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: noteKind, message: msg }),
      });
      if (!r.ok) throw new Error('Error al inyectar actualización');
      setNote('');
      await load();
    } catch (e: any) {
      setErr(e.message);
      setLoading(false);
    }
  };

  const savePostmortem = async () => {
    setLoading(true);
    setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}/postmortem`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(pm),
      });
      if (!r.ok) throw new Error('Fallo al consolidar postmortem');
      await load();
    } catch (e: any) {
      setErr(e.message);
      setLoading(false);
    }
  };

  if (loading && !detail) {
    return (
      <div className="flex animate-pulse flex-col items-center justify-center gap-6 py-40">
        <Activity className="h-16 w-16 text-brand-blue opacity-20" />
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          Retrieving Forensic Data...
        </p>
      </div>
    );
  }

  const inc = detail?.incident;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto w-full max-w-[1400px] space-y-10 pb-32 duration-1000">
      {/* 01. HEADER DE COMANDO */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <Link
            href="/admin/ops/incidents"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue transition-transform hover:translate-x-[-4px]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Operations Center: /incidents
          </Link>
          <div className="space-y-2">
            <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-6xl">
              Análisis <span className="font-light italic text-brand-yellow">Forense</span>
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <div className="rounded-lg border border-brand-dark/5 bg-surface-2 px-3 py-1 font-mono text-[10px] text-muted">
                UUID: {id}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-[10px] font-bold uppercase text-brand-blue">
                <Cpu className="h-3 w-3" /> Kernel Node 01
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button
            onClick={load}
            disabled={loading}
            variant="outline"
            className="h-14 rounded-full border-brand-dark/10 bg-surface px-8 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-surface-2"
          >
            <RefreshCw className={`mr-3 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
            Nodo
          </Button>
          {inc?.status === 'open' && (
            <Button
              onClick={() => mutateAction('ack')}
              disabled={loading}
              className="h-14 rounded-full bg-brand-yellow px-8 text-[10px] font-bold uppercase tracking-widest text-brand-dark shadow-pop transition-all hover:scale-105 active:scale-95"
            >
              <Zap className="mr-3 h-4 w-4 fill-current" /> Asumir Mando (ACK)
            </Button>
          )}
          {(inc?.status === 'open' || inc?.status === 'acked') && (
            <Button
              onClick={() => mutateAction('resolve')}
              disabled={loading}
              className="h-14 rounded-full bg-green-600 px-10 text-[10px] font-bold uppercase tracking-widest text-white shadow-pop transition-all hover:bg-green-700 active:scale-95"
            >
              <ShieldCheck className="mr-3 h-5 w-5" /> Resolver Incidencia
            </Button>
          )}
        </div>
      </header>

      {err && (
        <div className="animate-in slide-in-from-top-2 flex items-center gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-6 font-bold text-red-700 shadow-sm dark:bg-red-950/10 dark:text-red-400">
          <Flame className="h-6 w-6 opacity-60" />
          <p className="text-sm font-medium">
            Falla de Red Crítica: <span className="font-light">{err}</span>
          </p>
        </div>
      )}

      {/* 02. MÉTRICAS DE INCIDENCIA (BÓVEDA) */}
      {inc && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[2.2rem] border border-brand-dark/5 bg-surface p-8 shadow-soft dark:border-white/5">
            <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-40">
              Clasificación Operativa
            </p>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase opacity-40">Severidad</span>{' '}
                <span className={badgeSeverity(inc.severity)}>{inc.severity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase opacity-40">Estatus</span>{' '}
                <span className={badgeStatus(inc.status)}>{inc.status}</span>
              </div>
              <div className="border-t border-brand-dark/5 pt-5 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-blue dark:border-white/5">
                <Hash className="mr-1 inline h-3 w-3" /> {inc.kind}
              </div>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-brand-dark/5 bg-surface p-8 shadow-soft dark:border-white/5">
            <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-40">
              Telemetría Temporal
            </p>
            <div className="space-y-4 font-mono text-[11px] text-main">
              <div className="border-b border-brand-dark/5 pb-3 dark:border-white/5">
                <span className="mb-1 block text-[9px] font-bold uppercase opacity-40">
                  Detección inicial
                </span>{' '}
                {fmt(inc.first_seen_at)}
              </div>
              <div className="border-b border-brand-dark/5 pb-3 dark:border-white/5">
                <span className="mb-1 block text-[9px] font-bold uppercase opacity-40">
                  Último pulso
                </span>{' '}
                {fmt(inc.last_seen_at)}
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[9px] font-bold uppercase opacity-40">Hits Totales</span>
                <span className="rounded bg-red-500/5 px-2 py-0.5 font-bold text-red-600 dark:text-red-400">
                  {inc.count} EVENTOS
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-brand-dark/5 bg-surface p-8 shadow-soft dark:border-white/5 lg:col-span-2">
            <p className="mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-40">
              <Network className="h-4 w-4 text-brand-blue" /> Red & Atribución
            </p>
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-3">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">
                  Endpoint de Falla
                </span>
                <div className="truncate rounded-2xl border border-brand-dark/5 bg-surface-2 p-4 font-mono text-[11px] font-bold text-brand-blue shadow-inner dark:border-white/5">
                  <span className="mr-2 opacity-40">{inc.method || 'ERR'}</span>{' '}
                  {inc.path || '/root'}
                </div>
              </div>
              <div className="space-y-3">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">
                  Origen Técnico
                </span>
                <div className="truncate rounded-2xl border border-brand-dark/5 bg-surface-2 p-4 font-mono text-[11px] text-main shadow-inner dark:border-white/5">
                  <User className="mr-2 inline h-3 w-3 opacity-30" /> {inc.actor || 'SYSTEM'} ·{' '}
                  {inc.ip || 'INTERNAL_ADDR'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 03. TRAZA DEL ERROR (TERMINAL) */}
      {inc && (
        <section className="group relative overflow-hidden rounded-[2.5rem] border border-red-500/20 bg-red-500/[0.02] p-8 shadow-pop md:p-12">
          <div className="pointer-events-none absolute -right-8 -top-8 opacity-[0.02] transition-transform group-hover:scale-110">
            <AlertTriangle className="h-64 w-64 text-red-500" />
          </div>
          <header className="mb-8 flex items-center gap-4 text-red-800 dark:text-red-400">
            <Terminal className="h-6 w-6" />
            <h3 className="font-heading text-3xl tracking-tight">System Error Traceback</h3>
          </header>
          <div className="relative">
            <pre className="custom-scrollbar max-h-[400px] overflow-y-auto whitespace-pre-wrap rounded-3xl border border-red-500/10 bg-surface p-8 font-mono text-sm leading-relaxed text-red-900/80 shadow-inner selection:bg-red-500/20 dark:text-red-400/80">
              {inc.message}
            </pre>
            <div className="absolute right-4 top-4 h-3 w-3 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          </div>
          <footer className="mt-8">
            <Link
              className="inline-flex items-center gap-3 rounded-2xl bg-brand-dark px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95"
              href={`/admin/ops/runbooks#${inc.kind}`}
            >
              <Activity className="h-4 w-4" /> Ejecutar Runbook de Mitigación
            </Link>
          </footer>
        </section>
      )}

      {/* 04. POSTMORTEM & LOG (PROCESO OPERATIVO) */}
      <div className="grid gap-10 lg:grid-cols-[1fr_450px]">
        {/* DOCUMENTACIÓN POSTMORTEM (BÓVEDA ESTRATÉGICA) */}
        <section className="relative space-y-12 overflow-hidden rounded-[3rem] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5 md:p-16">
          <div className="pointer-events-none absolute right-0 top-0 p-10 opacity-[0.02]">
            <Database className="h-48 w-48 text-brand-blue" />
          </div>

          <header className="relative z-10 flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 sm:flex-row sm:items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
                <Layout className="h-4 w-4" /> Root Cause Analysis
              </div>
              <h2 className="font-heading text-4xl tracking-tight text-main">
                Reporte de Postmortem
              </h2>
              <p className="text-[10px] font-bold uppercase italic tracking-widest text-muted opacity-40">
                Incident Lifecycle Management · mmxxvi
              </p>
            </div>
            <Button
              onClick={savePostmortem}
              disabled={loading}
              className="group h-14 rounded-2xl bg-brand-dark px-10 text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95"
            >
              <Save className="mr-3 h-4 w-4 transition-transform group-hover:scale-110" />{' '}
              Consolidar Registro
            </Button>
          </header>

          <div className="relative z-10 grid gap-10 sm:grid-cols-2">
            <div className="space-y-3 sm:col-span-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                Operador Responsable (Owner)
              </label>
              <div className="group relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-blue opacity-30 transition-opacity group-focus-within:opacity-100" />
                <input
                  className="h-14 w-full rounded-2xl border border-brand-dark/10 bg-surface-2 pl-12 pr-6 text-sm font-bold text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                  value={pm.owner || ''}
                  onChange={(e) => setPm({ ...pm, owner: e.target.value })}
                  placeholder="Nombre del Nodo de Comando"
                />
              </div>
            </div>

            <div className="space-y-3 sm:col-span-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                Impacto Sistémico al Cliente
              </label>
              <textarea
                className="custom-scrollbar h-32 w-full resize-none rounded-[2rem] border border-brand-dark/10 bg-surface-2 p-6 text-sm font-light italic leading-relaxed text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                value={pm.customer_impact || ''}
                onChange={(e) => setPm({ ...pm, customer_impact: e.target.value })}
                placeholder="Describe la degradación del servicio percibida por los viajeros..."
              />
            </div>

            <div className="space-y-3 sm:col-span-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                Cronología Forense (Timeline)
              </label>
              <div className="relative">
                <textarea
                  className="custom-scrollbar h-48 w-full resize-none rounded-[2.5rem] border border-white/5 bg-[#0a0a0a] p-8 font-mono text-xs leading-relaxed text-emerald-500 shadow-2xl outline-none transition-all selection:bg-brand-blue/30"
                  value={pm.timeline || ''}
                  onChange={(e) => setPm({ ...pm, timeline: e.target.value })}
                  placeholder="12:01 - Spike detectado en pasarela Stripe..."
                />
                <div className="absolute left-4 top-4 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-600">
                <CheckCircle2 className="h-4 w-4 opacity-50" /> Puntos de Estabilidad
              </label>
              <textarea
                className="custom-scrollbar h-40 w-full resize-none rounded-[2rem] border border-green-500/20 bg-green-500/[0.02] p-6 text-sm font-light leading-relaxed text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-green-500/10"
                value={pm.what_went_well || ''}
                onChange={(e) => setPm({ ...pm, what_went_well: e.target.value })}
                placeholder="¿Qué procesos funcionaron?"
              />
            </div>

            <div className="space-y-3">
              <label className="ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-600">
                <XCircle className="h-4 w-4 opacity-50" /> Fricciones (Went Wrong)
              </label>
              <textarea
                className="custom-scrollbar h-40 w-full resize-none rounded-[2rem] border border-red-500/20 bg-red-500/[0.02] p-6 text-sm font-light leading-relaxed text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-red-500/10"
                value={pm.what_went_wrong || ''}
                onChange={(e) => setPm({ ...pm, what_went_wrong: e.target.value })}
                placeholder="¿Qué bloqueó la respuesta rápida?"
              />
            </div>
          </div>
        </section>

        {/* LOG DE ACTIVIDAD OPERATIVA (TERMINAL OSCURA) */}
        <aside className="space-y-6 lg:sticky lg:top-8">
          <div className="group relative flex min-h-[850px] flex-col overflow-hidden rounded-[3rem] border border-brand-dark/20 bg-brand-dark p-8 text-white shadow-pop md:p-10">
            <div className="absolute -right-6 -top-6 opacity-[0.03] transition-transform duration-1000 group-hover:scale-110">
              <Activity className="h-48 w-48 text-brand-yellow" />
            </div>

            <header className="relative z-10 mb-10 flex items-center gap-4 border-b border-white/5 pb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-yellow/10 text-brand-yellow shadow-inner ring-1 ring-brand-yellow/20">
                <Activity className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h2 className="font-heading text-2xl tracking-tight">Live Activity Log</h2>
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/30">
                  Ops Transmission Protocol
                </p>
              </div>
            </header>

            {/* Inyector de Comentarios */}
            <div className="relative z-10 mb-12 space-y-4">
              <div className="relative">
                <select
                  className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 px-5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-inner outline-none transition-colors hover:bg-white/10 focus:ring-2 focus:ring-brand-yellow/20"
                  value={noteKind}
                  onChange={(e) => setNoteKind(e.target.value as any)}
                >
                  <option value="note">MENSAJE INFORMATIVO</option>
                  <option value="action">MANIOBRA TÉCNICA</option>
                  <option value="status">CAMBIO DE ETAPA</option>
                </select>
                <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-3 w-3 -translate-y-1/2 rotate-90 opacity-40" />
              </div>
              <textarea
                className="custom-scrollbar h-32 w-full resize-none rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm font-light leading-relaxed text-white/80 shadow-inner outline-none placeholder:text-white/20 focus:ring-2 focus:ring-brand-yellow/20"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Transmitir actualización al comando central..."
              />
              <Button
                onClick={addUpdate}
                disabled={loading || !note.trim()}
                className="h-14 w-full rounded-2xl bg-brand-blue text-[10px] font-bold uppercase tracking-widest text-white shadow-pop transition-all hover:scale-105 active:scale-95"
              >
                Transmitir al Log
              </Button>
            </div>

            {/* Feed de Eventos */}
            <div className="custom-scrollbar relative z-10 flex-1 space-y-8 overflow-y-auto pr-3">
              {(detail?.updates || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20 text-xs italic opacity-20">
                  <Terminal className="h-8 w-8" />
                  Awaiting operational input...
                </div>
              ) : (
                detail?.updates.map((u) => (
                  <div
                    key={u.id}
                    className="group/log relative border-l border-white/10 pl-8"
                  >
                    <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-brand-yellow shadow-[0_0_8px_rgba(251,191,36,0.5)] transition-transform group-hover/log:scale-150" />
                    <header className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 opacity-30" />
                        <span className="font-mono text-[9px] text-white/30">
                          {fmt(u.created_at)}
                        </span>
                      </div>
                      <span className="rounded border border-brand-yellow/10 bg-brand-yellow/5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
                        {u.kind}
                      </span>
                    </header>
                    <p className="text-sm font-light italic leading-relaxed text-white/70">
                      &quot;{u.message}&quot;
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-brand-blue/50">
                      <User className="h-3 w-3" /> Op: {u.actor || 'Root_Node'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* 05. FOOTER DE INTEGRIDAD CORPORATIVA */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldAlert className="h-4 w-4 text-red-500" /> High-Confidence Incident Analysis
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Database className="h-4 w-4 text-brand-blue" /> Immutable Forensic Node v4.1
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Activity className="h-4 w-4 animate-pulse" /> Live Telemetry Synced
        </div>
      </footer>
    </div>
  );
}

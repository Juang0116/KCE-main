'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import {
  Activity,
  Clock,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  BarChart2,
  Server,
  Gauge,
  Zap,
  ShieldCheck,
  Terminal,
  Layers,
  Filter,
  ChevronRight,
  Hash,
  Database,
  Cpu,
  Layout,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TIPADO DEL NODO DE MÉTRICAS ---
type Metrics = {
  requestId: string;
  window: { hours: number; since: string };
  totals: {
    incidents: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
  };
  sla: { avgAckMs: number | null; avgResolveMs: number | null };
  topKinds: Array<{ kind: string; total: number }>;
  pauses: Array<{ channel: string; paused_until: string; reason?: string | null }>;
};

// --- HELPERS ---
function fmtMs(ms: number | null) {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  return `${h}h`;
}

export function AdminOpsMetricsClient() {
  const [hours, setHours] = useState<number>(24);
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const r = await adminFetch(
        `/api/admin/ops/metrics?hours=${encodeURIComponent(String(hours))}`,
        { cache: 'no-store' },
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || `Node Error: ${r.status}`);
      setData(j as Metrics);
    } catch (e: any) {
      setErr(e.message || 'Error de telemetría.');
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    void load();
  }, [load]);

  const opsSignals = useMemo(
    () => [
      {
        label: 'Incidentes Nodo',
        value: String(data?.totals.incidents ?? (loading ? '...' : '0')),
        note: `Ciclo de ${hours}h`,
      },
      { label: 'SLA Response', value: fmtMs(data?.sla.avgAckMs ?? null), note: 'Latencia ACK' },
      {
        label: 'Health Status',
        value: (data?.pauses?.length ?? 0) > 0 ? 'DEGRADADO' : 'NOMINAL',
        note: 'Estado de Sistemas',
      },
    ],
    [data, loading, hours],
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-32 duration-1000">
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 px-2 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Gauge className="h-4 w-4" /> Stability Lane: /ops-telemetry
          </div>
          <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-6xl">
            Salud <span className="font-light italic text-brand-yellow">Operacional</span>
          </h1>
          <p className="mt-2 max-w-2xl text-base font-light leading-relaxed text-muted">
            Monitor de resiliencia y cumplimiento de SLA para Knowing Cultures S.A.S. Supervisa la
            velocidad de mitigación ante fallas y gestiona la sanidad del Kernel.
          </p>
        </div>
      </header>

      {/* 02. WORKBENCH DE RESILIENCIA */}
      <AdminOperatorWorkbench
        eyebrow="Stability Protocol"
        title="Monitor de Respuesta Crítica"
        description="Analiza el tiempo medio de resolución. Un SLA de 'Resolve' superior a 4 horas en incidentes críticos indica una falla estructural en el manual de mitigación P77."
        actions={[
          { href: '/admin/ops/incidents', label: 'Ver Incidencias', tone: 'primary' },
          { href: '/admin/events', label: 'Visor Forense' },
        ]}
        signals={opsSignals}
      />

      {/* 03. INSTRUMENTACIÓN DE TIEMPO (LA BÓVEDA) */}
      <section className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5 md:flex-row">
        <div className="flex w-full items-center gap-6 md:w-auto">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand-blue/5 bg-brand-blue/10 text-brand-blue shadow-inner">
            <Clock className="h-7 w-7" />
          </div>
          <div className="flex-1 space-y-2">
            <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
              Horizonte de Observación
            </span>
            <div className="group relative">
              <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue opacity-40 transition-opacity group-focus-within:opacity-100" />
              <select
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-brand-dark/10 bg-surface-2 pl-12 pr-10 text-sm font-bold text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                value={String(hours)}
                onChange={(e) => setHours(Number(e.target.value))}
              >
                <option value="1">Ventana: Última Hora</option>
                <option value="6">Ventana: Últimas 6 Horas</option>
                <option value="24">Ciclo: Últimas 24 Horas</option>
                <option value="72">Ciclo: Últimas 72 Horas</option>
                <option value="168">Histórico: 7 Días</option>
              </select>
              <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted opacity-30" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-full border border-brand-dark/5 bg-surface-2 px-6 py-3">
          <div
            className={`h-2 w-2 rounded-full ${loading ? 'animate-pulse bg-brand-yellow shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            {loading ? 'Sincronizando Nodos...' : 'Data Sync: Nominal'}
          </span>
          <div className="mx-2 h-4 w-px bg-brand-dark/10" />
          <button
            onClick={() => void load()}
            className="text-brand-blue transition-transform hover:scale-110"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </section>

      {err && (
        <div className="animate-in slide-in-from-top-2 mx-2 flex items-center gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-6 font-bold text-red-700 shadow-sm dark:bg-red-950/10 dark:text-red-400">
          <AlertTriangle className="h-6 w-6 opacity-60" />
          <p className="text-sm font-medium">
            Falla de Telemetría: <span className="font-light">{err}</span>
          </p>
        </div>
      )}

      {/* 04. KPI GRID (WIDGETS DE ALTA VISIBILIDAD) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            l: 'Excepciones',
            v: String(data?.totals.incidents ?? '0'),
            s: `Ventana ${hours}h`,
            c: 'text-main',
            i: Terminal,
            bg: 'bg-brand-dark/5',
          },
          {
            l: 'SLA ACK',
            v: fmtMs(data?.sla.avgAckMs ?? null),
            s: 'Latencia Reconocimiento',
            c: 'text-brand-blue',
            i: Activity,
            bg: 'bg-brand-blue/5',
          },
          {
            l: 'SLA Resolve',
            v: fmtMs(data?.sla.avgResolveMs ?? null),
            s: 'Latencia Mitigación',
            c: 'text-green-600',
            i: ShieldCheck,
            bg: 'bg-green-500/5',
          },
          {
            l: 'Pausas Activas',
            v: String(data?.pauses?.length ?? 0),
            s: 'Modo Degradado',
            c: (data?.pauses?.length ?? 0) > 0 ? 'text-red-600' : 'text-main opacity-20',
            i: Zap,
            bg: 'bg-red-500/5',
            alert: (data?.pauses?.length ?? 0) > 0,
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className={`group rounded-[var(--radius-3xl)] border p-8 shadow-soft transition-all hover:-translate-y-1 hover:shadow-pop ${kpi.alert ? 'border-red-500/30 bg-red-500/[0.02]' : 'border-brand-dark/5 bg-surface dark:border-white/5'}`}
          >
            <header className="mb-8 flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">
                {kpi.l}
              </div>
              <div className={`h-10 w-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.i
                  className={`h-5 w-5 ${kpi.c} ${kpi.alert ? 'animate-pulse' : 'opacity-40'} transition-opacity group-hover:opacity-100`}
                />
              </div>
            </header>
            <div className={`font-heading text-5xl tracking-tighter ${kpi.c} mb-3`}>{kpi.v}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-40">
              {kpi.s}
            </div>
          </div>
        ))}
      </div>

      {/* 05. MATRICES DE ESTADO (DIAGNÓSTICO) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Matriz de Severidad */}
        <section className="relative space-y-10 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5">
          <div className="pointer-events-none absolute -right-6 -top-6 opacity-[0.02]">
            <ShieldAlert className="h-48 w-48 text-brand-blue" />
          </div>
          <header className="relative z-10 flex items-center gap-4 border-b border-brand-dark/5 pb-8 dark:border-white/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading text-3xl uppercase tracking-tight text-main">
                Matriz de Severidad
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">
                Impacto en la Operación
              </p>
            </div>
          </header>

          <div className="relative z-10 grid grid-cols-3 gap-6">
            {['info', 'warn', 'critical'].map((sev) => {
              const count = data?.totals.bySeverity[sev] ?? 0;
              const isCritical = sev === 'critical' && count > 0;
              return (
                <div
                  key={sev}
                  className={`rounded-[2.5rem] border p-8 text-center shadow-sm transition-all ${
                    isCritical
                      ? 'border-red-500/20 bg-red-500/5 text-red-700 ring-4 ring-red-500/5 dark:text-red-400'
                      : 'bg-surface-2/50 border-brand-dark/5 dark:border-white/5'
                  }`}
                >
                  <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
                    {sev}
                  </div>
                  <div
                    className={`font-heading text-5xl tracking-tighter ${isCritical ? 'animate-pulse' : ''}`}
                  >
                    {count}
                  </div>
                  <div className="mx-auto mt-4 h-1 w-8 rounded-full bg-current opacity-20" />
                </div>
              );
            })}
          </div>
        </section>

        {/* Estado de Ciclo */}
        <section className="relative space-y-10 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5">
          <div className="pointer-events-none absolute -right-6 -top-6 opacity-[0.02]">
            <Activity className="h-48 w-48 text-brand-blue" />
          </div>
          <header className="relative z-10 flex items-center gap-4 border-b border-brand-dark/5 pb-8 dark:border-white/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading text-3xl uppercase tracking-tight text-main">
                Estado de Ciclo
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">
                Workflow de Mitigación
              </p>
            </div>
          </header>

          <div className="relative z-10 grid grid-cols-3 gap-6">
            {['open', 'acked', 'resolved'].map((st) => {
              const count = data?.totals.byStatus[st] ?? 0;
              const isRed = st === 'open' && count > 0;
              const isGreen = st === 'resolved' && count > 0;
              return (
                <div
                  key={st}
                  className={`rounded-[2.5rem] border p-8 text-center shadow-sm transition-all ${
                    isRed
                      ? 'border-red-500/20 bg-red-500/5 text-red-700'
                      : isGreen
                        ? 'border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400'
                        : 'bg-surface-2/50 border-brand-dark/5 dark:border-white/5'
                  }`}
                >
                  <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
                    {st}
                  </div>
                  <div className="font-heading text-5xl tracking-tighter">{count}</div>
                  <div className="mx-auto mt-4 h-1 w-8 rounded-full bg-current opacity-20" />
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* 06. TABLAS DE DETALLE TÁCTICO (BÓVEDAS) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Principales Fallas */}
        <section className="flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
          <header className="bg-surface-2/30 flex items-center justify-between border-b border-brand-dark/5 p-8 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue shadow-inner">
                <Layout className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-main">
                Clases de Falla
              </h2>
            </div>
            <div className="rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-brand-blue">
              Node_Kind
            </div>
          </header>
          <div className="custom-scrollbar overflow-x-auto p-4">
            <table className="w-full border-separate border-spacing-y-2 px-4 text-left text-sm">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">
                  <th className="px-6 py-4">Trigger Exception</th>
                  <th className="px-6 py-4 text-right">Event Count</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topKinds || []).length > 0 ? (
                  data?.topKinds.map((row) => (
                    <tr
                      key={row.kind}
                      className="group transition-colors hover:bg-brand-blue/5"
                    >
                      <td className="rounded-l-2xl border-y border-l border-brand-dark/5 bg-surface px-6 py-5 dark:border-white/5">
                        <div className="flex items-center gap-3 font-mono text-[11px] font-bold text-brand-blue">
                          <Terminal className="h-4 w-4 opacity-30" /> {row.kind}
                        </div>
                      </td>
                      <td className="rounded-r-2xl border-y border-r border-brand-dark/5 bg-surface px-6 py-5 text-right font-heading text-xl text-main dark:border-white/5">
                        {row.total}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="rounded-2xl border border-dashed border-brand-dark/10 bg-surface px-6 py-24 text-center text-sm italic text-muted opacity-40"
                    >
                      Kernel Stability: All green.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sistemas Pausados */}
        <section className="flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
          <header className="bg-surface-2/30 flex items-center justify-between border-b border-brand-dark/5 p-8 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 shadow-inner">
                <Zap className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-main">
                Sistemas en Degradación
              </h2>
            </div>
            <div className="rounded-full border border-red-500/10 bg-red-500/5 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-red-600">
              Override_Active
            </div>
          </header>
          <div className="custom-scrollbar overflow-x-auto p-4">
            <table className="w-full border-separate border-spacing-y-2 px-4 text-left text-sm">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">
                  <th className="px-6 py-4">System_Node</th>
                  <th className="px-6 py-4">Pause_Until</th>
                  <th className="px-6 py-4 text-right">Root_Reason</th>
                </tr>
              </thead>
              <tbody>
                {(data?.pauses || []).length > 0 ? (
                  data?.pauses.map((p) => (
                    <tr
                      key={p.channel}
                      className="group bg-red-500/[0.02] transition-colors hover:bg-red-500/[0.05]"
                    >
                      <td className="rounded-l-2xl border-y border-l border-red-500/10 px-6 py-5">
                        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-tight text-red-700 dark:text-red-400">
                          <Hash className="h-3.5 w-3.5 opacity-30" /> {p.channel}
                        </div>
                      </td>
                      <td className="border-y border-red-500/10 px-6 py-5 font-mono text-[11px] text-muted opacity-80">
                        {new Date(p.paused_until).toLocaleDateString('es-CO', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="rounded-r-2xl border-y border-r border-red-500/10 px-6 py-5 text-right text-xs italic text-main opacity-80">
                        &quot;{p.reason || 'Manual tactical override'}&quot;
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="rounded-2xl border border-dashed border-brand-dark/10 bg-surface px-6 py-24 text-center text-sm italic text-muted opacity-40"
                    >
                      Systems Operational: Nominal state.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 07. FOOTER DE INTEGRIDAD CORPORATIVA */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Stability Registry Node Active
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Database className="h-4 w-4 opacity-50" /> SLA v3.4 Immutable Monitor
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        {data?.requestId && (
          <div className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-brand-yellow">
            <Hash className="h-4 w-4" /> Trace_ID: {data.requestId.slice(0, 12)}
          </div>
        )}
      </footer>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  Activity, Clock, ShieldAlert, AlertTriangle, 
  RefreshCw, BarChart2, Server, Gauge, 
  Zap, ShieldCheck, Terminal, Layers,
  Filter, ChevronRight, Hash, Database,
  Cpu, Layout, ArrowRight
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
      const r = await adminFetch(`/api/admin/ops/metrics?hours=${encodeURIComponent(String(hours))}`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || `Node Error: ${r.status}`);
      setData(j as Metrics);
    } catch (e: any) {
      setErr(e.message || 'Error de telemetría.');
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => { void load(); }, [load]);

  const opsSignals = useMemo(() => [
    { label: 'Incidentes Nodo', value: String(data?.totals.incidents ?? (loading ? '...' : '0')), note: `Ciclo de ${hours}h` },
    { label: 'SLA Response', value: fmtMs(data?.sla.avgAckMs ?? null), note: 'Latencia ACK' },
    { label: 'Health Status', value: (data?.pauses?.length ?? 0) > 0 ? 'DEGRADADO' : 'NOMINAL', note: 'Estado de Sistemas' },
  ], [data, loading, hours]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Gauge className="h-4 w-4" /> Stability Lane: /ops-telemetry
          </div>
          <h1 className="font-heading text-4xl md:text-6xl text-main tracking-tighter leading-none">
            Salud <span className="text-brand-yellow italic font-light">Operacional</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2">
            Monitor de resiliencia y cumplimiento de SLA para Knowing Cultures S.A.S. Supervisa la velocidad de mitigación ante fallas y gestiona la sanidad del Kernel.
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
          { href: '/admin/events', label: 'Visor Forense' }
        ]}
        signals={opsSignals}
      />

      {/* 03. INSTRUMENTACIÓN DE TIEMPO (LA BÓVEDA) */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-pop relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="h-14 w-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner border border-brand-blue/5 shrink-0">
            <Clock className="h-7 w-7" />
          </div>
          <div className="space-y-2 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50 ml-1">Horizonte de Observación</span>
            <div className="relative group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40 group-focus-within:opacity-100 transition-opacity" />
              <select
                className="w-full h-12 pl-12 pr-10 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-sm font-bold text-main outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner"
                value={String(hours)}
                onChange={(e) => setHours(Number(e.target.value))}
              >
                <option value="1">Ventana: Última Hora</option>
                <option value="6">Ventana: Últimas 6 Horas</option>
                <option value="24">Ciclo: Últimas 24 Horas</option>
                <option value="72">Ciclo: Últimas 72 Horas</option>
                <option value="168">Histórico: 7 Días</option>
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-muted opacity-30 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-surface-2 border border-brand-dark/5">
           <div className={`h-2 w-2 rounded-full ${loading ? 'bg-brand-yellow animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
           <span className="text-[10px] font-mono text-muted uppercase tracking-[0.2em]">
             {loading ? 'Sincronizando Nodos...' : 'Data Sync: Nominal'}
           </span>
           <div className="w-px h-4 bg-brand-dark/10 mx-2" />
           <button onClick={() => void load()} className="text-brand-blue hover:scale-110 transition-transform">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </section>

      {err && (
        <div className="mx-2 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/10 p-6 flex items-center gap-4 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2 shadow-sm font-bold">
          <AlertTriangle className="h-6 w-6 opacity-60" />
          <p className="text-sm font-medium">Falla de Telemetría: <span className="font-light">{err}</span></p>
        </div>
      )}

      {/* 04. KPI GRID (WIDGETS DE ALTA VISIBILIDAD) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: 'Excepciones', v: String(data?.totals.incidents ?? '0'), s: `Ventana ${hours}h`, c: 'text-main', i: Terminal, bg: 'bg-brand-dark/5' },
          { l: 'SLA ACK', v: fmtMs(data?.sla.avgAckMs ?? null), s: 'Latencia Reconocimiento', c: 'text-brand-blue', i: Activity, bg: 'bg-brand-blue/5' },
          { l: 'SLA Resolve', v: fmtMs(data?.sla.avgResolveMs ?? null), s: 'Latencia Mitigación', c: 'text-green-600', i: ShieldCheck, bg: 'bg-green-500/5' },
          { l: 'Pausas Activas', v: String(data?.pauses?.length ?? 0), s: 'Modo Degradado', c: (data?.pauses?.length ?? 0) > 0 ? 'text-red-600' : 'text-main opacity-20', i: Zap, bg: 'bg-red-500/5', alert: (data?.pauses?.length ?? 0) > 0 },
        ].map((kpi, i) => (
          <div key={i} className={`group rounded-[var(--radius-3xl)] border p-8 shadow-soft transition-all hover:shadow-pop hover:-translate-y-1 ${kpi.alert ? 'border-red-500/30 bg-red-500/[0.02]' : 'border-brand-dark/5 dark:border-white/5 bg-surface'}`}>
            <header className="flex items-center justify-between mb-8">
               <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">{kpi.l}</div>
               <div className={`h-10 w-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <kpi.i className={`h-5 w-5 ${kpi.c} ${kpi.alert ? 'animate-pulse' : 'opacity-40'} group-hover:opacity-100 transition-opacity`} />
               </div>
            </header>
            <div className={`text-5xl font-heading tracking-tighter ${kpi.c} mb-3`}>{kpi.v}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-40">{kpi.s}</div>
          </div>
        ))}
      </div>

      {/* 05. MATRICES DE ESTADO (DIAGNÓSTICO) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* Matriz de Severidad */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 shadow-pop space-y-10 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 opacity-[0.02] pointer-events-none">
             <ShieldAlert className="h-48 w-48 text-brand-blue" />
          </div>
          <header className="flex items-center gap-4 border-b border-brand-dark/5 dark:border-white/5 pb-8 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
               <Cpu className="h-6 w-6" />
            </div>
            <div>
               <h2 className="font-heading text-3xl text-main tracking-tight uppercase">Matriz de Severidad</h2>
               <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">Impacto en la Operación</p>
            </div>
          </header>
          
          <div className="grid grid-cols-3 gap-6 relative z-10">
            {['info', 'warn', 'critical'].map((sev) => {
              const count = data?.totals.bySeverity[sev] ?? 0;
              const isCritical = sev === 'critical' && count > 0;
              return (
                <div key={sev} className={`rounded-[2.5rem] border p-8 text-center transition-all shadow-sm ${
                  isCritical ? 'bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-400 ring-4 ring-red-500/5' : 'bg-surface-2/50 border-brand-dark/5 dark:border-white/5'
                }`}>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 mb-4">{sev}</div>
                  <div className={`text-5xl font-heading tracking-tighter ${isCritical ? 'animate-pulse' : ''}`}>{count}</div>
                  <div className="mt-4 h-1 w-8 bg-current opacity-20 mx-auto rounded-full" />
                </div>
              );
            })}
          </div>
        </section>

        {/* Estado de Ciclo */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 shadow-pop space-y-10 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 opacity-[0.02] pointer-events-none">
             <Activity className="h-48 w-48 text-brand-blue" />
          </div>
          <header className="flex items-center gap-4 border-b border-brand-dark/5 dark:border-white/5 pb-8 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
               <RefreshCw className="h-6 w-6" />
            </div>
            <div>
               <h2 className="font-heading text-3xl text-main tracking-tight uppercase">Estado de Ciclo</h2>
               <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">Workflow de Mitigación</p>
            </div>
          </header>
          
          <div className="grid grid-cols-3 gap-6 relative z-10">
            {['open', 'acked', 'resolved'].map((st) => {
              const count = data?.totals.byStatus[st] ?? 0;
              const isRed = st === 'open' && count > 0;
              const isGreen = st === 'resolved' && count > 0;
              return (
                <div key={st} className={`rounded-[2.5rem] border p-8 text-center transition-all shadow-sm ${
                  isRed ? 'bg-red-500/5 border-red-500/20 text-red-700' : 
                  isGreen ? 'bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-400' : 
                  'bg-surface-2/50 border-brand-dark/5 dark:border-white/5'
                }`}>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 mb-4">{st}</div>
                  <div className="text-5xl font-heading tracking-tighter">{count}</div>
                  <div className="mt-4 h-1 w-8 bg-current opacity-20 mx-auto rounded-full" />
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* 06. TABLAS DE DETALLE TÁCTICO (BÓVEDAS) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* Principales Fallas */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden flex flex-col">
          <header className="p-8 border-b border-brand-dark/5 dark:border-white/5 flex items-center justify-between bg-surface-2/30">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner">
                  <Layout className="h-5 w-5" />
               </div>
               <h2 className="font-heading text-2xl text-main tracking-tight uppercase">Clases de Falla</h2>
            </div>
            <div className="px-3 py-1 rounded-full bg-brand-blue/5 border border-brand-blue/10 text-[9px] font-bold text-brand-blue uppercase tracking-widest">Node_Kind</div>
          </header>
          <div className="overflow-x-auto p-4 custom-scrollbar">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2 px-4">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">
                  <th className="px-6 py-4">Trigger Exception</th>
                  <th className="px-6 py-4 text-right">Event Count</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topKinds || []).length > 0 ? (
                  data?.topKinds.map((row) => (
                    <tr key={row.kind} className="group hover:bg-brand-blue/5 transition-colors">
                      <td className="px-6 py-5 rounded-l-2xl border-l border-y border-brand-dark/5 dark:border-white/5 bg-surface">
                        <div className="font-mono text-[11px] font-bold text-brand-blue flex items-center gap-3">
                           <Terminal className="h-4 w-4 opacity-30" /> {row.kind}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right rounded-r-2xl border-r border-y border-brand-dark/5 dark:border-white/5 bg-surface font-heading text-xl text-main">
                        {row.total}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={2} className="px-6 py-24 text-center text-sm italic text-muted opacity-40 bg-surface rounded-2xl border border-dashed border-brand-dark/10">Kernel Stability: All green.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sistemas Pausados */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden flex flex-col">
          <header className="p-8 border-b border-brand-dark/5 dark:border-white/5 flex items-center justify-between bg-surface-2/30">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600 shadow-inner">
                  <Zap className="h-5 w-5" />
               </div>
               <h2 className="font-heading text-2xl text-main tracking-tight uppercase">Sistemas en Degradación</h2>
            </div>
            <div className="px-3 py-1 rounded-full bg-red-500/5 border border-red-500/10 text-[9px] font-bold text-red-600 uppercase tracking-widest">Override_Active</div>
          </header>
          <div className="overflow-x-auto p-4 custom-scrollbar">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2 px-4">
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
                    <tr key={p.channel} className="group bg-red-500/[0.02] hover:bg-red-500/[0.05] transition-colors">
                      <td className="px-6 py-5 rounded-l-2xl border-l border-y border-red-500/10">
                        <div className="font-bold text-red-700 dark:text-red-400 uppercase tracking-tight text-xs flex items-center gap-3">
                           <Hash className="h-3.5 w-3.5 opacity-30" /> {p.channel}
                        </div>
                      </td>
                      <td className="px-6 py-5 border-y border-red-500/10 font-mono text-[11px] text-muted opacity-80">
                        {new Date(p.paused_until).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-5 text-right rounded-r-2xl border-r border-y border-red-500/10 text-xs italic opacity-80 text-main">
                        &quot;{p.reason || 'Manual tactical override'}&quot;
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="px-6 py-24 text-center text-sm italic text-muted opacity-40 bg-surface rounded-2xl border border-dashed border-brand-dark/10">Systems Operational: Nominal state.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 07. FOOTER DE INTEGRIDAD CORPORATIVA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Stability Registry Node Active
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Database className="h-4 w-4 opacity-50" /> SLA v3.4 Immutable Monitor
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        {data?.requestId && (
          <div className="flex items-center gap-3 text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-brand-yellow">
            <Hash className="h-4 w-4" /> Trace_ID: {data.requestId.slice(0, 12)}
          </div>
        )}
      </footer>

    </div>
  );
}
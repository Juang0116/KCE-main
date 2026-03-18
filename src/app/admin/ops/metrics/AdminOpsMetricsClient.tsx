'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  Activity, Clock, ShieldAlert, AlertTriangle, 
  RefreshCw, BarChart2, Server, Gauge, 
  Zap, ShieldCheck, Terminal, Layers,
  Filter // ✅ Agrega esta línea
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

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

function fmtMs(ms: number | null) {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  return `${h}h`;
}

function kpiCard(title: string, value: string, hint?: string, alert?: boolean) {
  return (
    <div className={`group rounded-[2.5rem] border p-8 transition-all hover:shadow-xl ${alert ? 'border-rose-500/30 bg-rose-500/[0.02] shadow-rose-500/5' : 'border-[var(--color-border)] bg-white shadow-sm'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${alert ? 'text-rose-600' : 'text-[var(--color-text)]/40'}`}>{title}</div>
        {alert ? <Zap className="h-4 w-4 text-rose-500 animate-pulse" /> : <ShieldCheck className="h-4 w-4 text-brand-blue opacity-20" />}
      </div>
      <div className={`text-4xl font-heading tracking-tight ${alert ? 'text-rose-700' : 'text-brand-blue'}`}>{value}</div>
      {hint && (
        <div className={`mt-4 text-[10px] font-mono uppercase tracking-widest ${alert ? 'text-rose-600/60' : 'text-[var(--color-text)]/30'}`}>
          {hint}
        </div>
      )}
    </div>
  );
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

  useEffect(() => { load(); }, [load]);

  const opsSignals = useMemo(() => [
    { label: 'Eventos Nodo', value: String(data?.totals.incidents ?? (loading ? '...' : '0')), note: `Ventana de ${hours}h` },
    { label: 'SLA Response', value: fmtMs(data?.sla.avgAckMs ?? null), note: 'Latencia ACK' },
    { label: 'Sistemas Pausados', value: String(data?.pauses?.length ?? 0), note: 'Modo Degradado' },
  ], [data, loading, hours]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER DE OPERACIONES */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10 px-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Gauge className="h-3.5 w-3.5" /> Stability Lane: /ops-telemetry
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            Salud <span className="text-brand-yellow italic font-light">Operacional</span>
          </h1>
          <p className="mt-4 text-base text-[var(--color-text)]/50 font-light max-w-2xl italic">
            Monitor de resiliencia y SLA. Supervisa la velocidad de respuesta del equipo ante fallas 
            sistémicas y gestiona la degradación controlada de servicios.
          </p>
        </div>
      </header>

      <AdminOperatorWorkbench
        eyebrow="Resilience Monitoring"
        title="Protocolo de Estabilidad KCE"
        description="Analiza el tiempo medio de resolución. Un SLA de 'Resolve' superior a 4 horas en incidentes críticos indica una falla en el manual de mitigación o falta de redundancia."
        actions={[
          { href: '/admin/ops/incidents', label: 'Centro de Incidentes', tone: 'primary' },
          { href: '/admin/system/status', label: 'Infra Status' }
        ]}
        signals={opsSignals}
      />

      {/* INSTRUMENTACIÓN DE TIEMPO (BÓVEDA) */}
      <section className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 w-full sm:w-auto">
            <div className="h-12 w-12 rounded-2xl bg-brand-blue/5 flex items-center justify-center text-brand-blue shadow-inner border border-brand-blue/10">
              <Clock className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/30 ml-1">Ventana de Observación</span>
              <div className="relative group">
                <select
                  className="h-11 pl-4 pr-10 rounded-xl border border-[var(--color-border)] bg-white text-sm font-bold text-brand-blue outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/5 transition-all"
                  value={String(hours)}
                  onChange={(e) => setHours(Number(e.target.value))}
                >
                  <option value="1">Última Hora</option>
                  <option value="6">Últimas 6 Horas</option>
                  <option value="24">Ciclo de 24h</option>
                  <option value="72">Últimas 72h</option>
                  <option value="168">Últimos 7 días</option>
                </select>
                <Filter className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-blue/30 pointer-events-none" />
              </div>
            </div>
          </div>
          <Button onClick={load} disabled={loading} className="h-11 rounded-xl px-6 bg-brand-dark text-brand-yellow shadow-lg hover:scale-105 transition-transform disabled:opacity-50">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar Nodo
          </Button>
        </div>
      </section>

      {err && (
        <div className="mx-2 rounded-[2rem] border border-rose-500/20 bg-rose-500/5 p-6 flex items-center gap-4 text-rose-700 animate-in zoom-in-95">
          <AlertTriangle className="h-6 w-6 opacity-40" />
          <p className="text-sm font-medium">{err}</p>
        </div>
      )}

      {/* KPI GRID */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCard('Fallas Registradas', String(data?.totals.incidents ?? '0'), `Ventana ${hours}h`)}
        {kpiCard('SLA ACK (Medio)', fmtMs(data?.sla.avgAckMs ?? null), 'Latencia de Reconocimiento')}
        {kpiCard('SLA Resolve (Medio)', fmtMs(data?.sla.avgResolveMs ?? null), 'Latencia de Mitigación')}
        {kpiCard('Pausas Activas', String(data?.pauses?.length ?? 0), 'Sistemas en Degradación', (data?.pauses?.length ?? 0) > 0)}
      </div>

      {/* DISTRIBUCIÓN FORENSE */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl relative overflow-hidden group">
          <header className="flex items-center gap-4 border-b border-[var(--color-border)] pb-6 mb-8">
            <AlertTriangle className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-brand-blue">Matriz de Severidad</h2>
          </header>
          <div className="grid grid-cols-3 gap-4">
            {['info', 'warn', 'critical'].map((sev) => {
              const count = data?.totals.bySeverity[sev] ?? 0;
              const isCritical = sev === 'critical' && count > 0;
              return (
                <div key={sev} className={`rounded-[2rem] border p-6 text-center transition-all ${
                  isCritical ? 'bg-rose-500/10 border-rose-500/20 text-rose-700' : 'bg-white border-[var(--color-border)]'
                }`}>
                  <div className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40">{sev}</div>
                  <div className={`mt-3 text-3xl font-heading ${isCritical ? 'animate-pulse' : ''}`}>{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl relative overflow-hidden group">
          <header className="flex items-center gap-4 border-b border-[var(--color-border)] pb-6 mb-8">
            <ShieldAlert className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-brand-blue">Estado de Ciclo</h2>
          </header>
          <div className="grid grid-cols-3 gap-4">
            {['open', 'acked', 'resolved'].map((st) => {
              const count = data?.totals.byStatus[st] ?? 0;
              const isRed = st === 'open' && count > 0;
              const isGreen = st === 'resolved' && count > 0;
              return (
                <div key={st} className={`rounded-[2rem] border p-6 text-center transition-all ${
                  isRed ? 'bg-rose-500/10 border-rose-500/20 text-rose-700' : 
                  isGreen ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 
                  'bg-white border-[var(--color-border)]'
                }`}>
                  <div className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40">{st}</div>
                  <div className="mt-3 text-3xl font-heading">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TABLAS DE DETALLE TÁCTICO */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* TOP CAUSAS */}
        <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl overflow-hidden group">
          <header className="p-8 border-b border-[var(--color-border)] flex items-center gap-4">
            <BarChart2 className="h-5 w-5 text-brand-blue" />
            <h2 className="font-heading text-2xl text-brand-blue">Principales Clases de Falla</h2>
          </header>
          <div className="overflow-x-auto p-6">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead className="bg-[var(--color-surface-2)]">
                <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40">
                  <th className="px-6 py-4 rounded-l-xl">Causa (Kind)</th>
                  <th className="px-6 py-4 text-right rounded-r-xl">Incidencias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {(data?.topKinds || []).length > 0 ? (
                  data?.topKinds.map((row) => (
                    <tr key={row.kind} className="group/row transition-all hover:bg-brand-blue/[0.01]">
                      <td className="px-6 py-4 align-top">
                        <div className="font-mono text-xs font-bold text-brand-blue flex items-center gap-2">
                           <Terminal className="h-3 w-3 opacity-30" /> {row.kind}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right align-top font-heading text-lg text-brand-dark/60 group-hover/row:text-brand-yellow transition-colors">
                        {row.total}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={2} className="px-6 py-16 text-center text-xs italic opacity-30">Stability Node: All green.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAUSAS DEL SISTEMA */}
        <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl overflow-hidden group">
          <header className="p-8 border-b border-[var(--color-border)] flex items-center gap-4">
            <Server className="h-5 w-5 text-brand-blue" />
            <h2 className="font-heading text-2xl text-brand-blue">Sistemas en Degradación</h2>
          </header>
          <div className="overflow-x-auto p-6">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead className="bg-[var(--color-surface-2)]">
                <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40">
                  <th className="px-6 py-4 rounded-l-xl">Canal</th>
                  <th className="px-6 py-4">Pausa Hasta</th>
                  <th className="px-6 py-4 text-right rounded-r-xl">Protocolo / Razón</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {(data?.pauses || []).length > 0 ? (
                  data?.pauses.map((p) => (
                    <tr key={p.channel} className="group/row bg-rose-500/[0.02]">
                      <td className="px-6 py-4 align-top">
                        <div className="font-bold text-rose-700 uppercase tracking-tighter text-xs">{p.channel}</div>
                      </td>
                      <td className="px-6 py-4 align-top font-mono text-[10px] text-brand-dark/60">
                        {new Date(p.paused_until).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-right align-top text-xs italic opacity-70">
                        {p.reason || 'Manual override'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="px-6 py-16 text-center text-xs italic opacity-30">Systems Operational: Nominal state.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* FOOTER DE INTEGRIDAD */}
      <footer className="pt-12 flex items-center justify-center gap-12 border-t border-[var(--color-border)] opacity-20 hover:opacity-50 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Stability Registry Node
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> SLA v3.4 Monitor
        </div>
      </footer>

      {data?.requestId && <div className="mt-2 text-right text-[8px] font-mono text-[var(--color-text)]/10 uppercase tracking-widest">Trace_ID: {data.requestId}</div>}
      
    </div>
  );
}
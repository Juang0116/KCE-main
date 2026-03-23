'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  Calendar, Zap, AlertCircle, 
  Mail, Star, RefreshCw, 
  Users, Sparkles, Terminal,
  BrainCircuit, Activity,
  type LucideIcon 
} from 'lucide-react';

import { adminFetch } from '@/lib/adminFetch.client';

type Booking = { id: string; tour_title: string; customer_name: string; tour_date: string };
type Event = { type: string; source: string; created_at: string };
type Enrollment = { id: string; current_step: number; next_run_at: string };

type Summary = {
  kpis: { todayBookings: number; activeEnrollments: number; staleDeals: number; potentialRevenue: number };
  agents: { ops: { today: number; emails: number }; review: { today: number; emails: number } };
  upcomingBookings: Booking[];
  recentAgentEvents: Event[];
  activeSequences: Enrollment[];
};

function fmt(iso: string) {
  try { 
    return new Date(iso).toLocaleString('es-CO', { 
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
    }); 
  } catch { return iso; }
}

export default function CommandCenterLivePanel() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchSummary = useCallback(async () => {
    if (!data) setLoading(true); 
    try {
      const r = await adminFetch('/api/admin/ops/summary');
      const d = await r.json();
      if (d.ok) {
        setData(d);
        setLastUpdate(new Date());
      }
    } catch (e: unknown) {
      console.error('Sincronización de panel fallida', e);
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    void fetchSummary();
    const interval = setInterval(() => void fetchSummary(), 60000 * 5); 
    return () => clearInterval(interval);
  }, [fetchSummary]);

  if (loading && !data) {
    return (
      <div className="grid gap-6 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-[var(--radius-3xl)] bg-brand-blue/5 border border-brand-blue/10" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. PANEL DE SENSORES (KPI STRIP) */}
      <section className="grid gap-6 sm:grid-cols-3">
        <KpiWidget 
          label="Tours Hoy" 
          value={data.kpis.todayBookings} 
          icon={Calendar} 
          colorClass="text-brand-blue" 
          note="experiencias activas" 
        />
        <KpiWidget 
          label="Drip Activo" 
          value={data.kpis.activeEnrollments} 
          icon={Zap} 
          colorClass="text-green-600 dark:text-green-400" 
          note="secuencias en curso" 
        />
        <KpiWidget 
          label="Deals en Riesgo" 
          value={data.kpis.staleDeals} 
          icon={AlertCircle} 
          colorClass={data.kpis.staleDeals > 0 ? 'text-rose-600' : 'text-green-600'} 
          note="atención inmediata" 
          alert={data.kpis.staleDeals > 0}
        />
      </section>

      {/* 02. FUERZA LABORAL SINTÉTICA (AGENTES) */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 md:p-10 shadow-pop relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
          <BrainCircuit className="h-48 w-48 text-brand-blue" />
        </div>

        <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-dark/5 dark:border-white/5 pb-8 relative z-10">
          <div>
            <h3 className="font-heading text-2xl md:text-3xl text-main tracking-tight">Estatus de Agentes IA</h3>
            <p className="text-sm font-light text-muted mt-1 italic">Supervisión de autonomía 24/7</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/5 border border-green-500/10 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> 
            Live Telemetry
          </div>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 relative z-10">
          <AgentCard 
            name="Ops Agent" 
            emails={data.agents.ops.emails} 
            runs={data.agents.ops.today} 
            icon={Mail} 
            accentClass="text-brand-blue" 
          />
          <AgentCard 
            name="Review Agent" 
            emails={data.agents.review.emails} 
            runs={data.agents.review.today} 
            icon={Star} 
            accentClass="text-green-600 dark:text-green-400" 
          />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        
        {/* 03. LOGÍSTICA DE CAMPO (COLA) */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 md:p-10 shadow-soft">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-brand-blue opacity-30" />
              <h3 className="font-heading text-2xl text-main tracking-tight">Cola de Experiencias</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted bg-surface-2 px-3 py-1.5 rounded-full border border-brand-dark/5 dark:border-white/5">
              Próximas 48 Horas
            </span>
          </div>

          <div className="space-y-4">
            {data.upcomingBookings.length === 0 ? (
              <div className="py-20 text-center text-sm font-light text-muted italic border-2 border-dashed border-brand-dark/5 dark:border-white/5 rounded-[var(--radius-2xl)]">
                Cielo despejado. Sin tours programados en la ventana actual.
              </div>
            ) : (
              data.upcomingBookings.map((b) => (
                <div key={b.id} className="group flex items-center justify-between rounded-[var(--radius-2xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-6 transition-all hover:shadow-pop hover:bg-surface-2/50">
                  <div className="space-y-1">
                    <div className="font-bold text-main group-hover:text-brand-blue transition-colors uppercase tracking-widest text-sm">{b.tour_title}</div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                       <span className="h-1 w-1 rounded-full bg-brand-blue" />
                       {b.customer_name}
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-brand-blue bg-brand-blue/5 px-4 py-2 rounded-xl border border-brand-blue/10 shadow-inner">
                    {b.tour_date}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 04. HEARTBEAT TERMINAL (LOGS) */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/20 bg-brand-dark p-8 shadow-2xl text-white flex flex-col h-full">
          <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <Terminal className="h-5 w-5 text-brand-yellow" />
              <h3 className="font-heading text-lg tracking-tight">System Heartbeat</h3>
            </div>
            <div className="h-2 w-2 rounded-full bg-brand-yellow animate-pulse" />
          </div>

          <div className="space-y-5 max-h-[420px] overflow-y-auto custom-scrollbar pr-4 flex-1">
            {data.recentAgentEvents.length === 0 ? (
              <p className="text-xs font-mono text-white/30 italic">Iniciando secuencia de monitoreo...</p>
            ) : (
              data.recentAgentEvents.map((e, i) => (
                <div key={i} className="group flex flex-col gap-1 border-l-2 border-white/5 pl-5 py-1 hover:border-brand-yellow transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${e.source === 'ops_agent' ? 'text-brand-yellow' : 'text-green-400'}`}>
                      {e.type.split('.').pop()}
                    </span>
                    <span className="text-[9px] font-mono text-white/20">{fmt(e.created_at)}</span>
                  </div>
                  <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">{e.source.replace('_', ' ')}</div>
                </div>
              ))
            )}
          </div>

          <a href="/admin/audit" className="mt-8 flex w-full justify-center rounded-2xl border border-white/10 bg-white/5 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white hover:bg-brand-blue hover:border-brand-blue transition-all group shadow-lg">
            Abrir Auditoría Forense <RefreshCw className="ml-3 h-3.5 w-3.5 opacity-30 group-hover:rotate-180 transition-transform duration-500" />
          </a>
        </section>
      </div>

      {/* FOOTER DE ESTADO SUTIL */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 border-t border-brand-dark/5 dark:border-white/5 pt-8 opacity-40 transition-opacity hover:opacity-100 duration-500">
         <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
            <Sparkles className="h-3.5 w-3.5" /> Root Node Synchronized
         </div>
         <div className="flex items-center gap-6 text-[10px] font-mono">
            <span className="text-muted italic opacity-60">Kernel v2.0-stable</span>
            <span className="text-brand-blue font-bold tracking-widest bg-brand-blue/5 px-3 py-1 rounded-md">
              PULSO: {lastUpdate.toLocaleTimeString()}
            </span>
         </div>
      </footer>

    </div>
  );
}

/* --- SUB-COMPONENTES CON EL TOQUE KCE --- */

type KpiWidgetProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  colorClass: string; 
  note: string;
  alert?: boolean;
};

function KpiWidget({ label, value, icon: Icon, colorClass, note, alert }: KpiWidgetProps) {
  return (
    <div className={`group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-soft transition-all hover:shadow-pop hover:-translate-y-1 ${alert ? 'border-rose-500/20 bg-rose-50/30 dark:bg-rose-950/10' : ''}`}>
      <div className="absolute -right-6 -top-6 opacity-[0.03] transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12">
        <Icon className={`h-36 w-36 ${colorClass}`} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
            <Icon className="h-4 w-4 opacity-50" /> {label}
          </div>
          {alert && <div className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping shadow-[0_0_10px_rgba(244,63,94,0.5)]" />}
        </div>
        <div className="flex items-baseline gap-3">
          <span className={`font-heading text-5xl md:text-6xl tracking-tight ${colorClass}`}>{value}</span>
          <span className="text-[11px] font-light italic text-muted opacity-70">{note}</span>
        </div>
      </div>
    </div>
  );
}

type AgentCardProps = {
  name: string;
  emails: number;
  runs: number;
  icon: LucideIcon;
  accentClass: string;
};

function AgentCard({ name, emails, runs, icon: Icon, accentClass }: AgentCardProps) {
  return (
    <div className="group rounded-[var(--radius-2xl)] border border-brand-dark/5 dark:border-white/5 bg-surface-2/50 p-8 transition-all hover:shadow-soft hover:bg-surface border-dashed">
      <div className="flex items-start justify-between">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-surface shadow-inner border border-brand-dark/5 dark:border-white/5 group-hover:scale-105 transition-transform ${accentClass}`}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">{name}</div>
      </div>
      <div className="mt-10">
        <div className="text-5xl font-heading text-main tracking-tight">{emails}</div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mt-2 opacity-60">Mensajes generados hoy</div>
      </div>
      <div className="mt-8 flex items-center gap-3 border-t border-brand-dark/5 dark:border-white/5 pt-5 text-[10px] font-mono text-muted uppercase tracking-widest">
        <Activity className={`h-3.5 w-3.5 ${accentClass} animate-pulse`} /> 
        {runs} ciclos de autonomía completados
      </div>
    </div>
  );
}
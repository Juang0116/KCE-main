'use client';

import { useCallback, useEffect, useState } from 'react';
import { 
  Calendar, Zap, AlertCircle, 
  Mail, Star, RefreshCw, 
  Users, Sparkles, Terminal,
  BrainCircuit,
  type LucideIcon // Tipado Pro para iconos
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
    // No reseteamos 'loading' a true en cada ciclo para evitar destellos en la UI (Background Polling)
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
    const interval = setInterval(() => void fetchSummary(), 60000 * 5); // Polling cada 5 mins
    return () => clearInterval(interval);
  }, [fetchSummary]);

  if (loading && !data) {
    return (
      <div className="grid gap-6 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-[2.5rem] bg-brand-blue/5 border border-brand-blue/10" />
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
          colorClass="text-emerald-500" 
          note="secuencias en curso" 
        />
        <KpiWidget 
          label="Deals en Riesgo" 
          value={data.kpis.staleDeals} 
          icon={AlertCircle} 
          colorClass={data.kpis.staleDeals > 0 ? 'text-rose-500' : 'text-emerald-500'} 
          note="atención inmediata" 
          alert={data.kpis.staleDeals > 0}
        />
      </section>

      {/* 02. FUERZA LABORAL SINTÉTICA (AGENTES) */}
      <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
          <BrainCircuit className="h-40 w-40 text-brand-blue" />
        </div>

        <header className="mb-10 flex items-center justify-between border-b border-[var(--color-border)] pb-6 relative z-10">
          <div>
            <h3 className="font-heading text-2xl text-brand-blue">Estatus de Agentes IA</h3>
            <p className="text-sm font-light text-[var(--color-text)]/40 italic">Supervisión de autonomía 24/7</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
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
            accentClass="text-emerald-500" 
          />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        
        {/* 03. LOGÍSTICA DE CAMPO (COLA) */}
        <section className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 shadow-sm">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-brand-blue/30" />
              <h3 className="font-heading text-xl text-brand-blue">Cola de Experiencias</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">Próximas 48 Horas</span>
          </div>

          <div className="space-y-4">
            {data.upcomingBookings.length === 0 ? (
              <div className="py-12 text-center text-sm font-light text-[var(--color-text)]/30 italic border-2 border-dashed border-[var(--color-border)] rounded-[2rem]">
                Cielo despejado. Sin tours programados.
              </div>
            ) : (
              data.upcomingBookings.map((b) => (
                <div key={b.id} className="group flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all hover:shadow-xl hover:-translate-y-0.5">
                  <div className="space-y-1">
                    <div className="font-bold text-brand-blue group-hover:text-brand-yellow transition-colors">{b.tour_title}</div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text)]/40 italic">{b.customer_name}</div>
                  </div>
                  <div className="text-xs font-mono font-bold text-brand-blue/60 bg-[var(--color-surface-2)] px-3 py-1.5 rounded-lg border border-[var(--color-border)]">
                    {b.tour_date}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 04. HEARTBEAT TERMINAL (LOGS) */}
        <section className="rounded-[3rem] border border-[var(--color-border)] bg-brand-dark p-8 shadow-2xl text-white">
          <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
            <Terminal className="h-5 w-5 text-brand-yellow" />
            <h3 className="font-heading text-lg">System Heartbeat</h3>
          </div>

          <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
            {data.recentAgentEvents.map((e, i) => (
              <div key={i} className="group flex flex-col gap-1 border-l border-white/5 pl-4 py-1 hover:border-brand-yellow transition-colors">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${e.source === 'ops_agent' ? 'text-brand-yellow' : 'text-emerald-400'}`}>
                    {e.type.split('.').pop()}
                  </span>
                  <span className="text-[9px] font-mono text-white/20">{fmt(e.created_at)}</span>
                </div>
                <div className="text-[9px] font-mono text-white/40 uppercase tracking-tighter">{e.source.replace('_', ' ')}</div>
              </div>
            ))}
          </div>

          <a href="/admin/audit" className="mt-8 flex w-full justify-center rounded-2xl border border-white/10 bg-white/5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all">
            Abrir Auditoría Forense
          </a>
        </section>
      </div>

      {/* FOOTER DE ESTADO SUTIL */}
      <footer className="flex items-center justify-between px-6 opacity-30 transition-opacity hover:opacity-100">
         <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
            <Sparkles className="h-3 w-3" /> Root Node Synchronized
         </div>
         <div className="flex items-center gap-4 text-[10px] font-mono">
            <span className="text-[var(--color-text)]/40 italic">Kernel v2.0-stable</span>
            <span className="text-brand-blue font-bold tracking-tighter">Último pulso: {lastUpdate.toLocaleTimeString()}</span>
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
  colorClass: string; // Ej: 'text-brand-blue'
  note: string;
  alert?: boolean;
};

function KpiWidget({ label, value, icon: Icon, colorClass, note, alert }: KpiWidgetProps) {
  return (
    <div className={`group relative overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-white p-8 shadow-sm transition-all hover:shadow-2xl ${alert ? 'border-rose-100 bg-rose-50/20' : ''}`}>
      <div className="absolute -right-4 -top-4 opacity-[0.03] transition-transform group-hover:scale-110">
        <Icon className={`h-32 w-32 ${colorClass}`} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/30">
            <Icon className="h-3.5 w-3.5" /> {label}
          </div>
          {alert && <div className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />}
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`font-heading text-5xl ${colorClass}`}>{value}</span>
          <span className="text-[10px] font-light italic text-[var(--color-text)]/40">{note}</span>
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
  accentClass: string; // Ej: 'text-emerald-500'
};

function AgentCard({ name, emails, runs, icon: Icon, accentClass }: AgentCardProps) {
  return (
    <div className="group rounded-[2rem] border border-[var(--color-border)] bg-white p-7 transition-all hover:shadow-xl">
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/5 shadow-inner ${accentClass}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--color-text)]/20">{name}</div>
      </div>
      <div className="mt-8">
        <div className={`text-4xl font-heading text-brand-dark`}>{emails}</div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mt-1">Mensajes generados hoy</div>
      </div>
      <div className="mt-6 flex items-center gap-2 border-t border-[var(--color-border)] pt-4 text-[10px] font-mono text-[var(--color-text)]/30 uppercase">
        <RefreshCw className="h-3 w-3" /> {runs} ciclos completados
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import { 
  Bot, Activity, Terminal, Mail, 
  Play, RefreshCcw, AlertTriangle, CheckCircle2,
  Calendar, Briefcase, Star, PenTool, BarChart3, BrainCircuit,
  Sparkles,
  type LucideIcon // Añadido para tipado pro
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type AgentId = 'ops' | 'review' | 'sales' | 'content' | 'analytics' | 'trainer';

type AgentDef = {
  id: AgentId;
  name: string;
  icon: LucideIcon; // Tipado estricto en lugar de 'any'
  role: string;
  schedule: string;
  color: string;
};

const AGENTS: AgentDef[] = [
  { id: 'sales',     name: 'Sales Agent',     icon: Briefcase, role: 'Califica leads, genera propuestas y sigue deals.', schedule: 'Cada hora', color: 'blue' },
  { id: 'ops',       name: 'Ops Agent',       icon: Calendar,  role: 'Coordinación logística y recordatorios pre-tour.', schedule: 'Cada hora', color: 'orange' },
  { id: 'review',    name: 'Review Agent',    icon: Star,      role: 'Solicita reseñas post-tour y fidelización.', schedule: 'Cada hora', color: 'yellow' },
  { id: 'content',   name: 'Content Agent',   icon: PenTool,   role: 'Genera blog posts, SEO y descripciones de tours.', schedule: 'Diario 10am', color: 'green' },
  { id: 'analytics', name: 'Analytics Agent', icon: BarChart3, role: 'Analiza datos, detecta anomalías e insights.', schedule: 'Diario 10am', color: 'purple' },
  { id: 'trainer',   name: 'Trainer Agent',   icon: BrainCircuit, role: 'Auto-entrena agentes con datos reales de la red.', schedule: 'Lunes 10am', color: 'pink' },
];

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  blue:   { bg: 'bg-blue-500/5',   text: 'text-blue-600',   border: 'border-blue-500/20',   accent: 'bg-blue-500' },
  orange: { bg: 'bg-orange-500/5', text: 'text-orange-600', border: 'border-orange-500/20', accent: 'bg-orange-500' },
  yellow: { bg: 'bg-amber-500/5',  text: 'text-amber-600',  border: 'border-amber-500/20',  accent: 'bg-amber-500' },
  green:  { bg: 'bg-emerald-500/5',text: 'text-emerald-600',border: 'border-emerald-500/20',accent: 'bg-emerald-500' },
  purple: { bg: 'bg-purple-500/5', text: 'text-purple-600', border: 'border-purple-500/20', accent: 'bg-purple-500' },
  pink:   { bg: 'bg-pink-500/5',   text: 'text-pink-600',   border: 'border-pink-500/20',   accent: 'bg-pink-500' },
};

type LogEntry = { type: string; source: string; payload: Record<string, unknown>; created_at: string };
type MsgEntry = { id: string; to_email: string; subject: string; status: string; created_at: string; metadata: Record<string, unknown> };
type Stats = { ops: { sent: number; queued: number; failed: number }; review: { sent: number; queued: number; failed: number } };

type TabType = 'agents' | 'logs' | 'messages';

const TABS: { id: TabType; label: string; icon: LucideIcon }[] = [
  { id: 'agents', label: 'Dashboard', icon: Bot },
  { id: 'logs', label: 'Eventos', icon: Terminal },
  { id: 'messages', label: 'Mensajería', icon: Mail }
];

export default function AdminAgentsClient() {
  const [running, setRunning] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [msgs, setMsgs] = useState<MsgEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabType>('agents');
  const [flash, setFlash] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch('/api/admin/agents/logs?limit=50');
      const d = await r.json();
      if (d.ok) { 
        setLogs(d.events ?? []); 
        setMsgs(d.messages ?? []); 
        setStats(d.stats ?? null); 
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadLogs(); }, [loadLogs]);

  async function runAgent(agentId: string) {
    setRunning(agentId);
    setFlash(null);
    try {
      const r = await adminFetch('/api/admin/agents/run', {
        method: 'POST',
        body: JSON.stringify({ agent: agentId }),
      });
      const d = await r.json();
      if (d.ok) {
        setFlash({ type: 'ok', msg: `Agente ${agentId} completado con éxito.` });
        void loadLogs();
      } else {
        setFlash({ type: 'err', msg: `Falla en ejecución: ${d.error}` });
      }
    } catch (e: unknown) {
      // Tipado seguro para el catch
      const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
      setFlash({ type: 'err', msg: `Error de red: ${errorMsg}` });
    } finally {
      setRunning(null);
      setTimeout(() => setFlash(null), 6000);
    }
  }

  function fmt(iso: string) {
    try { 
      return new Date(iso).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }); 
    } catch { 
      return iso; 
    }
  }

  return (
    <div className="space-y-8 pb-20">
      
      {/* HEADER TÁCTICO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue mb-2">
             <Activity className="h-3 w-3 animate-pulse" /> System Autonomy Active
          </div>
          <h1 className="font-heading text-4xl text-brand-blue flex items-center gap-3">
            Agentes IA <Sparkles className="h-6 w-6 text-brand-yellow" />
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/50 font-light">
            Supervisión de la fuerza laboral sintética que opera Knowing Cultures Enterprise.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => void runAgent('all')}
            disabled={!!running}
            className="rounded-full shadow-xl"
          >
            {running === 'all' ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
            Ejecutar Ciclo Completo
          </Button>
          <button 
            onClick={() => void loadLogs()} 
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white shadow-sm transition hover:bg-[var(--color-surface-2)] disabled:opacity-50"
          >
            <RefreshCcw className={`h-4 w-4 text-brand-blue ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* NOTIFICACIONES FLASH */}
      {flash && (
        <div className={`flex items-center gap-3 rounded-2xl border p-4 shadow-lg animate-in slide-in-from-top-4 duration-300 ${
          flash.type === 'ok' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700' : 'border-rose-500/20 bg-rose-500/5 text-rose-700'
        }`}>
          {flash.type === 'ok' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          <span className="text-sm font-medium">{flash.msg}</span>
        </div>
      )}

      {/* TABS DE CONTROL */}
      <div className="flex rounded-full border border-[var(--color-border)] bg-white p-1.5 shadow-inner w-fit">
        {TABS.map((t) => (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-full px-6 py-2 text-xs font-bold transition-all ${
              tab === t.id ? 'bg-brand-blue text-white shadow-md' : 'text-[var(--color-text)]/40 hover:text-brand-blue'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* AGENTS GRID */}
      {tab === 'agents' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent) => {
            const c = COLOR_MAP[agent.color] ?? COLOR_MAP['blue']!;
            const lastLog = logs.find((l) => l.source === `${agent.id}_agent`);
            const isRunning = running === agent.id || running === 'all';

            return (
              <div key={agent.id} className={`group relative rounded-[2.5rem] border ${c.border} bg-white p-8 shadow-sm transition-all hover:shadow-xl`}>
                <div className={`absolute top-6 right-6 h-2 w-2 rounded-full ${isRunning ? 'animate-ping ' + c.accent : 'opacity-0'}`} />
                
                <header className="mb-6 flex items-start justify-between">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${c.bg} ${c.text} transition-transform group-hover:scale-110`}>
                    <agent.icon className="h-7 w-7" />
                  </div>
                  <Button 
                    onClick={() => void runAgent(agent.id)}
                    disabled={!!running}
                    variant="outline"
                    size="sm"
                    className={`rounded-full border-none shadow-none font-bold ${c.bg} ${c.text} hover:${c.accent} hover:text-white transition-all`}
                  >
                    {isRunning ? '⏳' : 'Run'}
                  </Button>
                </header>

                <div>
                  <h3 className={`font-heading text-xl ${c.text}`}>{agent.name}</h3>
                  <div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">
                    <Calendar className="h-3 w-3" /> {agent.schedule}
                  </div>
                  <p className="mt-4 text-sm font-light leading-relaxed text-[var(--color-text)]/60 min-h-[40px]">
                    {agent.role}
                  </p>
                </div>

                {/* Status bar interna */}
                <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border)] pt-6 text-[10px] font-mono text-[var(--color-text)]/30">
                  <span className="flex items-center gap-1.5">
                    <Activity className="h-3 w-3" /> 
                    {lastLog ? `Última actividad: ${fmt(lastLog.created_at)}` : 'Sin actividad reciente'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EVENT LOGS */}
      {tab === 'logs' && (
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-white p-2 shadow-2xl overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto px-4 py-4 space-y-3">
            {logs.length === 0 && <div className="p-12 text-center text-sm font-light text-[var(--color-text)]/40 italic">La terminal está limpia. No hay eventos registrados.</div>}
            {logs.map((e, i) => (
              <div key={i} className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 transition-colors hover:bg-brand-blue/[0.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${e.type.includes('error') ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${e.type.includes('error') ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {e.type.split('.').pop()}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
                    <span className="text-xs font-bold text-brand-blue">{e.source}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--color-text)]/30">{fmt(e.created_at)}</span>
                </div>
                {e.payload && Object.keys(e.payload).length > 0 && (
                  <div className="mt-2 rounded-xl bg-brand-dark/5 p-3 font-mono text-[10px] text-[var(--color-text)]/60 opacity-60 group-hover:opacity-100 transition-opacity overflow-x-auto">
                    {JSON.stringify(e.payload)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MESSAGING DASHBOARD */}
      {tab === 'messages' && (
        <div className="space-y-6">
          {stats && (
            <div className="grid gap-6 md:grid-cols-2">
              {[
                { label: 'Ops Agent', st: stats.ops, color: 'text-orange-600' },
                { label: 'Review Agent', st: stats.review, color: 'text-amber-600' }
              ].map(({ label, st, color }) => (
                <div key={label} className="rounded-[2.5rem] border border-[var(--color-border)] bg-white p-8 shadow-xl">
                  <h3 className={`font-heading text-xl mb-6 border-b border-[var(--color-border)] pb-4 ${color}`}>{label}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-heading text-emerald-600">{st.sent}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">Enviados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-heading text-amber-500">{st.queued}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">En cola</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-heading text-rose-500">{st.failed}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">Fallidos</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-white p-2 shadow-2xl">
            <div className="max-h-[500px] overflow-y-auto px-4 py-4 space-y-2">
              {msgs.length === 0 && <div className="p-12 text-center text-sm font-light text-[var(--color-text)]/40 italic">No se han emitido comunicaciones directas aún.</div>}
              {msgs.map((m) => (
                <div key={m.id} className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 hover:bg-brand-blue/[0.02] transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        m.status === 'sent' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {m.status === 'sent' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {m.status}
                      </span>
                      <span className="text-sm font-bold text-brand-blue">{m.to_email}</span>
                      <span className="text-[10px] text-[var(--color-text)]/30 italic">via {String(m.metadata?.agent ?? 'System')}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--color-text)]/30">{fmt(m.created_at)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs font-light text-[var(--color-text)]/60">
                    <Mail className="h-3.5 w-3.5 text-brand-blue/40" />
                    {m.subject}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
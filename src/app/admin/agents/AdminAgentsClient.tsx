'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import { Bot, Calendar, Star, PenTool, BarChart3, BrainCircuit, Briefcase, Play, RefreshCcw, CheckCircle, XCircle, Clock, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type AgentId = 'ops' | 'review' | 'sales' | 'content' | 'analytics' | 'trainer';

const AGENTS = [
  { id: 'sales' as AgentId,     name: 'Sales Agent',     icon: Briefcase, role: 'Califica leads, genera propuestas, sigue deals estancados.', schedule: 'Cada hora' },
  { id: 'ops' as AgentId,       name: 'Ops Agent',       icon: Calendar,  role: 'Envía recordatorios pre-tour a clientes (día anterior).', schedule: 'Cada hora' },
  { id: 'review' as AgentId,    name: 'Review Agent',    icon: Star,      role: 'Solicita reseñas post-tour con link personalizado.', schedule: 'Cada hora' },
  { id: 'content' as AgentId,   name: 'Content Agent',   icon: PenTool,   role: 'Genera posts de blog SEO y descripciones de tours.', schedule: 'Diario 9am' },
  { id: 'analytics' as AgentId, name: 'Analytics Agent', icon: BarChart3, role: 'Analiza datos, detecta anomalías, genera insight semanal.', schedule: 'Diario 10am' },
  { id: 'trainer' as AgentId,   name: 'Trainer Agent',   icon: BrainCircuit, role: 'Estudia conversiones y mejora los prompts de todos los agentes.', schedule: 'Lunes 10am' },
];

type RunResult = { ok?: boolean; error?: string; processed?: number; generated?: number; insights?: unknown[] };
type LogEntry = { type: string; source: string; payload: Record<string, unknown>; created_at: string };

export default function AdminAgentsClient() {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, RunResult>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<{ msg: string; ok: boolean } | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch('/api/admin/agents/logs?limit=30');
      const d = await r.json();
      if (d.ok) setLogs(d.events ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadLogs(); }, [loadLogs]);

  async function runAgent(id: string) {
    setRunning(id);
    setFlash(null);
    try {
      const r = await adminFetch('/api/admin/agents/run', {
        method: 'POST',
        body: JSON.stringify({ agent: id }),
      });
      const d = await r.json();
      if (d.ok) {
        setResults(prev => ({ ...prev, [id]: d.results?.[id] ?? d.results ?? {} }));
        setFlash({ msg: `✅ ${id} ejecutado correctamente`, ok: true });
        void loadLogs();
      } else {
        setFlash({ msg: `❌ Error: ${d.error || 'desconocido'}`, ok: false });
      }
    } catch (e: any) {
      setFlash({ msg: `❌ ${e?.message}`, ok: false });
    } finally {
      setRunning(null);
      setTimeout(() => setFlash(null), 6000);
    }
  }

  function lastRun(id: string) {
    const log = logs.find(l => l.source === `${id}_agent` && l.type.includes('completed'));
    return log ? new Date(log.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : null;
  }

  function hasError(id: string) {
    return logs.some(l => l.source === `${id}_agent` && l.type.includes('error'));
  }

  return (
    <div className="space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 01. HEADER INSTITUCIONAL */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Bot className="h-3.5 w-3.5" /> Automatización y Procesos
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tight">Fuerza Laboral IA</h1>
          <p className="mt-3 text-base text-muted font-light max-w-2xl">
            Supervisa el rendimiento de tu equipo virtual. Estos agentes operan en segundo plano optimizando ventas, soporte y contenido.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" size="icon" onClick={() => void loadLogs()} disabled={loading} className="rounded-full shadow-sm border-brand-dark/10 h-12 w-12 shrink-0 text-muted hover:text-brand-blue transition-all">
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => void runAgent('all')} disabled={!!running} className="rounded-full h-12 px-8 bg-brand-dark text-brand-yellow hover:bg-brand-blue hover:text-white shadow-pop disabled:opacity-50 transition-all text-[10px] font-bold uppercase tracking-widest">
            <Play className="mr-2 h-4 w-4" />
            {running === 'all' ? 'Iniciando Protocolo...' : 'Ejecutar Todos'}
          </Button>
        </div>
      </header>

      {/* ALERTAS DEL SISTEMA */}
      {flash && (
        <div className={`rounded-2xl p-4 text-sm font-bold flex items-center gap-3 shadow-sm animate-in fade-in ${flash.ok ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
          <Zap className="h-4 w-4 shrink-0" />
          {flash.msg}
        </div>
      )}

      {/* 02. PANEL DE AGENTES */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          const last = lastRun(agent.id);
          const error = hasError(agent.id);
          const res = results[agent.id];
          const isRunning = running === agent.id || running === 'all';

          return (
            <div key={agent.id} className="group rounded-[var(--radius-2xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-6 shadow-soft hover:shadow-pop transition-all duration-300 relative overflow-hidden flex flex-col h-full">
              
              {/* Decoración de fondo */}
              <div className="absolute -top-10 -right-10 opacity-[0.02] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Icon className="h-48 w-48 text-brand-blue" />
              </div>

              <div className="relative z-10 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 border border-brand-dark/5 dark:border-white/5 group-hover:border-brand-blue/20 transition-colors">
                      <Icon className={`h-5 w-5 text-brand-blue ${isRunning ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg text-main leading-none">{agent.name}</h3>
                      <span className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] mt-1 block">
                        Schedule: {agent.schedule}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted font-light leading-relaxed mb-6">
                  {agent.role}
                </p>

                {res && (
                  <div className="mb-6 rounded-xl bg-brand-dark/5 dark:bg-white/5 p-4 text-[10px] text-muted font-mono overflow-hidden">
                    <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-widest text-main">
                      <Activity className="h-3 w-3 text-brand-blue" /> Último Resultado
                    </div>
                    <div className="truncate">
                      {JSON.stringify(res).slice(0, 150)}...
                    </div>
                  </div>
                )}
              </div>

              {/* Footer de Tarjeta (Acciones y Estado) */}
              <div className="relative z-10 mt-auto pt-6 border-t border-brand-dark/5 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center text-[10px] font-bold uppercase tracking-widest">
                  {error ? (
                    <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md">
                      <XCircle className="h-3.5 w-3.5" /> Fallo reportado
                    </span>
                  ) : last ? (
                    <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-3.5 w-3.5" /> {last}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-muted">
                      <Clock className="h-3.5 w-3.5 opacity-50" /> Standby
                    </span>
                  )}
                </div>

                <Button 
                  size="sm" 
                  onClick={() => void runAgent(agent.id)} 
                  disabled={!!running} 
                  className="rounded-xl bg-surface-2 text-main border border-brand-dark/5 dark:border-white/5 hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all disabled:opacity-50 text-[10px] font-bold uppercase tracking-widest h-8"
                >
                  {isRunning ? <RefreshCcw className="h-3 w-3 animate-spin mr-1.5" /> : <Play className="h-3 w-3 mr-1.5 fill-current" />}
                  {isRunning ? 'RUNNING' : 'FORZAR'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 03. REGISTRO DE EVENTOS (Logs) */}
      {logs.length > 0 && (
        <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-soft overflow-hidden">
          <div className="p-6 border-b border-brand-dark/5 dark:border-white/5 bg-surface-2/30 flex items-center gap-3">
             <Activity className="h-4 w-4 text-brand-blue" />
             <h2 className="font-heading text-xl text-main tracking-tight">Registro de Operaciones (Logs)</h2>
          </div>
          
          <div className="custom-scrollbar max-h-80 overflow-y-auto">
            <table className="w-full text-left text-sm">
               <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
                 {logs.slice(0, 30).map((log, i) => (
                   <tr key={i} className="hover:bg-surface-2/50 transition-colors">
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center gap-3">
                         <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border ${
                           log.type.includes('error') ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 
                           log.type.includes('completed') ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' : 
                           'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                         }`}>
                           {log.type.split('.').pop()}
                         </span>
                         <span className="font-mono text-[11px] font-bold text-main opacity-70">
                           {log.source.replace('_agent', '').toUpperCase()}
                         </span>
                       </div>
                     </td>
                     <td className="px-6 py-4 w-full">
                        {/* Aquí podrías renderizar un snippet de log.payload si quisieras, por ahora lo dejamos limpio */}
                        <span className="text-xs text-muted font-light line-clamp-1">Operación registrada en el sistema.</span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-right text-[10px] font-bold text-muted uppercase tracking-widest">
                       {new Date(log.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
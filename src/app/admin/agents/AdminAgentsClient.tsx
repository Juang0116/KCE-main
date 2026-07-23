'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import {
  Bot,
  Calendar,
  Star,
  PenTool,
  BarChart3,
  BrainCircuit,
  Briefcase,
  Play,
  RefreshCcw,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type AgentId = 'ops' | 'review' | 'sales' | 'content' | 'analytics' | 'trainer';

const AGENTS = [
  {
    id: 'sales' as AgentId,
    name: 'Sales Agent',
    icon: Briefcase,
    role: 'Califica leads, genera propuestas, sigue deals estancados.',
    schedule: 'Cada hora',
  },
  {
    id: 'ops' as AgentId,
    name: 'Ops Agent',
    icon: Calendar,
    role: 'Envía recordatorios pre-tour a clientes (día anterior).',
    schedule: 'Cada hora',
  },
  {
    id: 'review' as AgentId,
    name: 'Review Agent',
    icon: Star,
    role: 'Solicita reseñas post-tour con link personalizado.',
    schedule: 'Cada hora',
  },
  {
    id: 'content' as AgentId,
    name: 'Content Agent',
    icon: PenTool,
    role: 'Genera posts de blog SEO y descripciones de tours.',
    schedule: 'Diario 9am',
  },
  {
    id: 'analytics' as AgentId,
    name: 'Analytics Agent',
    icon: BarChart3,
    role: 'Analiza datos, detecta anomalías, genera insight semanal.',
    schedule: 'Diario 10am',
  },
  {
    id: 'trainer' as AgentId,
    name: 'Trainer Agent',
    icon: BrainCircuit,
    role: 'Estudia conversiones y mejora los prompts de todos los agentes.',
    schedule: 'Lunes 10am',
  },
];

type RunResult = {
  ok?: boolean;
  error?: string;
  processed?: number;
  generated?: number;
  insights?: unknown[];
};
type LogEntry = {
  type: string;
  source: string;
  payload: Record<string, unknown>;
  created_at: string;
};

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

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

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
        setResults((prev) => ({ ...prev, [id]: d.results?.[id] ?? d.results ?? {} }));
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
    const log = logs.find((l) => l.source === `${id}_agent` && l.type.includes('completed'));
    return log
      ? new Date(log.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
      : null;
  }

  function hasError(id: string) {
    return logs.some((l) => l.source === `${id}_agent` && l.type.includes('error'));
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10 pb-24 duration-700">
      {/* 01. HEADER INSTITUCIONAL */}
      <header className="flex flex-col justify-between gap-6 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Bot className="h-3.5 w-3.5" /> Automatización y Procesos
          </div>
          <h1 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
            Fuerza Laboral IA
          </h1>
          <p className="mt-3 max-w-2xl text-base font-light text-muted">
            Supervisa el rendimiento de tu equipo virtual. Estos agentes operan en segundo plano
            optimizando ventas, soporte y contenido.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => void loadLogs()}
            disabled={loading}
            className="h-12 w-12 shrink-0 rounded-full border-brand-dark/10 text-muted shadow-sm transition-all hover:text-brand-blue"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={() => void runAgent('all')}
            disabled={!!running}
            className="h-12 rounded-full bg-brand-dark px-8 text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white disabled:opacity-50"
          >
            <Play className="mr-2 h-4 w-4" />
            {running === 'all' ? 'Iniciando Protocolo...' : 'Ejecutar Todos'}
          </Button>
        </div>
      </header>

      {/* ALERTAS DEL SISTEMA */}
      {flash && (
        <div
          className={`animate-in fade-in flex items-center gap-3 rounded-2xl p-4 text-sm font-bold shadow-sm ${flash.ok ? 'border border-green-200 bg-green-50 text-green-800 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400' : 'border border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400'}`}
        >
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
            <div
              key={agent.id}
              className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface p-6 shadow-soft transition-all duration-300 hover:shadow-pop dark:border-white/5"
            >
              {/* Decoración de fondo */}
              <div className="pointer-events-none absolute -right-10 -top-10 opacity-[0.02] transition-transform duration-700 group-hover:scale-110">
                <Icon className="h-48 w-48 text-brand-blue" />
              </div>

              <div className="relative z-10 flex-1">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-dark/5 bg-surface-2 transition-colors group-hover:border-brand-blue/20 dark:border-white/5">
                      <Icon
                        className={`h-5 w-5 text-brand-blue ${isRunning ? 'animate-pulse' : ''}`}
                      />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg leading-none text-main">{agent.name}</h3>
                      <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted">
                        Schedule: {agent.schedule}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mb-6 text-sm font-light leading-relaxed text-muted">{agent.role}</p>

                {res && (
                  <div className="mb-6 overflow-hidden rounded-xl bg-brand-dark/5 p-4 font-mono text-[10px] text-muted dark:bg-white/5">
                    <div className="mb-2 flex items-center gap-2 font-bold uppercase tracking-widest text-main">
                      <Activity className="h-3 w-3 text-brand-blue" /> Último Resultado
                    </div>
                    <div className="truncate">{JSON.stringify(res).slice(0, 150)}...</div>
                  </div>
                )}
              </div>

              {/* Footer de Tarjeta (Acciones y Estado) */}
              <div className="relative z-10 mt-auto flex items-center justify-between border-t border-brand-dark/5 pt-6 dark:border-white/5">
                <div className="flex items-center text-[10px] font-bold uppercase tracking-widest">
                  {error ? (
                    <span className="flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-red-600 dark:bg-red-500/10 dark:text-red-400">
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
                  className="h-8 rounded-xl border border-brand-dark/5 bg-surface-2 text-[10px] font-bold uppercase tracking-widest text-main transition-all hover:border-brand-blue hover:bg-brand-blue hover:text-white disabled:opacity-50 dark:border-white/5"
                >
                  {isRunning ? (
                    <RefreshCcw className="mr-1.5 h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="mr-1.5 h-3 w-3 fill-current" />
                  )}
                  {isRunning ? 'RUNNING' : 'FORZAR'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 03. REGISTRO DE EVENTOS (Logs) */}
      {logs.length > 0 && (
        <div className="overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-soft dark:border-white/5">
          <div className="bg-surface-2/30 flex items-center gap-3 border-b border-brand-dark/5 p-6 dark:border-white/5">
            <Activity className="h-4 w-4 text-brand-blue" />
            <h2 className="font-heading text-xl tracking-tight text-main">
              Registro de Operaciones (Logs)
            </h2>
          </div>

          <div className="custom-scrollbar max-h-80 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
                {logs.slice(0, 30).map((log, i) => (
                  <tr
                    key={i}
                    className="hover:bg-surface-2/50 transition-colors"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${
                            log.type.includes('error')
                              ? 'border-red-100 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400'
                              : log.type.includes('completed')
                                ? 'border-green-100 bg-green-50 text-green-600 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400'
                                : 'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400'
                          }`}
                        >
                          {log.type.split('.').pop()}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-main opacity-70">
                          {log.source.replace('_agent', '').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="w-full px-6 py-4">
                      {/* Aquí podrías renderizar un snippet de log.payload si quisieras, por ahora lo dejamos limpio */}
                      <span className="line-clamp-1 text-xs font-light text-muted">
                        Operación registrada en el sistema.
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted">
                      {new Date(log.created_at).toLocaleString('es-CO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
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

'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import { Bot, Calendar, Star, PenTool, BarChart3, BrainCircuit, Briefcase, Play, RefreshCcw, CheckCircle, XCircle, Clock } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-[color:var(--color-text)]">Agentes IA</h1>
          <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            6 agentes autónomos operan KCE. Puedes ejecutarlos manualmente o dejar que el cron los corra.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void runAgent('all')}
            disabled={!!running}
            className="flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-brand-blue/90 transition"
          >
            <Play className="h-4 w-4" />
            {running === 'all' ? 'Ejecutando...' : 'Ejecutar Todos'}
          </button>
          <button
            onClick={() => void loadLogs()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-2)] transition"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {flash && (
        <div className={`rounded-xl p-3 text-sm font-medium ${flash.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {flash.msg}
        </div>
      )}

      {/* Agent cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          const last = lastRun(agent.id);
          const error = hasError(agent.id);
          const res = results[agent.id];
          const isRunning = running === agent.id || running === 'all';

          return (
            <div key={agent.id} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10">
                    <Icon className="h-5 w-5 text-brand-blue" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[color:var(--color-text)]">{agent.name}</div>
                    <div className="text-[10px] text-[color:var(--color-text-muted)] uppercase tracking-wide">{agent.schedule}</div>
                  </div>
                </div>
                <button
                  onClick={() => void runAgent(agent.id)}
                  disabled={!!running}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40 hover:bg-brand-blue/90 transition"
                >
                  {isRunning ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  {isRunning ? '...' : 'Run'}
                </button>
              </div>

              <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed">{agent.role}</p>

              {/* Result */}
              {res && (
                <div className="rounded-lg bg-[color:var(--color-surface-2)] p-3 text-xs text-[color:var(--color-text-muted)] font-mono">
                  {JSON.stringify(res).slice(0, 150)}
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-[color:var(--color-text-muted)]">
                  {error ? (
                    <><XCircle className="h-3 w-3 text-red-500" /> Error en último run</>
                  ) : last ? (
                    <><CheckCircle className="h-3 w-3 text-emerald-500" /> Último: {last}</>
                  ) : (
                    <><Clock className="h-3 w-3" /> Sin runs recientes</>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent logs */}
      {logs.length > 0 && (
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
          <h2 className="font-semibold text-sm text-[color:var(--color-text)] mb-3">Eventos recientes</h2>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {logs.slice(0, 20).map((log, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-[color:var(--color-border)] last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${log.type.includes('error') ? 'bg-red-100 text-red-700' : log.type.includes('completed') ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {log.type.split('.').pop()}
                  </span>
                  <span className="text-[color:var(--color-text-muted)]">{log.source}</span>
                </div>
                <span className="text-[color:var(--color-text-muted)]">
                  {new Date(log.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

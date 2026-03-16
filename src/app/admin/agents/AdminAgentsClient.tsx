// src/app/admin/agents/AdminAgentsClient.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';

type AgentDef = {
  id: 'ops' | 'review' | 'sales' | 'content' | 'analytics' | 'trainer';
  name: string;
  icon: string;
  role: string;
  schedule: string;
  color: string;
};

const AGENTS: AgentDef[] = [
  { id: 'sales',     name: 'Sales Agent',     icon: '💼', role: 'Califica leads, draft propuestas, sigue deals', schedule: 'Cada hora', color: 'blue' },
  { id: 'ops',       name: 'Ops Agent',       icon: '🔔', role: 'Recordatorios pre-tour, coordinación logística', schedule: 'Cada hora', color: 'orange' },
  { id: 'review',    name: 'Review Agent',    icon: '⭐', role: 'Solicita reseñas post-tour, fidelización', schedule: 'Cada hora', color: 'yellow' },
  { id: 'content',   name: 'Content Agent',   icon: '✍️', role: 'Genera blog posts, descripiones de tours, SEO', schedule: 'Diario 10am', color: 'green' },
  { id: 'analytics', name: 'Analytics Agent', icon: '📊', role: 'Analiza datos, detecta anomalías, insights', schedule: 'Diario 10am', color: 'purple' },
  { id: 'trainer',   name: 'Trainer Agent',   icon: '🧠', role: 'Auto-entrena todos los agentes con datos reales', schedule: 'Lunes 10am', color: 'pink' },
];

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; btn: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   btn: 'bg-blue-600 hover:bg-blue-700' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', btn: 'bg-orange-500 hover:bg-orange-600' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', btn: 'bg-yellow-500 hover:bg-yellow-600' },
  green:  { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200',btn: 'bg-emerald-600 hover:bg-emerald-700' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', btn: 'bg-purple-600 hover:bg-purple-700' },
  pink:   { bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200',   btn: 'bg-pink-600 hover:bg-pink-700' },
};

type LogEntry = { type: string; source: string; payload: Record<string, unknown>; created_at: string };
type MsgEntry = { id: string; to_email: string; subject: string; status: string; created_at: string; metadata: Record<string, unknown> };
type Stats = { ops: { sent: number; queued: number; failed: number }; review: { sent: number; queued: number; failed: number } };

export default function AdminAgentsClient() {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [msgs, setMsgs] = useState<MsgEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'agents' | 'logs' | 'messages'>('agents');
  const [flash, setFlash] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch('/api/admin/agents/logs?limit=50');
      const d = await r.json();
      if (d.ok) { setLogs(d.events ?? []); setMsgs(d.messages ?? []); setStats(d.stats ?? null); }
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
        setResults((prev) => ({ ...prev, [agentId]: d.results }));
        setFlash(`✅ ${agentId} completado`);
        void loadLogs();
      } else {
        setFlash(`❌ Error: ${d.error}`);
      }
    } catch (e: any) {
      setFlash(`❌ ${e?.message}`);
    } finally {
      setRunning(null);
      setTimeout(() => setFlash(null), 5000);
    }
  }

  function fmt(iso: string) {
    try { return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }); } catch { return iso; }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[color:var(--color-text)]">
            🤖 Agentes IA — Centro de Control
          </h1>
          <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            6 agentes con roles especializados operan KCE de forma autónoma.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void runAgent('all')}
            disabled={!!running}
            className="rounded-full bg-brand-blue px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-brand-blue/90 transition"
          >
            {running === 'all' ? '⏳ Ejecutando...' : '▶ Ejecutar Todos'}
          </button>
          <button onClick={() => void loadLogs()} disabled={loading}
            className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold hover:bg-[color:var(--color-surface-2)] transition disabled:opacity-50">
            {loading ? '⏳' : '↻'}
          </button>
        </div>
      </div>

      {flash && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm">
          {flash}
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden w-fit">
        {(['agents', 'logs', 'messages'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-xs font-semibold capitalize transition ${tab === t ? 'bg-brand-blue text-white' : 'text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]'}`}>
            {t === 'agents' ? '🤖 Agentes' : t === 'logs' ? '📋 Eventos' : '📧 Mensajes'}
          </button>
        ))}
      </div>

      {/* Agents Grid */}
      {tab === 'agents' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent) => {
            const c = COLOR_MAP[agent.color] ?? COLOR_MAP['blue']!;
            const lastLog = logs.find((l) => l.source === `${agent.id}_agent`);
            const agentResult = results[agent.id];
            const isRunning = running === agent.id || running === 'all';

            return (
              <div key={agent.id} className={`rounded-3xl border ${c.border} ${c.bg} p-5 space-y-3`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl">{agent.icon}</div>
                    <div className={`mt-1 text-sm font-bold ${c.text}`}>{agent.name}</div>
                    <div className="text-[10px] text-[color:var(--color-text-muted)] uppercase tracking-wide mt-0.5">{agent.schedule}</div>
                  </div>
                  <button
                    onClick={() => void runAgent(agent.id)}
                    disabled={!!running}
                    className={`rounded-full ${c.btn} px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40 transition`}
                  >
                    {isRunning ? '⏳' : '▶ Run'}
                  </button>
                </div>

                <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed">{agent.role}</p>

                {agentResult !== undefined && (
                  <div className="rounded-xl bg-white/60 px-3 py-2 text-[10px] font-mono text-[color:var(--color-text-muted)] overflow-hidden">
                    {JSON.stringify(agentResult as Record<string, unknown>).slice(0, 120)}...
                  </div>
                )}

                {lastLog && (
                  <div className="text-[10px] text-[color:var(--color-text-muted)]">
                    Último run: {fmt(lastLog.created_at)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Logs Tab */}
      {tab === 'logs' && (
        <div className="space-y-2">
          {logs.length === 0 && <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 text-center text-sm text-[color:var(--color-text-muted)]">Sin eventos. Ejecuta un agente.</div>}
          {logs.map((e, i) => (
            <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${e.type.includes('error') ? 'bg-red-100 text-red-700' : e.type.includes('completed') ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {e.type.split('.').slice(-1)[0]}
                  </span>
                  <span className="text-xs text-[color:var(--color-text-muted)]">{e.source}</span>
                </div>
                <span className="text-[10px] text-[color:var(--color-text-muted)]">{fmt(e.created_at)}</span>
              </div>
              {e.payload && Object.keys(e.payload).length > 0 && (
                <div className="mt-1 text-[10px] font-mono text-[color:var(--color-text-muted)]">{JSON.stringify(e.payload).slice(0, 100)}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Messages Tab */}
      {tab === 'messages' && (
        <div className="space-y-2">
          {stats && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[['Ops Agent', stats.ops], ['Review Agent', stats.review]].map(([label, s]) => {
                const st = s as typeof stats.ops;
                return (
                  <div key={label as string} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4">
                    <div className="text-xs font-bold text-[color:var(--color-text-muted)] uppercase mb-2">{label as string}</div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><div className="text-xl font-bold text-emerald-600">{st.sent}</div><div className="text-[9px] text-[color:var(--color-text-muted)]">Enviados</div></div>
                      <div><div className="text-xl font-bold text-amber-500">{st.queued}</div><div className="text-[9px] text-[color:var(--color-text-muted)]">En cola</div></div>
                      <div><div className="text-xl font-bold text-red-500">{st.failed}</div><div className="text-[9px] text-[color:var(--color-text-muted)]">Fallidos</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {msgs.length === 0 && <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 text-center text-sm text-[color:var(--color-text-muted)]">Sin mensajes enviados aún.</div>}
          {msgs.map((m) => (
            <div key={m.id} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${m.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : m.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{m.status}</span>
                  <span className="text-xs text-[color:var(--color-text-muted)]">{String(m.metadata?.agent ?? '')}</span>
                  <span className="text-sm text-[color:var(--color-text)]">{m.to_email}</span>
                </div>
                <span className="text-[10px] text-[color:var(--color-text-muted)]">{fmt(m.created_at)}</span>
              </div>
              {m.subject && <div className="mt-1 text-xs text-[color:var(--color-text-muted)]">📧 {m.subject}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

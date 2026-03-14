// src/app/admin/agents/AdminAgentsClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';

type EventRow = {
  id: string;
  type: string;
  source: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

type MessageRow = {
  id: string;
  to_email: string | null;
  subject: string | null;
  status: string;
  channel: string;
  created_at: string;
  sent_at: string | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
};

type Stats = {
  ops: { sent: number; queued: number; failed: number };
  review: { sent: number; queued: number; failed: number };
};

type LogsData = { events: EventRow[]; messages: MessageRow[]; stats: Stats };

function Badge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    sent: 'bg-emerald-100 text-emerald-800',
    queued: 'bg-amber-100 text-amber-800',
    failed: 'bg-red-100 text-red-800',
    completed: 'bg-emerald-100 text-emerald-800',
    started: 'bg-blue-100 text-blue-800',
    error: 'bg-red-100 text-red-800',
  };
  const key = Object.keys(colors).find((k) => status.includes(k)) ?? 'queued';
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colors[key]}`}>
      {status.split('.').pop()}
    </span>
  );
}

function StatCard({ label, sent, queued, failed }: { label: string; sent: number; queued: number; failed: number }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)] mb-3">{label}</div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div><div className="text-2xl font-bold text-emerald-600">{sent}</div><div className="text-[10px] text-[color:var(--color-text-muted)]">Enviados</div></div>
        <div><div className="text-2xl font-bold text-amber-500">{queued}</div><div className="text-[10px] text-[color:var(--color-text-muted)]">En cola</div></div>
        <div><div className="text-2xl font-bold text-red-500">{failed}</div><div className="text-[10px] text-[color:var(--color-text-muted)]">Fallidos</div></div>
      </div>
    </div>
  );
}

function fmt(iso: string) {
  try { return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }); } catch { return iso; }
}

export default function AdminAgentsClient() {
  const [data, setData] = useState<LogsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState<'events' | 'messages'>('events');
  const [agentFilter, setAgentFilter] = useState<'all' | 'ops_agent' | 'review_agent'>('all');

  async function load() {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/agents/logs?limit=100&agent=${agentFilter}`);
      const d = await res.json();
      if (d.ok) setData(d);
    } catch (e: any) {
      setMsg(e?.message || 'Error cargando logs');
    } finally {
      setLoading(false);
    }
  }

  async function runAgent(agent: 'ops' | 'review' | 'all') {
    setRunning(agent);
    setMsg('');
    try {
      const res = await adminFetch('/api/admin/agents', {
        method: 'POST',
        body: JSON.stringify({ agent, dryRun: false }),
      });
      const d = await res.json();
      if (d.ok) {
        const r = d.results;
        setMsg(`✅ ${agent === 'ops' ? `Ops: ${r.ops?.processed ?? 0} emails` : agent === 'review' ? `Review: ${r.review?.processed ?? 0} emails` : `Ops: ${r.ops?.processed ?? 0} + Review: ${r.review?.processed ?? 0}`}`);
        void load();
      } else {
        setMsg(`Error: ${d.error || 'unknown'}`);
      }
    } catch (e: any) {
      setMsg(e?.message || 'Error ejecutando agente');
    } finally {
      setRunning(null);
    }
  }

  useEffect(() => { void load(); }, [agentFilter]);

  const filteredEvents = (data?.events ?? []).filter(
    (e) => agentFilter === 'all' || e.source === agentFilter,
  );
  const filteredMessages = (data?.messages ?? []).filter(
    (m) => agentFilter === 'all' || m.metadata?.agent === agentFilter,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-[color:var(--color-text)]">Agentes IA</h1>
          <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            Logs de actividad, métricas y disparo manual de los agentes de operación.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void runAgent('ops')}
            disabled={!!running}
            className="rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-brand-blue/90 transition"
          >
            {running === 'ops' ? '⏳ Ejecutando...' : '▶ Ops Agent'}
          </button>
          <button
            onClick={() => void runAgent('review')}
            disabled={!!running}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-emerald-700 transition"
          >
            {running === 'review' ? '⏳ Ejecutando...' : '▶ Review Agent'}
          </button>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-[color:var(--color-surface-2)] transition"
          >
            {loading ? '⏳' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {msg && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm">
          {msg}
        </div>
      )}

      {/* Stats */}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="🔔 Ops Agent (pre-tour reminders)" {...data.stats.ops} />
          <StatCard label="⭐ Review Agent (solicitudes de reseña)" {...data.stats.review} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden">
          {(['all', 'ops_agent', 'review_agent'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setAgentFilter(f)}
              className={`px-4 py-2 text-xs font-semibold transition ${agentFilter === f ? 'bg-brand-blue text-white' : 'text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]'}`}
            >
              {f === 'all' ? 'Todos' : f === 'ops_agent' ? 'Ops' : 'Review'}
            </button>
          ))}
        </div>
        <div className="flex rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden">
          {(['events', 'messages'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-brand-blue text-white' : 'text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]'}`}
            >
              {t === 'events' ? `Eventos (${filteredEvents.length})` : `Mensajes (${filteredMessages.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Events tab */}
      {tab === 'events' && (
        <div className="space-y-2">
          {filteredEvents.length === 0 && !loading && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 text-center text-sm text-[color:var(--color-text-muted)]">
              Sin eventos. Ejecuta un agente para ver actividad.
            </div>
          )}
          {filteredEvents.map((e) => (
            <div key={e.id} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge status={e.type} />
                  <span className="text-sm font-medium text-[color:var(--color-text)]">{e.type}</span>
                </div>
                <span className="text-[10px] text-[color:var(--color-text-muted)]">{fmt(e.created_at)}</span>
              </div>
              {e.payload && Object.keys(e.payload).length > 0 && (
                <div className="mt-2 rounded-xl bg-[color:var(--color-surface-2)] px-3 py-2 text-[11px] font-mono text-[color:var(--color-text-muted)]">
                  {JSON.stringify(e.payload)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Messages tab */}
      {tab === 'messages' && (
        <div className="space-y-2">
          {filteredMessages.length === 0 && !loading && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 text-center text-sm text-[color:var(--color-text-muted)]">
              Sin mensajes enviados por los agentes aún.
            </div>
          )}
          {filteredMessages.map((m) => (
            <div key={m.id} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge status={m.status} />
                  <span className="text-xs font-semibold text-[color:var(--color-text-muted)] uppercase">
                    {String(m.metadata?.agent ?? 'agent').replace('_agent', '')}
                  </span>
                  <span className="text-sm text-[color:var(--color-text)]">{m.to_email}</span>
                </div>
                <span className="text-[10px] text-[color:var(--color-text-muted)]">{fmt(m.created_at)}</span>
              </div>
              {m.subject && (
                <div className="mt-1 text-xs text-[color:var(--color-text-muted)]">📧 {m.subject}</div>
              )}
              {m.error && (
                <div className="mt-1 text-xs text-red-600">⚠ {m.error}</div>
              )}
              {m.sent_at && (
                <div className="mt-1 text-[10px] text-emerald-600">✓ Enviado: {fmt(m.sent_at)}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

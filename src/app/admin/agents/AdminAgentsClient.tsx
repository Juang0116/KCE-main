'use client';

import { useEffect, useState, useMemo } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { Bot, Play, RefreshCw, Activity, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

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
    sent: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    queued: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    failed: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
    completed: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    started: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
    error: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
  };
  const key = Object.keys(colors).find((k) => status.includes(k)) ?? 'queued';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${colors[key]}`}>
      {status.split('.').pop()}
    </span>
  );
}

function StatCard({ label, sent, queued, failed, icon: Icon }: { label: string; sent: number; queued: number; failed: number; icon: any }) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 transition-colors hover:border-brand-blue/30">
      <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-border)] pb-4">
        <Icon className="h-5 w-5 text-brand-blue" />
        <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-text)]/60">{label}</div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="rounded-2xl bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
          <div className="text-3xl font-heading text-emerald-600">{sent}</div>
          <div className="mt-1 text-[10px] uppercase font-bold tracking-widest text-[var(--color-text)]/40">Enviados</div>
        </div>
        <div className="rounded-2xl bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
          <div className="text-3xl font-heading text-amber-600">{queued}</div>
          <div className="mt-1 text-[10px] uppercase font-bold tracking-widest text-[var(--color-text)]/40">En cola</div>
        </div>
        <div className="rounded-2xl bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
          <div className="text-3xl font-heading text-rose-600">{failed}</div>
          <div className="mt-1 text-[10px] uppercase font-bold tracking-widest text-[var(--color-text)]/40">Fallidos</div>
        </div>
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
        setMsg(`✅ ${agent === 'ops' ? `Ops: ${r.ops?.processed ?? 0} correos` : agent === 'review' ? `Review: ${r.review?.processed ?? 0} correos` : `Ops: ${r.ops?.processed ?? 0} + Review: ${r.review?.processed ?? 0}`}`);
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

  const filteredEvents = (data?.events ?? []).filter((e) => agentFilter === 'all' || e.source === agentFilter);
  const filteredMessages = (data?.messages ?? []).filter((m) => agentFilter === 'all' || m.metadata?.agent === agentFilter);

  const agentSignals = useMemo(() => [
    { label: 'Eventos Logueados', value: String(filteredEvents.length), note: 'Acciones de sistema recientes.' },
    { label: 'Mensajes Generados', value: String(filteredMessages.length), note: 'Comunicaciones enviadas por IA.' },
    { label: 'Ops Queue', value: String(data?.stats?.ops?.queued ?? 0), note: 'Reminders pendientes de envío.' },
  ], [filteredEvents.length, filteredMessages.length, data]);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Agentes Autónomos</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Supervisa y dispara los agentes que operan KCE en segundo plano.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="AI Automation Hub"
        title="El Piloto Automático"
        description="Revisa los logs para asegurar que el Ops Agent (Recordatorios de Tour) y el Review Agent (Petición de Reseñas) están haciendo su trabajo sin errores."
        actions={[
          { href: '/admin/ops', label: 'Centro de Ops', tone: 'primary' },
          { href: '/admin/reviews', label: 'Moderar Reseñas' }
        ]}
        signals={agentSignals}
      />

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* Controles de Ejecución */}
        <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between mb-8 border-b border-[var(--color-border)] pb-8">
          <div className="flex flex-wrap gap-3">
            <button onClick={() => void runAgent('ops')} disabled={!!running} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 disabled:opacity-50 shadow-md">
              {running === 'ops' ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Play className="h-4 w-4 fill-current"/>} Ops Agent
            </button>
            <button onClick={() => void runAgent('review')} disabled={!!running} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-emerald-700 disabled:opacity-50 shadow-md">
              {running === 'review' ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Play className="h-4 w-4 fill-current"/>} Review Agent
            </button>
          </div>
          <button onClick={() => void load()} disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-6 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)] disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Sync Logs
          </button>
        </div>

        {msg && <div className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-800">{msg}</div>}

        {/* Tarjetas de Estadísticas */}
        {data && (
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <StatCard label="Ops Agent (Recordatorios de Tour)" icon={Activity} {...data.stats.ops} />
            <StatCard label="Review Agent (Solicitudes de Reseña)" icon={Mail} {...data.stats.review} />
          </div>
        )}

        {/* Filtros de Pestañas */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-[var(--color-border)] pb-6">
          <div className="flex gap-2 bg-[var(--color-surface-2)] p-1.5 rounded-full border border-[var(--color-border)]">
            {(['all', 'ops_agent', 'review_agent'] as const).map((f) => (
              <button key={f} onClick={() => setAgentFilter(f)} className={`rounded-full px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${agentFilter === f ? 'bg-brand-dark text-brand-yellow shadow-md scale-105' : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-black/5'}`}>
                {f === 'all' ? 'Todos' : f === 'ops_agent' ? 'Ops Agent' : 'Review Agent'}
              </button>
            ))}
          </div>

          <div className="flex gap-2 bg-[var(--color-surface-2)] p-1.5 rounded-full border border-[var(--color-border)]">
            <button onClick={() => setTab('events')} className={`rounded-full px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${tab === 'events' ? 'bg-brand-blue text-white shadow-md scale-105' : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-black/5'}`}>
              Eventos ({filteredEvents.length})
            </button>
            <button onClick={() => setTab('messages')} className={`rounded-full px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${tab === 'messages' ? 'bg-brand-blue text-white shadow-md scale-105' : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-black/5'}`}>
              Mensajes ({filteredMessages.length})
            </button>
          </div>
        </div>

        {/* Vistas de Pestañas */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 md:p-6">
          {tab === 'events' && (
            <div className="space-y-3">
              {filteredEvents.length === 0 && !loading && (
                <div className="py-12 text-center">
                  <Bot className="mx-auto h-12 w-12 text-[var(--color-text)]/10 mb-4" />
                  <p className="text-sm font-medium text-[var(--color-text)]/40">Sin eventos en este agente.</p>
                </div>
              )}
              {filteredEvents.map((e) => (
                <div key={e.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <Badge status={e.type} />
                      <span className="font-semibold text-brand-blue">{e.type}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">{fmt(e.created_at)}</span>
                  </div>
                  {e.payload && Object.keys(e.payload).length > 0 && (
                    <div className="rounded-xl bg-[var(--color-surface-2)] p-4 text-[11px] font-mono text-[var(--color-text)]/60 overflow-x-auto border border-[var(--color-border)]">
                      <pre>{JSON.stringify(e.payload, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'messages' && (
            <div className="space-y-3">
              {filteredMessages.length === 0 && !loading && (
                <div className="py-12 text-center">
                  <Mail className="mx-auto h-12 w-12 text-[var(--color-text)]/10 mb-4" />
                  <p className="text-sm font-medium text-[var(--color-text)]/40">Sin mensajes en este agente.</p>
                </div>
              )}
              {filteredMessages.map((m) => (
                <div key={m.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] pb-3 mb-3">
                    <div className="flex items-center gap-3">
                      <Badge status={m.status} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-md">
                        {String(m.metadata?.agent ?? 'agent').replace('_agent', '')}
                      </span>
                      <span className="font-medium text-[var(--color-text)]">{m.to_email}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">{fmt(m.created_at)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {m.subject && <div className="text-sm font-semibold text-[var(--color-text)]/80">📧 {m.subject}</div>}
                    {m.error && <div className="text-xs font-medium text-rose-600 bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-500/20 flex items-center gap-2"><AlertCircle className="h-4 w-4"/> {m.error}</div>}
                    {m.sent_at && <div className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/> Enviado: {fmt(m.sent_at)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Play, Pause, FastForward, Download, RefreshCw, Zap, Send, FileText, CheckCircle2, History } from 'lucide-react';

import { adminFetch } from '@/lib/adminFetch.client';

type TimelineItem = {
  kind: 'task' | 'outbound' | 'event' | 'message';
  ts: string;
  title: string;
  detail?: string;
  meta?: unknown;
};

type Deal = {
  id: string;
  title: string;
  stage: string;
  tour_slug: string | null;
  amount_minor: number | null;
  currency: string | null;
  probability: number | null;
  checkout_url: string | null;
  stripe_session_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  closed_at: string | null;
  lead_id: string | null;
  customer_id: string | null;
};

type TicketRef = {
  id: string;
  subject?: string | null;
  status?: string | null;
  channel?: string | null;
};

type TimelineResponse = {
  deal: Deal;
  ticket: TicketRef | null;
  timeline: TimelineItem[];
};

type ActionResult =
  | { ok: true; label: string; detail?: string }
  | { ok: false; label: string; detail?: string };

function moneyEUR(minor: number | null | undefined) {
  const v = (minor ?? 0) / 100;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

function badge(kind: string) {
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest';
  if (kind === 'task') return base + ' border border-blue-500/20 bg-blue-500/10 text-blue-700';
  if (kind === 'outbound') return base + ' border border-emerald-500/20 bg-emerald-500/10 text-emerald-700';
  if (kind === 'event') return base + ' border border-purple-500/20 bg-purple-500/10 text-purple-700';
  return base + ' border border-amber-500/20 bg-amber-500/10 text-amber-800';
}

function stageCopy(stageRaw?: string | null) {
  const stage = (stageRaw || '').toLowerCase();
  if (stage === 'checkout') {
    return {
      kind: 'checkout_push' as const,
      title: 'Acelerar Checkout',
      summary: 'El cliente tiene el link de pago. Reactiva la urgencia y valida que no tenga problemas técnicos.',
    };
  }
  if (stage === 'proposal') {
    return {
      kind: 'proposal' as const,
      title: 'Seguimiento de Propuesta',
      summary: 'Evalúa la temperatura de la propuesta. Es el momento de agendar llamada o mandar un incentivo.',
    };
  }
  return {
    kind: 'followup_24h' as const,
    title: 'Warm Follow-up',
    summary: 'El deal es reciente. Construye rapport, califica presupuesto y establece el próximo paso claro.',
  };
}

function toDateInput(daysAhead = 7) {
  const d = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

export function AdminDealDetailClient({ id }: { id: string }) {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState<'playbook' | 'proposal' | null>(null);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);

  // Timeline playback
  const [play, setPlay] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [speed, setSpeed] = useState(1);

  async function load() {
    setLoading(true); setErr('');
    try {
      const res = await adminFetch(`/api/admin/deals/${id}/timeline`, { cache: 'no-store' });
      const j = (await res.json()) as Partial<TimelineResponse> & { error?: string };
      if (!res.ok) throw new Error(j?.error || 'Error cargando deal');
      setData({ deal: (j.deal || null) as Deal, ticket: (j.ticket || null) as TicketRef | null, timeline: Array.isArray(j.timeline) ? (j.timeline as TimelineItem[]) : [] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error'); setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [id]);

  const deal = data?.deal;
  const timeline = useMemo(() => data?.timeline ?? [], [data]);
  const guidance = useMemo(() => stageCopy(deal?.stage), [deal?.stage]);

  useEffect(() => { setPlayIndex(0); setPlay(false); }, [timeline.length]);

  useEffect(() => {
    if (!play || !timeline.length) return;
    const stepMs = Math.max(200, Math.round(900 / Math.max(0.25, speed)));
    const t = window.setInterval(() => {
      setPlayIndex((i) => {
        const next = i + 1;
        if (next >= timeline.length) { window.clearInterval(t); setPlay(false); return i; }
        return next;
      });
    }, stepMs);
    return () => window.clearInterval(t);
  }, [play, speed, timeline.length]);

  function exportTimeline() {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `deal-${id}-timeline.json`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {}
  }

  async function applyPlaybook() {
    setActionBusy('playbook'); setActionResult(null);
    try {
      const res = await adminFetch(`/api/admin/deals/${id}/playbook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: guidance.kind }) });
      const j = (await res.json().catch(() => null)) as { tasksCreated?: number; error?: string } | null;
      if (!res.ok) throw new Error(j?.error || 'No fue posible aplicar el playbook');
      setActionResult({ ok: true, label: 'Playbook aplicado', detail: `${j?.tasksCreated ?? 0} tareas encoladas para: ${guidance.title}.` });
      await load();
    } catch (e) {
      setActionResult({ ok: false, label: 'Fallo al aplicar playbook', detail: e instanceof Error ? e.message : 'Error interno' });
    } finally { setActionBusy(null); }
  }

  async function generateProposal() {
    if (!deal?.tour_slug) {
      setActionResult({ ok: false, label: 'Acción Bloqueada', detail: 'Este deal no tiene un Tour asociado. Asigna un tour antes de enviar la propuesta.' });
      return;
    }
    setActionBusy('proposal'); setActionResult(null);
    try {
      const res = await adminFetch(`/api/admin/deals/${id}/proposal`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: deal.tour_slug, date: toDateInput(7), guests: 2, locale: 'es', includeCheckoutLink: true }) });
      const j = (await res.json().catch(() => null)) as { checkoutUrl?: string | null; error?: string } | null;
      if (!res.ok) throw new Error(j?.error || 'No fue posible generar la propuesta');
      setActionResult({ ok: true, label: 'Propuesta Generada', detail: j?.checkoutUrl ? 'El cliente ya tiene el link de pago activo.' : 'Propuesta enviada (modo informativo).' });
      await load();
    } catch (e) {
      setActionResult({ ok: false, label: 'Error al procesar propuesta', detail: e instanceof Error ? e.message : 'Error interno' });
    } finally { setActionBusy(null); }
  }

  const openTasks = timeline.filter((it) => it.kind === 'task').length;
  const recentSignals = timeline.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-20">
      
      {/* CABECERA Y MIGAS DE PAN */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-2">
          <Link href="/admin/deals" className="hover:text-brand-blue transition-colors">← Volver al Cockpit</Link> / DEAL {id.slice(0,8)}
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">{deal?.title || 'Deal Sin Nombre'}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-blue">{deal?.stage || 'NEW'}</span>
              {deal?.tour_slug && <span className="font-medium text-[var(--color-text)]/70">📍 {deal.tour_slug}</span>}
              <span className="font-bold text-emerald-600">{moneyEUR(deal?.amount_minor ?? 0)}</span>
              {deal?.probability != null && <span className="font-medium text-[var(--color-text)]/50">Prob: {deal.probability}%</span>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {deal?.checkout_url && (
              <a href={deal.checkout_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-600 shadow-md">
                💸 Ver Checkout
              </a>
            )}
            <button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface-2)]">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Cargando...' : 'Sync'}
            </button>
          </div>
        </div>
      </div>

      {err && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}

      {!data && !loading && (
        <div className="py-20 text-center text-[var(--color-text)]/50 text-sm">No se encontraron datos para este Deal.</div>
      )}

      {data && (
        <>
          {/* TABLERO DE ACCIÓN */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* 1. Siguiente Acción (Playbook) */}
            <div className="rounded-3xl border-2 border-brand-blue/20 bg-brand-blue/5 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5"><Zap className="h-32 w-32" /></div>
              <div className="relative z-10">
                <div className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/70">Consejo Comercial</div>
                <h3 className="mt-2 font-heading text-2xl text-brand-blue">{guidance.title}</h3>
                <p className="mt-2 text-sm text-brand-blue/80 font-light leading-relaxed">{guidance.summary}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button onClick={applyPlaybook} disabled={actionBusy !== null} className="flex-1 rounded-xl bg-brand-blue px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 disabled:opacity-50">
                    {actionBusy === 'playbook' ? 'Procesando...' : 'Auto-Follow Up'}
                  </button>
                  <button onClick={generateProposal} disabled={actionBusy !== null || !deal?.tour_slug} className="flex-1 rounded-xl bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-brand-blue transition border border-brand-blue/20 hover:bg-brand-blue/10 disabled:opacity-50">
                    {actionBusy === 'proposal' ? 'Armando...' : 'Crear Propuesta'}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Contexto del Cliente */}
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Identidad Digital</div>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-xs text-[var(--color-text)]/50">Customer ID</div>
                  <div className="font-mono text-sm">{deal?.customer_id || 'No linkeado'}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--color-text)]/50">Lead Origin</div>
                  <div className="font-mono text-sm">{deal?.lead_id || 'Generado Manualmente'}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--color-text)]/50">Estado de Conversión</div>
                  <div className="text-sm font-semibold">{deal?.checkout_url ? '💳 Payment Link Activo' : '🔎 En Negociación'}</div>
                </div>
              </div>
            </div>

            {/* 3. Salud Operativa */}
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Métricas Vitales</div>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2">
                    <span className="text-sm text-[var(--color-text)]/70">Interacciones (Timeline)</span>
                    <span className="font-bold">{timeline.length}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2">
                    <span className="text-sm text-[var(--color-text)]/70">Tareas Abiertas</span>
                    <span className={`font-bold ${openTasks > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{openTasks}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-sm text-[var(--color-text)]/70">Última Actividad</span>
                    <span className="text-xs font-medium">{deal?.updated_at ? new Date(deal.updated_at).toLocaleDateString('es-ES') : '—'}</span>
                  </div>
                </div>
              </div>
              {data.ticket && (
                <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-amber-800">Ticket Abierto: {data.ticket.status}</div>
                  <Link href={`/admin/tickets/${data.ticket.id}`} className="mt-1 block text-xs font-semibold text-amber-900 hover:underline truncate">
                    ⚠️ {data.ticket.subject || 'Atención requerida en soporte'}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {actionResult && (
            <div className={`rounded-2xl border p-4 text-sm flex gap-3 items-start ${actionResult.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800' : 'border-red-500/30 bg-red-500/10 text-red-800'}`}>
              <CheckCircle2 className={`h-5 w-5 shrink-0 ${actionResult.ok ? 'text-emerald-600' : 'text-red-600'}`} />
              <div>
                <div className="font-bold uppercase tracking-widest text-[10px]">{actionResult.label}</div>
                {actionResult.detail && <div className="mt-1 opacity-90">{actionResult.detail}</div>}
              </div>
            </div>
          )}

          {/* REPRODUCTOR DE TIMELINE */}
          <div className="rounded-3xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
            <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-brand-blue">
                <History className="h-5 w-5" />
                <h3 className="font-heading text-xl">Timeline del Deal</h3>
              </div>
              
              {/* Controles de Auditoría */}
              <div className="flex items-center gap-2 bg-[var(--color-surface)] p-1.5 rounded-2xl border border-[var(--color-border)]">
                <button onClick={() => setPlay((p) => !p)} disabled={!timeline.length} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold tracking-widest uppercase transition ${play ? 'bg-brand-yellow text-brand-dark' : 'hover:bg-[var(--color-surface-2)] text-[var(--color-text)]/70'}`}>
                  {play ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />} {play ? 'Pausa' : 'Play'}
                </button>
                <div className="h-4 w-px bg-[var(--color-border)]"></div>
                <button onClick={() => setPlayIndex((i) => Math.max(0, i - 1))} disabled={!timeline.length || playIndex <= 0} className="px-2 text-[var(--color-text)]/50 hover:text-brand-blue disabled:opacity-30">◀</button>
                <span className="text-[10px] font-mono w-8 text-center">{playIndex + 1}/{timeline.length}</span>
                <button onClick={() => setPlayIndex((i) => Math.min(timeline.length - 1, i + 1))} disabled={!timeline.length || playIndex >= timeline.length - 1} className="px-2 text-[var(--color-text)]/50 hover:text-brand-blue disabled:opacity-30">▶</button>
                <div className="h-4 w-px bg-[var(--color-border)]"></div>
                <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="bg-transparent text-xs font-bold text-[var(--color-text)]/70 outline-none cursor-pointer pl-2">
                  <option value={0.5}>0.5x</option><option value={1}>1.0x</option><option value={2}>2.0x</option>
                </select>
                <button onClick={exportTimeline} disabled={!data} title="Exportar log" className="ml-2 p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text)]/50">
                  <Download className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {!timeline.length ? (
                <div className="text-center py-10 text-[var(--color-text)]/40 text-sm">Este deal es nuevo. Aún no hay eventos registrados.</div>
              ) : (
                <div className="relative border-l-2 border-brand-blue/10 ml-4 space-y-8 pb-4">
                  {timeline.map((it, i) => {
                    const isPlaying = i === playIndex && play;
                    const isPassed = i < playIndex;
                    return (
                      <div key={i} className={`relative pl-8 transition-all duration-300 ${isPlaying ? 'scale-[1.02] opacity-100' : isPassed ? 'opacity-60' : 'opacity-100'}`}>
                        {/* Dot */}
                        <div className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white ${isPlaying ? 'bg-brand-yellow scale-125 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-brand-blue/30'}`}></div>
                        
                        <div className={`rounded-2xl border p-4 transition-colors ${isPlaying ? 'border-brand-yellow/50 bg-brand-yellow/5' : 'border-[var(--color-border)] bg-[var(--color-surface-2)]'}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={badge(it.kind)}>{it.kind}</span>
                              <span className="font-semibold text-[var(--color-text)]">{it.title}</span>
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-[var(--color-text)]/40 font-mono">
                              {new Date(it.ts).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                            </div>
                          </div>
                          {it.detail && <p className="text-sm text-[var(--color-text)]/70 font-light leading-relaxed">{it.detail}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
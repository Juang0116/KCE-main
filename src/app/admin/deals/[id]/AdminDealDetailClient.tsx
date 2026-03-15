'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Play, Pause, FastForward, Download, RefreshCw, Zap, Send, FileText, CheckCircle2, History, ArrowLeft, MapPin } from 'lucide-react';

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
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm';
  if (kind === 'task') return base + ' border border-sky-500/20 bg-sky-500/10 text-sky-700';
  if (kind === 'outbound') return base + ' border border-emerald-500/20 bg-emerald-500/10 text-emerald-700';
  if (kind === 'event') return base + ' border border-brand-blue/20 bg-brand-blue/10 text-brand-blue';
  return base + ' border border-amber-500/20 bg-amber-500/10 text-amber-800';
}

function stageCopy(stageRaw?: string | null) {
  const stage = (stageRaw || '').toLowerCase();
  if (stage === 'checkout') {
    return { kind: 'checkout_push' as const, title: 'Acelerar Checkout', summary: 'El cliente tiene el link de pago. Reactiva la urgencia y valida que no tenga problemas técnicos.' };
  }
  if (stage === 'proposal') {
    return { kind: 'proposal' as const, title: 'Seguimiento de Propuesta', summary: 'Evalúa la temperatura de la propuesta. Es el momento de agendar llamada o mandar un incentivo.' };
  }
  return { kind: 'followup_24h' as const, title: 'Warm Follow-up', summary: 'El deal es reciente. Construye rapport, califica presupuesto y establece el próximo paso claro.' };
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

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-20">
      
      {/* CABECERA Y MIGAS DE PAN */}
      <div>
        <Link href="/admin/deals" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 hover:text-brand-blue transition-colors mb-4">
          <ArrowLeft className="h-3 w-3" /> Volver al Cockpit Comercial
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl text-[var(--color-text)] leading-tight">{deal?.title || 'Deal Sin Nombre'}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/70">
                {deal?.stage || 'NEW'}
              </span>
              {deal?.tour_slug && <span className="font-semibold text-brand-blue flex items-center gap-1"><MapPin className="h-3 w-3"/> {deal.tour_slug}</span>}
              <span className="font-heading text-lg text-emerald-600">{moneyEUR(deal?.amount_minor ?? 0)}</span>
              {deal?.probability != null && <span className="font-bold text-[var(--color-text)]/40 text-[10px] uppercase tracking-widest ml-2 border-l border-[var(--color-border)] pl-3">Prob: {deal.probability}%</span>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {deal?.checkout_url && (
              <a href={deal.checkout_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-emerald-600 shadow-md">
                💸 Ver Checkout
              </a>
            )}
            <button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)] disabled:opacity-50">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Cargando...' : 'Sync'}
            </button>
          </div>
        </div>
      </div>

      {err && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}

      {!data && !loading && (
        <div className="py-20 text-center text-[var(--color-text)]/50 text-sm italic border border-dashed border-[var(--color-border)] rounded-[2rem]">No se encontraron datos para este Deal.</div>
      )}

      {data && (
        <>
          {/* TABLERO DE ACCIÓN E INFORMACIÓN */}
          <div className="grid gap-6 md:grid-cols-3 items-start">
            
            {/* 1. Siguiente Acción (Playbook) */}
            <div className="rounded-3xl border-2 border-brand-blue/20 bg-brand-blue/5 p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute -right-6 -top-6 opacity-5"><Zap className="h-40 w-40 text-brand-blue" /></div>
              <div className="relative z-10">
                <div className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/70 flex items-center gap-1.5 mb-3">
                  <Zap className="h-3 w-3"/> IA Consejo Comercial
                </div>
                <h3 className="font-heading text-2xl text-brand-blue mb-2">{guidance.title}</h3>
                <p className="text-sm text-[var(--color-text)]/70 font-light leading-relaxed">{guidance.summary}</p>
                <div className="mt-6 flex flex-col xl:flex-row gap-2">
                  <button onClick={applyPlaybook} disabled={actionBusy !== null} className="flex-1 flex items-center justify-center rounded-xl bg-brand-blue px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 shadow-md disabled:opacity-50">
                    {actionBusy === 'playbook' ? 'Procesando...' : 'Auto-Follow Up'}
                  </button>
                  <button onClick={generateProposal} disabled={actionBusy !== null || !deal?.tour_slug} className="flex-1 flex items-center justify-center rounded-xl border border-brand-blue/30 bg-white/60 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-blue transition hover:bg-white disabled:opacity-50">
                    {actionBusy === 'proposal' ? 'Armando...' : 'Crear Propuesta'}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Contexto del Cliente */}
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm flex flex-col justify-between h-full">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-4 border-b border-[var(--color-border)] pb-3">Identidad Digital</div>
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] text-[var(--color-text)]/40 uppercase tracking-widest font-bold mb-1">Customer ID (CRM)</div>
                    <div className={`text-sm font-mono ${deal?.customer_id ? 'text-emerald-600 font-bold' : 'text-[var(--color-text)]/60'}`}>{deal?.customer_id || 'No linkeado (Anónimo)'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--color-text)]/40 uppercase tracking-widest font-bold mb-1">Lead Origin</div>
                    <div className="text-sm font-mono text-[var(--color-text)]/80">{deal?.lead_id || 'Generado Manualmente'}</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
                <div className="text-[10px] text-[var(--color-text)]/40 uppercase tracking-widest font-bold mb-1">Estado de Conversión</div>
                <div className={`text-sm font-semibold flex items-center gap-1.5 ${deal?.checkout_url ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {deal?.checkout_url ? <CheckCircle2 className="h-4 w-4"/> : <History className="h-4 w-4"/>} 
                  {deal?.checkout_url ? 'Payment Link Activo' : 'En Negociación'}
                </div>
              </div>
            </div>

            {/* 3. Salud Operativa */}
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm flex flex-col justify-between h-full">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-4 border-b border-[var(--color-border)] pb-3">Salud Operativa</div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-[var(--color-surface-2)] p-3 rounded-xl border border-[var(--color-border)]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/60">Líneas en Timeline</span>
                    <span className="font-heading text-lg text-brand-blue">{timeline.length}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[var(--color-surface-2)] p-3 rounded-xl border border-[var(--color-border)]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/60">Tareas Abiertas</span>
                    <span className={`font-heading text-lg ${openTasks > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{openTasks}</span>
                  </div>
                  <div className="flex justify-between items-center px-2 py-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">Última Actividad</span>
                    <span className="text-xs font-mono text-[var(--color-text)]/60">{deal?.updated_at ? new Date(deal.updated_at).toLocaleDateString('es-ES') : '—'}</span>
                  </div>
                </div>
              </div>
              {data.ticket && (
                <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 transition hover:bg-amber-500/20">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">Ticket Abierto: {data.ticket.status}</div>
                  <Link href={`/admin/tickets/${data.ticket.id}`} className="block text-xs font-semibold text-amber-900 truncate">
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
                {actionResult.detail && <div className="mt-1 opacity-90 leading-relaxed font-light">{actionResult.detail}</div>}
              </div>
            </div>
          )}

          {/* REPRODUCTOR DE TIMELINE */}
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
            <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-6 md:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-[var(--color-text)]">
                <History className="h-5 w-5 opacity-50" />
                <h3 className="font-heading text-2xl">Historial E2E</h3>
              </div>
              
              {/* Controles de Reproducción */}
              <div className="flex items-center gap-2 bg-[var(--color-surface)] p-1.5 rounded-2xl border border-[var(--color-border)] shadow-sm w-max mx-auto sm:mx-0">
                <button onClick={() => setPlay((p) => !p)} disabled={!timeline.length} className={`flex h-8 items-center gap-1.5 px-3 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${play ? 'bg-brand-blue text-white shadow-sm' : 'hover:bg-[var(--color-surface-2)] text-[var(--color-text)]/70'}`}>
                  {play ? <Pause className="h-3 w-3 fill-white" /> : <Play className="h-3 w-3 fill-[var(--color-text)] opacity-50" />} {play ? 'Pausa' : 'Play'}
                </button>
                <div className="h-4 w-px bg-[var(--color-border)]"></div>
                <button onClick={() => setPlayIndex((i) => Math.max(0, i - 1))} disabled={!timeline.length || playIndex <= 0} className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--color-text)]/50 hover:bg-[var(--color-surface-2)] hover:text-brand-blue disabled:opacity-30 transition-colors">◀</button>
                <span className="text-[10px] font-mono font-bold w-12 text-center text-[var(--color-text)]/50">{playIndex + 1} / {timeline.length}</span>
                <button onClick={() => setPlayIndex((i) => Math.min(timeline.length - 1, i + 1))} disabled={!timeline.length || playIndex >= timeline.length - 1} className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--color-text)]/50 hover:bg-[var(--color-surface-2)] hover:text-brand-blue disabled:opacity-30 transition-colors">▶</button>
                <div className="h-4 w-px bg-[var(--color-border)]"></div>
                <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="h-8 bg-transparent text-[10px] font-bold text-[var(--color-text)]/70 outline-none cursor-pointer px-2 appearance-none">
                  <option value={0.5}>0.5x Vel</option><option value={1}>1.0x Vel</option><option value={2}>2.0x Vel</option>
                </select>
                <button onClick={exportTimeline} disabled={!data} title="Exportar log JSON" className="ml-1 h-8 w-8 flex items-center justify-center rounded-xl bg-brand-dark text-brand-yellow hover:scale-105 transition-transform shadow-sm">
                  <Download className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="p-6 md:p-10 bg-black/5 dark:bg-white/5 relative">
              {!timeline.length ? (
                <div className="text-center py-16">
                  <FileText className="h-12 w-12 mx-auto opacity-10 mb-4"/>
                  <div className="text-[var(--color-text)]/40 text-sm font-medium">Este deal es nuevo. Aún no hay eventos registrados en la línea de tiempo.</div>
                </div>
              ) : (
                <div className="relative border-l-2 border-[var(--color-border)] ml-4 md:ml-10 space-y-10 pb-6 before:absolute before:inset-y-0 before:-left-[2px] before:w-0.5 before:bg-gradient-to-b before:from-brand-blue before:to-transparent before:h-full before:opacity-20">
                  {timeline.map((it, i) => {
                    const isPlaying = i === playIndex && play;
                    const isPassed = i < playIndex;
                    return (
                      <div key={i} className={`relative pl-8 md:pl-12 transition-all duration-500 ${isPlaying ? 'scale-[1.02] opacity-100 origin-left' : isPassed ? 'opacity-40' : 'opacity-100'}`}>
                        {/* Nodo del Timeline */}
                        <div className={`absolute -left-[11px] top-1 h-5 w-5 rounded-full border-4 border-[var(--color-surface)] transition-all duration-300 ${isPlaying ? 'bg-brand-blue scale-125 shadow-[0_0_15px_rgba(var(--color-brand-blue-rgb),0.6)]' : isPassed ? 'bg-[var(--color-text)]/20' : 'bg-brand-blue/40'}`}></div>
                        
                        <div className={`rounded-3xl border p-5 md:p-6 transition-colors shadow-sm ${isPlaying ? 'border-brand-blue/30 bg-brand-blue/5' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-brand-blue/20'}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <span className={badge(it.kind)}>{it.kind}</span>
                              <span className="font-heading text-lg text-[var(--color-text)]">{it.title}</span>
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 bg-[var(--color-surface-2)] px-3 py-1.5 rounded-lg border border-[var(--color-border)]">
                              {new Date(it.ts).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit', second: '2-digit' })}
                            </div>
                          </div>
                          {it.detail && <p className="text-sm text-[var(--color-text)]/70 font-light leading-relaxed whitespace-pre-wrap">{it.detail}</p>}
                          
                          {/* Botón Detalles Meta (Corrección: uso de ternario) */}
                          {it.meta && typeof it.meta === 'object' && Object.keys(it.meta as object).length > 0 ? (
                            <details className="mt-4 group text-[10px]">
                              <summary className="cursor-pointer font-bold uppercase tracking-widest text-brand-blue opacity-50 hover:opacity-100 transition-opacity list-none flex items-center gap-1">Ver Metadatos Técnicos</summary>
                              <pre className="mt-2 bg-[var(--color-surface-2)] p-4 rounded-xl border border-[var(--color-border)] text-[var(--color-text)]/60 font-mono overflow-auto max-h-[200px]">
                                {JSON.stringify(it.meta, null, 2)}
                              </pre>
                            </details>
                          ) : null}
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
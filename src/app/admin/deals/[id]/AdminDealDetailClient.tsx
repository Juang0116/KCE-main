'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  Play, Pause, FastForward, Download, RefreshCw, Zap, // ✅ FastForward restaurado
  ArrowLeft, MapPin, DollarSign, ShieldCheck, 
  ChevronRight, ExternalLink, AlertCircle,
  Cpu, Terminal, Fingerprint, Sparkles,
  History as HistoryIcon,
  Activity 
} from 'lucide-react';

import { adminFetch } from '@/lib/adminFetch.client';
import { Button } from '@/components/ui/Button';

// --- TIPADO DEL MOTOR DE VENTAS ---
type TimelineItem = {
  kind: 'task' | 'outbound' | 'event' | 'message' | string;
  ts: string;
  title: string;
  detail?: string;
  meta?: Record<string, unknown> | null;
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

// --- HELPERS ---
function moneyEUR(minor: number | null | undefined) {
  const v = (minor ?? 0) / 100;
  return new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'EUR', 
    maximumFractionDigits: 0 
  }).format(v);
}

function badge(kind: string) {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border shadow-sm';
  if (kind === 'task') return `${base} border-sky-500/20 bg-sky-500/5 text-sky-600`;
  if (kind === 'outbound') return `${base} border-emerald-500/20 bg-emerald-500/5 text-emerald-600`;
  if (kind === 'event') return `${base} border-brand-blue/20 bg-brand-blue/5 text-brand-blue`;
  return `${base} border-amber-500/20 bg-amber-500/5 text-amber-700`;
}

function stageCopy(stageRaw?: string | null) {
  const stage = (stageRaw || '').toLowerCase();
  if (stage === 'checkout') {
    return { kind: 'checkout_push' as const, title: 'Acelerar Checkout', summary: 'El link de pago ya está en manos del cliente. Reactiva la urgencia y valida la integridad técnica.' };
  }
  if (stage === 'proposal') {
    return { kind: 'proposal' as const, title: 'Calibración de Propuesta', summary: 'Evalúa la temperatura del lead. Es el momento de inyectar un incentivo de escasez o agendar llamada.' };
  }
  return { kind: 'followup_24h' as const, title: 'Warm Follow-up', summary: 'Deal en etapa temprana. Construye rapport, califica presupuesto y define el próximo micro-objetivo.' };
}

export function AdminDealDetailClient({ id }: { id: string }) {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState<'playbook' | 'proposal' | null>(null);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);

  const [play, setPlay] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [speed] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const res = await adminFetch(`/api/admin/deals/${id}/timeline`, { cache: 'no-store' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Falla de conexión con el núcleo');
      setData({ 
        deal: j.deal as Deal, 
        ticket: j.ticket as TicketRef | null, 
        timeline: (j.timeline || []) as TimelineItem[] 
      });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

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

  const exportTimeline = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url; a.download = `deal-${id}-trace.json`;
    a.click();
  };

  async function applyPlaybook() {
    setActionBusy('playbook'); setActionResult(null);
    try {
      const res = await adminFetch(`/api/admin/deals/${id}/playbook`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ kind: guidance.kind }) 
      });
      if (!res.ok) throw new Error('Error al ejecutar el protocolo');
      setActionResult({ ok: true, label: 'Playbook Inyectado', detail: `Tareas de seguimiento activadas.` });
      await load();
    } catch (e: unknown) {
      setActionResult({ ok: false, label: 'Fallo de Inyección', detail: e instanceof Error ? e.message : 'Error' });
    } finally { setActionBusy(null); }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 pb-32 animate-in fade-in duration-700">
      
      {/* HEADER ESTRATÉGICO */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[var(--color-border)] pb-10">
        <div className="space-y-4">
          <Link href="/admin/deals" className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 hover:text-brand-blue transition-colors">
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /> Pipeline Maestro
          </Link>
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-[2rem] bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner relative">
               <Cpu className="h-8 w-8" />
               <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-500 animate-pulse border-2 border-white" />
            </div>
            <div>
              <h1 className="font-heading text-4xl text-brand-blue leading-tight line-clamp-1">{deal?.title || 'Cargando...'}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">
                <span className="bg-brand-dark text-brand-yellow px-3 py-1 rounded-lg">Stage: {deal?.stage || '...'}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {deal?.tour_slug || 'No Tour'}</span>
                <span className="flex items-center gap-1.5 text-emerald-600"><DollarSign className="h-3.5 w-3.5" /> {moneyEUR(deal?.amount_minor)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {deal?.checkout_url && (
            <Button asChild className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-8 py-6 shadow-lg">
              <a href={deal.checkout_url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Link de Pago
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={() => void load()} disabled={loading} className="rounded-full px-6 py-6 shadow-sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sync
          </Button>
        </div>
      </header>

      {(err || actionResult) && (
        <div className="space-y-4">
          {err && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 flex items-center gap-4 text-rose-700">
              <AlertCircle className="h-6 w-6" />
              <p className="text-sm font-medium">{err}</p>
            </div>
          )}
          {actionResult && (
            <div className={`rounded-2xl border p-6 flex items-center gap-4 animate-in zoom-in-95 ${actionResult.ok ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700' : 'border-rose-500/20 bg-rose-500/5 text-rose-700'}`}>
              <ShieldCheck className="h-6 w-6" />
              <div>
                <p className="text-sm font-bold">{actionResult.label}</p>
                {actionResult.detail && <p className="text-xs opacity-70">{actionResult.detail}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {data && (
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-8">
            <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden">
              <div className="border-b border-[var(--color-border)] bg-brand-dark px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-white">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <HistoryIcon className="h-5 w-5 text-brand-yellow" />
                   </div>
                   <div>
                      <h3 className="font-heading text-xl">Timeline E2E</h3>
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">Audit Trail Active</p>
                   </div>
                </div>

                <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                   <button onClick={() => setPlay(!play)} className={`flex h-9 items-center gap-2 px-4 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${play ? 'bg-brand-yellow text-brand-dark shadow-lg' : 'hover:bg-white/10'}`}>
                      {play ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />} {play ? 'Pausa' : 'Play'}
                   </button>
                   <div className="flex items-center gap-1 px-2 font-mono text-[10px] text-white/50 min-w-[80px] justify-center">
                      {playIndex + 1} / {timeline.length}
                   </div>
                   <button onClick={exportTimeline} className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-brand-yellow">
                      <Download className="h-4 w-4" />
                   </button>
                </div>
              </div>

              <div className="p-10 bg-black/[0.02] min-h-[600px]">
                {!timeline.length ? (
                   <div className="h-full flex flex-col items-center justify-center text-[var(--color-text)]/20 italic py-20">
                      <Terminal className="h-12 w-12 mb-4 opacity-10" />
                      <p>Sin trazas registradas.</p>
                   </div>
                ) : (
                  <div className="relative border-l-2 border-[var(--color-border)] ml-4 md:ml-12 space-y-12 pb-10">
                    {timeline.map((it, i) => {
                      const isPlaying = i === playIndex && play;
                      const isPassed = i < playIndex;
                      return (
                        <div key={i} className={`relative pl-10 md:pl-16 transition-all duration-500 ${isPlaying ? 'scale-[1.02] opacity-100' : isPassed ? 'opacity-30 blur-[0.5px]' : 'opacity-100'}`}>
                          <div className={`absolute -left-[11px] top-2 h-5 w-5 rounded-full border-4 border-[var(--color-surface)] transition-all duration-500 ${isPlaying ? 'bg-brand-yellow scale-125 shadow-[0_0_20px_rgba(255,200,0,0.4)]' : 'bg-brand-blue/20'}`} />
                          <div className={`rounded-[2.5rem] border p-6 shadow-sm transition-colors ${isPlaying ? 'border-brand-yellow/30 bg-white shadow-xl' : 'border-[var(--color-border)] bg-white/50 hover:bg-white'}`}>
                            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                               <div className="flex items-center gap-3">
                                  <span className={badge(it.kind)}>{it.kind}</span>
                                  <h4 className="font-heading text-lg text-brand-blue">{it.title}</h4>
                               </div>
                               <span className="text-[10px] font-mono text-[var(--color-text)]/40 bg-[var(--color-surface-2)] px-3 py-1.5 rounded-lg border border-[var(--color-border)]">
                                  {new Date(it.ts).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                               </span>
                            </header>
                            {it.detail && <p className="text-sm font-light text-[var(--color-text)]/70 italic border-l-2 border-brand-blue/10 pl-4">&quot;{it.detail}&quot;</p>}
                            {it.meta && typeof it.meta === 'object' && Object.keys(it.meta).length > 0 && (
                              <details className="mt-6 group">
                                <summary className="cursor-pointer text-[9px] font-bold uppercase tracking-widest text-brand-blue/40 hover:text-brand-blue transition-colors list-none flex items-center gap-1">
                                   Ver Data Object <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                                </summary>
                                <pre className="mt-3 bg-brand-dark p-6 rounded-2xl text-[10px] leading-relaxed text-emerald-400 font-mono overflow-auto max-h-[300px] shadow-inner text-left">
                                   {JSON.stringify(it.meta, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-8 sticky top-10">
            <section className="rounded-[3rem] border-2 border-brand-blue/10 bg-[var(--color-surface)] p-8 shadow-xl relative overflow-hidden">
              <div className="absolute -right-6 -top-6 opacity-[0.03]"><Zap className="h-40 w-40 text-brand-blue" /></div>
              <div className="relative z-10">
                <header className="mb-8 border-b border-[var(--color-border)] pb-6">
                   <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50 mb-3">
                      <Cpu className="h-3.5 w-3.5 text-brand-yellow" /> Cognitive Layer
                   </div>
                   <h2 className="font-heading text-2xl text-brand-blue">{guidance.title}</h2>
                   <p className="mt-3 text-sm font-light text-[var(--color-text)]/60 leading-relaxed">{guidance.summary}</p>
                </header>
                <Button onClick={() => void applyPlaybook()} disabled={actionBusy !== null} className="w-full rounded-2xl bg-brand-blue py-7 shadow-xl hover:scale-105 transition-transform">
                   {actionBusy === 'playbook' ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <FastForward className="mr-2 h-4 w-4" />}
                   Inyectar Protocolo
                </Button>
              </div>
            </section>

            <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-white p-8 space-y-8 shadow-sm">
               <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30 mb-6 border-b pb-3">Digital Identity</h4>
                  <div className="flex items-start gap-4">
                     <div className="h-10 w-10 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
                        <Fingerprint className="h-5 w-5 text-brand-blue/40" />
                     </div>
                     <div className="overflow-hidden">
                        <p className="text-[9px] font-bold uppercase text-[var(--color-text)]/30 mb-1">CRM Master ID</p>
                        <p className="text-xs font-mono text-emerald-600 font-bold break-all leading-tight">
                           {deal?.customer_id || 'Anónimo'}
                        </p>
                     </div>
                  </div>
               </div>
               {data.ticket && (
                 <div className="rounded-[2rem] bg-amber-500/5 border border-amber-500/10 p-6 space-y-4">
                    <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-amber-600">
                       <ShieldCheck className="h-3.5 w-3.5" /> Support Ticket Linked
                    </div>
                    <p className="text-sm font-bold text-brand-dark line-clamp-1">{data.ticket.subject}</p>
                    <Link href={`/admin/tickets/${data.ticket.id}`} className="flex items-center justify-between w-full rounded-xl bg-white border border-amber-500/20 px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-100 transition-all group">
                       Ver Ticket <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                 </div>
               )}
            </section>
          </aside>
        </div>
      )}

      <footer className="mt-20 flex flex-wrap items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> E2E Traceability Active
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> Cognitive CRM Node
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Activity className="h-3.5 w-3.5" /> Audit Trail Verified
        </div>
      </footer>
    </div>
  );
}
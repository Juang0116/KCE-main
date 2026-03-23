'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  Play, Pause, FastForward, Download, RefreshCw, Zap,
  ArrowLeft, MapPin, DollarSign, ShieldCheck, 
  ChevronRight, ExternalLink, AlertCircle,
  Cpu, Terminal, Fingerprint, Sparkles,
  History as HistoryIcon,
  Activity, Database, Hash
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
  if (kind === 'outbound') return `${base} border-green-500/20 bg-green-500/5 text-green-600`;
  if (kind === 'event') return `${base} border-brand-blue/20 bg-brand-blue/5 text-brand-blue`;
  return `${base} border-amber-500/20 bg-amber-500/5 text-amber-700`;
}

function stageCopy(stageRaw?: string | null) {
  const stage = (stageRaw || '').toLowerCase();
  if (stage === 'checkout') {
    return { kind: 'checkout_push' as const, title: 'Acelerar Checkout', summary: 'El link de pago ya está en manos del cliente. Reactiva la urgencia y valida la integridad técnica del nodo de pago.' };
  }
  if (stage === 'proposal') {
    return { kind: 'proposal' as const, title: 'Calibración de Propuesta', summary: 'Evalúa la temperatura del lead. Es el momento de inyectar un incentivo de escasez o agendar una llamada de cierre.' };
  }
  return { kind: 'followup_24h' as const, title: 'Warm Follow-up', summary: 'Deal en etapa temprana. Construye rapport, califica presupuesto y define el próximo micro-objetivo de conversión.' };
}

export function AdminDealDetailClient({ id }: { id: string }) {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<'playbook' | 'proposal' | null>(null);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);

  const [play, setPlay] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [speed] = useState(1);

  const load = useCallback(async () => {
    if (!data) setLoading(true); 
    setErr('');
    try {
      const res = await adminFetch(`/api/admin/deals/${id}/timeline`, { cache: 'no-store' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Falla de conexión con el núcleo central');
      setData({ 
        deal: j.deal as Deal, 
        ticket: j.ticket as TicketRef | null, 
        timeline: (j.timeline || []) as TimelineItem[] 
      });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error inesperado en el nodo de datos');
    } finally {
      setLoading(false);
    }
  }, [id, data]);

  useEffect(() => { void load(); }, [id]);

  const deal = data?.deal;
  const timeline = useMemo(() => data?.timeline ?? [], [data]);
  const guidance = useMemo(() => stageCopy(deal?.stage), [deal?.stage]);

  useEffect(() => { 
    if (!play) setPlayIndex(timeline.length - 1); 
  }, [timeline.length, play]);

  useEffect(() => {
    if (!play || !timeline.length) return;
    const stepMs = Math.max(200, Math.round(1000 / speed));
    const t = window.setInterval(() => {
      setPlayIndex((i) => {
        const next = i + 1;
        if (next >= timeline.length) { 
          setPlay(false); 
          return i; 
        }
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
    a.href = url; a.download = `trace-deal-${id}.json`;
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
      setActionResult({ ok: true, label: 'Playbook Inyectado', detail: `Tareas de seguimiento y recordatorios activados.` });
      await load();
    } catch (e: unknown) {
      setActionResult({ ok: false, label: 'Fallo de Inyección', detail: e instanceof Error ? e.message : 'Error técnico' });
    } finally { setActionBusy(null); }
  }

  if (loading && !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-1000">
        <Activity className="h-16 w-16 text-brand-blue opacity-10 animate-pulse" />
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-brand-blue/50">Deal Reconstruction Unit</p>
          <p className="text-sm font-light italic text-muted mt-2">Mapeando trazas de conversión...</p>
        </div>
      </div>
    );
  }

  // ✅ DEFENSIVE GUARD: Si no hay data (y no está cargando), no renderizamos nada.
  // Esto soluciona los errores de TypeScript "'data' is possibly 'null'" de forma global.
  if (!data) return null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. HEADER ESTRATÉGICO */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div className="space-y-4">
          <Link href="/admin/deals" className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-brand-blue transition-colors">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" /> Revenue Pipeline / Maestro
          </Link>
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-[2.2rem] bg-brand-blue/10 border border-brand-blue/5 flex items-center justify-center text-brand-blue shadow-inner relative">
               <Cpu className="h-10 w-10" />
               <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-green-500 animate-pulse border-4 border-surface" />
            </div>
            <div>
              <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tighter leading-none line-clamp-1">{data.deal.title || 'Expedición en Curso'}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-5 text-[10px] font-bold uppercase tracking-widest text-muted">
                <span className="bg-brand-dark text-brand-yellow px-3 py-1 rounded-lg flex items-center gap-2">
                   <Zap className="h-3 w-3 fill-current" /> STAGE: {data.deal.stage || 'QUALIFYING'}
                </span>
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4 opacity-40" /> {data.deal.tour_slug || 'CUSTOM_TRIP'}</span>
                <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                   <DollarSign className="h-4 w-4 opacity-40" /> {moneyEUR(data.deal.amount_minor)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {data.deal.checkout_url && (
            <Button asChild className="rounded-full bg-green-600 hover:bg-green-700 px-10 h-14 shadow-pop transition-all text-white active:scale-95">
              <a href={data.deal.checkout_url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-3 h-4 w-4" /> Link de Pago
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={() => void load()} disabled={loading} className="rounded-full h-14 px-8 border-brand-dark/10 hover:bg-surface-2 shadow-sm transition-all">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin text-brand-blue' : ''}`} /> Sincronizar Nodo
          </Button>
        </div>
      </header>

      {/* NOTIFICACIONES DE ACCIÓN */}
      {(err || actionResult) && (
        <div className="space-y-4">
          {err && (
            <div className="rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/10 p-6 flex items-center gap-4 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <p className="text-sm font-bold">Error de Sistema: <span className="font-light">{err}</span></p>
            </div>
          )}
          {actionResult && (
            <div className={`rounded-[var(--radius-2xl)] border p-6 flex items-center gap-4 animate-in zoom-in-95 shadow-sm ${actionResult.ok ? 'border-green-500/20 bg-green-50 dark:bg-green-950/10 text-green-700 dark:text-green-400' : 'border-red-500/20 bg-red-50 dark:bg-red-950/10 text-red-700 dark:text-red-400'}`}>
              <ShieldCheck className="h-6 w-6 shrink-0" />
              <div>
                <p className="text-sm font-bold uppercase tracking-widest">{actionResult.label}</p>
                {actionResult.detail && <p className="text-xs mt-1 opacity-70 font-light">{actionResult.detail}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        
        {/* LADO IZQUIERDO: TIMELINE E2E */}
        <div className="space-y-8">
          <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden">
            <div className="border-b border-brand-dark/10 bg-brand-dark px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-white relative z-20">
              <div className="flex items-center gap-4">
                 <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <HistoryIcon className="h-5 w-5 text-brand-yellow" />
                 </div>
                 <div>
                    <h3 className="font-heading text-xl tracking-tight">Timeline E2E</h3>
                    <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/40">Traceability Protocol Active</p>
                 </div>
              </div>

              <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                 <button onClick={() => { if(!play && playIndex === timeline.length-1) setPlayIndex(0); setPlay(!play); }} className={`flex h-10 items-center gap-3 px-5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all active:scale-95 ${play ? 'bg-brand-yellow text-brand-dark shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'hover:bg-white/10 text-white'}`}>
                    {play ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />} {play ? 'PAUSAR' : 'REPLAY'}
                 </button>
                 <div className="flex items-center gap-1 px-4 font-mono text-[10px] text-white/50 min-w-[90px] justify-center border-x border-white/10 mx-1">
                    {playIndex + 1} <span className="opacity-20 mx-1">/</span> {timeline.length}
                 </div>
                 <button onClick={exportTimeline} title="Exportar traza JSON" className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-brand-yellow transition-colors">
                    <Download className="h-4 w-4" />
                 </button>
              </div>
            </div>

            <div className="p-8 md:p-12 bg-surface-2/30 min-h-[700px] relative">
              {!timeline.length ? (
                 <div className="h-full flex flex-col items-center justify-center text-muted opacity-40 italic py-40">
                    <Terminal className="h-16 w-16 mb-6 opacity-10" />
                    <p className="text-lg font-heading tracking-tight">Cero registros en la boveda.</p>
                 </div>
              ) : (
                <div className="relative border-l-2 border-brand-dark/5 dark:border-white/5 ml-4 md:ml-12 space-y-12 pb-10">
                  {timeline.map((it, i) => {
                    const isCurrent = i === playIndex;
                    const isPassed = i < playIndex;
                    const isFuture = i > playIndex && play;
                    
                    return (
                      <div key={i} className={`relative pl-10 md:pl-16 transition-all duration-700 ${isCurrent ? 'scale-[1.02] opacity-100' : isPassed ? 'opacity-40 grayscale-[0.5]' : isFuture ? 'opacity-0 translate-y-4' : 'opacity-100'}`}>
                        <div className={`absolute -left-[11px] top-2 h-5 w-5 rounded-full border-4 border-surface transition-all duration-500 z-10 ${isCurrent ? 'bg-brand-yellow scale-125 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'bg-brand-blue/20'}`} />
                        
                        <div className={`rounded-[2.5rem] border p-7 shadow-soft transition-all duration-500 ${isCurrent ? 'border-brand-yellow/30 bg-surface shadow-pop ring-4 ring-brand-yellow/5' : 'border-brand-dark/5 dark:border-white/5 bg-surface/60'}`}>
                          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                             <div className="flex items-center gap-3">
                                <span className={badge(it.kind)}>{it.kind}</span>
                                <h4 className="font-heading text-lg text-main tracking-tight group-hover:text-brand-blue transition-colors">{it.title}</h4>
                             </div>
                             <span className="text-[10px] font-mono text-muted bg-surface-2 px-3 py-1.5 rounded-xl border border-brand-dark/5 dark:border-white/5 shadow-inner">
                                {new Date(it.ts).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </header>
                          
                          {it.detail && (
                            <p className="text-sm font-light text-main leading-relaxed border-l-2 border-brand-blue/20 pl-5 italic opacity-80">
                              &quot;{it.detail}&quot;
                            </p>
                          )}

                          {it.meta && Object.keys(it.meta).length > 0 && (
                            <details className="mt-6 group/data">
                              <summary className="cursor-pointer text-[9px] font-bold uppercase tracking-[0.2em] text-brand-blue/50 hover:text-brand-blue transition-all list-none flex items-center gap-2">
                                 <Database className="h-3 w-3" /> Ver Payload <ChevronRight className="h-3 w-3 group-open/data:rotate-90 transition-transform" />
                              </summary>
                              <div className="mt-4 bg-brand-dark p-6 rounded-3xl shadow-inner relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-white"><Terminal className="h-12 w-12" /></div>
                                 <pre className="text-[11px] leading-relaxed text-emerald-400/90 font-mono overflow-auto max-h-[400px] custom-scrollbar">
                                   {JSON.stringify(it.meta, null, 4)}
                                 </pre>
                              </div>
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

        {/* LADO DERECHO: COGNITIVE LAYER & IDENTITY */}
        <aside className="space-y-8 lg:sticky lg:top-8">
          
          <section className="rounded-[var(--radius-3xl)] border border-brand-blue/20 bg-surface p-8 shadow-pop relative overflow-hidden">
            <div className="absolute -right-6 -top-6 opacity-[0.02] pointer-events-none">
               <Zap className="h-48 w-48 text-brand-blue" />
            </div>
            <div className="relative z-10">
              <header className="mb-8 border-b border-brand-dark/5 dark:border-white/5 pb-6">
                 <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue mb-4">
                    <Cpu className="h-4 w-4 text-brand-yellow animate-pulse" /> Cognitive Guidance
                 </div>
                 <h2 className="font-heading text-2xl text-main tracking-tight leading-tight">{guidance.title}</h2>
                 <p className="mt-4 text-sm font-light text-muted leading-relaxed italic opacity-80">{guidance.summary}</p>
              </header>
              
              <Button 
                onClick={() => void applyPlaybook()} 
                disabled={actionBusy !== null} 
                className="w-full rounded-2xl bg-brand-dark text-brand-yellow py-8 shadow-pop hover:bg-brand-blue hover:text-white transition-all active:scale-95 group overflow-hidden relative"
              >
                 <div className="relative z-10 flex items-center justify-center gap-3">
                    {actionBusy === 'playbook' ? <RefreshCw className="h-5 w-5 animate-spin" /> : <FastForward className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Inyectar Playbook</span>
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Button>
            </div>
          </section>

          <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 space-y-10 shadow-soft">
             <div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-40 mb-6">
                   <Fingerprint className="h-4 w-4" /> Digital Identity
                </div>
                <div className="flex items-start gap-5">
                   <div className="h-12 w-12 rounded-2xl bg-brand-blue/5 border border-brand-blue/5 flex items-center justify-center shrink-0 shadow-inner">
                      <Hash className="h-6 w-6 text-brand-blue opacity-40" />
                   </div>
                   <div className="overflow-hidden">
                      <p className="text-[10px] font-bold uppercase text-muted opacity-60 mb-1">CRM Identifier</p>
                      <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold break-all leading-relaxed bg-green-500/5 px-2 py-1 rounded border border-green-500/10">
                         {data.deal.customer_id || data.deal.lead_id || 'ANONYMOUS_SESSION'}
                      </p>
                   </div>
                </div>
             </div>

             {/* ✅ FIX APLICADO: Optional Chaining en data.ticket */}
             {data?.ticket && (
               <div className="rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 p-7 space-y-5 animate-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">
                     <Sparkles className="h-4 w-4" /> Support Context Linked
                  </div>
                  <h4 className="text-base font-bold text-main line-clamp-2 tracking-tight">{data.ticket.subject}</h4>
                  <Link href={`/admin/tickets/${data.ticket.id}`} className="flex items-center justify-between w-full rounded-2xl bg-surface border border-amber-500/20 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-main hover:bg-brand-dark hover:text-brand-yellow transition-all shadow-sm group">
                     Inspeccionar Ticket <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                  </Link>
               </div>
             )}
          </section>

          <footer className="flex items-center justify-center gap-4 py-4 opacity-30">
             <Terminal className="h-3.5 w-3.5 text-muted" />
             <span className="text-[9px] font-mono text-muted uppercase tracking-[0.3em]">Revenue Analytics Node v5.2</span>
          </footer>
        </aside>
      </div>

      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> E2E Traceability Active
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Sparkles className="h-4 w-4 text-brand-yellow" /> Cognitive CRM v4.1
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Activity className="h-4 w-4 text-brand-blue" /> Audit Trail Verified
        </div>
      </footer>

    </div>
  );
}
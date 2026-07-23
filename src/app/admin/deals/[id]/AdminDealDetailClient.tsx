'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  FastForward,
  Download,
  RefreshCw,
  Zap,
  ArrowLeft,
  MapPin,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Cpu,
  Terminal,
  Fingerprint,
  Sparkles,
  History as HistoryIcon,
  Activity,
  Database,
  Hash,
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
    maximumFractionDigits: 0,
  }).format(v);
}

function badge(kind: string) {
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border shadow-sm';
  if (kind === 'task') return `${base} border-sky-500/20 bg-sky-500/5 text-sky-600`;
  if (kind === 'outbound') return `${base} border-green-500/20 bg-green-500/5 text-green-600`;
  if (kind === 'event') return `${base} border-brand-blue/20 bg-brand-blue/5 text-brand-blue`;
  return `${base} border-amber-500/20 bg-amber-500/5 text-amber-700`;
}

function stageCopy(stageRaw?: string | null) {
  const stage = (stageRaw || '').toLowerCase();
  if (stage === 'checkout') {
    return {
      kind: 'checkout_push' as const,
      title: 'Acelerar Checkout',
      summary:
        'El link de pago ya está en manos del cliente. Reactiva la urgencia y valida la integridad técnica del nodo de pago.',
    };
  }
  if (stage === 'proposal') {
    return {
      kind: 'proposal' as const,
      title: 'Calibración de Propuesta',
      summary:
        'Evalúa la temperatura del lead. Es el momento de inyectar un incentivo de escasez o agendar una llamada de cierre.',
    };
  }
  return {
    kind: 'followup_24h' as const,
    title: 'Warm Follow-up',
    summary:
      'Deal en etapa temprana. Construye rapport, califica presupuesto y define el próximo micro-objetivo de conversión.',
  };
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
        timeline: (j.timeline || []) as TimelineItem[],
      });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error inesperado en el nodo de datos');
    } finally {
      setLoading(false);
    }
  }, [id, data]);

  useEffect(() => {
    void load();
  }, [id]);

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
    a.href = url;
    a.download = `trace-deal-${id}.json`;
    a.click();
  };

  async function applyPlaybook() {
    setActionBusy('playbook');
    setActionResult(null);
    try {
      const res = await adminFetch(`/api/admin/deals/${id}/playbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: guidance.kind }),
      });
      if (!res.ok) throw new Error('Error al ejecutar el protocolo');
      setActionResult({
        ok: true,
        label: 'Playbook Inyectado',
        detail: `Tareas de seguimiento y recordatorios activados.`,
      });
      await load();
    } catch (e: unknown) {
      setActionResult({
        ok: false,
        label: 'Fallo de Inyección',
        detail: e instanceof Error ? e.message : 'Error técnico',
      });
    } finally {
      setActionBusy(null);
    }
  }

  if (loading && !data) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center space-y-8 py-40 duration-1000">
        <Activity className="h-16 w-16 animate-pulse text-brand-blue opacity-10" />
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-brand-blue/50">
            Deal Reconstruction Unit
          </p>
          <p className="mt-2 text-sm font-light italic text-muted">
            Mapeando trazas de conversión...
          </p>
        </div>
      </div>
    );
  }

  // ✅ DEFENSIVE GUARD: Si no hay data (y no está cargando), no renderizamos nada.
  // Esto soluciona los errores de TypeScript "'data' is possibly 'null'" de forma global.
  if (!data) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto w-full max-w-7xl space-y-10 pb-32 duration-1000">
      {/* 01. HEADER ESTRATÉGICO */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <Link
            href="/admin/deals"
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:text-brand-blue"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />{' '}
            Revenue Pipeline / Maestro
          </Link>
          <div className="flex items-center gap-6">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-[2.2rem] border border-brand-blue/5 bg-brand-blue/10 text-brand-blue shadow-inner">
              <Cpu className="h-10 w-10" />
              <div className="absolute -right-1 -top-1 h-4 w-4 animate-pulse rounded-full border-4 border-surface bg-green-500" />
            </div>
            <div>
              <h1 className="line-clamp-1 font-heading text-4xl leading-none tracking-tighter text-main md:text-5xl">
                {data.deal.title || 'Expedición en Curso'}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-5 text-[10px] font-bold uppercase tracking-widest text-muted">
                <span className="flex items-center gap-2 rounded-lg bg-brand-dark px-3 py-1 text-brand-yellow">
                  <Zap className="h-3 w-3 fill-current" /> STAGE: {data.deal.stage || 'QUALIFYING'}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 opacity-40" /> {data.deal.tour_slug || 'CUSTOM_TRIP'}
                </span>
                <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <DollarSign className="h-4 w-4 opacity-40" /> {moneyEUR(data.deal.amount_minor)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {data.deal.checkout_url && (
            <Button
              asChild
              className="h-14 rounded-full bg-green-600 px-10 text-white shadow-pop transition-all hover:bg-green-700 active:scale-95"
            >
              <a
                href={data.deal.checkout_url}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="mr-3 h-4 w-4" /> Link de Pago
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => void load()}
            disabled={loading}
            className="h-14 rounded-full border-brand-dark/10 px-8 shadow-sm transition-all hover:bg-surface-2"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin text-brand-blue' : ''}`}
            />{' '}
            Sincronizar Nodo
          </Button>
        </div>
      </header>

      {/* NOTIFICACIONES DE ACCIÓN */}
      {(err || actionResult) && (
        <div className="space-y-4">
          {err && (
            <div className="animate-in slide-in-from-top-2 flex items-center gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-6 text-red-700 dark:bg-red-950/10 dark:text-red-400">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <p className="text-sm font-bold">
                Error de Sistema: <span className="font-light">{err}</span>
              </p>
            </div>
          )}
          {actionResult && (
            <div
              className={`animate-in zoom-in-95 flex items-center gap-4 rounded-[var(--radius-2xl)] border p-6 shadow-sm ${actionResult.ok ? 'border-green-500/20 bg-green-50 text-green-700 dark:bg-green-950/10 dark:text-green-400' : 'border-red-500/20 bg-red-50 text-red-700 dark:bg-red-950/10 dark:text-red-400'}`}
            >
              <ShieldCheck className="h-6 w-6 shrink-0" />
              <div>
                <p className="text-sm font-bold uppercase tracking-widest">{actionResult.label}</p>
                {actionResult.detail && (
                  <p className="mt-1 text-xs font-light opacity-70">{actionResult.detail}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* LADO IZQUIERDO: TIMELINE E2E */}
        <div className="space-y-8">
          <section className="overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
            <div className="relative z-20 flex flex-col justify-between gap-6 border-b border-brand-dark/10 bg-brand-dark px-8 py-5 text-white sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <HistoryIcon className="h-5 w-5 text-brand-yellow" />
                </div>
                <div>
                  <h3 className="font-heading text-xl tracking-tight">Timeline E2E</h3>
                  <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/40">
                    Traceability Protocol Active
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-md">
                <button
                  onClick={() => {
                    if (!play && playIndex === timeline.length - 1) setPlayIndex(0);
                    setPlay(!play);
                  }}
                  className={`flex h-10 items-center gap-3 rounded-xl px-5 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${play ? 'bg-brand-yellow text-brand-dark shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'text-white hover:bg-white/10'}`}
                >
                  {play ? (
                    <Pause className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="h-4 w-4 fill-current" />
                  )}{' '}
                  {play ? 'PAUSAR' : 'REPLAY'}
                </button>
                <div className="mx-1 flex min-w-[90px] items-center justify-center gap-1 border-x border-white/10 px-4 font-mono text-[10px] text-white/50">
                  {playIndex + 1} <span className="mx-1 opacity-20">/</span> {timeline.length}
                </div>
                <button
                  onClick={exportTimeline}
                  title="Exportar traza JSON"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-yellow transition-colors hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="bg-surface-2/30 relative min-h-[700px] p-8 md:p-12">
              {!timeline.length ? (
                <div className="flex h-full flex-col items-center justify-center py-40 italic text-muted opacity-40">
                  <Terminal className="mb-6 h-16 w-16 opacity-10" />
                  <p className="font-heading text-lg tracking-tight">
                    Cero registros en la boveda.
                  </p>
                </div>
              ) : (
                <div className="relative ml-4 space-y-12 border-l-2 border-brand-dark/5 pb-10 dark:border-white/5 md:ml-12">
                  {timeline.map((it, i) => {
                    const isCurrent = i === playIndex;
                    const isPassed = i < playIndex;
                    const isFuture = i > playIndex && play;

                    return (
                      <div
                        key={i}
                        className={`relative pl-10 transition-all duration-700 md:pl-16 ${isCurrent ? 'scale-[1.02] opacity-100' : isPassed ? 'opacity-40 grayscale-[0.5]' : isFuture ? 'translate-y-4 opacity-0' : 'opacity-100'}`}
                      >
                        <div
                          className={`absolute -left-[11px] top-2 z-10 h-5 w-5 rounded-full border-4 border-surface transition-all duration-500 ${isCurrent ? 'scale-125 bg-brand-yellow shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'bg-brand-blue/20'}`}
                        />

                        <div
                          className={`rounded-[2.5rem] border p-7 shadow-soft transition-all duration-500 ${isCurrent ? 'border-brand-yellow/30 bg-surface shadow-pop ring-4 ring-brand-yellow/5' : 'bg-surface/60 border-brand-dark/5 dark:border-white/5'}`}
                        >
                          <header className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-3">
                              <span className={badge(it.kind)}>{it.kind}</span>
                              <h4 className="font-heading text-lg tracking-tight text-main transition-colors group-hover:text-brand-blue">
                                {it.title}
                              </h4>
                            </div>
                            <span className="rounded-xl border border-brand-dark/5 bg-surface-2 px-3 py-1.5 font-mono text-[10px] text-muted shadow-inner dark:border-white/5">
                              {new Date(it.ts).toLocaleString('es-CO', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </header>

                          {it.detail && (
                            <p className="border-l-2 border-brand-blue/20 pl-5 text-sm font-light italic leading-relaxed text-main opacity-80">
                              &quot;{it.detail}&quot;
                            </p>
                          )}

                          {it.meta && Object.keys(it.meta).length > 0 && (
                            <details className="group/data mt-6">
                              <summary className="flex cursor-pointer list-none items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-brand-blue/50 transition-all hover:text-brand-blue">
                                <Database className="h-3 w-3" /> Ver Payload{' '}
                                <ChevronRight className="h-3 w-3 transition-transform group-open/data:rotate-90" />
                              </summary>
                              <div className="relative mt-4 overflow-hidden rounded-3xl bg-brand-dark p-6 shadow-inner">
                                <div className="absolute right-0 top-0 p-4 text-white opacity-[0.03]">
                                  <Terminal className="h-12 w-12" />
                                </div>
                                <pre className="custom-scrollbar max-h-[400px] overflow-auto font-mono text-[11px] leading-relaxed text-emerald-400/90">
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
          <section className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-blue/20 bg-surface p-8 shadow-pop">
            <div className="pointer-events-none absolute -right-6 -top-6 opacity-[0.02]">
              <Zap className="h-48 w-48 text-brand-blue" />
            </div>
            <div className="relative z-10">
              <header className="mb-8 border-b border-brand-dark/5 pb-6 dark:border-white/5">
                <div className="mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
                  <Cpu className="h-4 w-4 animate-pulse text-brand-yellow" /> Cognitive Guidance
                </div>
                <h2 className="font-heading text-2xl leading-tight tracking-tight text-main">
                  {guidance.title}
                </h2>
                <p className="mt-4 text-sm font-light italic leading-relaxed text-muted opacity-80">
                  {guidance.summary}
                </p>
              </header>

              <Button
                onClick={() => void applyPlaybook()}
                disabled={actionBusy !== null}
                className="group relative w-full overflow-hidden rounded-2xl bg-brand-dark py-8 text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {actionBusy === 'playbook' ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <FastForward className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  )}
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">
                    Inyectar Playbook
                  </span>
                </div>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              </Button>
            </div>
          </section>

          <section className="space-y-10 rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-soft dark:border-white/5">
            <div>
              <div className="mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">
                <Fingerprint className="h-4 w-4" /> Digital Identity
              </div>
              <div className="flex items-start gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-blue/5 bg-brand-blue/5 shadow-inner">
                  <Hash className="h-6 w-6 text-brand-blue opacity-40" />
                </div>
                <div className="overflow-hidden">
                  <p className="mb-1 text-[10px] font-bold uppercase text-muted opacity-60">
                    CRM Identifier
                  </p>
                  <p className="break-all rounded border border-green-500/10 bg-green-500/5 px-2 py-1 font-mono text-xs font-bold leading-relaxed text-emerald-600 dark:text-emerald-400">
                    {data.deal.customer_id || data.deal.lead_id || 'ANONYMOUS_SESSION'}
                  </p>
                </div>
              </div>
            </div>

            {/* ✅ FIX APLICADO: Optional Chaining en data.ticket */}
            {data?.ticket && (
              <div className="animate-in slide-in-from-right-4 space-y-5 rounded-[2.5rem] border border-amber-500/10 bg-amber-500/5 p-7 duration-500">
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">
                  <Sparkles className="h-4 w-4" /> Support Context Linked
                </div>
                <h4 className="line-clamp-2 text-base font-bold tracking-tight text-main">
                  {data.ticket.subject}
                </h4>
                <Link
                  href={`/admin/tickets/${data.ticket.id}`}
                  className="group flex w-full items-center justify-between rounded-2xl border border-amber-500/20 bg-surface px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-main shadow-sm transition-all hover:bg-brand-dark hover:text-brand-yellow"
                >
                  Inspeccionar Ticket{' '}
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                </Link>
              </div>
            )}
          </section>

          <footer className="flex items-center justify-center gap-4 py-4 opacity-30">
            <Terminal className="h-3.5 w-3.5 text-muted" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted">
              Revenue Analytics Node v5.2
            </span>
          </footer>
        </aside>
      </div>

      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> E2E Traceability Active
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Sparkles className="h-4 w-4 text-brand-yellow" /> Cognitive CRM v4.1
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Activity className="h-4 w-4 text-brand-blue" /> Audit Trail Verified
        </div>
      </footer>
    </div>
  );
}

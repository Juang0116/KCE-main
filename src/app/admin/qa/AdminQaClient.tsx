'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { ShieldCheck, Activity, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Zap, Server, Target, Clock } from 'lucide-react';

type Check = {
  id: string;
  label: string;
  ok: boolean;
  ms: number;
  detail?: string;
};

type QaResponse = {
  ok: boolean;
  deep: boolean;
  mode?: 'dev' | 'prod';
  requestId: string;
  summary: { passed: number; failed: number };
  checks: Check[];
};

type RcCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
  meta?: Record<string, unknown>;
};

type RcVerifyResult = {
  ok: boolean;
  requestId: string;
  session_id: string;
  booking_id: string | null;
  checks: RcCheck[];
  next_actions?: string[];
};

type StageStatus = 'done' | 'partial' | 'todo' | 'manual';

export default function AdminQaClient() {
  const [loading, setLoading] = useState(false);
  const [deep, setDeep] = useState(false);
  const [prodMode, setProdMode] = useState(false);
  const [data, setData] = useState<QaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rcSessionId, setRcSessionId] = useState('');
  const [rcLoading, setRcLoading] = useState(false);
  const [rcData, setRcData] = useState<RcVerifyResult | null>(null);
  const [rcError, setRcError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const items = data?.checks ?? [];
    const groups: Record<string, Check[]> = {};
    for (const c of items) {
      const key = c.id.split('.')[0] ?? 'other';
      groups[key] = groups[key] ?? [];
      groups[key].push(c);
    }
    return groups;
  }, [data]);

  const readiness = useMemo(() => {
    if (!data) return null;
    const total = Math.max(1, data.summary.passed + data.summary.failed);
    const score = Math.round((data.summary.passed / total) * 100);
    return {
      score,
      label: score >= 90 ? 'Ready to ship' : score >= 75 ? 'Almost ready' : 'Needs work',
    };
  }, [data]);

  const rcCheckMap = useMemo(() => new Map((rcData?.checks ?? []).map((c) => [c.id, c])), [rcData]);

  const releaseGateScore = useMemo(() => {
    const qaScore = readiness?.score ?? 0;
    const rcChecks = rcData?.checks ?? [];
    const rcTotal = rcChecks.length;
    const rcPassed = rcChecks.filter((c) => c.ok).length;
    const rcScore = rcTotal > 0 ? Math.round((rcPassed / rcTotal) * 100) : null;
    const blended = rcScore == null ? qaScore : Math.round((qaScore * 0.5) + (rcScore * 0.5));
    return {
      score: blended,
      label: blended >= 90 ? 'Release candidate strong' : blended >= 78 ? 'Almost production-ready' : 'Still needs hardening',
      rcScore,
      rcPassed,
      rcTotal,
    };
  }, [readiness, rcData]);

  const goLiveBoard = useMemo(() => {
    const qaOk = !!data?.ok;
    const prodOkay = !!data && !!prodMode && data.ok;
    const bookingOk = !!rcCheckMap.get('supabase.booking_exists')?.ok;
    const emailOk = !!rcCheckMap.get('events.email_sent')?.ok;
    const linksOk = !!rcCheckMap.get('links.token')?.ok;
    const webhookOk = !!rcCheckMap.get('events.checkout_paid')?.ok;
    return [
      {
        title: 'QA Base',
        body: 'Variables, conectividad y dependencias críticas listas.',
        status: qaOk ? 'done' : 'todo',
      },
      {
        title: 'Preflight Estricto',
        body: 'Deep/Prod preflight antes de exponer cambios fuertes.',
        status: prodOkay ? 'done' : 'todo',
      },
      {
        title: 'Revenue Flow',
        body: 'Webhook, booking, links y email deben pasar sobre un session_id real.',
        status: webhookOk && bookingOk && emailOk && linksOk ? 'done' : rcData ? 'partial' : 'todo',
      },
      {
        title: 'Mobile QA',
        body: 'Home, tours, detalle y booking revisados en vertical sin fricción.',
        status: 'manual' as const,
      },
    ] as const;
  }, [data, prodMode, rcData, rcCheckMap]);

  const revenueDesk = useMemo(() => {
    const stage = (ids: string[]) => {
      const items = ids.map((id) => rcCheckMap.get(id)).filter(Boolean) as RcCheck[];
      const passed = items.filter((item) => item.ok).length;
      if (!items.length) return { status: 'todo' as const, passed: 0, total: 0 };
      if (passed === items.length) return { status: 'done' as const, passed, total: items.length };
      if (passed > 0) return { status: 'partial' as const, passed, total: items.length };
      return { status: 'todo' as const, passed, total: items.length };
    };

    const bookingMeta = rcCheckMap.get('supabase.booking_exists')?.meta;
    const linksMeta = rcCheckMap.get('links.token')?.meta;

    return {
      blocks: [
        {
          title: 'Checkout + Paid Session',
          body: 'La sesión debe existir en Stripe y quedar pagada en EUR.',
          ids: ['stripe.session', 'stripe.paid', 'stripe.currency_eur'],
          ...stage(['stripe.session', 'stripe.paid', 'stripe.currency_eur']),
        },
        {
          title: 'Webhook + Event Trail',
          body: 'El webhook recibido indica que Stripe está entrando a KCE.',
          ids: ['events.checkout_paid', 'events.stripe_webhook_received'],
          ...stage(['events.checkout_paid', 'events.stripe_webhook_received']),
        },
        {
          title: 'Booking Persisted',
          body: 'El booking debe existir o poder recuperarse (heal booking).',
          ids: ['supabase.booking_exists', 'heal.booking'],
          ...stage(['supabase.booking_exists', 'heal.booking']),
          meta: bookingMeta,
        },
        {
          title: 'Email + Delivery Assets',
          body: 'Email confirmado y signed links listos para booking e invoice.',
          ids: ['events.email_sent', 'links.token', 'heal.email'],
          ...stage(['events.email_sent', 'links.token', 'heal.email']),
          meta: linksMeta,
        },
        {
          title: 'Manual Account Check',
          body: 'Revisar booking en cuenta y abrir invoice generado.',
          ids: [],
          status: 'manual' as const,
          passed: 0,
          total: 0,
        },
      ],
      links: {
        bookingUrl: typeof linksMeta?.booking_url === 'string' ? linksMeta.booking_url : '',
        invoiceUrl: typeof linksMeta?.invoice_url === 'string' ? linksMeta.invoice_url : '',
      },
      bookingMeta,
    };
  }, [rcCheckMap]);

  const revenueScore = useMemo(() => {
    const relevant = revenueDesk.blocks.filter((block) => block.status !== 'manual');
    const total = relevant.length || 1;
    const points = relevant.reduce((sum, block) => sum + (block.status === 'done' ? 1 : block.status === 'partial' ? 0.5 : 0), 0);
    return Math.round((points / total) * 100);
  }, [revenueDesk]);

  const failureRecovery = useMemo(() => {
    const items: string[] = [];
    if (rcData && !rcCheckMap.get('events.checkout_paid')?.ok) {
      items.push('Si checkout.paid falla, revisa Stripe webhook endpoint, STRIPE_WEBHOOK_SECRET y el reenvío del evento desde Stripe Dashboard.');
    }
    if (rcData && !rcCheckMap.get('supabase.booking_exists')?.ok) {
      items.push('Si falta booking, ejecuta “Verificar + Heal booking” y valida de nuevo en account/admin.');
    }
    if (rcData && !rcCheckMap.get('events.email_sent')?.ok) {
      items.push('Si falta email, ejecuta “Reenviar email + PDF” y revisa RESEND_API_KEY, EMAIL_FROM e inbox/spam.');
    }
    if (rcData && !rcCheckMap.get('links.token')?.ok) {
      items.push('Si fallan los links firmados, configura LINK_TOKEN_SECRET antes de abrir booking/invoice al cliente.');
    }
    if (!items.length && rcData?.ok) {
      items.push('Cuando todos los checks estén en verde, revisa mobile vertical y una compra de prueba final antes de mover tráfico real.');
    }
    return items;
  }, [rcCheckMap, rcData]);

  async function run() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/qa/run?deep=${deep ? '1' : '0'}&mode=${prodMode ? 'prod' : 'dev'}`, { cache: 'no-store' });
      const json = (await res.json()) as QaResponse;
      if (!res.ok) throw new Error((json as { error?: string })?.error || 'QA run failed');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally { setLoading(false); }
  }

  async function runRcVerify(opts?: { healBooking?: boolean; healEmail?: boolean }) {
    const sid = rcSessionId.trim();
    if (!sid) return;
    setRcLoading(true); setRcError(null); setRcData(null);
    try {
      const p = new URLSearchParams({ session_id: sid });
      if (opts?.healBooking) p.set('heal_booking', '1');
      if (opts?.healEmail) p.set('heal_email', '1');
      const res = await fetch(`/api/admin/qa/rc-verify?${p.toString()}`, { cache: 'no-store' });
      const json = (await res.json().catch(() => null)) as RcVerifyResult | null;
      if (!res.ok || !json) throw new Error((json as { error?: string } | null)?.error || `RC verify failed (${res.status})`);
      setRcData(json);
    } catch (e) {
      setRcError(e instanceof Error ? e.message : 'Unknown error');
    } finally { setRcLoading(false); }
  }

  const signals = useMemo(() => [
    { label: 'Release Readiness', value: `${releaseGateScore.score}%`, note: releaseGateScore.label },
    { label: 'Revenue Health', value: `${revenueScore}%`, note: 'E2E Flow (Checkout -> Booking -> Delivery).' }
  ], [releaseGateScore, revenueScore]);

  return (
    <div className="space-y-10 pb-20">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">QA & Release Gates</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Valida infraestructura, revenue y dependencias antes de mover tráfico a producción.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Release Engineering"
        title="Sanidad antes del Handoff"
        description="Ejecuta el QA profundo y luego usa un Session ID de prueba en Stripe para validar que el pipeline de Revenue (Webhooks, Bookings, Mails) está operativo 100%."
        actions={[
          { href: '/admin/system', label: 'Monitor de Sistema', tone: 'primary' },
          { href: '/admin/ops', label: 'Centro de Ops' }
        ]}
        signals={signals}
      />

      {/* DASHBOARDS DE PUNTUACIÓN */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        
        {/* Release Readiness Board */}
        <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">Release Readiness</div>
            <div className="flex items-end gap-3 mb-6">
              <span className="text-5xl font-heading text-brand-blue">{releaseGateScore.score}%</span>
              <span className="text-sm text-[var(--color-text)]/60 pb-1.5 font-medium">{releaseGateScore.label}</span>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {goLiveBoard.map((item) => (
              <div key={item.title} className={`rounded-2xl border p-4 ${item.status === 'done' ? 'bg-emerald-500/10 border-emerald-500/20' : item.status === 'partial' ? 'bg-amber-500/10 border-amber-500/20' : item.status === 'manual' ? 'bg-sky-500/10 border-sky-500/20' : 'bg-[var(--color-surface-2)] border-[var(--color-border)]'}`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className={`text-xs font-bold uppercase tracking-widest ${item.status === 'done' ? 'text-emerald-700' : item.status === 'partial' ? 'text-amber-700' : item.status === 'manual' ? 'text-sky-700' : 'text-[var(--color-text)]/50'}`}>{item.title}</div>
                  {item.status === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  {item.status === 'todo' && <Clock className="h-4 w-4 text-[var(--color-text)]/30" />}
                </div>
                <p className="text-xs leading-relaxed text-[var(--color-text)]/70 font-light">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Revenue E2E Desk */}
        <section className="rounded-[2.5rem] border border-transparent bg-gradient-to-br from-brand-dark to-brand-blue p-6 md:p-8 shadow-xl text-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-brand-yellow/80 mb-2">Revenue E2E Desk</div>
              <h3 className="font-heading text-2xl">Cobrar y Entregar Sin Huecos</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70 font-light max-w-sm">Mide si KCE puede cobrar, guardar la reserva, y enviar tickets post-pago exitosamente.</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-right backdrop-blur-md shrink-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">E2E Score</div>
              <div className="font-heading text-4xl text-brand-yellow">{revenueScore}%</div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {revenueDesk.blocks.map((block) => (
              <div key={block.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:bg-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/80">{block.title}</div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: block.total }).map((_, i) => (
                      <div key={i} className={`h-1.5 w-4 rounded-full ${i < block.passed ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-white/20'}`} />
                    ))}
                  </div>
                </div>
                <div className="text-xs text-white/60 font-light leading-relaxed">{block.body}</div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* CONTROLES DE EJECUCIÓN */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Controles QA Base */}
        <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Server className="h-6 w-6 text-brand-blue" />
            <div>
              <h2 className="font-heading text-2xl text-[var(--color-text)]">Ejecutar Verificación (QA)</h2>
              <div className="text-xs text-[var(--color-text)]/50 mt-1">Valida secretos de entorno, conexiones de BBDD y APIs.</div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]/70 cursor-pointer bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-2.5 rounded-xl">
              <input type="checkbox" checked={deep} onChange={(e) => setDeep(e.target.checked)} className="h-4 w-4 accent-brand-blue" /> Red profunda (Stripe/Resend)
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]/70 cursor-pointer bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-2.5 rounded-xl">
              <input type="checkbox" checked={prodMode} onChange={(e) => setProdMode(e.target.checked)} className="h-4 w-4 accent-brand-blue" /> Reglas de Producción (Estricto)
            </label>
          </div>
          
          <button onClick={run} disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50 shadow-md">
            <Activity className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> {loading ? 'Ejecutando...' : 'Lanzar Verificación QA'}
          </button>
          {error && <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

          {/* Resultados QA */}
          {data && (
            <div className="mt-6 pt-6 border-t border-[var(--color-border)] space-y-6">
              {Object.entries(grouped).map(([group, checks]) => (
                <div key={group}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-3">{group}</div>
                  <div className="space-y-2">
                    {checks.map((c) => (
                      <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
                        <div className="flex items-center gap-3">
                          {c.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-rose-500" />}
                          <span className={`text-sm font-semibold ${c.ok ? 'text-[var(--color-text)]' : 'text-rose-600'}`}>{c.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono">
                          {c.detail && <span className="text-[var(--color-text)]/50 bg-[var(--color-surface)] px-2 py-0.5 rounded-md border border-[var(--color-border)] truncate max-w-[200px]">{c.detail}</span>}
                          <span className="text-[var(--color-text)]/30">{c.ms}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Controles RC / Revenue */}
        <div className="space-y-6">
          <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="h-6 w-6 text-brand-blue" />
              <div>
                <h2 className="font-heading text-2xl text-[var(--color-text)]">Revenue Flow (RC)</h2>
                <div className="text-xs text-[var(--color-text)]/50 mt-1">Usa un Session ID real de Stripe para validar el E2E.</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input value={rcSessionId} onChange={(e) => setRcSessionId(e.target.value)} placeholder="cs_test_..." className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-mono outline-none focus:border-brand-blue transition-colors" />
              <button onClick={() => void runRcVerify()} disabled={!rcSessionId || rcLoading} className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 disabled:opacity-50 shadow-sm">
                {rcLoading ? 'Verificando...' : 'Verificar Flujo'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => void runRcVerify({ healBooking: true })} disabled={!rcSessionId || rcLoading} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/70 hover:bg-[var(--color-surface)] transition-colors">
                + Heal Booking
              </button>
              <button onClick={() => void runRcVerify({ healEmail: true })} disabled={!rcSessionId || rcLoading} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/70 hover:bg-[var(--color-surface)] transition-colors">
                + Reenviar Email/PDF
              </button>
            </div>

            {rcError && <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-50 p-4 text-sm text-rose-700">{rcError}</div>}

            {rcData && (
              <div className="mt-6 pt-6 border-t border-[var(--color-border)] space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-2">Checklist de Conversión</div>
                {rcData.checks.map((c) => (
                  <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
                    <div className="flex items-center gap-3">
                      {c.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-rose-500" />}
                      <span className={`text-sm font-semibold ${c.ok ? 'text-[var(--color-text)]' : 'text-rose-600'}`}>{c.label}</span>
                    </div>
                    {c.detail && <span className="text-[10px] font-mono text-[var(--color-text)]/50 truncate max-w-[250px]">{c.detail}</span>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Failure Recovery Guide */}
          {failureRecovery.length > 0 && (
            <section className="rounded-[2.5rem] border border-amber-500/20 bg-amber-50 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
                <h2 className="font-heading text-xl text-amber-900">Guía de Recuperación</h2>
              </div>
              <ul className="space-y-3">
                {failureRecovery.map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-amber-800/80 font-medium">
                    <span className="opacity-50">0{idx + 1}.</span> {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';

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

function statusBadge(status: StageStatus) {
  return status === 'done'
    ? 'rounded-full bg-emerald-500/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700'
    : status === 'partial'
      ? 'rounded-full bg-amber-500/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700'
      : status === 'manual'
        ? 'rounded-full bg-sky-500/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700'
        : 'rounded-full bg-slate-500/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700';
}

function statusLabel(status: StageStatus) {
  return status === 'done' ? 'ok' : status === 'partial' ? 'partial' : status === 'manual' ? 'manual' : 'pending';
}

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
        title: 'QA base',
        body: 'Variables, conectividad y dependencias críticas listas.',
        status: qaOk ? 'done' : 'todo',
      },
      {
        title: 'Preflight estricto',
        body: 'Deep o production preflight antes de exponer cambios fuertes.',
        status: prodOkay ? 'done' : 'todo',
      },
      {
        title: 'Revenue flow',
        body: 'Webhook, booking, signed links y email deben pasar sobre session_id real.',
        status: webhookOk && bookingOk && emailOk && linksOk ? 'done' : rcData ? 'partial' : 'todo',
      },
      {
        title: 'Mobile QA',
        body: 'Home, tours, detalle y booking revisados en vertical sin fricción ni overflow.',
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
          title: 'Checkout + paid session',
          body: 'La sesión debe existir en Stripe y quedar pagada en EUR.',
          ids: ['stripe.session', 'stripe.paid', 'stripe.currency_eur'],
          ...stage(['stripe.session', 'stripe.paid', 'stripe.currency_eur']),
        },
        {
          title: 'Webhook + event trail',
          body: 'checkout.paid y webhook recibido indican que Stripe realmente está entrando a KCE.',
          ids: ['events.checkout_paid', 'events.stripe_webhook_received'],
          ...stage(['events.checkout_paid', 'events.stripe_webhook_received']),
        },
        {
          title: 'Booking persisted',
          body: 'bookings.stripe_session_id debe existir o poder recuperarse con heal booking.',
          ids: ['supabase.booking_exists', 'heal.booking'],
          ...stage(['supabase.booking_exists', 'heal.booking']),
          meta: bookingMeta,
        },
        {
          title: 'Email + delivery assets',
          body: 'Email confirmado y signed links listos para booking e invoice.',
          ids: ['events.email_sent', 'links.token', 'heal.email'],
          ...stage(['events.email_sent', 'links.token', 'heal.email']),
          meta: linksMeta,
        },
        {
          title: 'Manual account/admin check',
          body: 'Revisar booking en cuenta/admin y abrir invoice/booking url generadas.',
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
    if (!items.length) {
      items.push('Cuando todos los checks estén en verde, revisa mobile vertical y una compra de prueba final antes de mover tráfico real.');
    }
    return items;
  }, [rcCheckMap, rcData]);


  const launchBoard = useMemo(() => {
    const qaOk = !!data?.ok;
    const rcOk = !!rcData?.ok;
    const bookingOk = !!rcCheckMap.get('supabase.booking_exists')?.ok;
    const emailOk = !!rcCheckMap.get('events.email_sent')?.ok;
    const linksOk = !!rcCheckMap.get('links.token')?.ok;
    return [
      {
        title: 'Go',
        body: 'Build, QA base y RC Verify en verde. Puedes empujar tráfico y campañas con mucha más tranquilidad.',
        status: qaOk && rcOk && bookingOk && emailOk && linksOk ? 'done' as const : 'todo' as const,
      },
      {
        title: 'No-go',
        body: 'Si falla revenue truth, links firmados o email, detén el empuje comercial hasta cerrar el hueco.',
        status: rcData && (!bookingOk || !emailOk || !linksOk) ? 'done' as const : 'manual' as const,
      },
      {
        title: 'Monitor',
        body: 'Aunque todo compile, la salida final depende de mobile QA, booking/account y revisión humana real.',
        status: 'manual' as const,
      },
      {
        title: 'Recover',
        body: 'Si algo no pasa, usa heal booking, reenvío de email y runbooks antes de escalar más presión comercial.',
        status: rcData && (!rcOk || !bookingOk || !emailOk) ? 'partial' as const : 'todo' as const,
      },
    ] as const;
  }, [data, rcData, rcCheckMap]);

  const publicRouteAudit = useMemo(
    () => [
      {
        title: 'Home + tours',
        body: 'Hero, catálogo, filtros, scroll vertical y CTA principal sin saturación rara.',
        status: 'manual' as const,
      },
      {
        title: 'Detail + plan',
        body: 'Tour detail, plan personalizado y contacto deben conservar contexto y verse premium en mobile.',
        status: 'manual' as const,
      },
      {
        title: 'Chat + contacto',
        body: 'El concierge debe verse claro, responder corto y abrir continuidad sin perder el resumen del caso.',
        status: 'manual' as const,
      },
      {
        title: 'Booking + account',
        body: 'Post-compra, invoice y cuenta deben abrir rápido y sin huecos visuales o de permisos.',
        status: rcData ? 'partial' as const : 'manual' as const,
      },
    ],
    [rcData],
  );

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/qa/run?deep=${deep ? '1' : '0'}&mode=${prodMode ? 'prod' : 'dev'}`,
        { cache: 'no-store' },
      );
      const json = (await res.json()) as QaResponse;
      if (!res.ok) throw new Error((json as { error?: string })?.error || 'QA run failed');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function runRcVerify(opts?: { healBooking?: boolean; healEmail?: boolean }) {
    const sid = rcSessionId.trim();
    if (!sid) return;
    setRcLoading(true);
    setRcError(null);
    setRcData(null);
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
    } finally {
      setRcLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[26px] border border-black/10 bg-white/60 p-5 shadow-soft">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">release readiness</div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-4xl font-heading text-brand-blue">{releaseGateScore.score}%</div>
              <div className="mt-1 text-sm text-[color:var(--color-text)]/72">{releaseGateScore.label}</div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {goLiveBoard.map((item) => (
                <div key={item.title} className="min-w-[180px] rounded-[20px] border border-black/10 bg-[color:var(--color-surface)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-[color:var(--color-text)]">{item.title}</div>
                    <span className={statusBadge(item.status)}>{statusLabel(item.status)}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[color:var(--color-text)]/68">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[26px] border border-black/10 bg-[linear-gradient(160deg,rgba(15,55,120,0.98),rgba(15,55,120,0.86)_65%,rgba(216,179,73,0.18))] p-5 text-white shadow-soft">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">revenue e2e desk</div>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <h3 className="font-heading text-2xl text-white">Cobrar, persistir y entregar sin perder contexto</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/82">
                Este bloque ya no mide solo QA genérico: mide si KCE puede cobrar, guardar el booking, producir enlaces firmados y dejar al viajero con una entrega post-pago seria.
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/8 px-5 py-4 text-right">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">revenue score</div>
              <div className="mt-1 font-heading text-4xl text-white">{revenueScore}%</div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[20px] border border-white/10 bg-white/8 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">checkout + webhook</div>
              <div className="mt-2 text-sm leading-6 text-white/88">Valida que la sesión exista, el pago quede en paid y el webhook produzca checkout.paid.</div>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/8 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">booking + links</div>
              <div className="mt-2 text-sm leading-6 text-white/88">Asegura booking en Supabase y signed links para booking e invoice antes de mover tráfico.</div>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/8 p-4 sm:col-span-2 xl:col-span-1">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">delivery</div>
              <div className="mt-2 text-sm leading-6 text-white/88">Email, PDF y revisión manual en account/admin deben quedar claros y repetibles.</div>
            </div>
          </div>
        </section>
      </div>

      <div className="rounded-2xl border border-black/10 bg-black/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[color:var(--color-text)]">Ejecutar QA</div>
            <div className="mt-1 text-xs text-[color:var(--color-text)]/70">
              “Deep” hace un chequeo de red con Stripe. “Production preflight” aplica reglas estrictas para despliegue y ventas.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-[color:var(--color-text)]/80">
              <input
                type="checkbox"
                checked={deep}
                onChange={(e) => setDeep(e.target.checked)}
                className="size-4 rounded border-black/20"
              />
              Deep
            </label>
            <label className="flex items-center gap-2 text-sm text-[color:var(--color-text)]/80">
              <input
                type="checkbox"
                checked={prodMode}
                onChange={(e) => setProdMode(e.target.checked)}
                className="size-4 rounded border-black/20"
              />
              Production preflight
            </label>
            <Button onClick={run} disabled={loading}>
              {loading ? 'Ejecutando…' : 'Run checks'}
            </Button>
          </div>
        </div>

        {readiness ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white/50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">QA readiness</div>
              <div className="mt-2 text-3xl font-heading text-brand-blue">{readiness.score}%</div>
              <div className="mt-1 text-sm text-[color:var(--color-text)]/70">{readiness.label}</div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">Passed</div>
              <div className="mt-2 text-3xl font-heading text-emerald-700">{data?.summary.passed ?? 0}</div>
              <div className="mt-1 text-sm text-[color:var(--color-text)]/70">Checks listos</div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">Failed</div>
              <div className="mt-2 text-3xl font-heading text-red-700">{data?.summary.failed ?? 0}</div>
              <div className="mt-1 text-sm text-[color:var(--color-text)]/70">Puntos a corregir</div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        {data ? (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-[color:var(--color-text)]">
                <span className="font-semibold">Resultado:</span>{' '}
                <span className={data.ok ? 'text-emerald-700' : 'text-red-700'}>{data.ok ? 'OK' : 'FAIL'}</span>
                <span className="ml-3 text-xs text-[color:var(--color-text)]/70">RequestId: {data.requestId}</span>
              </div>
              <div className="text-xs text-[color:var(--color-text)]/70">Pasaron: {data.summary.passed} · Fallaron: {data.summary.failed}</div>
            </div>

            <div className="mt-4 grid gap-4">
              {Object.entries(grouped).map(([group, items]) => (
                <section key={group} className="rounded-2xl border border-black/10 bg-white/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/70">{group}</div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-[color:var(--color-text)]/60">
                          <th className="py-2 pr-3">Check</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2 pr-3">Ms</th>
                          <th className="py-2">Detail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((c) => (
                          <tr key={c.id} className="border-t border-black/10">
                            <td className="py-2 pr-3">
                              <div className="font-medium text-[color:var(--color-text)]">{c.label}</div>
                              <div className="text-xs text-[color:var(--color-text)]/60">{c.id}</div>
                            </td>
                            <td className="py-2 pr-3">
                              <span className={c.ok ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700'}>{c.ok ? 'PASS' : 'FAIL'}</span>
                            </td>
                            <td className="py-2 pr-3 tabular-nums text-[color:var(--color-text)]/80">{c.ms}</td>
                            <td className="py-2 text-xs text-[color:var(--color-text)]/70">{c.detail ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 text-xs text-[color:var(--color-text)]/70">Ejecuta el QA para ver resultados.</div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[24px] border border-black/10 bg-[color:var(--color-surface)] p-5 shadow-soft">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/55">hardening lanes</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              { title: 'Build + CI', body: 'npm run build · npm run qa:ci · npm run qa:smoke', href: '/admin/system' },
              { title: 'Revenue verify', body: 'Compra de prueba + RC Verify + heal booking/email si hace falta', href: '/admin/qa' },
              { title: 'Delivery truth', body: 'Revisar /booking, /account/bookings, /admin/bookings y email recibido', href: '/admin/bookings' },
              { title: 'Ops recovery', body: 'Si algo falla, abrir incidents y runbooks antes de seguir empujando tráfico', href: '/admin/ops/runbooks' },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="rounded-[18px] border border-black/10 bg-black/5 p-4 transition hover:-translate-y-px hover:bg-black/10">
                <div className="text-sm font-semibold text-[color:var(--color-text)]">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{item.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-black/10 bg-[linear-gradient(160deg,rgba(15,55,120,0.98),rgba(15,55,120,0.86)_65%,rgba(216,179,73,0.18))] p-5 text-white shadow-soft">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">manual go-live walk</div>
          <div className="mt-4 space-y-3">
            {[
              '1. Home / tours / detail / quiz revisados en mobile vertical sin scroll lateral.',
              '2. Compra de prueba terminada con session_id reciente y Stripe paid confirmado.',
              '3. RC Verify en verde o recuperado con heal booking/email.',
              '4. Booking visible en account/admin y email + PDF entregados.',
              '5. Solo después de eso mover tráfico o campañas.',
            ].map((item) => (
              <div key={item} className="rounded-[18px] border border-white/10 bg-white/8 p-4 text-sm leading-6 text-white/88">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-[22px] border border-black/10 bg-white/55 p-4 shadow-soft">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/55">qa score</div>
          <div className="mt-2 text-3xl font-heading text-brand-blue">{readiness?.score ?? 0}%</div>
          <p className="mt-1 text-sm text-[color:var(--color-text)]/70">{readiness?.label ?? 'Run QA to calculate readiness'}</p>
        </section>
        <section className="rounded-[22px] border border-black/10 bg-white/55 p-4 shadow-soft">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/55">rc verify</div>
          <div className="mt-2 text-3xl font-heading text-brand-blue">{releaseGateScore.rcScore ?? 0}%</div>
          <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
            {releaseGateScore.rcTotal
              ? `${releaseGateScore.rcPassed}/${releaseGateScore.rcTotal} checks end-to-end en verde`
              : 'Pega un session_id para validar booking, invoice y email'}
          </p>
        </section>
        <section className="rounded-[22px] border border-black/10 bg-white/55 p-4 shadow-soft">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/55">revenue score</div>
          <div className="mt-2 text-3xl font-heading text-brand-blue">{revenueScore}%</div>
          <p className="mt-1 text-sm text-[color:var(--color-text)]/70">Qué tan cerca está KCE de cobrar, persistir y entregar la reserva completa sin huecos.</p>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[24px] border border-black/10 bg-white/55 p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/55">go / no-go board</div>
              <h3 className="mt-2 font-heading text-2xl text-brand-blue">Decisión final antes de mover más presión comercial</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-text)]/70">Este bloque baja la decisión final a cuatro estados: salir, detener, vigilar o recuperar. No todo problema amerita pánico, pero tampoco conviene empujar tráfico con huecos en revenue truth.</p>
            </div>
            <Link href="/admin/launch-hq" className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-2)]">Abrir Launch HQ</Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {launchBoard.map((item) => (
              <article key={item.title} className="rounded-[18px] border border-black/10 bg-black/5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-[color:var(--color-text)]">{item.title}</div>
                  <span className={statusBadge(item.status)}>{statusLabel(item.status)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-black/10 bg-white/55 p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/55">public route audit</div>
              <h3 className="mt-2 font-heading text-2xl text-brand-blue">Auditoría manual de la experiencia que el viajero realmente ve</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-text)]/70">Aunque QA técnico pase, el release final depende de revisar flujo premium, continuidad comercial y calma post-compra en las rutas clave del front.</p>
            </div>
            <Link href="/admin/bookings" className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-2)]">Abrir continuity desk</Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {publicRouteAudit.map((item) => (
              <article key={item.title} className="rounded-[18px] border border-black/10 bg-black/5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-[color:var(--color-text)]">{item.title}</div>
                  <span className={statusBadge(item.status)}>{statusLabel(item.status)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="rounded-2xl border border-black/10 bg-black/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[color:var(--color-text)]">RC Verify (0→100)</div>
            <div className="mt-1 text-xs text-[color:var(--color-text)]/70">
              Verifica end-to-end (Stripe → webhook → booking → email/invoice). Pega el Stripe <span className="font-mono">session_id</span>.
            </div>
            <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[color:var(--color-text)]/45">Recommended order: verify → heal booking → resend email if needed</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              className="h-9 w-[320px] rounded-xl border border-black/10 bg-white/70 px-3 text-sm text-[color:var(--color-text)] outline-none"
              placeholder="cs_test_... / cs_live_..."
              value={rcSessionId}
              onChange={(e) => setRcSessionId(e.target.value)}
            />
            <Button onClick={() => runRcVerify({ healBooking: false })} disabled={rcLoading || !rcSessionId.trim()}>
              {rcLoading ? 'Verificando…' : 'Verificar'}
            </Button>
            <Button
              onClick={() => runRcVerify({ healBooking: true })}
              disabled={rcLoading || !rcSessionId.trim()}
              title="Crea/actualiza booking desde Stripe si falta (safe)"
            >
              {rcLoading ? '—' : 'Verificar + Heal booking'}
            </Button>
            <Button
              onClick={() => runRcVerify({ healEmail: true })}
              disabled={rcLoading || !rcSessionId.trim()}
              title="Reenvía el email de confirmación con PDF (usa Stripe como fuente de verdad)"
            >
              {rcLoading ? '—' : 'Reenviar email + PDF'}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[24px] border border-black/10 bg-white/55 p-4 shadow-soft">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/55">revenue flow board</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              {revenueDesk.blocks.map((block) => (
                <div key={block.title} className="rounded-[20px] border border-black/10 bg-[color:var(--color-surface)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--color-text)]">{block.title}</div>
                    <span className={statusBadge(block.status)}>{statusLabel(block.status)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">{block.body}</p>
                  {block.total ? (
                    <div className="mt-3 text-xs font-medium text-[color:var(--color-text)]/55">{block.passed}/{block.total} checks en verde</div>
                  ) : null}
                  {'meta' in block && block.meta ? (
                    <div className="mt-3 rounded-[16px] border border-black/10 bg-black/5 p-3 text-xs text-[color:var(--color-text)]/72">
                      {Object.entries(block.meta).slice(0, 3).map(([k, v]) => (
                        <div key={k}><span className="font-semibold text-[color:var(--color-text)]">{k}:</span> {String(v)}</div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-black/10 bg-[linear-gradient(160deg,rgba(15,55,120,0.98),rgba(15,55,120,0.86)_65%,rgba(216,179,73,0.18))] p-4 text-white shadow-soft">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">triage + delivery</div>
            <h3 className="mt-3 font-heading text-2xl text-white">Qué mirar cuando un pago ya entró pero el flujo no quedó completo</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/86">
              {failureRecovery.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] border border-white/10 bg-white/8 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/55">booking url</div>
                <div className="mt-2 break-all text-xs text-white/88">{revenueDesk.links.bookingUrl || 'Disponible después de links.token PASS'}</div>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-white/8 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/55">invoice url</div>
                <div className="mt-2 break-all text-xs text-white/88">{revenueDesk.links.invoiceUrl || 'Disponible después de links.token PASS'}</div>
              </div>
            </div>

            <div className="mt-4 rounded-[18px] border border-white/10 bg-white/8 p-4 text-sm text-white/88">
              Manual final: abre booking url, abre invoice url, revisa booking en account/admin y confirma que el correo llegó con el PDF correcto.
            </div>
          </section>
        </div>

        {rcError ? <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">{rcError}</div> : null}

        {rcData ? (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-[color:var(--color-text)]">
                <span className="font-semibold">Resultado:</span>{' '}
                <span className={rcData.ok ? 'text-emerald-700' : 'text-amber-800'}>{rcData.ok ? 'OK ✅' : 'Atención ⚠️'}</span>
                <span className="ml-3 text-xs text-[color:var(--color-text)]/70">RequestId: {rcData.requestId}</span>
              </div>
              <div className="text-xs text-[color:var(--color-text)]/70">
                session_id: <span className="font-mono">{rcData.session_id}</span>
                {rcData.booking_id ? <> · booking_id: <span className="font-mono">{rcData.booking_id}</span></> : null}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-black/10 bg-white/40 p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[color:var(--color-text)]/60">
                    <th className="py-2 pr-3">Check</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {rcData.checks.map((c) => (
                    <tr key={c.id} className="border-t border-black/10">
                      <td className="py-2 pr-3">
                        <div className="font-medium text-[color:var(--color-text)]">{c.label}</div>
                        <div className="text-xs text-[color:var(--color-text)]/60">{c.id}</div>
                      </td>
                      <td className="py-2 pr-3">
                        <span className={c.ok ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700'}>{c.ok ? 'PASS' : 'FAIL'}</span>
                      </td>
                      <td className="py-2 text-xs text-[color:var(--color-text)]/70">{c.detail ?? (c.meta ? JSON.stringify(c.meta) : '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {Array.isArray(rcData.next_actions) && rcData.next_actions.length ? (
              <div className="mt-4 rounded-2xl border border-black/10 bg-white/40 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/70">Siguientes acciones</div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[color:var(--color-text)]">
                  {rcData.next_actions.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 text-xs text-[color:var(--color-text)]/70">
            Usa un session_id real (Stripe) para validar el flujo completo. Tip: lo encuentras en Stripe Dashboard → Payments → Checkout session.
          </div>
        )}
      </div>
    </div>
  );
}

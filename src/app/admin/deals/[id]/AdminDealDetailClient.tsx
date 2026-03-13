/* src/app/admin/deals/[id]/AdminDealDetailClient.tsx */
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
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
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'EUR' }).format(v);
}

function badge(kind: string) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs';
  if (kind === 'task') return base + ' bg-blue-500/15 text-blue-700 dark:text-blue-200';
  if (kind === 'outbound') return base + ' bg-emerald-500/15 text-emerald-700 dark:text-emerald-200';
  if (kind === 'event') return base + ' bg-purple-500/15 text-purple-700 dark:text-purple-200';
  return base + ' bg-amber-500/15 text-amber-800 dark:text-amber-200';
}

function stageCopy(stageRaw?: string | null) {
  const stage = (stageRaw || '').toLowerCase();
  if (stage === 'checkout') {
    return {
      kind: 'checkout_push' as const,
      title: 'Empujar checkout',
      summary: 'Este deal ya está muy cerca del cierre. Conviene reactivar pago y verificar respuesta rápida.',
    };
  }
  if (stage === 'proposal') {
    return {
      kind: 'proposal' as const,
      title: 'Seguir propuesta',
      summary: 'La mejor siguiente acción es reforzar la propuesta y dejar visible el siguiente paso comercial.',
    };
  }
  return {
    kind: 'followup_24h' as const,
    title: 'Hacer follow-up',
    summary: 'Todavía está en etapa temprana. Lo más útil es contacto rápido y calificación comercial.',
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

  // Timeline playback (audit mode)
  const [play, setPlay] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [speed, setSpeed] = useState(1);

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const res = await adminFetch(`/api/admin/deals/${id}/timeline`, { cache: 'no-store' });
      const j = (await res.json()) as Partial<TimelineResponse> & { error?: string };
      if (!res.ok) throw new Error(j?.error || 'Error cargando deal');
      setData({
        deal: (j.deal || null) as Deal,
        ticket: (j.ticket || null) as TicketRef | null,
        timeline: Array.isArray(j.timeline) ? (j.timeline as TimelineItem[]) : [],
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const deal = data?.deal;
  const timeline = useMemo(() => data?.timeline ?? [], [data]);
  const guidance = useMemo(() => stageCopy(deal?.stage), [deal?.stage]);

  useEffect(() => {
    // reset index when timeline changes
    setPlayIndex(0);
    setPlay(false);
  }, [timeline.length]);

  useEffect(() => {
    if (!play) return;
    if (!timeline.length) return;
    const stepMs = Math.max(200, Math.round(900 / Math.max(0.25, speed)));
    const t = window.setInterval(() => {
      setPlayIndex((i) => {
        const next = i + 1;
        if (next >= timeline.length) {
          window.clearInterval(t);
          setPlay(false);
          return i;
        }
        return next;
      });
    }, stepMs);
    return () => window.clearInterval(t);
  }, [play, speed, timeline.length]);

  function exportTimeline() {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deal-${id}-timeline.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      // no-op
    }
  }

  async function applyPlaybook() {
    setActionBusy('playbook');
    setActionResult(null);
    try {
      const res = await adminFetch(`/api/admin/deals/${id}/playbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: guidance.kind }),
      });
      const j = (await res.json().catch(() => null)) as { tasksCreated?: number; error?: string } | null;
      if (!res.ok) throw new Error(j?.error || 'No fue posible aplicar el playbook');
      setActionResult({
        ok: true,
        label: 'Playbook aplicado',
        detail: `${j?.tasksCreated ?? 0} tareas creadas para ${guidance.title.toLowerCase()}.`,
      });
      await load();
    } catch (e) {
      setActionResult({
        ok: false,
        label: 'No se pudo aplicar el playbook',
        detail: e instanceof Error ? e.message : 'Error inesperado',
      });
    } finally {
      setActionBusy(null);
    }
  }

  async function generateProposal() {
    if (!deal?.tour_slug) {
      setActionResult({
        ok: false,
        label: 'Falta el tour del deal',
        detail: 'Este deal no tiene tour_slug; sin eso no se puede generar propuesta automática.',
      });
      return;
    }
    setActionBusy('proposal');
    setActionResult(null);
    try {
      const res = await adminFetch(`/api/admin/deals/${id}/proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: deal.tour_slug,
          date: toDateInput(7),
          guests: 2,
          locale: 'es',
          includeCheckoutLink: true,
        }),
      });
      const j = (await res.json().catch(() => null)) as { checkoutUrl?: string | null; error?: string } | null;
      if (!res.ok) throw new Error(j?.error || 'No fue posible generar la propuesta');
      const extra = j?.checkoutUrl
        ? 'Se dejó listo el siguiente paso con link de pago.'
        : 'Propuesta creada sin link de pago.';
      setActionResult({ ok: true, label: 'Propuesta generada', detail: extra });
      await load();
    } catch (e) {
      setActionResult({
        ok: false,
        label: 'No se pudo generar la propuesta',
        detail: e instanceof Error ? e.message : 'Error inesperado',
      });
    } finally {
      setActionBusy(null);
    }
  }

  const openTasks = timeline.filter((it) => it.kind === 'task').length;
  const recentSignals = timeline.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-6xl p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs opacity-70">
            <Link href="/admin/deals" className="underline">
              Deals
            </Link>{' '}
            / {id}
          </div>
          <h1 className="text-xl font-semibold">{deal?.title || 'Deal'}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm opacity-80">
            <span className="rounded-full border border-black/10 px-2 py-0.5 dark:border-white/10">{deal?.stage}</span>
            {deal?.tour_slug ? <span className="opacity-80">{deal.tour_slug}</span> : null}
            <span className="opacity-80">{moneyEUR(deal?.amount_minor ?? 0)}</span>
            {deal?.probability != null ? <span className="opacity-80">{deal.probability}%</span> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {deal?.checkout_url ? (
            <a className="text-sm underline" href={deal.checkout_url} target="_blank" rel="noreferrer">
              Abrir checkout
            </a>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-black/10 p-1 dark:border-white/10">
            <Button onClick={() => setPlay((p) => !p)} disabled={!timeline.length}>
              {play ? 'Pausar' : 'Playback'}
            </Button>
            <Button
              onClick={() => setPlayIndex((i) => Math.max(0, i - 1))}
              disabled={!timeline.length || playIndex <= 0}
            >
              ◀
            </Button>
            <Button
              onClick={() => setPlayIndex((i) => Math.min(timeline.length - 1, i + 1))}
              disabled={!timeline.length || playIndex >= timeline.length - 1}
            >
              ▶
            </Button>
            <label className="flex items-center gap-1 text-xs opacity-80">
              Velocidad
              <select
                className="rounded-md border border-black/10 bg-transparent px-1 py-0.5 text-xs dark:border-white/10"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
            </label>
            <Button onClick={exportTimeline} disabled={!data}>
              Export JSON
            </Button>
          </div>

          <Button onClick={load} disabled={loading}>
            {loading ? 'Cargando…' : 'Refrescar'}
          </Button>
        </div>
      </div>

      {err ? <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm">{err}</div> : null}

      {!data ? (
        <div className="text-sm opacity-70">{loading ? 'Cargando…' : 'Sin datos'}</div>
      ) : (
        <>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-black/10 p-3 dark:border-white/10">
              <div className="text-xs uppercase tracking-wide opacity-60">Siguiente mejor paso</div>
              <div className="mt-1 text-sm font-semibold">{guidance.title}</div>
              <div className="mt-1 text-sm opacity-80">{guidance.summary}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={applyPlaybook} disabled={actionBusy !== null}>
                  {actionBusy === 'playbook' ? 'Aplicando…' : 'Aplicar playbook'}
                </Button>
                <Button onClick={generateProposal} disabled={actionBusy !== null || !deal?.tour_slug}>
                  {actionBusy === 'proposal' ? 'Generando…' : 'Generar propuesta'}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-black/10 p-3 dark:border-white/10">
              <div className="text-xs uppercase tracking-wide opacity-60">Señales rápidas</div>
              <div className="mt-2 text-sm">Tareas abiertas: <span className="font-semibold">{openTasks}</span></div>
              <div className="mt-1 text-sm">Timeline: <span className="font-semibold">{timeline.length}</span> eventos</div>
              <div className="mt-1 text-sm">Última actualización: <span className="font-semibold">{deal?.updated_at ? new Date(deal.updated_at).toLocaleString('es-CO') : '—'}</span></div>
            </div>

            <div className="rounded-xl border border-black/10 p-3 dark:border-white/10">
              <div className="text-xs uppercase tracking-wide opacity-60">Contexto comercial</div>
              <div className="mt-2 text-sm">Lead: <span className="font-mono text-xs">{deal?.lead_id || '—'}</span></div>
              <div className="mt-1 text-sm">Cliente: <span className="font-mono text-xs">{deal?.customer_id || '—'}</span></div>
              <div className="mt-1 text-sm">Checkout: {deal?.checkout_url ? <span className="font-semibold">listo</span> : 'pendiente'}</div>
            </div>
          </div>

          {actionResult ? (
            <div
              className={`mb-4 rounded-xl p-3 text-sm ${
                actionResult.ok
                  ? 'border border-emerald-500/30 bg-emerald-500/10'
                  : 'border border-red-500/30 bg-red-500/10'
              }`}
            >
              <div className="font-medium">{actionResult.label}</div>
              {actionResult.detail ? <div className="mt-1 opacity-90">{actionResult.detail}</div> : null}
            </div>
          ) : null}

          {data.ticket ? (
            <div className="mb-4 rounded-xl border border-black/10 p-3 text-sm dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs opacity-70">Ticket más reciente</div>
                  <div className="font-medium">{data.ticket.subject || data.ticket.id}</div>
                  <div className="text-xs opacity-70">
                    {data.ticket.status || 'open'} · {data.ticket.channel || 'web'}
                  </div>
                </div>
                <Link className="text-sm underline" href={`/admin/tickets/${data.ticket.id}`}>
                  Abrir ticket
                </Link>
              </div>
            </div>
          ) : null}

          {!!recentSignals.length ? (
            <div className="mb-4 rounded-xl border border-black/10 p-3 dark:border-white/10">
              <div className="text-xs uppercase tracking-wide opacity-60">Últimas señales</div>
              <div className="mt-2 flex flex-col gap-2">
                {recentSignals.map((it, idx) => (
                  <div key={`${it.ts}-${idx}`} className="text-sm">
                    <span className={badge(it.kind)}>{it.kind}</span>
                    <span className="ml-2 font-medium">{it.title}</span>
                    <span className="ml-2 opacity-70">{new Date(it.ts).toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <h2 className="mb-2 text-base font-semibold">Timeline</h2>
          <div className="rounded-xl border border-black/10 dark:border-white/10">
            <div className="divide-y divide-black/10 dark:divide-white/10">
              {timeline.map((it, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 p-3 md:flex-row md:items-start md:justify-between ${i === playIndex ? 'bg-yellow-500/10' : ''}`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={badge(it.kind)}>{it.kind}</span>
                      <div className="font-medium">{it.title}</div>
                    </div>
                    {it.detail ? <div className="mt-1 text-sm opacity-80">{it.detail}</div> : null}
                  </div>
                  <div className="shrink-0 text-xs opacity-70">{new Date(it.ts).toLocaleString('es-CO')}</div>
                </div>
              ))}
              {!timeline.length ? <div className="p-3 text-sm opacity-70">Sin eventos todavía.</div> : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* src/app/admin/sales/AdminSalesCockpitClient.tsx */
'use client';


import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { normalizePhone } from '@/lib/normalize';

type Row = {
  id: string;
  stage: string | null;
  title: string | null;
  tour_slug: string | null;
  probability: number | null;
  amount_minor: number | null;
  currency: string | null;
  assigned_to: string | null;
  created_at: string | null;
  updated_at: string | null;

  age_days: number;
  stale_days: number;

  last_contact_at: string | null;
  contact_stale_days: number | null;

  last_customer_message_at?: string | null;
  last_agent_message_at?: string | null;
  waiting_on?: 'agent' | 'customer' | null;
  waiting_days?: number | null;
  locale?: string;

  open_tasks: number;
  overdue_tasks: number;

  score: number;
  risk: string[];

  next_task: { id: string; title: string; due_at: string | null } | null;
  next_action: string;

  customer: { name: string | null; email: string | null; whatsapp: string | null };
};

function badgeStage(stage: string) {
  const v = (stage || '').toLowerCase();
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  if (v === 'new') return `${base} bg-black/10 text-[color:var(--color-text)]/80`;
  if (v === 'contacted') return `${base} bg-teal-500/15 text-teal-800 dark:text-teal-200`;
  if (v === 'qualified') return `${base} bg-sky-500/15 text-sky-800 dark:text-sky-200`;
  if (v === 'proposal') return `${base} bg-amber-500/15 text-amber-800 dark:text-amber-200`;
  if (v === 'checkout') return `${base} bg-violet-500/15 text-violet-800 dark:text-violet-200`;
  if (v === 'won') return `${base} bg-emerald-500/15 text-emerald-800 dark:text-emerald-200`;
  if (v === 'lost') return `${base} bg-rose-500/15 text-rose-800 dark:text-rose-200`;
  return `${base} bg-black/10 text-[color:var(--color-text)]/80`;
}

function fmtDue(v: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}


function fmtMoneyMinor(amountMinor: number | null | undefined, currency: string | null | undefined) {
  if (typeof amountMinor !== 'number' || !Number.isFinite(amountMinor)) return '—';
  const code = String(currency || 'EUR').toUpperCase();
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: code }).format(amountMinor / 100);
  } catch {
    return `${(amountMinor / 100).toFixed(2)} ${code}`;
  }
}

function digitsForWa(v: string | null | undefined) {
  const n = normalizePhone(v || '');
  if (!n) return null;
  return n.replace(/[^0-9]/g, '');
}

function lang2(v: string | null | undefined) {
  const s = String(v || '').toLowerCase();
  if (s.startsWith('en')) return 'en';
  if (s.startsWith('fr')) return 'fr';
  if (s.startsWith('de')) return 'de';
  return 'es';
}

function templateKeyForStage(stage: string | null | undefined): string {
  const st = String(stage || '').toLowerCase();
  if (st === 'checkout') return 'deal.followup.checkout';
  if (st === 'proposal') return 'deal.followup.proposal';
  if (st === 'qualified') return 'deal.followup.qualified';
  if (st === 'contacted') return 'deal.followup.contacted';
  return 'deal.followup.new';
}

async function renderPlaybookMessage(row: Row, channel: 'whatsapp' | 'email', source: string) {
  const key = templateKeyForStage(row.stage);
  const vars = {
    name: row.customer?.name || '',
    tour: row.tour_slug || row.title || '',
    date: '',
    people: '',
    checkout_url: '',
  };

  try {
    const res = await adminFetch('/api/admin/templates/render', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        key,
        locale: row.locale || 'es',
        channel,
        vars,
        log: { dealId: row.id, source },
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j?.body) throw new Error(j?.error || 'render failed');
    return { subject: (j.subject as string | null) || null, body: String(j.body), templateKey: key, templateVariant: (j.templateVariant as string | null) || null };
  } catch {
    return { subject: null, body: playbookText(row), templateKey: templateKeyForStage(row.stage), templateVariant: null };
  }
}

function playbookText(row: Row) {
  const l = lang2(row.locale || 'es');
  const stage = String(row.stage || '').toLowerCase();
  const name = row.customer?.name || '';
  const tour = row.tour_slug ? ` (${row.tour_slug})` : '';

  // Short, high-conversion messages. You can tweak tone later.
  if (l === 'en') {
    if (stage === 'checkout') return `Hi ${name || 'there'}! Just checking in — do you want me to resend the payment link for your booking${tour}?`;
    if (stage === 'proposal') return `Hi ${name || 'there'}! Did you get the proposal${tour}? If you want, I can share the payment link and confirm your dates.`;
    if (stage === 'qualified') return `Hi ${name || 'there'}! I can prepare a tailored proposal${tour}. What dates and how many people are you traveling with?`;
    if (stage === 'contacted') return `Hi ${name || 'there'}! Following up — are you still interested in planning your experience in Colombia?`;
    return `Hi ${name || 'there'}! Thanks for reaching out to KCE. Tell me your travel dates and the city you’d like to visit, and I’ll recommend the best options.`;
  }

  if (l === 'fr') {
    if (stage === 'checkout') return `Bonjour ${name || ''}! Petit suivi — veux-tu que je te renvoie le lien de paiement pour ta réservation${tour} ?`;
    if (stage === 'proposal') return `Bonjour ${name || ''}! As-tu bien reçu la proposition${tour} ? Je peux aussi t’envoyer le lien de paiement et confirmer les dates.`;
    if (stage === 'qualified') return `Bonjour ${name || ''}! Je peux préparer une proposition sur mesure${tour}. Quelles dates et combien de personnes ?`;
    if (stage === 'contacted') return `Bonjour ${name || ''}! Petit suivi — souhaites-tu toujours organiser ton expérience en Colombie ?`;
    return `Bonjour ${name || ''}! Merci pour ton message à KCE. Dis-moi tes dates et la ville, et je te recommande les meilleures options.`;
  }

  if (l === 'de') {
    if (stage === 'checkout') return `Hallo ${name || ''}! Kurzer Check-in — soll ich dir den Zahlungslink für deine Buchung${tour} nochmal senden?`;
    if (stage === 'proposal') return `Hallo ${name || ''}! Hast du das Angebot${tour} erhalten? Ich kann dir auch den Zahlungslink schicken und die Daten bestätigen.`;
    if (stage === 'qualified') return `Hallo ${name || ''}! Ich kann ein passendes Angebot${tour} erstellen. Welche Daten und wie viele Personen seid ihr?`;
    if (stage === 'contacted') return `Hallo ${name || ''}! Kurzes Follow-up — hast du noch Interesse an der Planung deiner Kolumbien-Erfahrung?`;
    return `Hallo ${name || ''}! Danke für deine Anfrage bei KCE. Sag mir bitte deine Reisedaten und die Stadt, dann empfehle ich dir die besten Optionen.`;
  }

  // ES default
  if (stage === 'checkout') return `Hola ${name || ''} 👋 ¿Quieres que te reenvíe el link de pago para tu reserva${tour}?`;
  if (stage === 'proposal') return `Hola ${name || ''} 👋 ¿Pudiste ver la propuesta${tour}? Si quieres, te envío el link de pago y confirmamos fechas.`;
  if (stage === 'qualified') return `Hola ${name || ''} 👋 Te armo una propuesta a medida${tour}. ¿Qué fechas tienes y cuántas personas viajan?`;
  if (stage === 'contacted') return `Hola ${name || ''} 👋 Te hago seguimiento: ¿sigues interesado/a en organizar tu experiencia en Colombia?`;
  return `Hola ${name || ''} 👋 ¡Gracias por escribir a KCE! Cuéntame tus fechas y la ciudad que quieres visitar y te recomiendo las mejores opciones.`;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function AdminSalesCockpitClient() {
  const [stage, setStage] = useState<string>('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [autopilotMsg, setAutopilotMsg] = useState<string | null>(null);
  const [autopilotBusy, setAutopilotBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [ticketsSummary, setTicketsSummary] = useState<any | null>(null);

  const fetchIt = async () => {
    setLoading(true);
    setErr(null);
    const p = new URLSearchParams();
    if (stage) p.set('stage', stage);
    p.set('limit', '80');
    const r = await adminFetch(`/api/admin/sales/cockpit?${p.toString()}`, { cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    setItems(Array.isArray(j?.items) ? (j.items as Row[]) : []);

    // Best-effort support queue summary
    try {
      const tr = await adminFetch('/api/admin/tickets/summary', { cache: 'no-store' });
      const tj = await tr.json().catch(() => null);
      if (tr.ok && tj && tj.ok) setTicketsSummary(tj);
    } catch {
      // ignore
    }

    setLoading(false);
  };

  const runAutopilot = async () => {
    setAutopilotBusy(true);
    setAutopilotMsg(null);
    setErr(null);
    try {
      const body: any = { dryRun: false };
      if (stage && stage !== 'won' && stage !== 'lost') body.stage = stage;
      const r = await adminFetch('/api/admin/sales/autopilot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setAutopilotMsg(
        `Autopilot OK: ${j?.dealsProcessed ?? 0} deals, ${j?.tasksCreated ?? 0} tareas creadas.`,
      );
      await fetchIt();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setAutopilotBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchIt().catch((e) => {
      if (cancelled) return;
      setErr(e instanceof Error ? e.message : 'Error');
      setItems([]);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const nq = (q || '').trim().toLowerCase();
    if (!nq) return items;
    return items.filter((r) => {
      const hay = `${r.title ?? ''} ${r.tour_slug ?? ''} ${r.customer?.name ?? ''} ${r.customer?.email ?? ''}`.toLowerCase();
      return hay.includes(nq);
    });
  }, [items, q]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const checkout = filtered.filter((r) => (r.stage || '').toLowerCase() === 'checkout').length;
    const proposal = filtered.filter((r) => (r.stage || '').toLowerCase() === 'proposal').length;
    const hot = filtered.filter((r) => (r.score || 0) >= 75).length;
    const waitingCustomer = filtered.filter((r) => r.waiting_on === 'customer').length;
    const overdue = filtered.reduce((acc, r) => acc + (r.overdue_tasks || 0), 0);
    return { total, checkout, proposal, hot, waitingCustomer, overdue };
  }, [filtered]);


  const commandBoard = useMemo(() => {
    const active = filtered.filter((r) => {
      const st = (r.stage || '').toLowerCase();
      return st !== 'won' && st !== 'lost';
    });
    const closeToday = active
      .filter((r) => ['proposal', 'checkout'].includes((r.stage || '').toLowerCase()))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);
    const rescueNow = active
      .filter((r) => (r.overdue_tasks || 0) > 0 || (r.contact_stale_days || 0) >= 4 || (r.waiting_days || 0) >= 3)
      .sort((a, b) => ((b.overdue_tasks || 0) + (b.contact_stale_days || 0)) - ((a.overdue_tasks || 0) + (a.contact_stale_days || 0)))
      .slice(0, 5);
    const qualifyNext = active
      .filter((r) => ['new', 'contacted', 'qualified'].includes((r.stage || '').toLowerCase()))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);
    const pipelineValueMinor = active.reduce((acc, r) => acc + (r.amount_minor || 0), 0);
    return { closeToday, rescueNow, qualifyNext, pipelineValueMinor };
  }, [filtered]);

  const stageHealth = useMemo(() => {
    const labels = ['new', 'contacted', 'qualified', 'proposal', 'checkout'];
    return labels.map((label) => {
      const bucket = filtered.filter((r) => (r.stage || '').toLowerCase() === label);
      const count = bucket.length;
      const hot = bucket.filter((r) => (r.score || 0) >= 75).length;
      const stale = bucket.filter((r) => (r.contact_stale_days || 0) >= 4 || (r.waiting_days || 0) >= 3).length;
      return { label, count, hot, stale };
    });
  }, [filtered]);

  const activeTickets = (() => {
    const c = ticketsSummary?.counts || {};
    return (c.open || 0) + (c.pending || 0) + (c.in_progress || 0);
  })();

  const salesSignals = [
    {
      label: 'Hot to close',
      value: String(commandBoard.closeToday.length),
      note: 'Deals en proposal o checkout que merecen presión inmediata.',
    },
    {
      label: 'Needs rescue',
      value: String(commandBoard.rescueNow.length),
      note: 'Casos con overdue, espera o stale que todavía pueden rescatarse.',
    },
    {
      label: 'Pipeline visible',
      value: fmtMoneyMinor(commandBoard.pipelineValueMinor, filtered[0]?.currency || 'EUR'),
      note: 'Valor aproximado del pipeline activo bajo los filtros actuales.',
    },
    {
      label: 'Support pressure',
      value: `${activeTickets} active`,
      note: `SLA breach ${ticketsSummary?.sla?.breached ?? 0} · at risk ${ticketsSummary?.sla?.at_risk ?? 0}.`,
    },
  ];

  const founderLanes = useMemo(() => {
    const active = filtered.filter((r) => !['won', 'lost'].includes((r.stage || '').toLowerCase()));
    const sameDay = active.filter((r) => ['proposal', 'checkout'].includes((r.stage || '').toLowerCase()) || (r.overdue_tasks || 0) > 0).slice(0, 12);
    const within12h = active.filter((r) => ['qualified', 'contacted'].includes((r.stage || '').toLowerCase()) && (r.score || 0) >= 55).slice(0, 12);
    const within2h = active.filter((r) => (r.waiting_on === 'agent' && (r.waiting_days || 0) >= 1) || ((r.contact_stale_days || 0) >= 2 && ['checkout', 'proposal'].includes((r.stage || '').toLowerCase()))).slice(0, 12);
    const operator = active.filter((r) => !r.customer?.email && !r.customer?.whatsapp || !r.next_task).slice(0, 12);
    return { sameDay, within12h, within2h, operator };
  }, [filtered]);

  const salesActions = [
    { href: '/admin/deals', label: 'Deals', tone: 'primary' as const },
    { href: '/admin/revenue', label: 'Revenue' },
    { href: '/admin/outbound', label: 'Outbound' },
    { href: '/admin/templates', label: 'Templates' },
  ];

  const founderControlTower = useMemo(() => {
    const buckets = [
      {
        key: 'sameDay',
        title: 'Mismo día',
        subtitle: 'Close pressure',
        href: '/admin/deals',
        note: 'Proposal / checkout o tareas vencidas con efecto directo en revenue.',
        items: founderLanes.sameDay,
      },
      {
        key: 'within12h',
        title: '≤12h',
        subtitle: 'Premium follow-up',
        href: '/admin/tasks',
        note: 'Planes personalizados y leads con intención suficiente para seguimiento serio.',
        items: founderLanes.within12h,
      },
      {
        key: 'within2h',
        title: '≤2h',
        subtitle: 'Continuity risk',
        href: '/admin/tickets',
        note: 'Casos calientes esperando mano humana o continuidad post-compra.',
        items: founderLanes.within2h,
      },
      {
        key: 'operator',
        title: 'Operador',
        subtitle: 'System hygiene',
        href: '/admin/leads',
        note: 'Registros sin contacto suficiente o sin siguiente tarea clara.',
        items: founderLanes.operator,
      },
    ] as const;

    return buckets.map((bucket) => ({
      ...bucket,
      top: bucket.items.slice(0, 3).map((row) => ({
        id: row.id,
        name: row.customer?.name || row.title || row.id.slice(0, 8),
        stage: row.stage || 'n/a',
        amount: fmtMoneyMinor(row.amount_minor, row.currency),
        nextAction: row.next_action || 'follow-up',
        score: row.score || 0,
      })),
    }));
  }, [founderLanes]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <AdminOperatorWorkbench
        eyebrow="sales workbench"
        title="Focus the deals that deserve pressure now"
        description="Use this cockpit as an action desk, not a wall of cards: close what can move cash, rescue what is cooling down and protect the premium handoff after payment."
        actions={salesActions}
        signals={salesSignals}
      />

      <section className="grid gap-3 xl:grid-cols-4">
        {[
          { title: 'Mismo día', value: founderLanes.sameDay.length, copy: 'Proposal / checkout o tasks vencidas que pueden mover caja hoy.', href: '/admin/deals' },
          { title: '≤12h', value: founderLanes.within12h.length, copy: 'Planes, contacto premium y deals que sí merecen seguimiento antes de enfriarse.', href: '/admin/tasks' },
          { title: '≤2h', value: founderLanes.within2h.length, copy: 'Casos calientes esperando al operador o con riesgo real de perder continuidad.', href: '/admin/tickets' },
          { title: 'Operador', value: founderLanes.operator.length, copy: 'Registros sin contacto suficiente o sin siguiente tarea clara dentro del sistema.', href: '/admin/leads' },
        ].map((lane) => (
          <a
            key={lane.title}
            href={lane.href}
            className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop dark:border-white/10 dark:bg-black/30"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-text)]/50">Founder response lane</div>
            <h2 className="mt-2 font-heading text-xl text-brand-blue">{lane.title}</h2>
            <div className="mt-2 text-3xl font-semibold text-[color:var(--color-text)]">{lane.value}</div>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">{lane.copy}</p>
          </a>
        ))}
      </section>

      <section className="rounded-3xl border border-black/10 bg-[color:var(--color-surface)] p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-text)]/55">Founder control tower</div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--color-text)]">Qué carril mirar primero y qué caso mover ya</h2>
            <p className="mt-1 max-w-3xl text-sm text-[color:var(--color-text)]/72">No todos los registros merecen la misma energía. Esta lectura te da las 3 piezas más visibles por carril para decidir presión, rescate o higiene operativa.</p>
          </div>
          <Link href="/admin/deals" className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-black/5">
            Abrir deals priorizados
          </Link>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {founderControlTower.map((lane) => (
            <article key={lane.key} className="rounded-[1.4rem] border border-black/10 bg-black/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-text)]/52">{lane.subtitle}</div>
                  <h3 className="mt-1 text-lg font-semibold text-brand-blue">{lane.title}</h3>
                </div>
                <Link href={lane.href} className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1 text-[11px] font-medium text-[color:var(--color-text)]/70 transition hover:bg-black/5">
                  Abrir carril
                </Link>
              </div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">{lane.note}</p>

              <div className="mt-4 space-y-2">
                {lane.top.length ? lane.top.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[color:var(--color-text)]">{entry.name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[color:var(--color-text)]/58">
                          <span className="rounded-full border border-black/10 px-2 py-0.5">{entry.stage}</span>
                          <span>{entry.amount}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-[color:var(--color-text)]">{entry.score}</div>
                        <div className="text-[10px] uppercase tracking-wide text-[color:var(--color-text)]/55">score</div>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-[color:var(--color-text)]/62">Siguiente paso: {entry.nextAction}</div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-black/10 bg-[color:var(--color-surface)] px-4 py-4 text-sm text-[color:var(--color-text)]/58">Nada visible en este carril bajo los filtros actuales.</div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-[color:var(--color-surface)] p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-text)]/55">Premium continuity matrix</div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--color-text)]">Qué revisar cuando el caso ya toca ventas, soporte o booking</h2>
            <p className="mt-1 max-w-3xl text-sm text-[color:var(--color-text)]/72">Usa esta matriz para que el founder no trate todos los casos como pipeline puro. Algunos ya son continuidad, algunos ya son recovery y otros solo necesitan higiene operativa.</p>
          </div>
          <Link href="/admin/bookings" className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-black/5">
            Abrir bookings / support
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['Sales pressure', 'Proposal, checkout y follow-up con owner claro. Si mueve caja, founder lane primero.', '/admin/deals'],
            ['Support active', 'Cuando ya hay ticket o handoff sensible, protege confianza antes de abrir más discovery.', '/admin/tickets'],
            ['Checkout visible', 'Revenue y booking deben contar la misma historia antes de decir que el caso está resuelto.', '/admin/revenue'],
            ['System hygiene', 'Si falta contacto, task o contexto, deja el caso listo para el operador en vez de empujarlo a ciegas.', '/admin/leads'],
          ].map(([title, body, href]) => (
            <Link key={String(title)} href={String(href)} className="rounded-2xl border border-black/10 bg-black/5 p-4 transition hover:bg-black/10">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{body}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="rounded-2xl border border-black/10 bg-black/5 p-5">
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">Visibles</div>
          <div className="mt-1 text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">Deals calientes</div>
          <div className="mt-1 text-2xl font-semibold">{stats.hot}</div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">En checkout</div>
          <div className="mt-1 text-2xl font-semibold">{stats.checkout}</div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">Esperando cliente</div>
          <div className="mt-1 text-2xl font-semibold">{stats.waitingCustomer}</div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">Tareas vencidas</div>
          <div className="mt-1 text-2xl font-semibold">{stats.overdue}</div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">Tickets activos</div>
          <div className="mt-1 text-2xl font-semibold">{activeTickets}</div>
          <div className="mt-1 text-[11px] text-[color:var(--color-text)]/60">open + pending + in_progress</div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">SLA support</div>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-2xl font-semibold">{ticketsSummary?.sla?.breached ?? 0}</span>
            <span className="text-[11px] text-[color:var(--color-text)]/60">breach</span>
          </div>
          <div className="mt-1 text-[11px] text-[color:var(--color-text)]/60">
            {ticketsSummary?.sla?.at_risk ?? 0} at risk · {ticketsSummary?.sla?.warn_hours ?? 24}h/{ticketsSummary?.sla?.breach_hours ?? 48}h
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <button type="button" onClick={() => setStage('')} className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5">Todos</button>
        <button type="button" onClick={() => setStage('qualified')} className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5">Priorizar qualified</button>
        <button type="button" onClick={() => setStage('proposal')} className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5">Seguir proposal</button>
        <button type="button" onClick={() => setStage('checkout')} className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5">Empujar checkout</button>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="text-xs font-semibold text-[color:var(--color-text)]/70">Etapa</div>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="h-9 rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-2 text-sm"
          >
            <option value="">Activos (no won/lost)</option>
            <option value="new">new</option>
            <option value="contacted">contacted</option>
            <option value="qualified">qualified</option>
            <option value="proposal">proposal</option>
            <option value="checkout">checkout</option>
            <option value="won">won</option>
            <option value="lost">lost</option>
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar (cliente, tour, título)…"
            className="h-9 w-full rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-3 text-sm sm:w-80"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => runAutopilot().catch(() => {})}
            disabled={autopilotBusy}
            className="h-9 rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-3 text-sm hover:bg-black/5 disabled:opacity-60"
            title="Crea tareas faltantes por etapa (SLA/follow-up) para los deals visibles"
          >
            {autopilotBusy ? 'Autopilot…' : 'Autopilot'}
          </button>

          <button
            type="button"
            onClick={() => fetchIt().catch((e) => setErr(e instanceof Error ? e.message : 'Error'))}
            className="h-9 rounded-xl border border-black/10 bg-black/5 px-3 text-sm hover:bg-black/10"
          >
            Refrescar
          </button>
        </div>
      </div>

      {err ? (
        <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-800 dark:text-rose-200">
          {err}
        </div>
      ) : null}

      {autopilotMsg ? (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
          {autopilotMsg}
        </div>
      ) : null}

      {toast ? (
        <div className="mt-3 rounded-xl border border-black/10 bg-[color:var(--color-surface)] p-3 text-sm">
          {toast}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.35fr,1fr]">
        <div className="rounded-3xl border border-black/10 bg-[color:var(--color-surface)] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-text)]/55">Commercial command board</div>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--color-text)]">Qué empujar hoy para mover revenue</h2>
              <p className="mt-1 max-w-2xl text-sm text-[color:var(--color-text)]/72">Usa esta lectura como desk diario: cerrar lo caliente, rescatar lo que se enfría y calificar lo que todavía tiene intención utilizable.</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-text)]/55">Pipeline value</div>
              <div className="mt-1 text-2xl font-semibold">{fmtMoneyMinor(commandBoard.pipelineValueMinor, filtered[0]?.currency || 'EUR')}</div>
              <div className="mt-1 text-[11px] text-[color:var(--color-text)]/60">Valor visible en activos filtrados</div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            {[
              { key: 'close', title: 'Cerrar hoy', tone: 'bg-emerald-500/10', items: commandBoard.closeToday, helper: 'Proposal + checkout con mayor score.' },
              { key: 'rescue', title: 'Rescatar ahora', tone: 'bg-amber-500/10', items: commandBoard.rescueNow, helper: 'Overdue, stale o esperando demasiado.' },
              { key: 'qualify', title: 'Calificar siguiente', tone: 'bg-sky-500/10', items: commandBoard.qualifyNext, helper: 'New / contacted / qualified que todavía pueden subir.' },
            ].map((panel) => (
              <div key={panel.key} className={`rounded-[1.25rem] border border-black/10 p-4 ${panel.tone}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[color:var(--color-text)]">{panel.title}</div>
                  <div className="rounded-full border border-black/10 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-[color:var(--color-text)]/65">{panel.items.length}</div>
                </div>
                <p className="mt-1 text-xs text-[color:var(--color-text)]/65">{panel.helper}</p>
                <div className="mt-3 space-y-2">
                  {panel.items.length ? panel.items.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-black/10 bg-white/80 px-3 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-[color:var(--color-text)]">{r.customer?.name || r.title || r.id.slice(0, 8)}</div>
                          <div className="truncate text-xs text-[color:var(--color-text)]/60">{r.tour_slug || 'tour pendiente'} · {r.stage || 'stage n/a'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-[color:var(--color-text)]">{r.score}</div>
                          <div className="text-[11px] text-[color:var(--color-text)]/55">score</div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-[color:var(--color-text)]/58">
                        <span>{fmtMoneyMinor(r.amount_minor, r.currency)}</span>
                        <span>{r.next_action || 'follow-up'}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-black/10 bg-white/70 px-3 py-4 text-sm text-[color:var(--color-text)]/60">Nada prioritario en este bucket.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-[color:var(--color-surface)] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-text)]/55">Stage health</div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--color-text)]">Dónde se enfría el pipeline</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text)]/72">Lee cada etapa como semáforo: volumen visible, deals calientes y señales de enfriamiento.</p>

          <div className="mt-4 space-y-3">
            {stageHealth.map((entry) => (
              <div key={entry.label} className="rounded-[1.15rem] border border-black/10 bg-black/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold capitalize text-[color:var(--color-text)]">{entry.label}</div>
                  <div className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-2.5 py-1 text-[11px] text-[color:var(--color-text)]/62">{entry.count} visibles</div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-2 py-2">
                    <div className="text-lg font-semibold">{entry.count}</div>
                    <div className="text-[10px] uppercase tracking-wide text-[color:var(--color-text)]/55">volumen</div>
                  </div>
                  <div className="rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-2 py-2">
                    <div className="text-lg font-semibold">{entry.hot}</div>
                    <div className="text-[10px] uppercase tracking-wide text-[color:var(--color-text)]/55">hot</div>
                  </div>
                  <div className="rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-2 py-2">
                    <div className="text-lg font-semibold">{entry.stale}</div>
                    <div className="text-[10px] uppercase tracking-wide text-[color:var(--color-text)]/55">stale</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      <section className="mt-4 rounded-3xl border border-black/10 bg-[color:var(--color-surface)] p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-text)]/55">Premium continuity matrix</div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--color-text)]">Dónde se puede romper la promesa si nadie toma ownership</h2>
            <p className="mt-1 max-w-3xl text-sm text-[color:var(--color-text)]/72">Lee ventas, soporte y booking como la misma experiencia. El valor no está solo en cerrar: está en que el handoff llegue con contexto, owner y siguiente paso.</p>
          </div>
          <Link href="/admin/tickets" className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-black/5">Abrir soporte / continuidad</Link>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-4">
          {[
            ['Sales pressure', String(commandBoard.closeToday.length), 'Deals que todavía merecen presión founder.', '/admin/deals'],
            ['Support active', String(activeTickets), 'Continuidad post-compra y casos con SLA visible.', '/admin/tickets'],
            ['Checkout visible', String(stats.checkout), 'Checkout abierto que no debe quedarse sin siguiente paso.', '/admin/revenue'],
            ['System hygiene', String(founderLanes.operator.length), 'Registros sin contacto suficiente o sin tarea clara.', '/admin/leads'],
          ].map(([title, value, body, href]) => (
            <Link key={String(title)} href={String(href)} className="rounded-2xl border border-black/10 bg-black/5 p-4 transition hover:bg-black/10">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/50">{title}</div>
              <div className="mt-2 text-3xl font-semibold text-[color:var(--color-text)]">{value}</div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{body}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-4 overflow-auto rounded-xl border border-black/10 bg-[color:var(--color-surface)]">
        <table className="w-full min-w-[1220px] text-sm">
          <thead className="bg-black/5 text-xs text-[color:var(--color-text)]/70">
            <tr>
              <th className="px-3 py-2 text-left">Deal</th>
              <th className="px-3 py-2 text-left">Etapa</th>
              <th className="px-3 py-2 text-left">Cliente</th>
              <th className="px-3 py-2 text-left">Tour</th>
              <th className="px-3 py-2 text-right">Edad</th>
              <th className="px-3 py-2 text-right">Stale</th>
              <th className="px-3 py-2 text-right">Contacto</th>
              <th className="px-3 py-2 text-right">Tareas</th>
              <th className="px-3 py-2 text-right">Score</th>
              <th className="px-3 py-2 text-left">Riesgo</th>
              <th className="px-3 py-2 text-left">Siguiente</th>
              <th className="px-3 py-2 text-left">Playbook</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4 text-[color:var(--color-text)]/70" colSpan={12}>
                  Cargando…
                </td>
              </tr>
            ) : filtered.length ? (
              filtered.map((r) => {
                const overdue = r.overdue_tasks > 0;
                const waDigits = digitsForWa(r.customer?.whatsapp || null);
                const email = r.customer?.email || null;
                const fallbackMsg = playbookText(r);
                const msg = fallbackMsg;

                const openWa = async () => {
                  if (!waDigits) return;
                  const rendered = await renderPlaybookMessage(r, 'whatsapp', 'sales_cockpit:whatsapp');
                  try {
                    await adminFetch('/api/admin/outbound', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({
                        channel: 'whatsapp',
                        provider: 'manual',
                        status: 'queued',
                        toPhone: waDigits,
                        subject: null,
                        body: rendered.body || fallbackMsg,
                        dealId: r.id,
                        templateKey: rendered.templateKey || null,
                        templateVariant: rendered.templateVariant || null,
                        metadata: { source: 'sales_cockpit:whatsapp' },
                      }),
                    });
                  } catch {
                    // ignore (no bloquear acción principal)
                  }
                  const url = `https://wa.me/${waDigits}?text=${encodeURIComponent(rendered.body || fallbackMsg)}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                };

                const openEmail = async () => {
                  if (!email) return;
                  const rendered = await renderPlaybookMessage(r, 'email', 'sales_cockpit:email');
                  try {
                    await adminFetch('/api/admin/outbound', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({
                        channel: 'email',
                        provider: 'manual',
                        status: 'queued',
                        toEmail: email,
                        subject: rendered.subject || `KCE — Seguimiento ${r.tour_slug ? `(${r.tour_slug})` : ''}`.trim(),
                        body: rendered.body || fallbackMsg,
                        dealId: r.id,
                        templateKey: rendered.templateKey || null,
                        templateVariant: rendered.templateVariant || null,
                        metadata: { source: 'sales_cockpit:email' },
                      }),
                    });
                  } catch {
                    // ignore
                  }
                  const subject = (rendered.subject || `KCE — Seguimiento ${r.tour_slug ? `(${r.tour_slug})` : ''}`.trim());
                  const body = rendered.body || fallbackMsg;
                  const url = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  window.location.href = url;
                };

                const onCopy = async () => {
                  const rendered = await renderPlaybookMessage(r, 'whatsapp', 'sales_cockpit:copy');
                  const ok = await copyToClipboard(rendered.body || fallbackMsg);
                  setToast(ok ? 'Copiado ✅' : 'No se pudo copiar');
                };

                return (
                  <tr key={r.id} className={overdue ? 'bg-rose-500/5' : ''}>
                    <td className="px-3 py-2">
                      <Link href={`/admin/deals?stage=&q=${encodeURIComponent(r.id)}`} className="underline">
                        {r.id.slice(0, 8)}
                      </Link>
                      <div className="text-xs text-[color:var(--color-text)]/60">{r.title ?? '—'}</div>
                    </td>

                    <td className="px-3 py-2">
                      <span className={badgeStage(String(r.stage || ''))}>{r.stage || '—'}</span>
                      {r.waiting_on ? (
                        <div className="mt-1 text-[11px] text-[color:var(--color-text)]/60">
                          {r.waiting_on === 'agent' ? 'cliente espera' : 'espera cliente'}
                          {typeof r.waiting_days === 'number' ? ` • ${r.waiting_days}d` : ''}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-3 py-2">
                      <div className="font-medium">{r.customer?.name ?? '—'}</div>
                      <div className="text-xs text-[color:var(--color-text)]/60">{r.customer?.email ?? '—'}</div>
                    </td>

                    <td className="px-3 py-2">
                      <div className="font-medium">{r.tour_slug ?? '—'}</div>
                    </td>

                    <td className="px-3 py-2 text-right">{r.age_days}d</td>
                    <td className="px-3 py-2 text-right">{r.stale_days}d</td>

                    <td className="px-3 py-2 text-right">
                      {r.contact_stale_days === null ? '—' : `${r.contact_stale_days}d`}
                    </td>

                    <td className="px-3 py-2 text-right">
                      <span className={overdue ? 'font-semibold text-rose-700 dark:text-rose-200' : ''}>
                        {r.open_tasks}
                      </span>
                      {overdue ? (
                        <span className="ml-2 rounded-full bg-rose-500/15 px-2 py-0.5 text-xs text-rose-800 dark:text-rose-200">
                          {r.overdue_tasks} vencidas
                        </span>
                      ) : null}
                    </td>

                    <td className="px-3 py-2 text-right">
                      <span className={r.score >= 70 ? 'font-semibold' : 'text-[color:var(--color-text)]/70'}>
                        {r.score}
                      </span>
                    </td>

                    <td className="px-3 py-2">
                      {r.risk?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {r.risk.slice(0, 3).map((x) => (
                            <span
                              key={x}
                              className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-800 dark:text-rose-200"
                            >
                              {x}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-[color:var(--color-text)]/50">—</span>
                      )}
                    </td>

                    <td className="px-3 py-2">
                      <div className="text-xs text-[color:var(--color-text)]/70">{r.next_task?.title ?? '—'}</div>
                      <div className="text-[11px] text-[color:var(--color-text)]/50">
                        {fmtDue(r.next_task?.due_at ?? null)}
                      </div>
                      <div className="mt-1 text-[11px] text-[color:var(--color-text)]/60">{r.next_action}</div>
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onCopy().catch(() => {})}
                          className="h-8 rounded-lg border border-black/10 bg-[color:var(--color-surface)] px-2 text-xs hover:bg-black/5"
                          title="Copiar mensaje"
                        >
                          Copiar
                        </button>
                        <button
                          type="button"
                          onClick={openWa}
                          disabled={!waDigits}
                          className="h-8 rounded-lg border border-black/10 bg-[color:var(--color-surface)] px-2 text-xs hover:bg-black/5 disabled:opacity-50"
                          title={waDigits ? 'Abrir WhatsApp' : 'Sin WhatsApp'}
                        >
                          WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={openEmail}
                          disabled={!email}
                          className="h-8 rounded-lg border border-black/10 bg-[color:var(--color-surface)] px-2 text-xs hover:bg-black/5 disabled:opacity-50"
                          title={email ? 'Abrir Email' : 'Sin Email'}
                        >
                          Email
                        </button>
                      </div>
                      <div className="mt-2 text-[11px] text-[color:var(--color-text)]/60 line-clamp-2">
                        {msg}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-3 py-4 text-[color:var(--color-text)]/70" colSpan={12}>
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-[color:var(--color-text)]/60">
        Tip: prioriza filas con “cliente esperando”, “tareas vencidas”, y score ≥ 70.
      </div>
          </div>
    </div>
  );
}

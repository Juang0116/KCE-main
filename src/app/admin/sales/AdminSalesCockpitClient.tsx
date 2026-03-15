'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { normalizePhone } from '@/lib/normalize';
import { Bot, Briefcase, Copy, RefreshCw } from 'lucide-react';

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
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest';
  if (v === 'new') return `${base} border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/70`;
  if (v === 'contacted') return `${base} border border-teal-500/20 bg-teal-500/10 text-teal-700`;
  if (v === 'qualified') return `${base} border border-sky-500/20 bg-sky-500/10 text-sky-700`;
  if (v === 'proposal') return `${base} border border-amber-500/20 bg-amber-500/10 text-amber-700`;
  if (v === 'checkout') return `${base} border border-brand-blue/20 bg-brand-blue/10 text-brand-blue`;
  if (v === 'won') return `${base} border border-emerald-500/20 bg-emerald-500/10 text-emerald-700`;
  if (v === 'lost') return `${base} border border-rose-500/20 bg-rose-500/10 text-rose-700`;
  return `${base} border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/70`;
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

    try {
      const tr = await adminFetch('/api/admin/tickets/summary', { cache: 'no-store' });
      const tj = await tr.json().catch(() => null);
      if (tr.ok && tj && tj.ok) setTicketsSummary(tj);
    } catch { }

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
    return () => { cancelled = true; };
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
    { label: 'Hot to close', value: String(commandBoard.closeToday.length), note: 'Deals en proposal o checkout que merecen presión.' },
    { label: 'Needs rescue', value: String(commandBoard.rescueNow.length), note: 'Casos con overdue o stale.' },
    { label: 'Pipeline visible', value: fmtMoneyMinor(commandBoard.pipelineValueMinor, filtered[0]?.currency || 'EUR'), note: 'Valor del pipeline activo.' },
    { label: 'Support pressure', value: `${activeTickets} active`, note: `SLA breach ${ticketsSummary?.sla?.breached ?? 0}.` },
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
      { key: 'sameDay', title: 'Mismo día', subtitle: 'Close pressure', href: '/admin/deals', note: 'Proposal / checkout o tareas vencidas.', items: founderLanes.sameDay },
      { key: 'within12h', title: '≤12h', subtitle: 'Premium follow-up', href: '/admin/tasks', note: 'Planes personalizados e intención media-alta.', items: founderLanes.within12h },
      { key: 'within2h', title: '≤2h', subtitle: 'Continuity risk', href: '/admin/tickets', note: 'Casos calientes esperando atención humana.', items: founderLanes.within2h },
      { key: 'operator', title: 'Operador', subtitle: 'System hygiene', href: '/admin/leads', note: 'Registros sin contacto o tarea clara.', items: founderLanes.operator },
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
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-20">
      <AdminOperatorWorkbench
        eyebrow="sales workbench"
        title="Focus the deals that deserve pressure now"
        description="Use this cockpit as an action desk, not a wall of cards: close what can move cash, rescue what is cooling down and protect the premium handoff after payment."
        actions={salesActions}
        signals={salesSignals}
      />

      {/* 1. FOUNDER LANES */}
      <section className="grid gap-5 xl:grid-cols-4">
        {[
          { title: 'Mismo día', value: founderLanes.sameDay.length, copy: 'Proposal / checkout o tasks vencidas que pueden mover caja hoy.', href: '/admin/deals' },
          { title: '≤12h', value: founderLanes.within12h.length, copy: 'Planes, contacto premium y deals que sí merecen seguimiento.', href: '/admin/tasks' },
          { title: '≤2h', value: founderLanes.within2h.length, copy: 'Casos calientes esperando al operador o con riesgo de perderse.', href: '/admin/tickets' },
          { title: 'Operador', value: founderLanes.operator.length, copy: 'Registros sin contacto suficiente o sin siguiente tarea clara.', href: '/admin/leads' },
        ].map((lane) => (
          <Link key={lane.title} href={lane.href} className="group rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-pop hover:border-brand-blue/30">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 group-hover:text-brand-blue transition-colors">Founder response lane</div>
            <h2 className="mt-3 font-heading text-2xl text-brand-blue">{lane.title}</h2>
            <div className="mt-2 text-4xl font-semibold text-[var(--color-text)]">{lane.value}</div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text)]/60 font-light">{lane.copy}</p>
          </Link>
        ))}
      </section>

      {/* 2. FOUNDER CONTROL TOWER */}
      <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-10 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">Founder control tower</div>
            <h2 className="mt-2 font-heading text-3xl tracking-tight text-[var(--color-text)]">Qué carril mirar primero y qué caso mover ya</h2>
            <p className="mt-2 max-w-3xl text-base text-[var(--color-text)]/60 font-light">No todos los registros merecen la misma energía. Esta lectura te da las 3 piezas más visibles por carril para decidir presión, rescate o higiene operativa.</p>
          </div>
          <Link href="/admin/deals" className="rounded-full bg-brand-dark px-6 py-3 text-sm font-bold text-brand-yellow transition hover:scale-105 shadow-md">
            Abrir deals priorizados
          </Link>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          {founderControlTower.map((lane) => (
            <article key={lane.key} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 transition-colors hover:border-brand-blue/30">
              <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4 mb-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">{lane.subtitle}</div>
                  <h3 className="mt-1 font-heading text-2xl text-[var(--color-text)]">{lane.title}</h3>
                </div>
                <Link href={lane.href} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/70 transition hover:bg-[var(--color-border)]">
                  Abrir carril
                </Link>
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-text)]/60 font-light mb-5">{lane.note}</p>

              <div className="space-y-3">
                {lane.top.length ? lane.top.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-[var(--color-text)]">{entry.name}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text)]/60">
                          <span className={badgeStage(entry.stage)}>{entry.stage}</span>
                          <span className="font-semibold text-[var(--color-text)]">{entry.amount}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xl font-heading text-brand-blue">{entry.score}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mt-1">score</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-[var(--color-text)]/50 border-t border-[var(--color-border)] pt-2">Siguiente paso: <span className="font-medium text-[var(--color-text)]/80">{entry.nextAction}</span></div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-transparent px-4 py-6 text-center text-sm font-medium text-[var(--color-text)]/40">Nada visible en este carril bajo los filtros actuales.</div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. CONTINUITY MATRIX */}
      <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-10 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">Premium continuity matrix</div>
            <h2 className="mt-2 font-heading text-3xl tracking-tight text-[var(--color-text)]">Dónde se puede romper la promesa</h2>
            <p className="mt-2 max-w-3xl text-base text-[var(--color-text)]/60 font-light">Lee ventas, soporte y booking como la misma experiencia. El valor no está solo en cerrar, sino en que el handoff llegue con contexto.</p>
          </div>
          <Link href="/admin/tickets" className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-6 py-3 text-sm font-bold transition hover:bg-[var(--color-border)]">
            Abrir soporte / continuidad
          </Link>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-4">
          {[
            ['Sales pressure', String(commandBoard.closeToday.length), 'Deals que todavía merecen presión founder.', '/admin/deals'],
            ['Support active', String(activeTickets), 'Continuidad post-compra y casos con SLA visible.', '/admin/tickets'],
            ['Checkout visible', String(stats.checkout), 'Checkout abierto que no debe quedarse sin siguiente paso.', '/admin/revenue'],
            ['System hygiene', String(founderLanes.operator.length), 'Registros sin contacto suficiente o sin tarea clara.', '/admin/leads'],
          ].map(([title, value, body, href]) => (
            <Link key={String(title)} href={String(href)} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 transition-all hover:bg-[var(--color-border)] hover:scale-105">
              <div className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">{title}</div>
              <div className="mt-3 font-heading text-4xl text-[var(--color-text)]">{value}</div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text)]/60 font-light">{body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. TABLA PRINCIPAL Y ESTADÍSTICAS */}
      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        
        {/* Mininards de Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Visibles</div>
            <div className="mt-1 font-heading text-2xl text-brand-blue">{stats.total}</div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Deals calientes</div>
            <div className="mt-1 font-heading text-2xl text-brand-blue">{stats.hot}</div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">En checkout</div>
            <div className="mt-1 font-heading text-2xl text-brand-blue">{stats.checkout}</div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Esperando cliente</div>
            <div className="mt-1 font-heading text-2xl text-brand-blue">{stats.waitingCustomer}</div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Tareas vencidas</div>
            <div className="mt-1 font-heading text-2xl text-rose-600">{stats.overdue}</div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Tickets activos</div>
            <div className="mt-1 font-heading text-2xl text-amber-600">{activeTickets}</div>
            <div className="mt-1 text-[9px] uppercase tracking-widest text-[var(--color-text)]/40">open + pending</div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">SLA support</div>
            <div className="mt-1 flex items-end gap-2">
              <span className="font-heading text-2xl text-rose-600">{ticketsSummary?.sla?.breached ?? 0}</span>
              <span className="text-[10px] uppercase font-bold text-rose-600/70 mb-1">breach</span>
            </div>
            <div className="mt-1 text-[9px] uppercase tracking-widest text-[var(--color-text)]/40">
              {ticketsSummary?.sla?.at_risk ?? 0} at risk
            </div>
          </div>
        </div>

        {/* Action Bar (Filters) */}
        <div className="mb-6 border-b border-[var(--color-border)] pb-6">
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <button type="button" onClick={() => setStage('')} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 font-bold uppercase tracking-widest transition hover:border-brand-blue/30 text-[10px]">Todos</button>
            <button type="button" onClick={() => setStage('qualified')} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 font-bold uppercase tracking-widest transition hover:border-brand-blue/30 text-[10px]">Priorizar qualified</button>
            <button type="button" onClick={() => setStage('proposal')} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 font-bold uppercase tracking-widest transition hover:border-brand-blue/30 text-[10px]">Seguir proposal</button>
            <button type="button" onClick={() => setStage('checkout')} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 font-bold uppercase tracking-widest transition hover:border-brand-blue/30 text-[10px]">Empujar checkout</button>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full md:w-auto">
              <select value={stage} onChange={(e) => setStage(e.target.value)} className="h-12 w-full sm:w-48 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 text-sm font-semibold outline-none appearance-none">
                <option value="">Activos (no won/lost)</option>
                <option value="new">New</option><option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option><option value="proposal">Proposal</option>
                <option value="checkout">Checkout</option><option value="won">Won</option><option value="lost">Lost</option>
              </select>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar (cliente, tour, título)…" className="h-12 w-full sm:w-80 rounded-full border border-[var(--color-border)] bg-transparent px-5 text-sm outline-none focus:border-brand-blue transition-colors" />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => runAutopilot().catch(() => {})} disabled={autopilotBusy} className="h-12 flex items-center gap-2 rounded-full bg-brand-dark px-6 text-[10px] font-bold uppercase tracking-widest text-brand-yellow hover:scale-105 transition-all disabled:opacity-50">
                <Bot className="h-4 w-4"/> {autopilotBusy ? 'Autopilot...' : 'Autopilot'}
              </button>
              <button type="button" onClick={() => fetchIt().catch((e) => setErr(e instanceof Error ? e.message : 'Error'))} className="h-12 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-6 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-border)]">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refrescar
              </button>
            </div>
          </div>
        </div>

        {err && <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}
        {autopilotMsg && <div className="mb-4 rounded-2xl border border-brand-yellow/30 bg-brand-yellow/10 p-4 text-sm font-medium text-brand-dark">{autopilotMsg}</div>}
        {toast && <div className="fixed bottom-6 right-6 z-50 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-xl animate-fade-in">{toast}</div>}

        {/* La Tabla Premium */}
        <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)]">
          <table className="w-full min-w-[1220px] text-sm text-left">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-5 py-4">Deal</th>
                <th className="px-5 py-4">Etapa</th>
                <th className="px-5 py-4">Cliente</th>
                <th className="px-5 py-4">Tour</th>
                <th className="px-5 py-4 text-right">Edad</th>
                <th className="px-5 py-4 text-right">Stale</th>
                <th className="px-5 py-4 text-right">Contacto</th>
                <th className="px-5 py-4 text-right">Tareas</th>
                <th className="px-5 py-4 text-right">Score</th>
                <th className="px-5 py-4">Riesgo</th>
                <th className="px-5 py-4">Siguiente</th>
                <th className="px-5 py-4 text-right">Playbook</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {loading ? (
                <tr><td className="px-5 py-12 text-center text-[var(--color-text)]/40 font-medium" colSpan={12}>Cargando datos del Cockpit...</td></tr>
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
                        method: 'POST', headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ channel: 'whatsapp', provider: 'manual', status: 'queued', toPhone: waDigits, subject: null, body: rendered.body || fallbackMsg, dealId: r.id, templateKey: rendered.templateKey || null, templateVariant: rendered.templateVariant || null, metadata: { source: 'sales_cockpit:whatsapp' } }),
                      });
                    } catch {}
                    const url = `https://wa.me/${waDigits}?text=${encodeURIComponent(rendered.body || fallbackMsg)}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  };

                  const openEmail = async () => {
                    if (!email) return;
                    const rendered = await renderPlaybookMessage(r, 'email', 'sales_cockpit:email');
                    try {
                      await adminFetch('/api/admin/outbound', {
                        method: 'POST', headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ channel: 'email', provider: 'manual', status: 'queued', toEmail: email, subject: rendered.subject || `KCE — Seguimiento ${r.tour_slug ? `(${r.tour_slug})` : ''}`.trim(), body: rendered.body || fallbackMsg, dealId: r.id, templateKey: rendered.templateKey || null, templateVariant: rendered.templateVariant || null, metadata: { source: 'sales_cockpit:email' } }),
                      });
                    } catch {}
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
                    <tr key={r.id} className={`transition-colors hover:bg-[var(--color-surface-2)]/50 ${overdue ? 'bg-rose-500/5 hover:bg-rose-500/10' : ''}`}>
                      <td className="px-5 py-4 align-top">
                        <Link href={`/admin/deals?stage=&q=${encodeURIComponent(r.id)}`} className="font-semibold text-brand-blue hover:underline">
                          {r.id.slice(0, 8)}
                        </Link>
                        <div className="mt-1 text-xs text-[var(--color-text)]/60 line-clamp-1 max-w-[120px]">{r.title ?? '—'}</div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span className={badgeStage(String(r.stage || ''))}>{r.stage || '—'}</span>
                        {r.waiting_on ? (
                          <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">
                            {r.waiting_on === 'agent' ? 'cliente espera' : 'espera cliente'}
                            {typeof r.waiting_days === 'number' ? ` • ${r.waiting_days}d` : ''}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="font-medium text-[var(--color-text)]">{r.customer?.name ?? '—'}</div>
                        <div className="mt-1 text-xs text-[var(--color-text)]/60">{r.customer?.email ?? '—'}</div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="font-medium text-brand-blue">{r.tour_slug ?? '—'}</div>
                      </td>

                      <td className="px-5 py-4 align-top text-right text-[var(--color-text)]/70">{r.age_days}d</td>
                      <td className="px-5 py-4 align-top text-right text-[var(--color-text)]/70">{r.stale_days}d</td>
                      <td className="px-5 py-4 align-top text-right text-[var(--color-text)]/70">
                        {r.contact_stale_days === null ? '—' : `${r.contact_stale_days}d`}
                      </td>

                      <td className="px-5 py-4 align-top text-right">
                        <span className={overdue ? 'font-bold text-rose-600' : 'font-medium'}>
                          {r.open_tasks}
                        </span>
                        {overdue ? (
                          <div className="mt-1 inline-block rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                            {r.overdue_tasks} vencidas
                          </div>
                        ) : null}
                      </td>

                      <td className="px-5 py-4 align-top text-right">
                        <span className={`font-heading text-lg ${r.score >= 70 ? 'text-brand-blue' : 'text-[var(--color-text)]/50'}`}>
                          {r.score}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top">
                        {r.risk?.length ? (
                          <div className="flex flex-col gap-1">
                            {r.risk.slice(0, 2).map((x) => (
                              <span key={x} className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-700 w-max">
                                {x}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-text)]/30">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="text-sm font-semibold text-[var(--color-text)]/80 line-clamp-1 max-w-[150px]">{r.next_task?.title ?? '—'}</div>
                        <div className="mt-1 text-[10px] font-mono text-[var(--color-text)]/40">
                          {fmtDue(r.next_task?.due_at ?? null)}
                        </div>
                        <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-brand-blue">{r.next_action}</div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-1">
                            <button type="button" onClick={() => onCopy().catch(() => {})} className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-surface-2)] text-[var(--color-text)] transition hover:bg-[var(--color-border)]" title="Copiar">
                              <Copy className="h-3 w-3" />
                            </button>
                            <button type="button" onClick={openWa} disabled={!waDigits} className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-30" title="WhatsApp">
                              WA
                            </button>
                            <button type="button" onClick={openEmail} disabled={!email} className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-blue/30 bg-brand-blue/5 text-brand-blue transition hover:bg-brand-blue/10 disabled:opacity-30" title="Email">
                              <Briefcase className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="text-[10px] text-[var(--color-text)]/50 line-clamp-2 text-right w-32 font-light">
                            {msg}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-5 py-12 text-center text-[var(--color-text)]/40 font-medium" colSpan={12}>
                    No hay resultados para estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
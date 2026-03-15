'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { normalizePhone } from '@/lib/normalize';
import { Bot, Briefcase, Copy, RefreshCw, Filter, Search, ArrowRight, Zap, Target, DollarSign, Clock, MapPin, CheckCircle2 } from 'lucide-react';

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
  const base = 'inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border shadow-sm';
  if (v === 'new') return `${base} border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/70`;
  if (v === 'contacted') return `${base} border-teal-500/20 bg-teal-500/10 text-teal-700`;
  if (v === 'qualified') return `${base} border-sky-500/20 bg-sky-500/10 text-sky-700`;
  if (v === 'proposal') return `${base} border-amber-500/20 bg-amber-500/10 text-amber-700`;
  if (v === 'checkout') return `${base} border-brand-blue/20 bg-brand-blue/10 text-brand-blue`;
  if (v === 'won') return `${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-700`;
  if (v === 'lost') return `${base} border-rose-500/20 bg-rose-500/10 text-rose-700`;
  return `${base} border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/70`;
}

function fmtDue(v: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtMoneyMinor(amountMinor: number | null | undefined, currency: string | null | undefined) {
  if (typeof amountMinor !== 'number' || !Number.isFinite(amountMinor)) return '—';
  const code = String(currency || 'EUR').toUpperCase();
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(amountMinor / 100);
  } catch {
    return `${(amountMinor / 100).toFixed(0)} ${code}`;
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
  const vars = { name: row.customer?.name || '', tour: row.tour_slug || row.title || '', date: '', people: '', checkout_url: '' };

  try {
    const res = await adminFetch('/api/admin/templates/render', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key, locale: row.locale || 'es', channel, vars, log: { dealId: row.id, source } }),
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
  try { await navigator.clipboard.writeText(text); return true; } 
  catch {
    try {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.focus(); ta.select(); const ok = document.execCommand('copy'); document.body.removeChild(ta);
      return ok;
    } catch { return false; }
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
    setLoading(true); setErr(null);
    const p = new URLSearchParams(); if (stage) p.set('stage', stage); p.set('limit', '80');
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
    setAutopilotBusy(true); setAutopilotMsg(null); setErr(null);
    try {
      const body: any = { dryRun: false };
      if (stage && stage !== 'won' && stage !== 'lost') body.stage = stage;
      const r = await adminFetch('/api/admin/sales/autopilot', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setAutopilotMsg(`Autopilot OK: ${j?.dealsProcessed ?? 0} deals, ${j?.tasksCreated ?? 0} tareas creadas.`);
      await fetchIt();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally { setAutopilotBusy(false); }
  };

  useEffect(() => {
    let cancelled = false;
    fetchIt().catch((e) => {
      if (cancelled) return;
      setErr(e instanceof Error ? e.message : 'Error'); setItems([]); setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
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
    const active = filtered.filter((r) => { const st = (r.stage || '').toLowerCase(); return st !== 'won' && st !== 'lost'; });
    const closeToday = active.filter((r) => ['proposal', 'checkout'].includes((r.stage || '').toLowerCase())).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);
    const rescueNow = active.filter((r) => (r.overdue_tasks || 0) > 0 || (r.contact_stale_days || 0) >= 4 || (r.waiting_days || 0) >= 3).sort((a, b) => ((b.overdue_tasks || 0) + (b.contact_stale_days || 0)) - ((a.overdue_tasks || 0) + (a.contact_stale_days || 0))).slice(0, 5);
    const qualifyNext = active.filter((r) => ['new', 'contacted', 'qualified'].includes((r.stage || '').toLowerCase())).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);
    const pipelineValueMinor = active.reduce((acc, r) => acc + (r.amount_minor || 0), 0);
    return { closeToday, rescueNow, qualifyNext, pipelineValueMinor };
  }, [filtered]);

  const activeTickets = (() => { const c = ticketsSummary?.counts || {}; return (c.open || 0) + (c.pending || 0) + (c.in_progress || 0); })();

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
    { href: '/admin/deals/board', label: 'Kanban', tone: 'primary' as const },
    { href: '/admin/revenue', label: 'Revenue' },
    { href: '/admin/outbound', label: 'Outbound' },
    { href: '/admin/templates', label: 'Templates' },
  ];

  const founderControlTower = useMemo(() => {
    const buckets = [
      { key: 'sameDay', title: 'Mismo día', subtitle: 'Close pressure', href: '/admin/deals/board', note: 'Proposal / checkout o tareas vencidas.', items: founderLanes.sameDay },
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
    <div className="space-y-10 pb-20">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Sales Cockpit</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Vista táctica del Pipeline: cierra lo que mueve caja y rescata lo que se enfría.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="sales workbench"
        title="Focus on Deals that Deserve Pressure"
        description="No veas esto como un simple listado. Usa las métricas del Control Tower para decidir qué carril merece tu tiempo ahora mismo y aplica el Playbook para acelerar el ciclo de ventas."
        actions={salesActions}
        signals={salesSignals}
      />

      {/* 1. FOUNDER LANES (Tarjetas Rápidas) */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Mismo día', value: founderLanes.sameDay.length, copy: 'Checkout/Proposal o vencidas.', href: '/admin/deals/board', color: 'text-rose-600', bg: 'bg-rose-500/5', border: 'border-rose-500/20' },
          { title: '≤12h', value: founderLanes.within12h.length, copy: 'Intención alta, preparar propuesta.', href: '/admin/tasks', color: 'text-amber-600', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
          { title: '≤2h', value: founderLanes.within2h.length, copy: 'Riesgo de continuidad (Soporte).', href: '/admin/tickets', color: 'text-emerald-600', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
          { title: 'Operador', value: founderLanes.operator.length, copy: 'Sin contacto o higiene del sistema.', href: '/admin/leads', color: 'text-brand-blue', bg: 'bg-brand-blue/5', border: 'border-brand-blue/20' },
        ].map((lane) => (
          <Link key={lane.title} href={lane.href} className={`group rounded-3xl border ${lane.border} ${lane.bg} p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md`}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 group-hover:text-brand-blue transition-colors">Action Lane</div>
              <ArrowRight className="h-4 w-4 opacity-30 group-hover:opacity-100 group-hover:text-brand-blue transition-all group-hover:translate-x-1" />
            </div>
            <h2 className="font-heading text-xl text-[var(--color-text)] mb-1">{lane.title}</h2>
            <div className={`text-4xl font-heading ${lane.color}`}>{lane.value}</div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-text)]/60 font-light">{lane.copy}</p>
          </Link>
        ))}
      </section>

      {/* 2. FOUNDER CONTROL TOWER */}
      <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-[var(--color-border)] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-6 w-6 text-brand-blue" />
              <h2 className="font-heading text-2xl text-[var(--color-text)]">Priorización Táctica</h2>
            </div>
            <p className="text-sm text-[var(--color-text)]/60 font-light max-w-2xl">
              No todos los registros merecen la misma energía. Esta lectura te da los 3 casos más críticos por carril.
            </p>
          </div>
          <Link href="/admin/deals/board" className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-md">
            Ver Todos en Kanban
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {founderControlTower.map((lane) => (
            <article key={lane.key} className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 transition-colors hover:border-brand-blue/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">{lane.subtitle}</div>
                  <h3 className="font-heading text-xl text-[var(--color-text)] mt-1">{lane.title}</h3>
                </div>
                <Link href={lane.href} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/70 transition hover:bg-[var(--color-border)] shadow-sm">
                  Abrir Carril
                </Link>
              </div>
              <p className="text-xs text-[var(--color-text)]/60 font-light mb-5">{lane.note}</p>

              <div className="space-y-3">
                {lane.top.length ? lane.top.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm transition-shadow hover:shadow-md group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[var(--color-text)] group-hover:text-brand-blue transition-colors">{entry.name}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={badgeStage(entry.stage)}>{entry.stage}</span>
                          <span className="font-mono text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{entry.amount}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-xl font-heading ${entry.score >= 75 ? 'text-rose-600' : 'text-brand-blue'}`}>{entry.score}</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mt-1">Score</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-[var(--color-text)]/50 border-t border-[var(--color-border)] pt-3 flex justify-between items-center">
                      <span>Próxima Acción:</span>
                      <span className="font-bold text-[var(--color-text)]/70 uppercase tracking-widest text-[10px] bg-[var(--color-surface-2)] px-2 py-1 rounded-md border border-[var(--color-border)]">{entry.nextAction}</span>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-transparent py-8 text-center text-sm font-medium text-[var(--color-text)]/40">Carril Limpio. Nada urgente aquí.</div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. CONTINUITY MATRIX */}
      <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8 border-b border-[var(--color-border)] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-6 w-6 text-brand-blue" />
              <h2 className="font-heading text-2xl text-[var(--color-text)]">Premium Continuity Matrix</h2>
            </div>
            <p className="text-sm text-[var(--color-text)]/60 font-light max-w-2xl">
              Lee ventas, soporte y reservas como una sola experiencia. Evita que la promesa de la marca se rompa en los handoffs entre módulos.
            </p>
          </div>
          <Link href="/admin/tickets" className="shrink-0 flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)] shadow-sm">
            Bandeja de Soporte
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Sales Pressure', String(commandBoard.closeToday.length), 'Deals que merecen empuje final.', '/admin/deals/board', 'text-brand-blue'],
            ['Support Active', String(activeTickets), 'Casos con SLA visible pos-compra.', '/admin/tickets', 'text-amber-600'],
            ['Checkout Visible', String(stats.checkout), 'Sin siguiente paso tras abrir pago.', '/admin/revenue', 'text-emerald-600'],
            ['System Hygiene', String(founderLanes.operator.length), 'Sin contacto o tarea clara.', '/admin/leads', 'text-[var(--color-text)]/70'],
          ].map(([title, value, body, href, colorClass]) => (
            <Link key={String(title)} href={String(href)} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 transition-all hover:border-brand-blue/30 hover:shadow-md group">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 group-hover:text-brand-blue transition-colors">{title}</div>
              <div className={`mt-3 font-heading text-4xl ${colorClass}`}>{value}</div>
              <p className="mt-3 text-xs leading-relaxed text-[var(--color-text)]/60 font-light">{body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. DATA TABLE & FILTERS */}
      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* KPI Mini-cards */}
        <div className="mb-8 grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {[
            { label: 'Visibles', val: stats.total }, { label: 'Calientes', val: stats.hot },
            { label: 'En Checkout', val: stats.checkout }, { label: 'Espera Cliente', val: stats.waitingCustomer },
            { label: 'Vencidos', val: stats.overdue, alert: true }, { label: 'Soporte Activo', val: activeTickets },
            { label: 'SLA Breach', val: ticketsSummary?.sla?.breached ?? 0, alert: true }
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border ${s.alert && s.val > 0 ? 'border-rose-500/30 bg-rose-50' : 'border-[var(--color-border)] bg-[var(--color-surface-2)]'} p-4 text-center`}>
              <div className={`text-[9px] font-bold uppercase tracking-widest ${s.alert && s.val > 0 ? 'text-rose-700' : 'text-[var(--color-text)]/50'}`}>{s.label}</div>
              <div className={`mt-1.5 font-heading text-xl ${s.alert && s.val > 0 ? 'text-rose-600' : 'text-brand-blue'}`}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Action Bar (Filters) */}
        <div className="mb-6 flex flex-col xl:flex-row gap-4 xl:items-center justify-between border-b border-[var(--color-border)] pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-brand-blue mr-2 hidden sm:block" />
            {[
              { id: '', label: 'Activos' }, { id: 'qualified', label: 'Priorizar Qualified' },
              { id: 'proposal', label: 'Seguir Proposal' }, { id: 'checkout', label: 'Empujar Checkout' }
            ].map(b => (
              <button key={b.id} onClick={() => setStage(b.id)} className={`rounded-xl border px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${stage === b.id ? 'bg-brand-dark text-brand-yellow border-brand-dark shadow-sm' : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text)]/60 hover:bg-[var(--color-surface)]'}`}>
                {b.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text)]/40" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar deal..." className="w-full h-10 pl-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 outline-none focus:border-brand-blue transition-colors text-sm" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button onClick={() => runAutopilot().catch(() => {})} disabled={autopilotBusy} className="flex-1 sm:flex-none flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-brand-blue/90 transition-all shadow-sm disabled:opacity-50">
                <Bot className="h-3 w-3"/> Autopilot
              </button>
              <button onClick={() => fetchIt().catch((e) => setErr(e instanceof Error ? e.message : 'Error'))} disabled={loading} className="flex-1 sm:flex-none flex h-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 hover:bg-[var(--color-surface)] transition-all">
                <RefreshCw className={`h-4 w-4 text-[var(--color-text)]/60 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {err && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}
        {autopilotMsg && <div className="mb-6 rounded-2xl border border-brand-yellow/30 bg-brand-yellow/10 p-4 text-sm font-medium text-brand-dark flex items-center gap-2"><Bot className="h-4 w-4"/> {autopilotMsg}</div>}
        {toast && <div className="fixed bottom-6 right-6 z-50 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-xl animate-fade-in flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/> {toast}</div>}

        {/* Tabla Principal */}
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
          <table className="w-full min-w-[1200px] text-sm text-left">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-5 py-4">Info del Deal</th>
                <th className="px-5 py-4">Etapa (Stage)</th>
                <th className="px-5 py-4 text-right">Contacto (Age / Stale)</th>
                <th className="px-5 py-4 text-center">Tareas</th>
                <th className="px-5 py-4 text-center">Riesgo / Score</th>
                <th className="px-5 py-4">Siguiente Acción</th>
                <th className="px-5 py-4 text-right">Playbook Manual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-[var(--color-text)]/40 font-medium">Sincronizando pipeline comercial...</td></tr>
              ) : filtered.length ? (
                filtered.map((r) => {
                  const overdue = r.overdue_tasks > 0;
                  const waDigits = digitsForWa(r.customer?.whatsapp || null);
                  const email = r.customer?.email || null;
                  const fallbackMsg = playbookText(r);

                  const openWa = async () => {
                    if (!waDigits) return;
                    const rendered = await renderPlaybookMessage(r, 'whatsapp', 'sales_cockpit:whatsapp');
                    try { await adminFetch('/api/admin/outbound', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ channel: 'whatsapp', provider: 'manual', status: 'queued', toPhone: waDigits, subject: null, body: rendered.body || fallbackMsg, dealId: r.id, templateKey: rendered.templateKey || null, templateVariant: rendered.templateVariant || null, metadata: { source: 'sales_cockpit:whatsapp' } }) }); } catch {}
                    window.open(`https://wa.me/${waDigits}?text=${encodeURIComponent(rendered.body || fallbackMsg)}`, '_blank', 'noopener,noreferrer');
                  };

                  const openEmail = async () => {
                    if (!email) return;
                    const rendered = await renderPlaybookMessage(r, 'email', 'sales_cockpit:email');
                    try { await adminFetch('/api/admin/outbound', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ channel: 'email', provider: 'manual', status: 'queued', toEmail: email, subject: rendered.subject || `KCE — Seguimiento ${r.tour_slug ? `(${r.tour_slug})` : ''}`.trim(), body: rendered.body || fallbackMsg, dealId: r.id, templateKey: rendered.templateKey || null, templateVariant: rendered.templateVariant || null, metadata: { source: 'sales_cockpit:email' } }) }); } catch {}
                    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(rendered.subject || `KCE — Seguimiento ${r.tour_slug ? `(${r.tour_slug})` : ''}`.trim())}&body=${encodeURIComponent(rendered.body || fallbackMsg)}`;
                  };

                  const onCopy = async () => {
                    const rendered = await renderPlaybookMessage(r, 'whatsapp', 'sales_cockpit:copy');
                    const ok = await copyToClipboard(rendered.body || fallbackMsg);
                    setToast(ok ? 'Mensaje Copiado ✅' : 'No se pudo copiar');
                  };

                  return (
                    <tr key={r.id} className={`transition-colors hover:bg-[var(--color-surface-2)]/50 ${overdue ? 'bg-rose-500/5' : ''}`}>
                      <td className="px-5 py-4 align-top">
                        <Link href={`/admin/deals/${r.id}`} className="font-semibold text-brand-blue hover:underline line-clamp-1 max-w-[200px]">{r.title || 'Sin Título'}</Link>
                        <div className="mt-1 font-medium text-[var(--color-text)] flex items-center gap-1.5"><MapPin className="h-3 w-3 text-[var(--color-text)]/40"/> {r.tour_slug || '—'}</div>
                        <div className="mt-2 text-xs text-[var(--color-text)]/60">{r.customer?.name || 'Cliente Anónimo'}</div>
                        <div className="text-[10px] font-mono text-[var(--color-text)]/40 truncate max-w-[150px]">{r.customer?.email || ''}</div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="mb-2">{badgeStage(r.stage || '')}</div>
                        {r.waiting_on && (
                          <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 rounded-md w-max">
                            Espera: {r.waiting_on} {typeof r.waiting_days === 'number' ? `(${r.waiting_days}d)` : ''}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top text-right text-[var(--color-text)]/70">
                        <div className="text-xs">Edad: <span className="font-mono">{r.age_days}d</span></div>
                        <div className="text-xs mt-0.5">Stale: <span className="font-mono">{r.stale_days}d</span></div>
                        <div className="text-xs mt-0.5">Contacto: <span className="font-mono">{r.contact_stale_days ?? '—'}d</span></div>
                      </td>

                      <td className="px-5 py-4 align-top text-center">
                        <div className={`font-heading text-xl ${overdue ? 'text-rose-600' : 'text-[var(--color-text)]/80'}`}>{r.open_tasks}</div>
                        {overdue && <div className="mt-1 text-[9px] font-bold uppercase tracking-widest text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 inline-block">{r.overdue_tasks} Vencidas</div>}
                      </td>

                      <td className="px-5 py-4 align-top text-center">
                        <div className={`font-heading text-xl ${r.score >= 75 ? 'text-brand-blue' : 'text-[var(--color-text)]/40'}`}>{r.score}</div>
                        {r.risk?.length > 0 && (
                          <div className="mt-2 flex flex-col gap-1 items-center">
                            {r.risk.slice(0, 2).map(x => <span key={x} className="text-[8px] font-bold uppercase tracking-widest text-rose-700 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded w-max">{x}</span>)}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="text-sm font-semibold text-[var(--color-text)]/80 line-clamp-2 max-w-[200px] leading-snug">{r.next_task?.title ?? '—'}</div>
                        <div className="mt-1 text-[10px] font-mono text-[var(--color-text)]/40">{fmtDue(r.next_task?.due_at ?? null)}</div>
                        <div className="mt-2 text-[9px] font-bold uppercase tracking-widest text-brand-blue">{r.next_action}</div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-1">
                            <button onClick={() => onCopy().catch(() => {})} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] transition hover:bg-[var(--color-border)]" title="Copiar Mensaje">
                              <Copy className="h-3 w-3" />
                            </button>
                            <button onClick={openWa} disabled={!waDigits} className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-30 font-bold text-[10px]" title="WhatsApp">
                              WA
                            </button>
                            <button onClick={openEmail} disabled={!email} className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-blue/30 bg-brand-blue/5 text-brand-blue transition hover:bg-brand-blue/10 disabled:opacity-30" title="Email">
                              <Briefcase className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="font-heading text-lg text-emerald-600 mt-2">{fmtMoneyMinor(r.amount_minor, r.currency)}</div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-sm font-medium text-[var(--color-text)]/40">No hay tratos (deals) en este carril bajo los filtros seleccionados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
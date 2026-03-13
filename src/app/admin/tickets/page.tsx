// src/app/admin/tickets/page.tsx
import 'server-only';

import type { Metadata } from 'next';

import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';

import { AdminTicketsClient } from './AdminTicketsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tickets | Admin | KCE',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/conversations', label: 'Conversations', tone: 'primary' as const },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/launch-hq', label: 'Launch HQ' },
  { href: '/admin/command-center', label: 'Command Center' },
];

const focusItems = [
  {
    label: '01 · triage',
    title: 'Start with the cases that threaten traveler confidence',
    body: 'Open, urgent and aging tickets deserve the first block of attention because they can damage conversion, delivery calm or post-purchase trust.',
    href: '/admin/bookings',
    cta: 'Protect bookings',
  },
  {
    label: '02 · connect',
    title: 'Read support inside the customer and conversation context',
    body: 'A strong support desk should reconnect the ticket with the conversation, the customer record and the booking truth before escalating anything.',
    href: '/admin/conversations',
    cta: 'Open conversations',
  },
  {
    label: '03 · close',
    title: 'Resolve fast, but only after the promise is safe again',
    body: 'Closing a ticket matters only when payment, assets, links and traveler reassurance are already aligned again.',
    href: '/admin/launch-hq',
    cta: 'Review launch lane',
  },
];

const notes = [
  {
    title: 'What to do first',
    body: 'Handle urgent or aging support before lower-risk housekeeping so premium confidence stays intact.',
  },
  {
    title: 'What to avoid',
    body: 'Do not resolve a case just because the dashboard is cleaner if the traveler still lacks certainty or assets.',
  },
  {
    title: 'What good looks like',
    body: 'The best ticket queue feels calm, traceable and connected to the same truth seen in bookings and conversations.',
  },
];

export default function AdminTicketsPage() {
  return (
    <main className="space-y-6">
      <AdminExecutivePanel
        eyebrow="support operating read"
        title="A simpler support desk for human handoff and recovery"
        description="Tickets now start with operator clarity: find the cases that threaten trust, reconnect them to the real customer context and resolve only when the premium promise is safe again."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      <ReleaseGradeDeck
        compact
        title="Support release-grade read"
        description="Before pushing more volume, make sure ticket triage, handoff and post-purchase reassurance still feel calm and easy to verify."
      />

      <GoLiveSimplificationDeck
        compact
        title="Support simplification"
        description="The last improvement here is faster triage: fewer decorative reads, clearer priorities and quicker connection between ticket, customer and booking truth."
      />

      <section className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-soft dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">Support continuity board</div>
            <h2 className="mt-2 font-heading text-xl text-brand-blue">Qué revisar antes de cerrar o escalar un ticket</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/72">Un ticket premium no se resuelve solo con responder. Primero confirma si el caso toca booking, conversación, pago o simple tranquilidad del viajero.</p>
          </div>
          <a href="/admin/conversations" className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]">Abrir conversaciones</a>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['Conversation truth', 'Lee primero la conversación real y evita responder como si el caso hubiera empezado hoy.', '/admin/conversations'],
            ['Booking truth', 'Si el caso toca pago, invoice, links o assets, reconnecta con bookings antes de escalar.', '/admin/bookings'],
            ['Human reassurance', 'A veces el valor no está en otro workflow sino en devolver claridad al viajero rápido y bien.', '/admin/customers'],
            ['Close loop', 'Solo resuelve cuando siguiente paso, owner y promesa final ya están claros.', '/admin/launch-hq'],
          ].map(([title, body, href]) => (
            <a key={title} href={href} className="rounded-2xl border border-black/10 bg-black/5 p-4 transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{body}</p>
            </a>
          ))}
        </div>
      </section>


      <section className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-soft dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">Support recovery checklist</div>
            <h2 className="mt-2 font-heading text-xl text-brand-blue">Qué confirmar antes de responder, escalar o cerrar un caso sensible</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/72">Un caso premium no siempre necesita otra explicación; a veces necesita truth, owner y siguiente paso. Esta lectura te ayuda a distinguir continuidad real de simple ruido operativo.</p>
          </div>
          <a href="/admin/bookings" className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]">Ver booking truth</a>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['Leer contexto', 'Abre conversación, cliente y booking antes de responder como si el caso empezara hoy.', '/admin/conversations'],
            ['Verificar truth', 'Si el caso toca pago, invoice, calendar o links, confirma booking truth antes de prometer algo.', '/admin/bookings'],
            ['Asignar owner', 'Todo caso que no cierre hoy debe salir con owner y siguiente paso escritos.', '/admin/tasks'],
            ['Cerrar con calma', 'Solo resuelve cuando el viajero ya tiene claridad, activos y continuidad suficiente.', '/admin/launch-hq'],
          ].map(([title, body, href]) => (
            <a key={String(title)} href={String(href)} className="rounded-2xl border border-black/10 bg-black/5 p-4 transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{body}</p>
            </a>
          ))}
        </div>
      </section>

      <AdminTicketsClient />
    </main>
  );
}

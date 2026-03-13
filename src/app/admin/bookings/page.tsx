import 'server-only';

import type { Metadata } from 'next';

import { CommercialControlDeck } from '@/components/admin/CommercialControlDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';

import { AdminBookingsClient } from './AdminBookingsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Reservas | KCE',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/revenue', label: 'Revenue truth', tone: 'primary' as const },
  { href: '/admin/qa', label: 'QA truth' },
  { href: '/admin/tickets', label: 'Tickets' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/customers', label: 'Customers' },
];

const focusItems = [
  {
    label: '01 · verify',
    title: 'Confirm payment truth first',
    body: 'Before touching support or follow-up, confirm Stripe, booking persistence and revenue metrics still agree on the same case.',
    href: '/admin/revenue',
    cta: 'Open revenue',
  },
  {
    label: '02 · recover',
    title: 'Rescue only the bookings that need intervention',
    body: 'Use tickets, QA and manual trace only when the booking still needs recovery, traveler reassurance or asset re-delivery.',
    href: '/admin/qa',
    cta: 'Review QA',
  },
  {
    label: '03 · protect',
    title: 'Keep post-purchase calm and premium',
    body: 'A strong booking desk should feel boring: links work, assets exist and support can reopen the case without confusion.',
    href: '/admin/tickets',
    cta: 'Open support queue',
  },
];

const notes = [
  {
    title: 'What matters first',
    body: 'Paid truth matters more than dashboard aesthetics when a traveler already completed checkout.',
  },
  {
    title: 'What to escalate',
    body: 'Only escalate the bookings that show missing assets, support friction or payment mismatch.',
  },
  {
    title: 'What good looks like',
    body: 'The best booking day feels quiet: paid, traceable, delivered and easy to support later.',
  },
];

export default function AdminBookingsPage() {
  return (
    <main className="space-y-6">
      <CommercialControlDeck
        eyebrow="Delivery & Revenue"
        title="Reservas"
        description="Bookings is now treated as a clean post-purchase desk: verify truth, recover only what matters and keep traveler confidence calm after payment."
        primaryHref="/admin/revenue"
        primaryLabel="Abrir revenue"
        secondaryHref="/admin/qa"
        secondaryLabel="Abrir QA"
      />

      <AdminExecutivePanel
        eyebrow="bookings operating read"
        title="A simpler desk for post-purchase confidence"
        description="This page now prioritizes the next action over decorative duplication: verify charge truth, inspect the cases that need recovery and keep the delivery promise readable for support."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      <ReleaseGradeDeck
        compact
        title="Bookings release-grade read"
        description="Before more volume hits, make sure booking persistence, traveler assets and support reopening still feel calm, premium and easy to verify."
      />

      <GoLiveSimplificationDeck
        compact
        title="Bookings simplification"
        description="The last upgrade here is operator clarity: fewer repeated blocks, faster case reading and a more obvious recovery path when anything slips."
      />

      <section className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-soft dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">Premium recovery matrix</div>
            <h2 className="mt-2 font-heading text-xl text-brand-blue">Cómo leer bookings cuando ventas, soporte y entrega todavía importan</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/72">No todos los bookings necesitan el mismo esfuerzo. Usa esta lectura para decidir si toca verificar revenue, rescatar activos, abrir soporte o simplemente confirmar que la post-compra sigue tranquila.</p>
          </div>
          <a href="/admin/revenue" className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]">Abrir revenue truth</a>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['Charge truth', 'Confirma Stripe, revenue y persistencia antes de tocar soporte o follow-up.', '/admin/revenue'],
            ['Asset rescue', 'Si falta invoice, calendar o link, abre recuperación antes de cerrar el caso.', '/admin/qa'],
            ['Support reopen', 'Cuando el viajero ya pagó, tickets debe reabrir el caso sin perder contexto.', '/admin/tickets'],
            ['Post-purchase calm', 'Si todo está entregado y trazable, el mejor movimiento es no intervenir de más.', '/es/account/bookings'],
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
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">Sales → booking → support bridge</div>
            <h2 className="mt-2 font-heading text-xl text-brand-blue">Qué revisar cuando el cierre ya pasó y ahora importa la calma post-compra</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/72">Bookings no debería operar solo como lista de reservas. Úsalo como puente entre revenue, soporte y tranquilidad del viajero para que cada caso ya pagado siga teniendo una lectura premium.</p>
          </div>
          <a href="/admin/tickets" className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]">Abrir soporte</a>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['Confirmar truth', 'Stripe, invoice y links deben contar la misma historia antes de cerrar cualquier caso.', '/admin/revenue'],
            ['Ver support', 'Si ya existe ticket o fricción post-compra, bookings debe abrir soporte con contexto y no solo con intuición.', '/admin/tickets'],
            ['Validar assets', 'Calendar, invoice y booking page deben estar disponibles para que la experiencia siga siendo tranquila.', '/admin/qa'],
            ['Cuidar al viajero', 'Si el caso ya está resuelto, el mejor movimiento puede ser no tocarlo de más y dejar solo continuidad visible.', '/es/account/bookings'],
          ].map(([title, body, href]) => (
            <a key={String(title)} href={String(href)} className="rounded-2xl border border-black/10 bg-black/5 p-4 transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{body}</p>
            </a>
          ))}
        </div>
      </section>

      <AdminBookingsClient />
    </main>
  );
}

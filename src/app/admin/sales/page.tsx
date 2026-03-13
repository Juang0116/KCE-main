import { CommercialControlDeck } from '@/components/admin/CommercialControlDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';

import { AdminSalesCockpitClient } from './AdminSalesCockpitClient';

export const dynamic = 'force-dynamic';

const quickLinks = [
  { href: '/admin/deals', label: 'Deals', tone: 'primary' as const },
  { href: '/admin/revenue', label: 'Revenue' },
  { href: '/admin/outbound', label: 'Outbound' },
  { href: '/admin/templates', label: 'Templates' },
  { href: '/admin/tickets', label: 'Support queue' },
];

const focusItems = [
  {
    label: '01 · close',
    title: 'Start from the opportunities that can move cash now',
    body: 'Proposal and checkout pressure deserve attention before broad pipeline grooming when the goal is real revenue movement.',
    href: '/admin/revenue',
    cta: 'Review revenue truth',
  },
  {
    label: '02 · rescue',
    title: 'Rescue the deals that are cooling down',
    body: 'If reply, waiting time or overdue tasks show friction, use outbound and templates fast before the opportunity goes cold.',
    href: '/admin/outbound',
    cta: 'Open outbound',
  },
  {
    label: '03 · protect',
    title: 'Keep premium continuity after the close',
    body: 'Sales should not close in isolation: the promise must still hold in bookings, support and post-purchase confidence.',
    href: '/admin/tickets',
    cta: 'Protect handoff',
  },
];

const notes = [
  {
    title: 'What wins today',
    body: 'One strong close action usually matters more than a dozen soft touches across colder deals.',
  },
  {
    title: 'What to rescue today',
    body: 'Rescue stalled deals only when the channel, offer and timing still show a believable path to payment.',
  },
  {
    title: 'What to leave ready tonight',
    body: 'End the block with the hottest deal moved, the coldest rescue queued and the next pressure lane already obvious.',
  },
];

export default function AdminSalesPage() {
  return (
    <main className="space-y-6">
      <CommercialControlDeck
        eyebrow="Sales Cabin"
        title="Ventas"
        description="Sales now reads as a cleaner daily cockpit: close what can move cash, rescue what is cooling down and protect the handoff after payment."
        primaryHref="/admin/deals"
        primaryLabel="Abrir deals"
        secondaryHref="/admin/revenue"
        secondaryLabel="Abrir revenue"
      />

      <AdminExecutivePanel
        eyebrow="sales operating read"
        title="A simpler sales cockpit for decisive action"
        description="This page now prioritizes the next move over dashboard sprawl: focus the hot opportunities, rescue the right deals and keep the premium promise intact after the close."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      <ReleaseGradeDeck
        compact
        title="Sales release-grade read"
        description="Before pushing harder, make sure close pressure, outbound follow-up and post-purchase handoff still reinforce the same premium system."
      />

      <GoLiveSimplificationDeck
        compact
        title="Sales simplification"
        description="The last improvement here is operator focus: fewer repeated reads, clearer priorities and a faster path from signal to action."
      />


      <section className="grid gap-3 md:grid-cols-4">
        {[
          ['Mismo día', 'Deals en proposal / checkout con tarea vencida o sin respuesta reciente.', '/admin/deals'],
          ['≤12h', 'Planes personalizados, contacto premium y handoff desde chat/contacto.', '/admin/tasks'],
          ['≤2h', 'Tickets de soporte o continuidad post-compra con contexto sensible.', '/admin/tickets'],
          ['Operador', 'Verifica leads, deals, tasks y tickets como una sola cadena.', '/admin/leads'],
        ].map(([title, body, href]) => (
          <a
            key={title}
            href={href}
            className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop dark:border-white/10 dark:bg-black/30"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">Founder lane</div>
            <h2 className="mt-2 font-heading text-xl text-brand-blue">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">{body}</p>
          </a>
        ))}
      </section>

      <section className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-soft dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">System continuity</div>
            <h2 className="mt-2 font-heading text-xl text-brand-blue">Qué abrir primero cuando entra un caso nuevo</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/72">Lee chat, contacto, deals y soporte como una sola cadena. El objetivo no es responder todo igual: es saber qué contexto ya existe y qué carril merece founder pressure.</p>
          </div>
          <a href="/admin/ai" className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]">
            Abrir IA / SOP
          </a>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['Chat', 'Detecta intención, resume el caso y empuja a plan, tours o mano humana.', '/admin/ai'],
            ['Contacto', 'Recibe contexto y abre ticket/deal/task cuando el caso ya merece continuidad.', '/admin/tickets'],
            ['CRM', 'Deals y tasks deben dejar visible quién responde, en qué ventana y con qué siguiente paso.', '/admin/deals'],
            ['Founder lane', 'Usa Sales para decidir qué empujar hoy, qué rescatar y qué dejar al operador.', '/admin/sales'],
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
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">Founder daily rhythm</div>
            <h2 className="mt-2 font-heading text-xl text-brand-blue">Cómo leer KCE en bloques de trabajo, no solo en dashboards</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/72">La operación mejora cuando cada franja del día tiene una función clara: cerrar, rescatar, proteger continuidad y dejar listo el siguiente bloque.</p>
          </div>
          <a href="/admin/tasks" className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]">Abrir tasks</a>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ['Apertura', 'Revisa founder lanes, decide los cierres del día y deja claro qué caso merece presión inmediata.'],
            ['Bloque medio', 'Protege continuidad entre ventas, soporte y booking. No abras discovery si el contexto ya existe.'],
            ['Cierre', 'Deja task, owner y siguiente paso escritos. La meta no es responder todo: es que nada valioso quede huérfano.'],
          ].map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{body}</p>
            </article>
          ))}
        </div>
      </section>


      <section className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-soft dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">Founder decision path</div>
            <h2 className="mt-2 font-heading text-xl text-brand-blue">Cómo decidir si hoy toca cerrar, rescatar, proteger o limpiar</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/72">Una lectura ejecutiva para no tratar cada caso como pipeline puro. Si ya existe contexto, no abras discovery otra vez; decide si toca presión comercial, continuidad, soporte o higiene del sistema.</p>
          </div>
          <a href="/admin/bookings" className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]">Ver continuity desk</a>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['Close', 'Proposal, checkout o follow-up caliente donde un founder move puede empujar caja hoy.', '/admin/deals'],
            ['Rescue', 'Deals con task vencida, respuesta fría o contacto estancado que todavía merecen recuperación.', '/admin/tasks'],
            ['Protect', 'Casos donde ventas ya toca booking o soporte y la prioridad es proteger la promesa premium.', '/admin/bookings'],
            ['Clean', 'Registros sin owner, sin task o sin contacto suficiente; mejor dejarlos listos para operador que empujarlos a ciegas.', '/admin/leads'],
          ].map(([title, body, href]) => (
            <a key={String(title)} href={String(href)} className="rounded-2xl border border-black/10 bg-black/5 p-4 transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{body}</p>
            </a>
          ))}
        </div>
      </section>

      <AdminSalesCockpitClient />
    </main>
  );
}

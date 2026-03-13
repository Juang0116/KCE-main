import Link from 'next/link';

const cards = [
  {
    eyebrow: 'delivery truth',
    title: 'Revenue ledger',
    body: 'Cruza paid session, booking, invoice, email y account antes de declarar una venta como cerrada del todo.',
    href: '/admin/revenue',
    label: 'Abrir revenue',
  },
  {
    eyebrow: 'booking ops',
    title: 'Bookings command',
    body: 'Entra a reservas cuando necesites revisar assets, recovery o fricción post-compra en un caso concreto.',
    href: '/admin/bookings',
    label: 'Ver bookings',
  },
  {
    eyebrow: 'traveler experience',
    title: 'Account view',
    body: 'Confirma cómo vive el viajero su reserva: descargas, soporte y continuidad dentro de la cuenta.',
    href: '/account/bookings',
    label: 'Abrir account',
  },
  {
    eyebrow: 'release confidence',
    title: 'QA + hardening',
    body: 'Si algo no cuadra, vuelve a QA y a los runbooks antes de tocar revenue o soporte manual.',
    href: '/admin/qa',
    label: 'Abrir QA',
  },
] as const;

type Props = {
  title?: string;
  description?: string;
};

export function RevenuePolishDeck({
  title = 'Final revenue polish deck',
  description = 'Usa este deck para cerrar el loop completo: cobro confirmado, assets listos, cuenta clara y recovery preparado si algo se corta.',
}: Props) {
  return (
    <section className="rounded-[28px] border border-black/10 bg-[linear-gradient(135deg,rgba(10,61,128,0.08),rgba(255,196,0,0.08),rgba(255,255,255,0.88))] p-5 shadow-soft md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-black/10 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-text)]/60">
            revenue polish
          </div>
          <h2 className="mt-3 font-heading text-2xl text-brand-blue md:text-3xl">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/74 md:text-base">{description}</p>
        </div>
        <div className="rounded-[22px] border border-brand-blue/10 bg-white/80 px-4 py-3 text-sm text-[color:var(--color-text)]/72 shadow-[0_16px_38px_rgba(0,0,0,0.04)]">
          Meta del sprint: menos fricción entre cierre, entrega y soporte.
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.title} className="rounded-[22px] border border-black/10 bg-white/85 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/52">{card.eyebrow}</div>
            <h3 className="mt-2 text-base font-semibold text-[color:var(--color-text)]">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">{card.body}</p>
            <Link
              href={card.href}
              className="mt-4 inline-flex items-center rounded-full border border-[color:var(--color-border)] px-3 py-2 text-sm font-semibold text-brand-blue transition hover:-translate-y-px hover:bg-brand-blue/5"
            >
              {card.label}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

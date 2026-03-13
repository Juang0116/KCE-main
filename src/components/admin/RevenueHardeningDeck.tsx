import Link from 'next/link';

const cards = [
  {
    eyebrow: 'qa gate',
    title: 'Revenue QA',
    body: 'Corre QA base, preflight y RC verify antes de empujar cambios o compras de prueba.',
    href: '/admin/qa',
    label: 'Abrir QA',
  },
  {
    eyebrow: 'delivery truth',
    title: 'Bookings + entrega',
    body: 'Confirma booking, invoice, email y assets desde la vista operativa de reservas.',
    href: '/admin/bookings',
    label: 'Ver bookings',
  },
  {
    eyebrow: 'ops recovery',
    title: 'Runbooks',
    body: 'Si algo se rompe en checkout, webhook o email, entra directo al runbook correspondiente.',
    href: '/admin/ops/runbooks',
    label: 'Abrir runbooks',
  },
  {
    eyebrow: 'system gate',
    title: 'System status',
    body: 'Verifica secrets, dependencias y señales de salud antes de pasar a producción.',
    href: '/admin/system',
    label: 'Ver sistema',
  },
] as const;

type Props = {
  title?: string;
  description?: string;
  compact?: boolean;
};

export function RevenueHardeningDeck({
  title = 'Revenue hardening command deck',
  description = 'La meta aquí no es solo que compile: es saber si KCE puede cobrar, persistir, entregar y recuperarse sin perder confianza del viajero.',
  compact = false,
}: Props) {
  return (
    <section className="rounded-[26px] border border-black/10 bg-[color:var(--color-surface)] p-5 shadow-soft">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">hardening deck</div>
          <h2 className="mt-3 font-heading text-2xl text-brand-blue md:text-3xl">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72 md:text-base">{description}</p>
        </div>
        {!compact ? (
          <div className="rounded-[22px] border border-brand-blue/10 bg-brand-blue/5 px-4 py-3 text-sm text-brand-blue">
            Usa este bloque como atajo para validar ingresos, entrega y recovery antes de escalar tráfico.
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.title} className="rounded-[20px] border border-black/10 bg-[color:var(--color-surface-2)] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/52">{card.eyebrow}</div>
            <h3 className="mt-2 text-base font-semibold text-[color:var(--color-text)]">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{card.body}</p>
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

import Link from 'next/link';

import { Button } from '@/components/ui/Button';

type Props = {
  localePrefix?: string;
  accountHref?: string;
  bookingsHref?: string;
  supportHref?: string;
  contactHref?: string;
  className?: string;
};

export default function LaunchCommandContinuityRail({
  localePrefix = '',
  accountHref,
  bookingsHref,
  supportHref,
  contactHref,
  className,
}: Props) {
  const account = accountHref || `${localePrefix}/account`;
  const bookings = bookingsHref || `${localePrefix}/account/bookings`;
  const support = supportHref || `${localePrefix}/account/support`;
  const contact = contactHref || `${localePrefix}/contact?source=account`;

  const cards = [
    {
      eyebrow: 'account lane',
      title: 'Cuenta clara',
      body: 'Mantén seguridad, reservas y reentrada al producto dentro del mismo hilo.',
      href: account,
      cta: 'Abrir cuenta',
      tone: 'dark' as const,
    },
    {
      eyebrow: 'booking lane',
      title: 'Booking, invoice y calendario',
      body: 'Recupera activos post-compra y vuelve al booking correcto sin duplicar pasos.',
      href: bookings,
      cta: 'Ver reservas',
      tone: 'light' as const,
    },
    {
      eyebrow: 'support handoff',
      title: 'Soporte con contexto',
      body: 'Escala incidencias, cambios o dudas logísticas con la referencia correcta del caso.',
      href: support,
      cta: 'Ir a soporte',
      tone: 'light' as const,
    },
  ];

  return (
    <section
      className={[
        'rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8',
        className || '',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">launch command</p>
          <h2 className="mt-2 font-heading text-2xl text-brand-blue md:text-3xl">Cuenta, booking, soporte y handoff ya deberían funcionar como un solo sistema</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/72 md:text-base">
            Esta capa final de lanzamiento busca que el viajero no tenga que adivinar a dónde ir: revisar reservas, abrir soporte, volver al contacto o retomar la cuenta debe sentirse continuo.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-brand-blue">
          traveler continuity
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.12fr_0.94fr_0.94fr]">
        {cards.map((card) => (
          <article
            key={card.title}
            className={
              card.tone === 'dark'
                ? 'rounded-3xl border border-brand-blue/10 bg-[linear-gradient(135deg,rgba(12,31,69,0.96),rgba(24,92,194,0.88))] p-5 text-white shadow-soft'
                : 'rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5'
            }
          >
            <div className={card.tone === 'dark' ? 'text-[11px] uppercase tracking-[0.18em] text-white/65' : 'text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-text)]/52'}>{card.eyebrow}</div>
            <h3 className={card.tone === 'dark' ? 'mt-4 font-heading text-2xl text-white' : 'mt-4 font-heading text-xl text-brand-blue'}>{card.title}</h3>
            <p className={card.tone === 'dark' ? 'mt-2 text-sm leading-6 text-white/80' : 'mt-2 text-sm leading-6 text-[color:var(--color-text)]/72'}>{card.body}</p>
            <div className="mt-5">
              <Button asChild variant="outline" className={card.tone === 'dark' ? 'border-white/20 bg-white/5 text-white hover:bg-white/10' : undefined}>
                <Link href={card.href}>{card.cta}</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-text)]/52">human follow-up</p>
          <h3 className="mt-3 font-heading text-xl text-brand-blue">Si el caso requiere una persona, la transición debe ser elegante</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">
            Contacto, soporte y CRM deben compartir el mismo resumen para evitar que el viajero repita historia, pago o referencia del tour.
          </p>
          <div className="mt-4">
            <Button asChild variant="ghost" className="justify-start px-0 text-brand-blue">
              <Link href={contact}>Abrir contacto con continuidad</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-text)]/52">launch gate</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--color-text)]/72">
            <li>• Cuenta y reservas con siguiente paso claro</li>
            <li>• Soporte capaz de recibir bookingId, ticket o contexto previo</li>
            <li>• Contacto y chat alineados al mismo resumen comercial</li>
            <li>• Reentrada al catálogo sin romper continuidad</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

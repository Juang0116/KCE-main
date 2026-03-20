import Link from 'next/link';

const items = [
  {
    eyebrow: 'booking continuity',
    title: 'Reserva + activos',
    body: 'Encuentra booking, factura y calendario sin salir del mismo flujo.',
    href: '/account/bookings',
    label: 'Mis reservas',
  },
  {
    eyebrow: 'support handoff',
    title: 'Soporte contextual',
    body: 'Si algo falla, abre soporte desde la cuenta correcta y evita repetir todo desde cero.',
    href: '/account/support',
    label: 'Abrir soporte',
  },
  {
    eyebrow: 'next purchase',
    title: 'Volver a explorar',
    body: 'Pasa de post-compra a nueva intención con tours, destinos y shortlist mejor conectados.',
    href: '/tours',
    label: 'Ver tours',
  },
] as const;

type Props = {
  localePrefix?: string;
};

export default function AccountServiceRail({ localePrefix = '' }: Props) {
  const withLocale = (href: string) => {
    if (!href.startsWith('/')) return href;
    return `${localePrefix}${href}`;
  };

  return (
    <section className="rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-blue">
            account polish
          </div>
          <h2 className="mt-3 font-heading text-2xl text-brand-blue">Tu cuenta debería sentirse como una suite premium de seguimiento</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72 md:text-base">
            KCE sube de nivel cuando el viajero puede volver a su compra, descargar activos y pedir ayuda sin confusión ni pasos sueltos.
          </p>
        </div>
        <div className="rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm text-[color:var(--color-text)]/72">
          Reserva → activos → soporte → siguiente viaje.
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.title} className="rounded-[1.4rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/52">{item.eyebrow}</div>
            <h3 className="mt-2 text-base font-semibold text-[color:var(--color-text)]">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">{item.body}</p>
            <Link
              href={withLocale(item.href)}
              className="mt-4 inline-flex items-center rounded-full border border-[color:var(--color-border)] px-3 py-2 text-sm font-semibold text-brand-blue transition hover:-translate-y-px hover:bg-brand-blue/5"
            >
              {item.label}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

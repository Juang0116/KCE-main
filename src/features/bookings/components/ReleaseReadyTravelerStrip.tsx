import Link from 'next/link';

function withPrefix(prefix: string, href: string) {
  const cleanPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  if (!href.startsWith('/')) return href;
  if (!cleanPrefix) return href;
  return `${cleanPrefix}${href}`;
}

type Props = {
  localePrefix: string;
};

export default function ReleaseReadyTravelerStrip({ localePrefix }: Props) {
  const items = [
    {
      title: 'Assets listos',
      body: 'Booking, factura y calendario deben encontrarse sin buscar demasiado ni abrir rutas confusas.',
      href: '/account/bookings',
      label: 'Abrir booking center',
    },
    {
      title: 'Soporte con contexto',
      body: 'Si algo falla, el viajero debería volver a soporte con la reserva y el contexto ya visibles.',
      href: '/account/support',
      label: 'Ir a soporte',
    },
    {
      title: 'Siguiente paso claro',
      body: 'Después de comprar, KCE todavía debe invitar a explorar más experiencias o preparar el siguiente viaje.',
      href: '/tours',
      label: 'Explorar tours',
    },
  ] as const;

  return (
    <section className="rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-brand-blue/12 bg-brand-blue/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue">
            traveler release polish
          </div>
          <h2 className="mt-4 font-heading text-2xl text-brand-blue md:text-3xl">
            El post-compra también debe sentirse 10/10
          </h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--color-text)]/72">
            Este tramo final comprueba que el viajero pueda seguir, descargar, pedir ayuda y volver a explorar sin perder la sensación premium que prometió el funnel.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.title}
            className="rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4"
          >
            <h3 className="text-base font-semibold text-brand-blue">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">{item.body}</p>
            <Link
              href={withPrefix(localePrefix, item.href)}
              className="mt-4 inline-flex rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-2)]"
            >
              {item.label}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

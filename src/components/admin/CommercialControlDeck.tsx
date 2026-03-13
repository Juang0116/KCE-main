import Link from 'next/link';

type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

const routeLinks = [
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/deals', label: 'Deals' },
  { href: '/admin/sales', label: 'Sales' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/tasks', label: 'Tasks' },
  { href: '/admin/outbound', label: 'Outbound' },
  { href: '/admin/revenue', label: 'Revenue' },
  { href: '/admin/qa', label: 'QA / Release' },
];

const controlPillars = [
  {
    title: '1 · Capturar',
    body: 'Leads, tickets, quiz, wishlist y contacto deben terminar con owner claro y siguiente acción visible.',
  },
  {
    title: '2 · Calificar',
    body: 'El matcher comercial es pasar rápido de intención difusa a propuesta, deal o checkout.',
  },
  {
    title: '3 · Cobrar',
    body: 'Checkout, webhook, booking, invoice y email deben sentirse como una sola ruta de revenue.',
  },
  {
    title: '4 · Reconfirmar',
    body: 'Cada movimiento importante vuelve a métricas, revenue y tasks para validar si el loop se movió.',
  },
];

export function CommercialControlDeck({
  eyebrow = 'Commercial Command',
  title,
  description,
  primaryHref = '/admin/sales',
  primaryLabel = 'Abrir Sales cockpit',
  secondaryHref = '/admin/qa',
  secondaryLabel = 'Abrir release desk',
}: Props) {
  return (
    <section className="rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,rgba(0,59,122,0.10),rgba(255,196,0,0.09),rgba(255,255,255,0.82))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.05)] md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-black/10 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-text)]/65">
            {eyebrow}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--color-text)] md:text-[2rem]">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--color-text)]/74 md:text-[15px]">
            {description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {routeLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-black/10 bg-white/88 px-3 py-1.5 font-medium text-[color:var(--color-text)]/78 transition hover:-translate-y-0.5 hover:bg-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
          {controlPillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-[1.4rem] border border-black/10 bg-white/85 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.04)]"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-text)]/55">
                {pillar.title}
              </div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/74">{pillar.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.5fr,1fr]">
        <div className="rounded-3xl border border-black/10 bg-[#0a3d80] px-5 py-5 text-white shadow-[0_24px_60px_rgba(10,61,128,0.22)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
            Go-to-close rhythm
          </div>
          <div className="mt-3 text-xl font-semibold tracking-tight md:text-[1.55rem]">
            Opera como cabina comercial: detectar → mover → verificar → entregar.
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/82">
            KCE sube a 10/10 cuando la capa comercial deja de depender de memoria manual.
            Cada lead, deal, reserva y tarea debe quedar conectada a una siguiente acción clara.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0a3d80] transition hover:-translate-y-0.5"
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/14"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white/85 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.04)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-text)]/55">
            Daily loop
          </div>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-[color:var(--color-text)]/76">
            <li><span className="font-semibold text-[color:var(--color-text)]">Morning:</span> calienta qualified / proposal / checkout.</li>
            <li><span className="font-semibold text-[color:var(--color-text)]">Midday:</span> desbloquea replies, tasks vencidas y tickets que frenan cierre.</li>
            <li><span className="font-semibold text-[color:var(--color-text)]">Afternoon:</span> confirma revenue, entrega y activos post-compra.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

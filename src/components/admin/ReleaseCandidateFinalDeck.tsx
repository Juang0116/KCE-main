import Link from 'next/link';

type Props = {
  compact?: boolean;
  title?: string;
  description?: string;
};

const lanes = [
  {
    eyebrow: 'Truth source',
    title: 'Revenue, bookings y account deben contar la misma historia',
    body:
      'Antes de mover más tráfico, comprueba que checkout, booking, invoice y account reflejan la misma reserva sin huecos ni interpretaciones manuales.',
  },
  {
    eyebrow: 'Traveler confidence',
    title: 'La experiencia post-compra debe sentirse premium',
    body:
      'Success, booking y account tienen que ayudar al viajero a encontrar activos, pedir soporte y seguir su experiencia sin ruido visual ni fricción.',
  },
  {
    eyebrow: 'Operator confidence',
    title: 'El equipo debe saber exactamente dónde actuar',
    body:
      'QA, revenue, bookings y marketing deberían dejar claro qué revisar, qué corregir y cuándo un release ya está listo para vender con confianza.',
  },
] as const;

const checklist = [
  ['QA + RC Verify', 'Ejecuta QA, Production preflight o Deep QA y una verificación real de compra antes de declarar release candidate.'],
  ['Delivery assets', 'Comprueba booking, invoice, calendar y email con un caso real. Si algo falla, usa heal/retry y documenta la causa.'],
  ['Account confidence', 'Verifica que account/bookings permita al viajero retomar soporte, descargar activos y volver al tour sin perder contexto.'],
  ['Growth safety', 'Antes de empujar campañas o landings, confirma que el funnel completo resiste tráfico nuevo y no solo navegación local.'],
] as const;

export default function ReleaseCandidateFinalDeck({
  compact = false,
  title = 'Release candidate final view',
  description = 'Este deck junta el último tramo de hardening, polish y confianza operativa para saber si KCE ya está listo para vender con una sensación premium y sin improvisación.',
}: Props) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-soft">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-6 md:p-8">
          <div className="inline-flex rounded-full border border-brand-blue/12 bg-brand-blue/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue">
            release candidate final
          </div>
          <h2 className="mt-4 font-heading text-2xl text-brand-blue md:text-3xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-text)]/72">
            {description}
          </p>

          <div className={`mt-6 grid gap-4 ${compact ? 'md:grid-cols-1 xl:grid-cols-3' : 'md:grid-cols-3'}`}>
            {lanes.map((lane) => (
              <article
                key={lane.title}
                className="rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">
                  {lane.eyebrow}
                </div>
                <h3 className="mt-2 text-base font-semibold text-brand-blue">{lane.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">{lane.body}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="border-t border-brand-blue/10 bg-[linear-gradient(160deg,rgba(15,55,120,0.98),rgba(15,55,120,0.88)_65%,rgba(216,179,73,0.18))] p-6 text-white lg:border-l lg:border-t-0 md:p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">closeout order</div>
          <div className="mt-4 space-y-3">
            {checklist.map(([heading, copy]) => (
              <div key={heading} className="rounded-[20px] border border-white/10 bg-white/8 p-4">
                <p className="text-sm font-semibold text-white">{heading}</p>
                <p className="mt-2 text-sm leading-6 text-white/78">{copy}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <Link
              href="/admin/qa"
              className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/15"
            >
              QA desk
            </Link>
            <Link
              href="/admin/revenue"
              className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/15"
            >
              Revenue ops
            </Link>
            <Link
              href="/admin/bookings"
              className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/15"
            >
              Booking ops
            </Link>
            <Link
              href="/es/account/bookings"
              className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/15"
            >
              Traveler account
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

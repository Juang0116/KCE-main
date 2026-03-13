import Link from 'next/link';
import { ArrowRight, BadgeCheck, Blocks, LifeBuoy, ShieldCheck, WalletCards } from 'lucide-react';

const lanes = [
  {
    icon: WalletCards,
    eyebrow: 'revenue truth',
    title: 'Charge → booking → assets',
    body: 'Cada venta debe existir como historia continua: Stripe, booking, invoice, calendar, email y account.',
    href: '/admin/revenue',
    label: 'Abrir revenue',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'release gate',
    title: 'QA + verify + recovery',
    body: 'Antes de mover tráfico, valida preflight, RC Verify, mobile QA y recovery de booking/email.',
    href: '/admin/qa',
    label: 'Abrir QA',
  },
  {
    icon: Blocks,
    eyebrow: 'delivery ops',
    title: 'Bookings + soporte',
    body: 'La vista operativa debe dejar claro si el viajero recibió sus activos y si soporte tiene contexto completo.',
    href: '/admin/bookings',
    label: 'Ver bookings',
  },
  {
    icon: LifeBuoy,
    eyebrow: 'traveler continuity',
    title: 'Account confidence',
    body: 'La cuenta del viajero debe sentirse premium: reservas claras, descargas listas y soporte sin fricción.',
    href: '/account/bookings',
    label: 'Abrir account',
  },
] as const;

const checklist = [
  'Una compra real o de prueba termina con booking visible y activos descargables.',
  'Home, tours, detail, booking y account pasan revisión mobile sin ruido ni scroll lateral.',
  'Support, QA y revenue usan el mismo lenguaje para recuperar un caso sin improvisación.',
  'La operación diaria sabe qué revisar antes de escalar campañas, tráfico o ventas.',
] as const;

type Props = {
  title?: string;
  description?: string;
  compact?: boolean;
};

export function ReleaseGradeDeck({
  title = 'Release-grade confidence layer',
  description = 'Este bloque existe para que KCE se opere como una empresa seria: revenue claro, recovery definido, cuenta premium y release confidence antes de empujar más tráfico.',
  compact = false,
}: Props) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-black/10 bg-[linear-gradient(135deg,rgba(9,31,68,0.96),rgba(20,78,168,0.92)_55%,rgba(235,198,78,0.22))] text-white shadow-soft">
      <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="p-5 md:p-6 lg:p-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/76">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            release grade
          </div>
          <h2 className="mt-4 max-w-3xl font-heading text-2xl text-white md:text-3xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78 md:text-base">{description}</p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {lanes.map((lane) => {
              const Icon = lane.icon;
              return (
                <article key={lane.title} className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3 text-white/84">
                    <span className="flex size-10 items-center justify-center rounded-2xl border border-white/12 bg-white/10">
                      <Icon className="size-4.5" aria-hidden="true" />
                    </span>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/58">{lane.eyebrow}</div>
                      <h3 className="mt-1 text-base font-semibold text-white">{lane.title}</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/74">{lane.body}</p>
                  <Link
                    href={lane.href}
                    className="mt-4 inline-flex items-center rounded-full border border-white/14 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-white/14"
                  >
                    {lane.label}
                    <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="border-t border-white/10 bg-black/10 p-5 md:p-6 xl:border-l xl:border-t-0">
          <div className="rounded-[26px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62">launch confidence</div>
            <h3 className="mt-3 font-heading text-2xl text-white">Qué debe sentirse sólido antes de escalar</h3>
            <div className="mt-5 space-y-3">
              {checklist.map((item, idx) => (
                <div key={item} className="rounded-[20px] border border-white/10 bg-white/7 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">0{idx + 1}</div>
                  <p className="mt-2 text-sm leading-6 text-white/82">{item}</p>
                </div>
              ))}
            </div>
            {!compact ? (
              <p className="mt-4 text-sm leading-6 text-white/70">
                Úsalo como recordatorio visual: lo que buscamos ahora no es solo sumar features, sino que cada parte del loop comercial sea más confiable y premium.
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default ReleaseGradeDeck;

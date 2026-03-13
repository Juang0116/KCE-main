import Link from 'next/link';
import { ArrowRight, CalendarPlus2, LifeBuoy, ReceiptText, ShieldCheck } from 'lucide-react';

type Props = {
  localePrefix: string;
  bookingHref?: string;
  supportHref?: string;
  toursHref?: string;
  className?: string;
};

export default function TravelerOpsPolishStrip({
  localePrefix,
  bookingHref,
  supportHref,
  toursHref,
  className = '',
}: Props) {
  const resolvedSupport = supportHref ?? `${localePrefix}/account/support`;
  const resolvedTours = toursHref ?? `${localePrefix}/tours`;

  return (
    <section className={`rounded-[28px] border border-[color:var(--color-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(7,64,145,0.05),rgba(235,196,77,0.12))] p-5 shadow-soft md:p-6 ${className}`.trim()}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/12 bg-brand-blue/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-blue">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            traveler continuity
          </div>
          <h2 className="mt-3 font-heading text-2xl text-brand-blue md:text-3xl">Después de comprar, todo debería sentirse claro y premium</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/74 md:text-base">
            Factura, calendario, booking center y soporte deberían vivir dentro del mismo hilo. Esta franja refuerza justamente esa continuidad.
          </p>
        </div>
        <div className="rounded-[22px] border border-black/10 bg-white/85 px-4 py-3 text-sm text-[color:var(--color-text)]/72 shadow-[0_14px_38px_rgba(0,0,0,0.04)]">
          Meta: menos fricción post-compra y más confianza al volver a KCE.
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <article className="rounded-[22px] border border-[color:var(--color-border)] bg-white/85 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3 text-brand-blue">
            <ReceiptText className="size-4" aria-hidden="true" />
            <p className="text-sm font-semibold">Assets a mano</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">La factura PDF y el calendario deberían abrirse sin obligarte a reconstruir el contexto de la compra.</p>
          {bookingHref ? (
            <Link href={bookingHref} className="mt-4 inline-flex items-center rounded-full border border-[color:var(--color-border)] px-3 py-2 text-sm font-semibold text-brand-blue transition hover:-translate-y-px hover:bg-brand-blue/5">
              Ir al booking center
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </article>

        <article className="rounded-[22px] border border-[color:var(--color-border)] bg-white/85 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3 text-brand-blue">
            <LifeBuoy className="size-4" aria-hidden="true" />
            <p className="text-sm font-semibold">Soporte con contexto</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">Si algo falla, soporte debería recibir el caso asociado al booking correcto y no arrancar desde cero.</p>
          <Link href={resolvedSupport} className="mt-4 inline-flex items-center rounded-full border border-[color:var(--color-border)] px-3 py-2 text-sm font-semibold text-brand-blue transition hover:-translate-y-px hover:bg-brand-blue/5">
            Abrir soporte
          </Link>
        </article>

        <article className="rounded-[22px] border border-[color:var(--color-border)] bg-white/85 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3 text-brand-blue">
            <CalendarPlus2 className="size-4" aria-hidden="true" />
            <p className="text-sm font-semibold">Próximo viaje</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">KCE también debería invitarte a seguir explorando: nuevo tour, shortlist futura y continuidad de marca.</p>
          <Link href={resolvedTours} className="mt-4 inline-flex items-center rounded-full border border-[color:var(--color-border)] px-3 py-2 text-sm font-semibold text-brand-blue transition hover:-translate-y-px hover:bg-brand-blue/5">
            Ver más tours
          </Link>
        </article>
      </div>
    </section>
  );
}

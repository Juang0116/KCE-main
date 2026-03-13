import Link from 'next/link';

import clsx from 'clsx';

type Props = {
  localePrefix: string;
  compact?: boolean;
};

const links = [
  { title: 'Assets ready', body: 'Invoice, booking and next steps stay easy to reopen after purchase.', href: '/account/bookings' },
  { title: 'Support with context', body: 'Move into support without losing the thread of what was already bought.', href: '/account/support' },
  { title: 'Continue exploring', body: 'A premium trip should lead naturally into the next shortlist, not into friction.', href: '/tours' },
] as const;

export default function PremiumTravelerContinuityStrip({ localePrefix, compact = false }: Props) {
  return (
    <section className={clsx('rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft', compact ? 'py-5' : '')}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-brand-blue/15 bg-brand-blue/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue">
            traveler continuity
          </div>
          <h2 className="mt-4 font-heading text-2xl tracking-tight text-brand-blue md:text-3xl">Keep the premium feeling after payment</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--color-text)]/72">
            Booking confidence is not only about charging successfully. It is also about how fast the traveler can reopen assets, reach support and continue the journey without losing calm or context.
          </p>
        </div>
        <Link href={`${localePrefix}/account/bookings`} className="inline-flex rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-px">
          Open booking center
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {links.map((item) => (
          <article key={item.title} className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5 shadow-soft">
            <h3 className="font-heading text-xl tracking-tight text-brand-blue">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{item.body}</p>
            <Link href={`${localePrefix}${item.href}`} className="mt-4 inline-flex rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-2)]">
              Open
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

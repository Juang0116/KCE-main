import Link from 'next/link';

import clsx from 'clsx';

type Props = {
  compact?: boolean;
  title?: string;
  description?: string;
};

type HqLink = {
  title: string;
  body: string;
  href: string;
  tone?: 'dark';
};

const lanes: HqLink[] = [
  {
    title: 'Launch truth',
    body: 'Open QA and revenue first. If checks, payments and delivery assets disagree, hold pressure until the system feels calm again.',
    href: '/admin/qa',
    tone: 'dark',
  },
  {
    title: 'Commercial pressure',
    body: 'Move from sales, marketing and deals only when the lanes still look qualified, premium and recoverable.',
    href: '/admin/sales',
  },
  {
    title: 'Delivery calm',
    body: 'Bookings, account confidence and support should stay readable before you scale traffic or push harder internationally.',
    href: '/admin/bookings',
  },
  {
    title: 'Market next',
    body: 'Use marketing, discover and campaign lanes to decide what to publish, what to scale and what to hold for later.',
    href: '/admin/marketing',
  },
];

export default function ExecutiveLaunchHQDeck({
  compact = false,
  title = 'Executive launch HQ',
  description = 'One command lane to decide what to scale, what to protect and what to fix before pushing KCE harder across markets, content and bookings.',
}: Props) {
  return (
    <section className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft">
      <div className={clsx('flex flex-col gap-3', compact ? 'md:flex-row md:items-end md:justify-between' : '')}>
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-brand-blue/15 bg-brand-blue/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue">
            executive launch hq
          </div>
          <h2 className="mt-4 font-heading text-2xl tracking-tight text-brand-blue md:text-3xl">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--color-text)]/72">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link href="/admin/launch-hq" className="rounded-full bg-brand-blue px-4 py-2 font-semibold text-white transition hover:-translate-y-px">
            Open launch HQ
          </Link>
          <Link href="/admin/command-center" className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]">
            Command Center
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {lanes.map((lane) => (
          <article
            key={lane.title}
            className={clsx(
              'rounded-3xl border p-5 shadow-soft',
              lane.tone === 'dark'
                ? 'border-transparent bg-[linear-gradient(160deg,rgba(6,29,61,0.98),rgba(10,69,135,0.93)_62%,rgba(216,176,74,0.72))] text-white'
                : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]',
            )}
          >
            <div className={clsx('text-[11px] font-semibold uppercase tracking-[0.18em]', lane.tone === 'dark' ? 'text-white/65' : 'text-[color:var(--color-text)]/45')}>
              launch lane
            </div>
            <h3 className={clsx('mt-3 font-heading text-xl tracking-tight', lane.tone === 'dark' ? 'text-white' : 'text-brand-blue')}>
              {lane.title}
            </h3>
            <p className={clsx('mt-2 text-sm leading-6', lane.tone === 'dark' ? 'text-white/82' : 'text-[color:var(--color-text)]/70')}>
              {lane.body}
            </p>
            <Link
              href={lane.href}
              className={clsx(
                'mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-px',
                lane.tone === 'dark'
                  ? 'border border-white/12 bg-white/10 text-white hover:bg-white/15'
                  : 'bg-brand-blue text-white',
              )}
            >
              Open lane
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

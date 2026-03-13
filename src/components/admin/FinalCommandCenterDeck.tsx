import clsx from 'clsx';
import Link from 'next/link';

type CenterLane = {
  kicker: string;
  title: string;
  body: string;
  href: string;
  label: string;
  highlight?: boolean;
};

const lanes: CenterLane[] = [
  {
    kicker: '01 · Launch truth',
    title: 'Open the day from one master view',
    body:
      'Start with QA, revenue and bookings together so traffic, payment, delivery and recovery all read from the same operating truth before anyone pushes harder.',
    href: '/admin/qa',
    label: 'Open QA desk',
  },
  {
    kicker: '02 · Commercial pressure',
    title: 'Push growth only when close quality is holding',
    body:
      'Marketing, sales, AI handoff and traveler support should reinforce the same premium promise. Scale the lanes that still feel curated, calm and recoverable.',
    href: '/admin/marketing',
    label: 'Review growth + sales',
    highlight: true,
  },
  {
    kicker: '03 · Operator calm',
    title: 'Protect delivery while volume grows',
    body:
      'If bookings, account confidence and post-purchase support stay readable, KCE can scale with more confidence instead of adding expensive chaos behind the scenes.',
    href: '/admin/bookings',
    label: 'Inspect bookings',
  },
];

const commandLinks = [
  { href: '/admin/qa', label: 'QA' },
  { href: '/admin/revenue', label: 'Revenue' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/marketing', label: 'Marketing' },
  { href: '/admin/sales', label: 'Sales' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/tickets', label: 'Tickets' },
  { href: '/admin/ai', label: 'AI' },
] as const;

type Props = {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
};

export default function FinalCommandCenterDeck({
  title = 'Final command center',
  description = 'Use one coordinated deck to decide what to push, what to protect and what to fix before scaling harder. The goal is simple: demand, delivery and traveler calm should still agree on the same premium truth.',
  compact = false,
  className,
}: Props) {
  return (
    <section
      className={clsx(
        'overflow-hidden rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] shadow-soft',
        className,
      )}
    >
      <div className={clsx('grid gap-0 lg:grid-cols-[0.96fr_1.04fr]', compact ? 'min-h-0' : 'min-h-[21rem]')}>
        <div className="bg-[linear-gradient(160deg,rgba(8,28,58,0.99),rgba(10,69,135,0.95)_58%,rgba(216,176,74,0.72))] p-7 text-white md:p-9">
          <div className="inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
            command center
          </div>
          <h2 className="mt-5 max-w-xl font-heading text-2xl tracking-tight md:text-[2.15rem]">{title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/78 md:text-[15px]">{description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {['Open truth', 'Push with calm', 'Protect revenue', 'Recover fast'].map((label) => (
              <div
                key={label}
                className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-sm font-medium text-white/84 backdrop-blur"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {commandLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
          {lanes.map((lane) => (
            <article
              key={lane.title}
              className={clsx(
                'rounded-3xl border p-5 shadow-soft',
                lane.highlight
                  ? 'border-transparent bg-[linear-gradient(160deg,rgba(6,29,61,0.98),rgba(10,69,135,0.93)_62%,rgba(216,176,74,0.72))] text-white'
                  : 'border-[var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]',
              )}
            >
              <div className={clsx('text-[11px] font-semibold uppercase tracking-[0.18em]', lane.highlight ? 'text-white/64' : 'text-brand-blue/65')}>
                {lane.kicker}
              </div>
              <h3 className="mt-3 font-heading text-lg tracking-tight">{lane.title}</h3>
              <p className={clsx('mt-2 text-sm leading-6', lane.highlight ? 'text-white/78' : 'text-[color:var(--color-text)]/70')}>
                {lane.body}
              </p>
              <Link
                href={lane.href}
                className={clsx(
                  'mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold transition',
                  lane.highlight
                    ? 'bg-white/12 text-white hover:bg-white/18'
                    : 'bg-brand-blue text-white hover:-translate-y-px',
                )}
              >
                {lane.label}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

type Props = {
  compact?: boolean;
  title?: string;
  description?: string;
};

type Step = {
  label: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  emphasis?: boolean;
};

const steps: Step[] = [
  {
    label: 'Step 01',
    title: 'Reduce noise before scale',
    body: 'Cut duplicate checks and keep the launch read simple enough that any operator knows what to review first before pushing traffic or closing more deals.',
    href: '/admin/qa',
    cta: 'Open QA',
    emphasis: true,
  },
  {
    label: 'Step 02',
    title: 'Confirm paid truth fast',
    body: 'Revenue, bookings and account should tell the same story without forcing the operator to jump across too many panels or guess the next move.',
    href: '/admin/revenue',
    cta: 'Open revenue',
  },
  {
    label: 'Step 03',
    title: 'Keep the traveler path calm',
    body: 'Success, booking center and account should feel like one premium post-purchase lane: assets visible, support clear and follow-up easy.',
    href: '/es/account/bookings',
    cta: 'Open account',
  },
];

const rails = [
  ['Launch fewer messages, better', 'When everything feels urgent, the team loses narrative clarity. Pick the one market lane, one conversion lane and one support lane that matter most this week.'],
  ['Make recovery obvious', 'If a booking or delivery breaks, the next action should be visible immediately: QA, revenue, bookings and support all need a simple recovery path.'],
  ['Protect confidence after the click', 'International growth only scales if the paid traveler still feels guided after checkout, not just before it.'],
] as const;

export default function GoLiveSimplificationDeck({
  compact = false,
  title = 'Go-live simplification system',
  description = 'Use this pass to make KCE easier to operate under pressure: fewer competing signals, clearer operator actions and a calmer traveler journey from campaign to delivery.',
}: Props) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-soft">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-6 md:p-8">
          <div className="inline-flex rounded-full border border-brand-blue/12 bg-brand-blue/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue">
            launch simplification
          </div>
          <h2 className="mt-4 font-heading text-2xl text-brand-blue md:text-3xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-text)]/72">{description}</p>

          <div className={`mt-6 grid gap-4 ${compact ? 'xl:grid-cols-1 2xl:grid-cols-3' : 'md:grid-cols-3'}`}>
            {steps.map((step) => (
              <article
                key={step.title}
                className={step.emphasis
                  ? 'rounded-[22px] border border-transparent bg-[linear-gradient(150deg,rgba(10,61,128,0.98),rgba(10,61,128,0.90)_62%,rgba(216,179,73,0.34))] p-4 text-white shadow-soft'
                  : 'rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4'}
              >
                <div className={step.emphasis ? 'text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62' : 'text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/55'}>
                  {step.label}
                </div>
                <h3 className={step.emphasis ? 'mt-2 text-base font-semibold text-white' : 'mt-2 text-base font-semibold text-brand-blue'}>{step.title}</h3>
                <p className={step.emphasis ? 'mt-2 text-sm leading-6 text-white/82' : 'mt-2 text-sm leading-6 text-[color:var(--color-text)]/72'}>{step.body}</p>
                <div className="mt-4">
                  <Link
                    href={step.href}
                    className={step.emphasis
                      ? 'inline-flex items-center rounded-full border border-white/14 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/14'
                      : 'inline-flex items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-3)]'}
                  >
                    {step.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="border-t border-brand-blue/10 bg-[linear-gradient(160deg,rgba(15,55,120,0.98),rgba(15,55,120,0.90)_62%,rgba(216,179,73,0.16))] p-6 text-white lg:border-l lg:border-t-0 md:p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">operator simplification</div>
          <div className="mt-4 space-y-3">
            {rails.map(([heading, copy]) => (
              <div key={heading} className="rounded-[20px] border border-white/10 bg-white/8 p-4">
                <p className="text-sm font-semibold text-white">{heading}</p>
                <p className="mt-2 text-sm leading-6 text-white/80">{copy}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            {[
              { href: '/admin/qa', label: 'QA' },
              { href: '/admin/revenue', label: 'Revenue' },
              { href: '/admin/bookings', label: 'Bookings' },
              { href: '/admin/sales', label: 'Sales' },
              { href: '/admin/marketing', label: 'Marketing' },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="inline-flex items-center rounded-full border border-white/12 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/15"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

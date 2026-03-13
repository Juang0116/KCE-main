import Link from 'next/link';

function pillLink(href: string, label: string) {
  return (
    <Link
      key={label}
      href={href}
      className="inline-flex items-center rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
    >
      {label}
    </Link>
  );
}

type Props = {
  compact?: boolean;
  title?: string;
  description?: string;
};

type Lane = {
  eyebrow: string;
  title: string;
  body: string;
  links: Array<{ href: string; label: string }>;
  highlight?: boolean;
};

const lanes: Lane[] = [
  {
    eyebrow: 'Acquire',
    title: 'Open more precise intent and market lanes before scaling spend',
    body:
      'Traffic compounds when discovery pages, market pages and the premium catalog all speak with the same promise. Expand only the lanes you can clearly nurture and close.',
    links: [
      { href: '/discover', label: 'Discover' },
      { href: '/discover/uk', label: 'UK' },
      { href: '/discover/luxury', label: 'Luxury' },
    ],
  },
  {
    eyebrow: 'Convert',
    title: 'Make every campaign path end in shortlist, chat or checkout',
    body:
      'Growth only matters when the traveler can move from content to tours, from quiz to human handoff, and from intent to booking without losing confidence.',
    links: [
      { href: '/quiz', label: 'Matcher' },
      { href: '/tours', label: 'Tours' },
      { href: '/admin/sales', label: 'Sales' },
    ],
    highlight: true,
  },
  {
    eyebrow: 'Protect',
    title: 'Keep revenue truth, delivery confidence and operator context aligned',
    body:
      'The market gets dominated when the team can scale without improvising: paid sessions reconcile, bookings persist, assets deliver and support has context fast.',
    links: [
      { href: '/admin/qa', label: 'QA' },
      { href: '/admin/revenue', label: 'Revenue' },
      { href: '/admin/bookings', label: 'Bookings' },
    ],
  },
];

const launchMoves = [
  ['Push today', 'Choose one market lane, one intent lane and one revenue lane to push today instead of spreading the team thin.'],
  ['Measure tonight', 'Read marketing, sales and revenue together so the same session story shows up in all three places.'],
  ['Scale next', 'Only scale the campaign or content lane that keeps both acquisition and post-purchase confidence healthy.'],
] as const;

export default function MarketDominationPlaybookDeck({
  compact = false,
  title = 'Market domination playbook',
  description = 'Use this playbook when KCE is no longer just shipping features and is starting to act like a coordinated international growth machine.',
}: Props) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-soft">
      <div className="grid gap-0 lg:grid-cols-[1.06fr_0.94fr]">
        <div className="p-6 md:p-8">
          <div className="inline-flex rounded-full border border-brand-blue/12 bg-brand-blue/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue">
            market domination polish
          </div>
          <h2 className="mt-4 font-heading text-2xl text-brand-blue md:text-3xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-text)]/72">{description}</p>

          <div className={`mt-6 grid gap-4 ${compact ? 'xl:grid-cols-1 2xl:grid-cols-3' : 'md:grid-cols-3'}`}>
            {lanes.map((lane) => (
              <article
                key={lane.title}
                className={lane.highlight
                  ? 'rounded-[22px] border border-transparent bg-[linear-gradient(150deg,rgba(10,61,128,0.98),rgba(10,61,128,0.88)_62%,rgba(216,179,73,0.35))] p-4 text-white shadow-soft'
                  : 'rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4'}
              >
                <div className={lane.highlight ? 'text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62' : 'text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/55'}>
                  {lane.eyebrow}
                </div>
                <h3 className={lane.highlight ? 'mt-2 text-base font-semibold text-white' : 'mt-2 text-base font-semibold text-brand-blue'}>{lane.title}</h3>
                <p className={lane.highlight ? 'mt-2 text-sm leading-6 text-white/82' : 'mt-2 text-sm leading-6 text-[color:var(--color-text)]/72'}>{lane.body}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {lane.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={lane.highlight
                        ? 'inline-flex items-center rounded-full border border-white/14 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/14'
                        : 'inline-flex items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-3)]'}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="border-t border-brand-blue/10 bg-[linear-gradient(160deg,rgba(15,55,120,0.98),rgba(15,55,120,0.90)_62%,rgba(216,179,73,0.18))] p-6 text-white lg:border-l lg:border-t-0 md:p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">launch playbook</div>
          <div className="mt-4 space-y-3">
            {launchMoves.map(([heading, copy]) => (
              <div key={heading} className="rounded-[20px] border border-white/10 bg-white/8 p-4">
                <p className="text-sm font-semibold text-white">{heading}</p>
                <p className="mt-2 text-sm leading-6 text-white/80">{copy}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            {[
              { href: '/admin/marketing', label: 'Marketing' },
              { href: '/admin/sales', label: 'Sales' },
              { href: '/admin/revenue', label: 'Revenue' },
              { href: '/admin/qa', label: 'QA' },
              { href: '/discover', label: 'Discover' },
            ].map((link) => pillLink(link.href, link.label))}
          </div>
        </aside>
      </div>
    </section>
  );
}

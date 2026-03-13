import Link from 'next/link';

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
    eyebrow: 'Go-live truth',
    title: 'Push only the experience you can protect after the click',
    body:
      'World-class launch means the same promise survives the whole path: discover, tours, booking, assets, support and operator context all stay aligned.',
    highlight: true,
    links: [
      { href: '/admin/qa', label: 'QA' },
      { href: '/admin/revenue', label: 'Revenue' },
      { href: '/admin/bookings', label: 'Bookings' },
    ],
  },
  {
    eyebrow: 'Market confidence',
    title: 'Scale the lanes that stay premium on mobile, sales and delivery',
    body:
      'Do not treat international growth as more pages alone. Scale only the markets and intents that still convert cleanly and feel premium in the handoff to humans.',
    links: [
      { href: '/discover', label: 'Discover' },
      { href: '/admin/marketing', label: 'Marketing' },
      { href: '/admin/sales', label: 'Sales' },
    ],
  },
  {
    eyebrow: 'Traveler trust',
    title: 'Let the paid traveler feel the same quality after booking',
    body:
      'A world-class polish pass should show up where confidence matters most: success, booking center, account and support should feel coherent and calm.',
    links: [
      { href: '/es/account/bookings', label: 'Account' },
      { href: '/booking/demo?t=local-dev', label: 'Booking view' },
      { href: '/es/checkout/success', label: 'Success' },
    ],
  },
];

const playbook = [
  ['Protect the premium path', 'Review mobile first, then revenue truth, then human handoff. Launch confidence is lost fastest where the traveler touches friction directly.'],
  ['Scale with one story', 'Keep growth, sales, bookings and support speaking the same promise. Every lane should know what to say, what to check and where to recover.'],
  ['Finish the loop', 'A launch feels world-class only when the traveler can move from inspiration to purchase to support without confusion or duplicate effort.'],
] as const;

export default function WorldClassGoLiveDeck({
  compact = false,
  title = 'World-class go-live system',
  description = 'Use this as the final polish lens before heavier traffic: the site, the team and the paid journey should all feel coordinated, premium and calm.',
}: Props) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-soft">
      <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="p-6 md:p-8">
          <div className="inline-flex rounded-full border border-brand-blue/12 bg-brand-blue/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue">
            world-class polish
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
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">go-live playbook</div>
          <div className="mt-4 space-y-3">
            {playbook.map(([heading, copy]) => (
              <div key={heading} className="rounded-[20px] border border-white/10 bg-white/8 p-4">
                <p className="text-sm font-semibold text-white">{heading}</p>
                <p className="mt-2 text-sm leading-6 text-white/80">{copy}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            {[
              { href: '/admin/qa', label: 'QA' },
              { href: '/admin/marketing', label: 'Marketing' },
              { href: '/admin/sales', label: 'Sales' },
              { href: '/admin/bookings', label: 'Bookings' },
              { href: '/discover', label: 'Discover' },
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

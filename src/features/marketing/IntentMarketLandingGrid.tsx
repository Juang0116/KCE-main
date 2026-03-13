import Link from 'next/link';


type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

type Props = {
  locale: SupportedLocale;
  className?: string;
};

const cards = [
  {
    href: '/discover/europe',
    eyebrow: 'Europe-ready',
    title: 'Landing for first-time Europe demand',
    body: 'Warm up travelers who need trust, planning clarity and a curated first shortlist for Colombia.',
  },
  {
    href: '/discover/coffee',
    eyebrow: 'Coffee intent',
    title: 'Coffee routes that feel unmistakably Colombian',
    body: 'Perfect for travelers searching coffee culture, landscapes, tastings and finca experiences.',
  },
  {
    href: '/discover/cultural',
    eyebrow: 'Culture seekers',
    title: 'Shortlists for art, heritage and local stories',
    body: 'Use this path for travelers who value meaning, people, neighborhoods and guided context.',
  },
  {
    href: '/discover/luxury',
    eyebrow: 'Luxury buyers',
    title: 'Premium comfort, concierge feel and polished service',
    body: 'For travelers who expect boutique quality, private guidance and a more elevated brand promise.',
  },
  {
    href: '/discover/family',
    eyebrow: 'Family planning',
    title: 'Safer, calmer routes for parents and mixed-age groups',
    body: 'Built for family decision makers who want clarity, rhythm and lower-friction planning.',
  },
  {
    href: '/discover/adventure',
    eyebrow: 'Adventure intent',
    title: 'Nature, movement and high-energy Colombia experiences',
    body: 'Useful for travelers who want landscapes, outdoors and memorable movement-led days.',
  },

  {
    href: '/discover/romantic',
    eyebrow: 'Romantic journeys',
    title: 'Honeymoon, anniversary and slow-romance routes',
    body: 'Useful for couples who want boutique atmosphere, softer pacing and premium memory-making.',
  },
  {
    href: '/discover/wellness',
    eyebrow: 'Wellness intent',
    title: 'Recharge-led Colombia with calmer premium planning',
    body: 'Useful for travelers looking for nature, recovery, softer rhythm and feel-good travel framing.',
  },
  {
    href: '/discover/remote-work',
    eyebrow: 'Remote work',
    title: 'Longer-stay planning for flexible digital travelers',
    body: 'Useful for mobile professionals, creative sabbaticals and slow-travel decision makers.',
  },
  {
    href: '/discover/student',
    eyebrow: 'Student & young adults',
    title: 'Budget-aware discovery with culture and movement',
    body: 'Useful for younger travelers who need clarity, confidence and a more accessible first route into Colombia.',
  },
  {
    href: '/discover/uk',
    eyebrow: 'UK market',
    title: 'Premium planning lane for UK-based demand',
    body: 'Useful for traffic looking for polished planning, stronger reassurance and premium long-haul framing.',
  },
  {
    href: '/discover/france',
    eyebrow: 'France market',
    title: 'Editorial, culture-first lane for France-based traffic',
    body: 'Useful when the traveler responds to gastronomy, stories, neighborhoods and more editorial discovery.',
  },
  {
    href: '/discover/germany',
    eyebrow: 'Germany market',
    title: 'Structure-first lane for Germany-based planning intent',
    body: 'Useful for travelers who value clarity, trust, nature and a more organized booking route.',
  },
  {
    href: '/destinations',
    eyebrow: 'By city',
    title: 'Browse Colombia by destination',
    body: 'Useful when the user already has a city in mind and wants to compare the best matching experiences.',
  },
] as const;

export default function IntentMarketLandingGrid({ locale, className }: Props) {
  return (
    <section className={cx('space-y-4', className)} aria-label='Intent and market landings'>
      <div className='flex flex-col gap-2 md:flex-row md:items-end md:justify-between'>
        <div>
          <div className='inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/60'>
            Intent paths
          </div>
          <h2 className='mt-3 font-heading text-2xl tracking-tight text-brand-blue'>Landing pages by market and purchase intent</h2>
          <p className='mt-2 max-w-3xl text-sm text-[color:var(--color-text)]/70'>
            These paths help KCE capture colder traffic with a more relevant promise instead of sending everyone to the same generic page.
          </p>
        </div>
        <Link
          href={withLocale(locale, '/discover')}
          className='inline-flex items-center gap-2 text-sm font-semibold text-brand-blue transition hover:translate-x-0.5'
        >
          Explore the discover hub <span aria-hidden='true'>→</span>
        </Link>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
        {cards.map((card) => (
          <Link
            key={card.href}
            href={withLocale(locale, card.href)}
            className={cx(
              'group rounded-[calc(var(--radius)+0.3rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft transition',
              'hover:-translate-y-px hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40',
            )}
          >
            <div className='text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-yellow'>{card.eyebrow}</div>
            <h3 className='mt-3 text-lg font-semibold tracking-tight text-[color:var(--color-text)]'>{card.title}</h3>
            <p className='mt-2 text-sm leading-6 text-[color:var(--color-text)]/70'>{card.body}</p>
            <div className='mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue'>
              Open landing <span className='transition group-hover:translate-x-0.5' aria-hidden='true'>→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

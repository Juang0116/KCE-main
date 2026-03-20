import Link from 'next/link';
import clsx from 'clsx';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

type Props = {
  locale: SupportedLocale;
  whatsAppHref?: string | null;
  className?: string;
};


type DeckLink = {
  label: string;
  href: string;
  external?: boolean;
};

type GrowthLane = {
  kicker: string;
  title: string;
  body: string;
  highlight?: boolean;
  links: readonly DeckLink[];
};

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

export default function GrowthMachine20Deck({ locale, whatsAppHref, className }: Props) {
  const humanHref = whatsAppHref ?? withLocale(locale, '/contact');

  const lanes: readonly GrowthLane[] = [
    {
      kicker: '01 · Intent clusters',
      title: 'Grow beyond one generic discover page',
      body: 'Open more precise entry lanes for wellness, romance, remote work and student planning so colder traffic lands on a promise that feels made for them.',
      links: [
        { label: 'Wellness lane', href: withLocale(locale, '/discover/wellness') },
        { label: 'Romantic lane', href: withLocale(locale, '/discover/romantic') },
        { label: 'Remote-work lane', href: withLocale(locale, '/discover/remote-work') },
      ],
    },
    {
      kicker: '02 · Market expansion',
      title: 'Pair intent with international market framing',
      body: 'Keep UK, France and Germany live, then layer new content routes on top so paid traffic, SEO and partnerships can enter KCE through stronger market-specific narratives.',
      highlight: true,
      links: [
        { label: 'UK lane', href: withLocale(locale, '/discover/uk') },
        { label: 'France lane', href: withLocale(locale, '/discover/france') },
        { label: 'Germany lane', href: withLocale(locale, '/discover/germany') },
      ],
    },
    {
      kicker: '03 · Human conversion',
      title: 'Close with shortlist, matcher and human handoff',
      body: 'Make every content lane end in the same machine: tours, matcher, lead magnet or human support. That keeps growth tied to conversion instead of vanity traffic.',
      links: [
        { label: 'Personalized plan', href: withLocale(locale, '/plan') },
        { label: 'Lead magnet EU', href: withLocale(locale, '/lead-magnets/eu-guide') },
        { label: 'Talk to KCE', href: humanHref, external: !!whatsAppHref },
      ],
    },
  ];

  return (
    <section
      className={clsx(
        'overflow-hidden rounded-[calc(var(--radius)+0.55rem)] border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,243,234,0.96))] shadow-soft',
        className,
      )}
      aria-label='Growth machine 2.0'
    >
      <div className='border-b border-[color:var(--color-border)] px-6 py-6 sm:px-8'>
        <div className='inline-flex rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/60'>
          Growth machine 2.0
        </div>
        <h2 className='mt-3 font-heading text-[1.95rem] leading-[0.98] text-brand-blue md:text-[2.35rem]'>Build a broader international acquisition machine without losing conversion discipline.</h2>
        <p className='mt-3 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/72 md:text-[0.98rem]'>
          This layer expands KCE from premium catalog + matcher into a clearer market machine: more relevant content lanes, tighter interlinking and a stronger bridge from content to human-assisted close.
        </p>
      </div>

      <div className='grid gap-4 px-6 py-6 md:grid-cols-3 sm:px-8'>
        {lanes.map((lane) => (
          <div
            key={lane.title}
            className={clsx(
              'rounded-[1.35rem] border p-5 shadow-soft',
              lane.highlight
                ? 'border-transparent bg-[linear-gradient(155deg,rgba(6,29,61,0.98),rgba(10,69,135,0.95)_62%,rgba(216,176,74,0.74))] text-white'
                : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)]',
            )}
          >
            <div className={clsx('text-[11px] font-semibold uppercase tracking-[0.18em]', lane.highlight ? 'text-white/68' : 'text-[color:var(--color-text)]/55')}>{lane.kicker}</div>
            <h3 className={clsx('mt-3 text-xl font-semibold tracking-tight', lane.highlight ? 'text-white' : 'text-[color:var(--color-text)]')}>{lane.title}</h3>
            <p className={clsx('mt-3 text-sm leading-6', lane.highlight ? 'text-white/82' : 'text-[color:var(--color-text)]/72')}>{lane.body}</p>
            <div className='mt-5 flex flex-col gap-2'>
              {lane.links.map((link) => {
                const className = clsx(
                  'inline-flex items-center justify-between rounded-full border px-3.5 py-2 text-sm font-semibold transition',
                  lane.highlight
                    ? 'border-white/18 bg-white/10 text-white hover:bg-white/14'
                    : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)] hover:bg-[color:var(--color-surface)]',
                );
                return link.external ? (
                  <a key={link.label} href={link.href} target='_blank' rel='noreferrer' className={className}>
                    <span>{link.label}</span>
                    <span aria-hidden='true'>↗</span>
                  </a>
                ) : (
                  <Link key={link.label} href={link.href} className={className}>
                    <span>{link.label}</span>
                    <span aria-hidden='true'>→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

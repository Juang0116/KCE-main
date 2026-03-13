import Link from "next/link";

import type { SupportedLocale } from '@/i18n/getDictionary';

type Props = {
  locale: SupportedLocale;
  whatsAppHref?: string | null;
  compact?: boolean;
};

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

const tiles = [
  {
    kicker: 'Luxury signal',
    title: 'Less clutter, more confidence',
    body: 'Premium design starts reading better when the traveler sees fewer competing boxes and clearer next actions.',
  },
  {
    kicker: 'Conversion signal',
    title: 'One promise through the whole lane',
    body: 'Marketing, tours, booking and support should feel like the same brand voice instead of separate systems stitched together.',
  },
  {
    kicker: 'Trust signal',
    title: 'High-touch where it matters',
    body: 'The premium feel survives when help, delivery assets and follow-up are still obvious after the click, not just before it.',
  },
] as const;

export default function LuxurySignalStrip({ locale, whatsAppHref, compact = false }: Props) {
  const contactHref = whatsAppHref ?? withLocale(locale, '/contact');
  const contactLabel = whatsAppHref ? 'WhatsApp' : 'Contact';

  return (
    <section className="overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,244,236,0.97))] shadow-soft">
      <div className="grid gap-0 lg:grid-cols-[1.04fr_0.96fr]">
        <div className="p-6 md:p-8">
          <div className="inline-flex rounded-full border border-brand-blue/12 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue shadow-soft">
            premium signal system
          </div>
          <h2 className="mt-4 font-heading text-2xl text-brand-blue md:text-3xl">Keep KCE feeling premium even when the traveler moves fast</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-text)]/72">
            This strip acts like a final luxury reminder: cleaner hierarchy, calmer support and a sharper commercial narrative all raise confidence before and after booking.
          </p>

          <div className={`mt-6 grid gap-4 ${compact ? 'md:grid-cols-3' : 'md:grid-cols-3'}`}>
            {tiles.map((tile) => (
              <article key={tile.title} className="rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-soft">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue/75">{tile.kicker}</div>
                <h3 className="mt-2 text-base font-semibold text-[color:var(--color-text)]">{tile.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">{tile.body}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="border-t border-brand-blue/10 bg-[linear-gradient(160deg,rgba(8,41,86,0.98),rgba(11,84,162,0.96)_62%,rgba(216,176,74,0.34))] p-6 text-white lg:border-l lg:border-t-0 md:p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">luxury closeout</div>
          <div className="mt-4 space-y-3">
            {[
              'Open the catalog only when it feels easier to scan than to guess.',
              'Let the traveler choose between guided, human and direct routes without forcing extra explanation.',
              'Make support and booking assets visible enough that international buyers stay calm after payment.',
            ].map((item, idx) => (
              <div key={item} className="rounded-[20px] border border-white/10 bg-white/8 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">0{idx + 1}</div>
                <p className="mt-2 text-sm leading-6 text-white/80">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <Link href={withLocale(locale, '/tours')} className="inline-flex items-center rounded-full border border-white/12 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/15">Browse tours</Link>
            <Link href={withLocale(locale, '/discover')} className="inline-flex items-center rounded-full border border-white/12 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/15">Discover</Link>
            <Link href={withLocale(locale, '/plan')} className="inline-flex items-center rounded-full border border-white/12 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/15">Plan</Link>
            <a href={contactHref} target={whatsAppHref ? '_blank' : undefined} rel={whatsAppHref ? 'noreferrer' : undefined} className="inline-flex items-center rounded-full border border-white/12 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/15">{contactLabel}</a>
          </div>
        </aside>
      </div>
    </section>
  );
}

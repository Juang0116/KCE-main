import Link from 'next/link';
import clsx from 'clsx';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

type Props = {
  locale: SupportedLocale;
  className?: string;
  whatsAppHref?: string | null;
};

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

function copy(locale: SupportedLocale) {
  switch (locale) {
    case 'en':
      return {
        kicker: 'Luxury polish',
        title: 'Make the launch feel premium at every step',
        body: 'The strongest travel brands keep their promise calm, clear and elegant from first click to support after payment.',
        primary: 'Browse tours',
        secondary: 'Open personalized plan',
        tertiary: 'WhatsApp',
        cards: ['Sharper story', 'Cleaner conversion', 'Calmer delivery'],
      };
    case 'fr':
      return {
        kicker: 'Luxury polish',
        title: 'Donne au lancement une sensation premium à chaque étape',
        body: 'Les meilleures marques de voyage gardent une promesse claire, calme et élégante du premier clic jusqu’au support après paiement.',
        primary: 'Voir les tours',
        secondary: 'Ouvrir le plan personnalisé',
        tertiary: 'WhatsApp',
        cards: ['Narratif plus net', 'Conversion plus claire', 'Livraison plus calme'],
      };
    case 'de':
      return {
        kicker: 'Luxury polish',
        title: 'Lass den Launch in jedem Schritt premium wirken',
        body: 'Starke Travel Brands halten ihr Versprechen vom ersten Klick bis zum Support nach dem Kauf ruhig, klar und hochwertig.',
        primary: 'Touren ansehen',
        secondary: 'Persönlichen Plan öffnen',
        tertiary: 'WhatsApp',
        cards: ['Klarere Story', 'Sauberere Conversion', 'Ruhigere Delivery'],
      };
    default:
      return {
        kicker: 'Luxury polish',
        title: 'Haz que el lanzamiento se sienta premium en cada paso',
        body: 'Las marcas de viaje más fuertes mantienen una promesa clara, calmada y elegante desde el primer clic hasta el soporte post-compra.',
        primary: 'Ver tours',
        secondary: 'Abrir plan personalizado',
        tertiary: 'WhatsApp',
        cards: ['Narrativa más fina', 'Conversión más limpia', 'Entrega más calmada'],
      };
  }
}

export default function LuxuryLaunchPolishStrip({ locale, className, whatsAppHref }: Props) {
  const c = copy(locale);
  const waOrContact = whatsAppHref ?? withLocale(locale, '/contact');

  return (
    <section className={clsx('overflow-hidden rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] shadow-soft', className)}>
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-7 md:p-9">
          <div className="inline-flex rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue/80">
            {c.kicker}
          </div>
          <h2 className="mt-4 max-w-2xl font-heading text-2xl tracking-tight text-brand-blue md:text-[2.15rem]">{c.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--color-text)]/72 md:text-[15px]">{c.body}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={withLocale(locale, '/tours')} className="inline-flex items-center rounded-full bg-brand-blue px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-px">
              {c.primary}
            </Link>
            <Link href={withLocale(locale, '/plan')} className="inline-flex items-center rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-2)]">
              {c.secondary}
            </Link>
            <a href={waOrContact} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-2)]">
              {c.tertiary}
            </a>
          </div>
        </div>
        <div className="border-t border-brand-blue/10 bg-[linear-gradient(160deg,rgba(6,29,61,0.98),rgba(10,69,135,0.94)_60%,rgba(216,176,74,0.72))] p-7 text-white lg:border-l lg:border-t-0 md:p-9">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {c.cards.map((card, idx) => (
              <div key={card} className="rounded-3xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/62">0{idx + 1}</div>
                <div className="mt-2 font-heading text-lg">{card}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

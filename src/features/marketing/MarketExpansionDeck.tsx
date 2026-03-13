import Link from 'next/link';
import clsx from 'clsx';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

type Props = {
  locale: SupportedLocale;
  whatsAppHref?: string | null;
  className?: string;
};

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

function getCopy(locale: SupportedLocale, whatsAppHref?: string | null) {
  const humanHref = whatsAppHref || withLocale(locale, '/contact');

  switch (locale) {
    case 'en':
      return {
        eyebrow: 'market expansion system',
        title: 'Launch KCE with clearer market-by-market growth lanes.',
        subtitle:
          'Use country-aware pages, a tighter content rhythm and a stronger handoff path so colder international demand gets a more relevant promise from the first click.',
        markets: [
          { label: 'United Kingdom', href: withLocale(locale, '/discover/uk'), hint: 'City breaks, premium planning, reassurance-first copy.' },
          { label: 'France', href: withLocale(locale, '/discover/france'), hint: 'Culture, gastronomy and a more editorial shortlist style.' },
          { label: 'Germany', href: withLocale(locale, '/discover/germany'), hint: 'Clarity, structure, trust and nature-forward positioning.' },
        ],
        lanes: [
          { kicker: 'Acquire', title: 'Search + partnerships', body: 'Match the market page to campaigns, affiliates, travel content and cold traffic routes.' },
          { kicker: 'Nurture', title: 'Lead magnet + newsletter', body: 'Keep undecided visitors in the KCE system until they are ready for tours, matcher or a human conversation.' },
          { kicker: 'Close', title: 'WhatsApp + secure checkout', body: 'Give stronger-intent travelers a clean route to shortlist, chat and book without losing confidence.' },
        ],
        ctas: [
          { label: 'Open discover hub', href: withLocale(locale, '/discover') },
          { label: 'Talk to KCE', href: humanHref, external: !!whatsAppHref },
        ],
      };
    case 'fr':
      return {
        eyebrow: 'système d’expansion marché',
        title: 'Lancer KCE avec des routes de croissance plus précises par marché.',
        subtitle:
          'Utilise des pages adaptées par pays, un rythme de contenu plus fort et un meilleur handoff pour que la demande internationale froide reçoive une promesse plus pertinente dès le premier clic.',
        markets: [
          { label: 'Royaume-Uni', href: withLocale(locale, '/discover/uk'), hint: 'City breaks, cadrage premium et rassurance.' },
          { label: 'France', href: withLocale(locale, '/discover/france'), hint: 'Culture, gastronomie et shortlist plus éditoriale.' },
          { label: 'Allemagne', href: withLocale(locale, '/discover/germany'), hint: 'Clarté, structure, confiance et nature.' },
        ],
        lanes: [
          { kicker: 'Acquisition', title: 'Search + partenaires', body: 'Associe chaque page marché à des campagnes, affiliés et contenus adaptés.' },
          { kicker: 'Nurture', title: 'Lead magnet + newsletter', body: 'Garde le visiteur indécis dans le système KCE jusqu’au matcher, aux tours ou au handoff humain.' },
          { kicker: 'Conversion', title: 'WhatsApp + checkout sécurisé', body: 'Donne une route claire vers shortlist, conversation et réservation.' },
        ],
        ctas: [
          { label: 'Ouvrir discover', href: withLocale(locale, '/discover') },
          { label: 'Parler à KCE', href: humanHref, external: !!whatsAppHref },
        ],
      };
    case 'de':
      return {
        eyebrow: 'markt-expansionssystem',
        title: 'KCE mit klareren Wachstumsrouten pro Markt ausrollen.',
        subtitle:
          'Nutze länderspezifische Seiten, stärkeren Content-Rhythmus und besseren Handoff, damit kalte internationale Nachfrage schon beim ersten Klick relevanter abgeholt wird.',
        markets: [
          { label: 'Vereinigtes Königreich', href: withLocale(locale, '/discover/uk'), hint: 'City breaks, Premium-Planung und starke Orientierung.' },
          { label: 'Frankreich', href: withLocale(locale, '/discover/france'), hint: 'Kultur, Gastronomie und editoriale Shortlist.' },
          { label: 'Deutschland', href: withLocale(locale, '/discover/germany'), hint: 'Struktur, Vertrauen und naturorientierte Positionierung.' },
        ],
        lanes: [
          { kicker: 'Acquire', title: 'Search + Partner', body: 'Verbinde jede Marktseite mit Kampagnen, Affiliates und passenden Content-Einstiegen.' },
          { kicker: 'Nurture', title: 'Lead Magnet + Newsletter', body: 'Halte unsicheren Traffic im KCE-System bis zu Matcher, Touren oder menschlichem Handoff.' },
          { kicker: 'Close', title: 'WhatsApp + sicherer Checkout', body: 'Gib Nutzern mit stärkerer Absicht einen klaren Weg zu Shortlist, Gespräch und Buchung.' },
        ],
        ctas: [
          { label: 'Discover öffnen', href: withLocale(locale, '/discover') },
          { label: 'Mit KCE sprechen', href: humanHref, external: !!whatsAppHref },
        ],
      };
    default:
      return {
        eyebrow: 'sistema de expansión internacional',
        title: 'Lanza KCE con rutas de crecimiento más claras por mercado.',
        subtitle:
          'Usa páginas adaptadas por país, un ritmo de contenido más fuerte y un mejor handoff para que la demanda internacional fría reciba una promesa más relevante desde el primer clic.',
        markets: [
          { label: 'Reino Unido', href: withLocale(locale, '/discover/uk'), hint: 'City breaks, planeación premium y copy de confianza.' },
          { label: 'Francia', href: withLocale(locale, '/discover/france'), hint: 'Cultura, gastronomía y shortlist más editorial.' },
          { label: 'Alemania', href: withLocale(locale, '/discover/germany'), hint: 'Claridad, estructura, confianza y posicionamiento nature-first.' },
        ],
        lanes: [
          { kicker: 'Atraer', title: 'Search + partnerships', body: 'Conecta cada página mercado con campañas, afiliados, contenido y rutas de tráfico frío.' },
          { kicker: 'Nutrir', title: 'Lead magnet + newsletter', body: 'Mantén al visitante indeciso dentro del sistema KCE hasta que esté listo para tours, matcher o conversación humana.' },
          { kicker: 'Cerrar', title: 'WhatsApp + checkout seguro', body: 'Da una ruta clara a shortlist, chat y compra sin perder confianza.' },
        ],
        ctas: [
          { label: 'Abrir discover', href: withLocale(locale, '/discover') },
          { label: 'Hablar con KCE', href: humanHref, external: !!whatsAppHref },
        ],
      };
  }
}

export default function MarketExpansionDeck({ locale, whatsAppHref, className }: Props) {
  const copy = getCopy(locale, whatsAppHref);

  return (
    <section
      className={clsx(
        'overflow-hidden rounded-[calc(var(--radius)+0.55rem)] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(245,248,255,0.96))] shadow-soft',
        className,
      )}
    >
      <div className='border-b border-[var(--color-border)] px-6 py-6 sm:px-8'>
        <div className='inline-flex rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/60'>
          {copy.eyebrow}
        </div>
        <h2 className='mt-3 font-heading text-[1.9rem] leading-[0.98] text-brand-blue md:text-[2.3rem]'>{copy.title}</h2>
        <p className='mt-3 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/72 md:text-[0.98rem]'>{copy.subtitle}</p>
      </div>

      <div className='grid gap-4 px-6 py-6 lg:grid-cols-[1.05fr_0.95fr] sm:px-8'>
        <div className='space-y-3'>
          {copy.markets.map((market) => (
            <Link
              key={market.label}
              href={market.href}
              className='group flex items-start justify-between gap-4 rounded-[1.2rem] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-soft transition hover:-translate-y-px hover:shadow-2xl'
            >
              <div>
                <div className='text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/55'>Market lane</div>
                <div className='mt-2 text-lg font-semibold tracking-tight text-[color:var(--color-text)]'>{market.label}</div>
                <p className='mt-1 text-sm leading-6 text-[color:var(--color-text)]/72'>{market.hint}</p>
              </div>
              <div className='pt-1 text-lg font-semibold text-brand-blue transition group-hover:translate-x-0.5'>→</div>
            </Link>
          ))}
        </div>

        <div className='rounded-[1.35rem] border border-transparent bg-[linear-gradient(155deg,rgba(6,29,61,0.98),rgba(10,69,135,0.95)_62%,rgba(216,176,74,0.74))] p-5 text-white shadow-soft'>
          <div className='grid gap-4'>
            {copy.lanes.map((lane) => (
              <div key={lane.title} className='rounded-[1.05rem] border border-white/12 bg-white/8 p-4'>
                <div className='text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68'>{lane.kicker}</div>
                <div className='mt-2 text-lg font-semibold tracking-tight'>{lane.title}</div>
                <p className='mt-2 text-sm leading-6 text-white/82'>{lane.body}</p>
              </div>
            ))}

            <div className='mt-1 flex flex-wrap gap-3'>
              {copy.ctas.map((cta) =>
                cta.external ? (
                  <a key={cta.label} href={cta.href} target='_blank' rel='noreferrer' className='inline-flex items-center rounded-full border border-white/18 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/14'>
                    {cta.label}
                  </a>
                ) : (
                  <Link key={cta.label} href={cta.href} className='inline-flex items-center rounded-full border border-white/18 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/14'>
                    {cta.label}
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

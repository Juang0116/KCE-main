import Link from 'next/link';
import clsx from 'clsx';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

type Props = {
  locale: SupportedLocale;
  whatsAppHref?: string | null;
  className?: string;
  compact?: boolean;
};

type Lane = {
  kicker: string;
  title: string;
  body: string;
  highlight?: boolean;
};

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

function getCopy(locale: SupportedLocale): {
  kicker: string;
  title: string;
  body: string;
  primary: string;
  secondary: string;
  tertiary: string;
  lanes: Lane[];
} {
  switch (locale) {
    case 'en':
      return {
        kicker: 'Conversion authority',
        title: 'Let premium certainty carry the close',
        body:
          'When traffic is stronger and intent is warmer, the traveler should feel guided by authority: a clearer shortlist, calmer booking path and visible human support.',
        primary: 'Browse tours',
        secondary: 'Open discover',
        tertiary: 'Talk on WhatsApp',
        lanes: [
          {
            kicker: '01 · Stronger shortlist',
            title: 'Give fewer, better next steps',
            body: 'Keep the traveler moving through the best-fit lane instead of forcing a generic browse path.',
          },
          {
            kicker: '02 · Premium certainty',
            title: 'Make trust visible before friction appears',
            body: 'Show secure booking, advisor support and delivery calm before the traveler feels the need to ask.',
            highlight: true,
          },
          {
            kicker: '03 · Human backup',
            title: 'Keep the rescue lane elegant',
            body: 'If the traveler hesitates, human help should feel like part of the premium flow, not a fallback hack.',
          },
        ],
      };
    case 'fr':
      return {
        kicker: 'Autorité de conversion',
        title: 'Laisse la certitude premium porter la décision',
        body:
          'Quand le trafic est plus fort et l’intention plus chaude, le voyageur doit sentir une vraie autorité: shortlist plus nette, réservation plus calme et aide humaine visible.',
        primary: 'Voir les tours',
        secondary: 'Ouvrir discover',
        tertiary: 'Parler sur WhatsApp',
        lanes: [
          { kicker: '01 · Shortlist plus forte', title: 'Moins d’options, mais meilleures', body: 'Fais avancer le voyageur dans la bonne voie au lieu de le laisser dans un browse trop générique.' },
          { kicker: '02 · Certitude premium', title: 'Montrer la confiance avant la friction', body: 'Affiche la réservation sécurisée, le support humain et le calme de la livraison avant que le doute n’apparaisse.', highlight: true },
          { kicker: '03 · Sauvetage humain', title: 'Garder l’aide humaine élégante', body: 'Si le voyageur hésite, l’aide doit sembler intégrée au flux premium, pas improvisée.' },
        ],
      };
    case 'de':
      return {
        kicker: 'Conversion-Autorität',
        title: 'Lass Premium-Sicherheit den Abschluss tragen',
        body:
          'Wenn Traffic stärker und Absicht wärmer wird, sollte der Reisende echte Orientierung spüren: klarere Shortlist, ruhigere Buchung und sichtbare menschliche Hilfe.',
        primary: 'Touren ansehen',
        secondary: 'Discover öffnen',
        tertiary: 'Per WhatsApp sprechen',
        lanes: [
          { kicker: '01 · Stärkere Shortlist', title: 'Weniger, aber bessere nächste Schritte', body: 'Halte den Reisenden im bestpassenden Pfad statt in generischem Browsing.' },
          { kicker: '02 · Premium-Sicherheit', title: 'Vertrauen vor Reibung sichtbar machen', body: 'Zeige sichere Buchung, Beratung und Delivery-Ruhe bevor Zweifel entstehen.', highlight: true },
          { kicker: '03 · Menschliche Hilfe', title: 'Den Rettungspfad elegant halten', body: 'Wenn der Reisende zögert, sollte Hilfe Teil des Premium-Flows bleiben.' },
        ],
      };
    default:
      return {
        kicker: 'Autoridad de conversión',
        title: 'Haz que la certeza premium sostenga el cierre',
        body:
          'Cuando el tráfico entra mejor y la intención ya está más caliente, el viajero debe sentir una autoridad clara: shortlist más firme, reserva más calmada y ayuda humana visible.',
        primary: 'Ver tours',
        secondary: 'Abrir discover',
        tertiary: 'Hablar por WhatsApp',
        lanes: [
          {
            kicker: '01 · Shortlist más fuerte',
            title: 'Dar menos pasos, pero mejores',
            body: 'Mantén al viajero dentro del camino más adecuado en vez de dejarlo en un browse demasiado genérico.',
          },
          {
            kicker: '02 · Certeza premium',
            title: 'Mostrar confianza antes de que aparezca la fricción',
            body: 'Haz visible la reserva segura, el soporte humano y la calma de la entrega antes de que el viajero sienta la duda.',
            highlight: true,
          },
          {
            kicker: '03 · Rescate humano',
            title: 'Mantener elegante el camino de ayuda',
            body: 'Si el viajero duda, la ayuda humana debe sentirse integrada al flujo premium, no como un parche de última hora.',
          },
        ],
      };
  }
}

export default function ConversionAuthorityStrip({ locale, whatsAppHref, className, compact = false }: Props) {
  const copy = getCopy(locale);
  const waOrContact = whatsAppHref ?? withLocale(locale, '/contact');

  return (
    <section
      className={clsx(
        'overflow-hidden rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] shadow-soft',
        className,
      )}
    >
      <div className={clsx('grid gap-0 lg:grid-cols-[0.96fr_1.04fr]', compact ? 'min-h-0' : 'min-h-[22rem]')}>
        <div className="bg-[linear-gradient(165deg,rgba(6,29,61,0.98),rgba(10,69,135,0.95)_58%,rgba(216,176,74,0.72))] p-7 text-white md:p-9">
          <div className="inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
            {copy.kicker}
          </div>
          <h2 className="mt-5 max-w-xl font-heading text-2xl tracking-tight md:text-[2.15rem]">{copy.title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/78 md:text-[15px]">{copy.body}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={withLocale(locale, '/tours')} className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-dark shadow-soft transition hover:-translate-y-px">
              {copy.primary}
            </Link>
            <Link href={withLocale(locale, '/discover')} className="inline-flex items-center rounded-full border border-white/16 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12">
              {copy.secondary}
            </Link>
            <a
              href={waOrContact}
              target={waOrContact.startsWith('http') ? '_blank' : undefined}
              rel={waOrContact.startsWith('http') ? 'noreferrer' : undefined}
              className="inline-flex items-center rounded-full border border-white/16 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
            >
              {copy.tertiary}
            </a>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
          {copy.lanes.map((lane) => (
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
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

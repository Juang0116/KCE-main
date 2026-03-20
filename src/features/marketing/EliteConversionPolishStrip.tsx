import Link from 'next/link';
import clsx from 'clsx';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

type Props = {
  locale: SupportedLocale;
  whatsAppHref?: string | null;
  className?: string;
  compact?: boolean;
};

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

function getCopy(locale: SupportedLocale) {
  switch (locale) {
    case 'en':
      return {
        kicker: 'Elite conversion polish',
        title: 'Tighten the path from first click to protected booking',
        body:
          'Reduce decision friction with a calmer shortlist, a stronger human handoff and a booking path that keeps trust visible all the way through payment and delivery.',
        primary: 'Browse tours',
        secondary: 'Open personalized plan',
        tertiary: 'Talk on WhatsApp',
        lanes: [
          {
            kicker: '01 · Shortlist rhythm',
            title: 'Show fewer, stronger options',
            body: 'Move travelers from generic browsing into clearer picks by city, style and intent before sending them to checkout.',
          },
          {
            kicker: '02 · Human rescue',
            title: 'Keep advisory support one click away',
            body: 'When the traveler hesitates, the best recovery is a clean handoff to WhatsApp or advisor support without losing context.',
            highlight: true,
          },
          {
            kicker: '03 · Booking calm',
            title: 'Protect trust after payment too',
            body: 'Make success, booking assets and account follow-up feel as premium as the landing page that created the booking.',
          },
        ],
      };
    case 'fr':
      return {
        kicker: 'Conversion premium',
        title: 'Resserre le parcours du premier clic à la réservation protégée',
        body:
          'Réduis la friction avec une shortlist plus claire, un handoff humain plus fort et un chemin de réservation qui garde la confiance visible jusqu’au paiement et à la livraison.',
        primary: 'Voir les tours',
        secondary: 'Ouvrir le plan personnalisé',
        tertiary: 'Parler sur WhatsApp',
        lanes: [
          {
            kicker: '01 · Rythme shortlist',
            title: 'Montrer moins, mais mieux',
            body: 'Fais passer le voyageur d’une navigation générique à des options plus nettes par ville, style et intention.',
          },
          {
            kicker: '02 · Sauvetage humain',
            title: 'Garder l’aide humaine à un clic',
            body: 'Quand le voyageur hésite, le meilleur recovery est un handoff propre vers WhatsApp ou un conseiller.',
            highlight: true,
          },
          {
            kicker: '03 · Réservation sereine',
            title: 'Protéger la confiance après le paiement aussi',
            body: 'Success, booking assets et suivi account doivent rester aussi premium que la landing qui a généré la vente.',
          },
        ],
      };
    case 'de':
      return {
        kicker: 'Elite Conversion',
        title: 'Ziehe den Weg vom ersten Klick bis zur geschützten Buchung enger',
        body:
          'Weniger Reibung mit klarerer Shortlist, stärkerem menschlichen Handoff und einem Buchungsweg, der Vertrauen bis zu Zahlung und Delivery sichtbar hält.',
        primary: 'Touren ansehen',
        secondary: 'Persönlichen Plan öffnen',
        tertiary: 'Per WhatsApp sprechen',
        lanes: [
          {
            kicker: '01 · Shortlist-Rhythmus',
            title: 'Weniger, aber stärkere Optionen zeigen',
            body: 'Führe Reisende von generischem Browsing zu klareren Picks nach Stadt, Stil und Absicht.',
          },
          {
            kicker: '02 · Menschliche Rettung',
            title: 'Beratung nur einen Klick entfernt halten',
            body: 'Wenn der Reisende zögert, ist ein sauberer Handoff zu WhatsApp oder Beratung der beste Recovery-Pfad.',
            highlight: true,
          },
          {
            kicker: '03 · Ruhige Buchung',
            title: 'Vertrauen auch nach dem Payment schützen',
            body: 'Success, Booking-Assets und Account-Follow-up sollten so premium wirken wie die Landing davor.',
          },
        ],
      };
    default:
      return {
        kicker: 'Elite conversion polish',
        title: 'Aprieta mejor la ruta desde el primer clic hasta la reserva protegida',
        body:
          'Reduce la fricción de decisión con una shortlist más clara, un handoff humano más fuerte y un camino de reserva que mantenga la confianza visible hasta el pago y la entrega.',
        primary: 'Ver tours',
        secondary: 'Abrir plan personalizado',
        tertiary: 'Hablar por WhatsApp',
        lanes: [
          {
            kicker: '01 · Shortlist rhythm',
            title: 'Mostrar menos opciones, pero más fuertes',
            body: 'Mueve al viajero de un browse genérico a picks más claros por ciudad, estilo e intención antes de enviarlo al checkout.',
          },
          {
            kicker: '02 · Human rescue',
            title: 'Mantener la ayuda humana a un clic',
            body: 'Cuando el viajero duda, la mejor recuperación es un handoff limpio a WhatsApp o a un asesor sin perder contexto.',
            highlight: true,
          },
          {
            kicker: '03 · Booking calm',
            title: 'Proteger la confianza también después del pago',
            body: 'Success, booking assets y seguimiento en account deben sentirse tan premium como la landing que generó la venta.',
          },
        ],
      };
  }
}

type Lane = {
  kicker: string;
  title: string;
  body: string;
  highlight?: boolean;
};

export default function EliteConversionPolishStrip({ locale, whatsAppHref, className, compact = false }: Props) {
  const copy = getCopy(locale);
  const waOrContact = whatsAppHref ?? withLocale(locale, '/contact');
  const lanes = copy.lanes as Lane[];

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
            <Link
              href={withLocale(locale, '/tours')}
              className="inline-flex items-center rounded-full bg-[color:var(--color-surface)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)] shadow-soft transition hover:-translate-y-px"
            >
              {copy.primary}
            </Link>
            <Link
              href={withLocale(locale, '/plan')}
              className="inline-flex items-center rounded-full border border-white/16 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
            >
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
          {lanes.map((lane) => (
            <article
              key={lane.title}
              className={clsx(
                'rounded-3xl border p-5 shadow-soft',
                lane.highlight
                  ? 'border-transparent bg-[linear-gradient(160deg,rgba(6,29,61,0.98),rgba(10,69,135,0.93)_62%,rgba(216,176,74,0.72))] text-white'
                  : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]',
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

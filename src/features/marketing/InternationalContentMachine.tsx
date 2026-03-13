import Link from 'next/link';

import clsx from 'clsx';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

type Props = {
  locale: SupportedLocale;
  whatsAppHref?: string | null;
  className?: string;
};

type Copy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  lanes: Array<{
    kicker: string;
    title: string;
    body: string;
    links: Array<{ label: string; href: string; external?: boolean }>;
  }>;
};

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

function getCopy(locale: SupportedLocale, whatsAppHref?: string | null): Copy {
  const humanHref = whatsAppHref || withLocale(locale, '/contact');

  switch (locale) {
    case 'en':
      return {
        eyebrow: 'international content machine',
        title: 'Build growth by connecting content, qualification and human support.',
        subtitle:
          'KCE grows faster when cold traffic does not hit a dead end: it should move from intent landing to content, then to matcher, shortlist and real handoff.',
        lanes: [
          {
            kicker: '01 · Attract',
            title: 'Intent and market landings',
            body: 'Capture demand with pages tuned to Europe, coffee, culture, family, luxury and adventure instead of one generic destination page.',
            links: [
              { label: 'Discover hub', href: withLocale(locale, '/discover') },
              { label: 'Europe lane', href: withLocale(locale, '/discover/europe') },
              { label: 'Luxury lane', href: withLocale(locale, '/discover/luxury') },
            ],
          },
          {
            kicker: '02 · Nurture',
            title: 'Guide uncertain travelers',
            body: 'Use editorial routes, newsletter and lead magnets to keep colder visitors in the KCE system until they are ready to compare or talk.',
            links: [
              { label: 'Lead magnet EU', href: withLocale(locale, '/lead-magnets/eu-guide') },
              { label: 'Newsletter', href: withLocale(locale, '/newsletter') },
              { label: 'Personalized plan', href: withLocale(locale, '/plan') },
            ],
          },
          {
            kicker: '03 · Convert',
            title: 'Close with tours and human handoff',
            body: 'When intent is stronger, move the traveler to curated tours, secure checkout and a real person who can finish the conversation.',
            links: [
              { label: 'Browse tours', href: withLocale(locale, '/tours') },
              { label: 'Destinations', href: withLocale(locale, '/destinations') },
              { label: 'Talk to KCE', href: humanHref, external: !!whatsAppHref },
            ],
          },
        ],
      };
    case 'fr':
      return {
        eyebrow: 'machine de croissance internationale',
        title: 'Relier contenu, qualification et support humain pour mieux croître.',
        subtitle:
          'KCE grandit plus vite quand le trafic froid ne tombe pas dans une impasse : il doit passer d’une landing d’intention au contenu, puis au matcher, à la shortlist et au handoff humain.',
        lanes: [
          {
            kicker: '01 · Attirer',
            title: 'Landings par intention et marché',
            body: 'Capte la demande avec des pages adaptées à l’Europe, au café, à la culture, à la famille, au luxe et à l’aventure.',
            links: [
              { label: 'Hub discover', href: withLocale(locale, '/discover') },
              { label: 'Lane Europe', href: withLocale(locale, '/discover/europe') },
              { label: 'Lane luxe', href: withLocale(locale, '/discover/luxury') },
            ],
          },
          {
            kicker: '02 · Nourrir',
            title: 'Guider les voyageurs incertains',
            body: 'Utilise contenu, newsletter et lead magnets pour garder les visiteurs dans l’écosystème KCE jusqu’à une intention plus claire.',
            links: [
              { label: 'Lead magnet EU', href: withLocale(locale, '/lead-magnets/eu-guide') },
              { label: 'Newsletter', href: withLocale(locale, '/newsletter') },
              { label: 'Personalized plan', href: withLocale(locale, '/plan') },
            ],
          },
          {
            kicker: '03 · Convertir',
            title: 'Finaliser avec tours et handoff humain',
            body: 'Quand l’intention devient plus forte, fais passer vers les tours, le checkout sécurisé et une vraie personne pour conclure.',
            links: [
              { label: 'Voir les tours', href: withLocale(locale, '/tours') },
              { label: 'Destinations', href: withLocale(locale, '/destinations') },
              { label: 'Parler à KCE', href: humanHref, external: !!whatsAppHref },
            ],
          },
        ],
      };
    case 'de':
      return {
        eyebrow: 'internationale growth machine',
        title: 'Content, Qualifizierung und menschlichen Support besser verbinden.',
        subtitle:
          'KCE wächst schneller, wenn kalter Traffic nicht in Sackgassen endet: von Intent-Landing zu Content, dann zu Matcher, Shortlist und menschlichem Handoff.',
        lanes: [
          {
            kicker: '01 · Anziehen',
            title: 'Landings nach Markt und Absicht',
            body: 'Fange Nachfrage mit Seiten für Europa, Kaffee, Kultur, Familie, Luxus und Abenteuer statt mit nur einer generischen Seite ab.',
            links: [
              { label: 'Discover Hub', href: withLocale(locale, '/discover') },
              { label: 'Europa', href: withLocale(locale, '/discover/europe') },
              { label: 'Luxus', href: withLocale(locale, '/discover/luxury') },
            ],
          },
          {
            kicker: '02 · Nähren',
            title: 'Unentschlossene Reisende führen',
            body: 'Nutze Content, Newsletter und Lead Magnets, damit kälterer Traffic in der KCE-Route bleibt.',
            links: [
              { label: 'Lead Magnet EU', href: withLocale(locale, '/lead-magnets/eu-guide') },
              { label: 'Newsletter', href: withLocale(locale, '/newsletter') },
              { label: 'Personalized plan', href: withLocale(locale, '/plan') },
            ],
          },
          {
            kicker: '03 · Konvertieren',
            title: 'Mit Touren und Handoff abschließen',
            body: 'Sobald die Absicht stärker ist, leite zu kuratierten Touren, sicherem Checkout und echter Beratung weiter.',
            links: [
              { label: 'Touren öffnen', href: withLocale(locale, '/tours') },
              { label: 'Destinationen', href: withLocale(locale, '/destinations') },
              { label: 'Mit KCE sprechen', href: humanHref, external: !!whatsAppHref },
            ],
          },
        ],
      };
    default:
      return {
        eyebrow: 'máquina internacional de growth',
        title: 'Conecta contenido, calificación y soporte humano para crecer mejor.',
        subtitle:
          'KCE crece más rápido cuando el tráfico frío no cae en callejones sin salida: debe pasar de landing por intención a contenido, luego a matcher, shortlist y handoff humano.',
        lanes: [
          {
            kicker: '01 · Atraer',
            title: 'Landings por intención y mercado',
            body: 'Captura demanda con páginas para Europa, café, cultura, familia, lujo y aventura en vez de mandar a todos a una sola página genérica.',
            links: [
              { label: 'Discover hub', href: withLocale(locale, '/discover') },
              { label: 'Ruta Europa', href: withLocale(locale, '/discover/europe') },
              { label: 'Ruta lujo', href: withLocale(locale, '/discover/luxury') },
            ],
          },
          {
            kicker: '02 · Nutrir',
            title: 'Guiar al viajero indeciso',
            body: 'Usa contenido, newsletter y lead magnets para mantener al visitante dentro del sistema KCE hasta que esté listo para comparar o hablar.',
            links: [
              { label: 'Lead magnet EU', href: withLocale(locale, '/lead-magnets/eu-guide') },
              { label: 'Newsletter', href: withLocale(locale, '/newsletter') },
              { label: 'Personalized plan', href: withLocale(locale, '/plan') },
            ],
          },
          {
            kicker: '03 · Convertir',
            title: 'Cerrar con tours y handoff humano',
            body: 'Cuando la intención está más fuerte, mueve al viajero a tours curados, checkout seguro y una persona real que pueda cerrar la conversación.',
            links: [
              { label: 'Ver tours', href: withLocale(locale, '/tours') },
              { label: 'Destinations', href: withLocale(locale, '/destinations') },
              { label: 'Hablar con KCE', href: humanHref, external: !!whatsAppHref },
            ],
          },
        ],
      };
  }
}

export default function InternationalContentMachine({ locale, whatsAppHref, className }: Props) {
  const copy = getCopy(locale, whatsAppHref);

  return (
    <section
      className={clsx(
        'overflow-hidden rounded-[calc(var(--radius)+0.55rem)] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,244,236,0.96))] shadow-soft',
        className,
      )}
      aria-label="International content growth machine"
    >
      <div className="border-b border-[var(--color-border)] px-6 py-6 sm:px-8">
        <div className="inline-flex rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/60">
          {copy.eyebrow}
        </div>
        <h2 className="mt-3 font-heading text-[1.95rem] leading-[0.98] text-brand-blue md:text-[2.35rem]">{copy.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/72 md:text-[0.98rem]">{copy.subtitle}</p>
      </div>

      <div className="grid gap-4 px-6 py-6 md:grid-cols-3 sm:px-8">
        {copy.lanes.map((lane, idx) => (
          <div
            key={lane.title}
            className={clsx(
              'rounded-[1.35rem] border border-[var(--color-border)] p-5 shadow-soft',
              idx === 1
                ? 'bg-[linear-gradient(155deg,rgba(6,29,61,0.98),rgba(10,69,135,0.95)_62%,rgba(216,176,74,0.74))] text-white border-transparent'
                : 'bg-[color:var(--color-surface)]',
            )}
          >
            <div className={clsx('text-[11px] font-semibold uppercase tracking-[0.18em]', idx === 1 ? 'text-white/68' : 'text-[color:var(--color-text)]/55')}>
              {lane.kicker}
            </div>
            <h3 className={clsx('mt-3 text-xl font-semibold tracking-tight', idx === 1 ? 'text-white' : 'text-[color:var(--color-text)]')}>
              {lane.title}
            </h3>
            <p className={clsx('mt-3 text-sm leading-6', idx === 1 ? 'text-white/82' : 'text-[color:var(--color-text)]/72')}>
              {lane.body}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {lane.links.map((link) => {
                const linkClass = clsx(
                  'inline-flex items-center justify-between rounded-full border px-3.5 py-2 text-sm font-semibold transition',
                  idx === 1
                    ? 'border-white/18 bg-white/10 text-white hover:bg-white/14'
                    : 'border-[var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)] hover:bg-[color:var(--color-surface)]',
                );
                return link.external ? (
                  <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className={linkClass}>
                    <span>{link.label}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <Link key={link.label} href={link.href} className={linkClass}>
                    <span>{link.label}</span>
                    <span aria-hidden="true">→</span>
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

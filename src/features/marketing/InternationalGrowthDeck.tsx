import Link from 'next/link';

import clsx from 'clsx';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

type Props = {
  locale: SupportedLocale;
  whatsAppHref?: string | null;
  className?: string;
  compact?: boolean;
};

type Copy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  cards: Array<{ title: string; copy: string; cta: string; href: string; external?: boolean }>;
  proof: string[];
};

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

function getCopy(locale: SupportedLocale, whatsAppHref?: string | null): Copy {
  const contactHref = whatsAppHref || withLocale(locale, '/contact');

  switch (locale) {
    case 'en':
      return {
        eyebrow: 'KCE growth routes',
        title: 'International entry points built to turn attention into qualified demand.',
        subtitle:
          'Give international travelers a clearer path: browse destinations, request a tailored plan and move into human support without losing confidence.',
        cards: [
          { title: 'Premium catalog', copy: 'Send high-intent traffic straight to curated tours and secure checkout.', cta: 'Open tours', href: withLocale(locale, '/tours') },
          { title: 'Tailored plan', copy: 'Help undecided travelers describe what they want before you send them to a tour or to support.', cta: 'Start planning', href: withLocale(locale, '/plan') },
          { title: 'EU lead magnet', copy: 'Capture early-stage intent with a practical Europe → Colombia planning asset.', cta: 'Open the guide', href: withLocale(locale, '/lead-magnets/eu-guide') },
          { title: 'Human handoff', copy: 'When confidence needs a real person, route the traveler to WhatsApp or contact.', cta: 'Talk to KCE', href: contactHref, external: !!whatsAppHref },
        ],
        proof: ['Localized routes', 'EUR pricing flow', 'CRM-ready lead capture'],
      };
    case 'fr':
      return {
        eyebrow: 'routes de croissance KCE',
        title: 'Des points d’entrée internationaux pensés pour transformer l’attention en demande qualifiée.',
        subtitle:
          'Donne aux voyageurs internationaux un chemin plus clair : explorer, demander un plan personnalisé et passer à l’aide humaine sans perdre confiance.',
        cards: [
          { title: 'Catalogue premium', copy: 'Envoie le trafic à forte intention vers des tours curés et un checkout sécurisé.', cta: 'Voir les tours', href: withLocale(locale, '/tours') },
          { title: 'Tailored plan', copy: 'Aide les voyageurs indécis à décrire ce qu’ils veulent avant de les envoyer vers un tour ou vers le support.', cta: 'Commencer', href: withLocale(locale, '/plan') },
          { title: 'Lead magnet EU', copy: 'Capte l’intention tôt avec un guide pratique Europe → Colombie.', cta: 'Ouvrir le guide', href: withLocale(locale, '/lead-magnets/eu-guide') },
          { title: 'Handoff humain', copy: 'Quand la confiance demande une vraie personne, redirige vers WhatsApp ou contact.', cta: 'Parler à KCE', href: contactHref, external: !!whatsAppHref },
        ],
        proof: ['Routes localisées', 'Prix en EUR', 'Capture CRM prête'],
      };
    case 'de':
      return {
        eyebrow: 'KCE growth routes',
        title: 'Internationale Einstiegspunkte, die Aufmerksamkeit in qualifizierte Nachfrage verwandeln.',
        subtitle:
          'Gib internationalen Reisenden einen klareren Weg: entdecken, persönlichen Plan anfragen und bei Bedarf menschliche Hilfe erhalten.',
        cards: [
          { title: 'Premium-Katalog', copy: 'Leite kaufbereiten Traffic direkt zu kuratierten Touren und sicherem Checkout.', cta: 'Touren öffnen', href: withLocale(locale, '/tours') },
          { title: 'Tailored plan', copy: 'Hilf unentschlossenen Reisenden zuerst zu beschreiben, was sie suchen, bevor du sie zu einer Tour oder zum Support leitest.', cta: 'Plan starten', href: withLocale(locale, '/plan') },
          { title: 'EU Lead Magnet', copy: 'Fange frühe Absicht mit einem praktischen Europa → Kolumbien Guide ab.', cta: 'Guide öffnen', href: withLocale(locale, '/lead-magnets/eu-guide') },
          { title: 'Menschlicher Handoff', copy: 'Wenn Vertrauen eine echte Person braucht, leite zu WhatsApp oder Kontakt.', cta: 'Mit KCE sprechen', href: contactHref, external: !!whatsAppHref },
        ],
        proof: ['Lokalisierte Routen', 'EUR-Preislogik', 'CRM-fähige Lead-Erfassung'],
      };
    default:
      return {
        eyebrow: 'KCE growth routes',
        title: 'Puertas internacionales pensadas para convertir atención en demanda calificada.',
        subtitle:
          'Da a los viajeros internacionales una ruta más clara: explorar destinos, pedir un plan personalizado y pasar a ayuda humana sin perder confianza.',
        cards: [
          { title: 'Catálogo premium', copy: 'Empuja tráfico de alta intención a tours curados, shortlist clara y checkout seguro.', cta: 'Ver tours', href: withLocale(locale, '/tours') },
          { title: 'Tailored plan', copy: 'Ayuda al viajero indeciso a describir mejor lo que quiere antes de llevarlo a un tour o a soporte.', cta: 'Abrir plan', href: withLocale(locale, '/plan') },
          { title: 'Lead magnet EU', copy: 'Captura intención temprana con una guía práctica Europa → Colombia que alimenta CRM.', cta: 'Abrir guía', href: withLocale(locale, '/lead-magnets/eu-guide') },
          { title: 'Handoff humano', copy: 'Cuando hace falta confianza real, lleva al viajero a WhatsApp o contacto sin romper el contexto.', cta: 'Hablar con KCE', href: contactHref, external: !!whatsAppHref },
        ],
        proof: ['Rutas localizadas', 'Flujo en EUR', 'Lead capture listo para CRM'],
      };
  }
}

export default function InternationalGrowthDeck({
  locale,
  whatsAppHref,
  className,
  compact = false,
}: Props) {
  const copy = getCopy(locale, whatsAppHref);

  return (
    <section
      className={clsx(
        'overflow-hidden rounded-[calc(var(--radius)+0.6rem)] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.985),rgba(248,244,236,0.97))] shadow-hard',
        className,
      )}
      aria-label="KCE growth routes"
    >
      <div className={clsx('grid gap-0 lg:grid-cols-[0.92fr_1.08fr]', compact && 'lg:grid-cols-[0.86fr_1.14fr]')}>
        <div className="border-b border-[var(--color-border)] bg-[linear-gradient(155deg,rgba(6,29,61,0.98),rgba(10,69,135,0.95)_60%,rgba(216,176,74,0.76))] px-6 py-7 text-white lg:border-b-0 lg:border-r lg:px-8">
          <div className="inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/78">
            {copy.eyebrow}
          </div>
          <h2 className="mt-4 max-w-xl font-heading text-[1.95rem] leading-[0.98] text-white md:text-[2.35rem]">
            {copy.title}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/80 md:text-[0.98rem]">{copy.subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {copy.proof.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/14 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/84"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="px-6 py-7 lg:px-8">
          <div className={clsx('grid gap-4 md:grid-cols-2', compact && 'gap-3')}>
            {copy.cards.map((card, idx) => {
              const classes = clsx(
                'group rounded-[1.45rem] border border-[var(--color-border)] bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,244,236,0.95))] p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop',
                idx === 1 && 'bg-[linear-gradient(145deg,rgba(11,84,162,0.94),rgba(10,69,135,0.88)_58%,rgba(216,176,74,0.55))] text-white border-transparent',
              );

              const content = (
                <>
                  <div className={clsx('text-[11px] font-semibold uppercase tracking-[0.18em]', idx === 1 ? 'text-white/70' : 'text-brand-blue/80')}>
                    0{idx + 1}
                  </div>
                  <div className={clsx('mt-3 text-xl font-semibold leading-tight', idx === 1 ? 'text-white' : 'text-[color:var(--color-text)]')}>
                    {card.title}
                  </div>
                  <p className={clsx('mt-3 text-sm leading-6', idx === 1 ? 'text-white/78' : 'text-[color:var(--color-text)]/74')}>
                    {card.copy}
                  </p>
                  <div className={clsx('mt-5 inline-flex items-center gap-2 text-sm font-semibold', idx === 1 ? 'text-white' : 'text-brand-blue')}>
                    {card.cta}
                    <span aria-hidden="true" className="transition group-hover:translate-x-0.5">→</span>
                  </div>
                </>
              );

              return card.external ? (
                <a
                  key={card.title}
                  href={card.href}
                  target="_blank"
                  rel="noreferrer"
                  className={classes}
                >
                  {content}
                </a>
              ) : (
                <Link key={card.title} href={card.href} className={classes}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

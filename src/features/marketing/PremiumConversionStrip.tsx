import Link from 'next/link';
import { ArrowRight, ArrowUpRight, MessageCircleMore, ShieldCheck, Sparkles, TicketPercent } from 'lucide-react';

import { type SupportedLocale } from '@/i18n/getDictionary';

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

type Copy = {
  kicker: string;
  title: string;
  subtitle: string;
  tours: string;
  toursCopy: string;
  plan: string;
  planCopy: string;
  contact: string;
  contactCopy: string;
  offer: string;
  certainty: string;
  support: string;
  deskLabel: string;
  deskTitle: string;
  deskCopy: string;
  microTitle: string;
  microCopy: string;
  compareLabel: string;
  railCopy: string;
  routeCta: string;
};

function getCopy(locale: SupportedLocale): Copy {
  switch (locale) {
    case 'en':
      return {
        kicker: 'Conversion flow',
        title: 'Turn interest into a cleaner premium booking path',
        subtitle: 'Choose the clearest path for the traveler: browse tours, request a tailored plan or talk to KCE directly.',
        tours: 'Browse premium tours',
        toursCopy: 'Curated inventory with secure booking and a cleaner shortlist experience.',
        plan: 'Start a tailored plan',
        planCopy: 'Share dates, budget and travel style to receive a more guided recommendation.',
        contact: 'Talk to KCE',
        contactCopy: 'Use WhatsApp or contact when the traveler needs dates, logistics or reassurance.',
        offer: 'Tailored guidance',
        certainty: 'Clear checkout',
        support: 'Human support',
        deskLabel: 'Centro de planificación',
        deskTitle: 'Built to guide the traveler with more clarity',
        deskCopy: 'This section helps the traveler compare options, ask for help and move forward without jumping through disconnected pages.',
        microTitle: 'Editorial shortlist',
        microCopy: 'Cleaner route selection, calmer hierarchy and stronger CTA balance for real travelers.',
        compareLabel: 'Choose your path',
        railCopy: 'Explore, plan or contact KCE from one clear premium flow.',
        routeCta: 'Open route',
      };
    case 'fr':
      return {
        kicker: 'Flux de conversion',
        title: 'Transforme l’intérêt en parcours premium plus fluide',
        subtitle: 'Choisis le chemin le plus clair : explorer les tours, demander un plan personnalisé ou parler à KCE.',
        tours: 'Explorer les tours premium',
        toursCopy: 'Catalogue sélectionné, réservation sécurisée et shortlist plus claire.',
        plan: 'Créer un plan personnalisé',
        planCopy: 'Partage dates, budget et style de voyage pour recevoir une recommandation plus guidée.',
        contact: 'Parler à KCE',
        contactCopy: 'Utilise WhatsApp ou contact pour les dates, la logistique et la réassurance.',
        offer: 'Guidage personnalisé',
        certainty: 'Checkout clair',
        support: 'Support humain',
        deskLabel: 'Hub de planification',
        deskTitle: 'Pensé pour guider le voyageur avec plus de clarté',
        deskCopy: 'Cette section aide à comparer, demander de l’aide et avancer sans casser le parcours.',
        microTitle: 'Shortlist éditoriale',
        microCopy: 'Hiérarchie plus calme, choix plus propre et CTA mieux équilibrés.',
        compareLabel: 'Choisir sa route',
        railCopy: 'Explorer, planifier ou contacter KCE dans un même rythme premium.',
        routeCta: 'Ouvrir la route',
      };
    case 'de':
      return {
        kicker: 'Conversion flow',
        title: 'Interesse in einen klareren Premium-Buchungsweg verwandeln',
        subtitle: 'Wähle den klarsten Weg: Touren ansehen, einen persönlichen Plan starten oder direkt mit KCE sprechen.',
        tours: 'Premium-Touren ansehen',
        toursCopy: 'Kuratiertes Angebot mit sicherer Buchung und klarerer Shortlist.',
        plan: 'Persönlichen Plan starten',
        planCopy: 'Teile Daten, Budget und Reisestil, um eine gezieltere Empfehlung zu erhalten.',
        contact: 'Mit KCE sprechen',
        contactCopy: 'WhatsApp oder Kontakt nutzen, wenn Termine, Logistik oder Vertrauen wichtig sind.',
        offer: 'Persönliche Orientierung',
        certainty: 'Klarer Checkout',
        support: 'Menschlicher Support',
        deskLabel: 'Centro de planificación',
        deskTitle: 'Gebaut für mehr Klarheit auf dem Weg zur Reise',
        deskCopy: 'Dieser Bereich hilft beim Vergleichen, Planen und Kontaktieren – ohne unruhige Sprünge zwischen Seiten.',
        microTitle: 'Editoriale Shortlist',
        microCopy: 'Sauberere Hierarchie, klarere Auswahl und stärkere CTA-Balance.',
        compareLabel: 'Weg wählen',
        railCopy: 'Entdecken, planen oder KCE kontaktieren – in einem klaren Premium-Fluss.',
        routeCta: 'Route öffnen',
      };
    default:
      return {
        kicker: 'Ruta premium',
        title: 'Pasa de interés a reserva con una ruta mucho más clara',
        subtitle: 'Usa el camino más claro para el viajero: explorar tours, pedir un plan personalizado o hablar con KCE.',
        tours: 'Explorar tours premium',
        toursCopy: 'Inventario curado, booking seguro y una shortlist más limpia para decidir.',
        plan: 'Abrir plan personalizado',
        planCopy: 'Comparte fechas, presupuesto y estilo de viaje para recibir una recomendación más guiada.',
        contact: 'Hablar con KCE',
        contactCopy: 'Usa WhatsApp o contacto cuando el viajero necesita fechas, logística o más confianza.',
        offer: 'Guía personalizada',
        certainty: 'Checkout claro',
        support: 'Soporte humano',
        deskLabel: 'Centro de planificación',
        deskTitle: 'Diseñado para orientar al viajero con más claridad',
        deskCopy: 'Esta sección ayuda a comparar, pedir ayuda y avanzar sin saltar entre páginas desconectadas.',
        microTitle: 'Shortlist editorial',
        microCopy: 'Jerarquía más limpia, decisiones más calmadas y CTAs mejor balanceados.',
        compareLabel: 'Elegir ruta',
        railCopy: 'Explora, planea o habla con KCE dentro del mismo flujo premium.',
        routeCta: 'Abrir ruta',
      };
  }
}

export default function PremiumConversionStrip({
  locale,
  whatsAppHref,
  className = '',
}: {
  locale: SupportedLocale;
  whatsAppHref?: string | null;
  className?: string;
}) {
  const copy = getCopy(locale);
  const contactHref = whatsAppHref || withLocale(locale, '/contact');

  const items = [
    {
      href: withLocale(locale, '/tours'),
      title: copy.tours,
      copy: copy.toursCopy,
      icon: TicketPercent,
      eyebrow: '01',
      external: false,
      featured: false,
    },
    {
      href: withLocale(locale, '/plan'),
      title: copy.plan,
      copy: copy.planCopy,
      icon: Sparkles,
      eyebrow: '02',
      external: false,
      featured: true,
    },
    {
      href: contactHref,
      title: copy.contact,
      copy: copy.contactCopy,
      icon: MessageCircleMore,
      eyebrow: '03',
      external: Boolean(whatsAppHref),
      featured: false,
    },
  ];

  return (
    <section className={`mx-auto max-w-6xl px-6 py-10 ${className}`.trim()}>
      <div className="overflow-hidden rounded-[calc(var(--radius)+1rem)] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,242,233,0.96))] shadow-hard">
        <div className="grid gap-0 lg:grid-cols-[0.96fr_1.04fr]">
          <aside className="relative overflow-hidden border-b border-[var(--color-border)] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_34%),linear-gradient(160deg,rgba(6,29,61,0.99),rgba(10,69,135,0.97)_56%,rgba(216,176,74,0.8))] px-6 py-7 text-white lg:border-b-0 lg:border-r lg:px-8 lg:py-8">
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/86 backdrop-blur">
                {copy.kicker}
              </div>
              <h2 className="mt-4 max-w-xl font-heading text-[2rem] leading-[0.98] text-white md:text-[2.55rem]">
                {copy.title}
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/80 md:text-[0.98rem]">
                {copy.subtitle}
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
                {[copy.offer, copy.certainty, copy.support].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-white/92 backdrop-blur"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-yellow" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-7 grid gap-3">
                <div className="rounded-3xl border border-white/12 bg-black/12 p-4 backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">{copy.deskLabel}</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{copy.deskTitle}</h3>
                    </div>
                    <div className="grid size-11 place-items-center rounded-2xl border border-white/12 bg-white/10 text-white/92">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/76">{copy.deskCopy}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/68">{copy.microTitle}</p>
                    <p className="mt-2 text-sm leading-6 text-white/78">{copy.microCopy}</p>
                  </div>
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/68">KCE route</p>
                    <p className="mt-2 text-sm leading-6 text-white/78">{copy.railCopy}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="bg-[linear-gradient(180deg,rgba(250,247,241,0.96),rgba(255,255,255,0.99))] px-5 py-6 md:px-6 md:py-7 lg:px-8 lg:py-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue/80">{copy.compareLabel}</p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-[color:var(--color-text)]/70">{copy.railCopy}</p>
              </div>
              <div className="hidden rounded-full border border-[var(--color-border)] bg-white/96 px-3 py-1 text-xs font-semibold text-[color:var(--color-text-muted)] shadow-soft md:inline-flex">
                premium flow
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {items.map((item) => {
                const Icon = item.icon;
                const cardClass = item.featured
                  ? 'group relative flex h-full flex-col overflow-hidden rounded-[1.55rem] border border-brand-blue/15 bg-[linear-gradient(160deg,rgba(7,34,72,0.98),rgba(11,84,162,0.94)_60%,rgba(216,176,74,0.78))] p-5 text-white shadow-hard transition duration-200 hover:-translate-y-1'
                  : 'group relative flex h-full flex-col overflow-hidden rounded-[1.55rem] border border-[var(--color-border)] bg-white p-5 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-hard';
                const body = (
                  <>
                    <div aria-hidden={item.featured ? undefined : true} className={item.featured ? 'pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_30%)]' : 'hidden'} />
                    <div className="relative flex items-start justify-between gap-3">
                      <span className={item.featured ? 'rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white' : 'rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface)] px-2.5 py-1 text-[11px] font-semibold text-brand-blue'}>
                        {item.eyebrow}
                      </span>
                      <div className={item.featured ? 'grid size-11 place-items-center rounded-2xl border border-white/15 bg-white/10' : 'grid size-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgba(11,84,162,0.1),rgba(255,255,255,0.98))] ring-1 ring-[var(--color-border)]'}>
                        <Icon className={item.featured ? 'h-5 w-5 text-brand-yellow' : 'h-5 w-5 text-brand-blue'} aria-hidden="true" />
                      </div>
                    </div>
                    <div className={item.featured ? 'relative mt-7 text-[1.35rem] font-semibold leading-snug text-white' : 'relative mt-7 text-[1.35rem] font-semibold leading-snug text-[color:var(--color-text)]'}>{item.title}</div>
                    <div className={item.featured ? 'relative mt-2 text-sm leading-6 text-white/80' : 'relative mt-2 text-sm leading-6 text-[color:var(--color-text)]/72'}>{item.copy}</div>
                    <div className="mt-auto pt-6">
                      <div className={item.featured ? 'inline-flex items-center gap-2 text-sm font-semibold text-white' : 'inline-flex items-center gap-2 text-sm font-semibold text-brand-blue'}>
                        <span>{copy.routeCta}</span>
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </>
                );

                if (item.external) {
                  return (
                    <a key={item.title} href={item.href} target="_blank" rel="noreferrer" className={cardClass}>
                      {body}
                    </a>
                  );
                }

                return (
                  <Link key={item.title} href={item.href} className={`${cardClass} !no-underline hover:!no-underline`}>
                    {body}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

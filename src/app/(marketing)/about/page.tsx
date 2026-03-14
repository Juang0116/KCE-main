// src/app/(marketing)/about/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { headers, cookies } from 'next/headers';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const c = await cookies();
  const v = (h.get('x-kce-locale') || c.get('kce.locale')?.value || '').toLowerCase();
  return SUPPORTED.has(v as SupportedLocale) ? (v as SupportedLocale) : 'es';
}

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  return `/${locale}${href}`;
}

export const metadata: Metadata = {
  title: 'Sobre KCE — Knowing Cultures Enterprise',
  description: 'Experiencias culturales premium en Colombia. Conoce quiénes somos, nuestra misión y cómo ayudamos a los viajeros a descubrir lo mejor de Colombia.',
};

const COPY = {
  es: {
    headline: 'Conoce la Colombia que pocos viajeros llegan a ver',
    sub: 'KCE es una agencia de turismo cultural premium basada en Colombia. Diseñamos experiencias que conectan viajeros internacionales con la cultura, la gastronomía y la gente real del país.',
    mission: 'Nuestra misión',
    missionText: 'Hacer que viajar por Colombia sea claro, seguro y profundamente memorable. Sin sorpresas desagradables, con soporte real y con guías que aman lo que hacen.',
    values: [
      { icon: '🗺️', title: 'Curación real', body: 'Cada tour pasa por un proceso de selección. Si no lo recomendaríamos a nuestra propia familia, no está en el catálogo.' },
      { icon: '🔒', title: 'Seguridad y claridad', body: 'Checkout profesional con Stripe, confirmación por email y factura PDF. Sabes exactamente qué compraste y cuándo.' },
      { icon: '🤝', title: 'Soporte humano', body: 'Detrás del asistente IA siempre hay un equipo real. Estamos disponibles antes, durante y después de tu experiencia.' },
      { icon: '🌿', title: 'Impacto local', body: 'Trabajamos con guías y proveedores locales. Cada reserva apoya directamente a las comunidades que hacen posible la experiencia.' },
    ],
    destinations: '¿Dónde operamos?',
    destText: 'Bogotá, Medellín, Cartagena, Santa Marta, Salento, Guatapé y más destinos de Colombia.',
    cta: 'Explorar tours',
    ctaContact: 'Hablar con el equipo',
  },
  en: {
    headline: 'Discover the Colombia few travelers ever see',
    sub: 'KCE is a premium cultural travel agency based in Colombia. We design experiences that connect international travelers with the real culture, food and people of the country.',
    mission: 'Our mission',
    missionText: 'Make traveling through Colombia clear, safe and deeply memorable. No unpleasant surprises, real support and guides who love what they do.',
    values: [
      { icon: '🗺️', title: 'Real curation', body: 'Every tour goes through a selection process. If we wouldn\'t recommend it to our own family, it\'s not in the catalog.' },
      { icon: '🔒', title: 'Safety and clarity', body: 'Professional checkout with Stripe, email confirmation and PDF invoice. You know exactly what you bought and when.' },
      { icon: '🤝', title: 'Human support', body: 'Behind the AI assistant there is always a real team. We are available before, during and after your experience.' },
      { icon: '🌿', title: 'Local impact', body: 'We work with local guides and providers. Every booking directly supports the communities that make the experience possible.' },
    ],
    destinations: 'Where do we operate?',
    destText: 'Bogotá, Medellín, Cartagena, Santa Marta, Salento, Guatapé and more destinations in Colombia.',
    cta: 'Explore tours',
    ctaContact: 'Talk to the team',
  },
  fr: {
    headline: 'Découvrez la Colombie que peu de voyageurs voient',
    sub: 'KCE est une agence de voyage culturel premium basée en Colombie. Nous créons des expériences qui connectent les voyageurs internationaux avec la culture, la gastronomie et les gens du pays.',
    mission: 'Notre mission',
    missionText: 'Rendre le voyage en Colombie clair, sûr et profondément mémorable. Sans mauvaises surprises, avec un vrai soutien et des guides passionnés.',
    values: [
      { icon: '🗺️', title: 'Curation réelle', body: 'Chaque tour passe par un processus de sélection rigoureux.' },
      { icon: '🔒', title: 'Sécurité et clarté', body: 'Paiement professionnel avec Stripe, confirmation par e-mail et facture PDF.' },
      { icon: '🤝', title: 'Support humain', body: 'Derrière l\'assistant IA, il y a toujours une vraie équipe disponible.' },
      { icon: '🌿', title: 'Impact local', body: 'Nous travaillons avec des guides et prestataires locaux.' },
    ],
    destinations: 'Où opérons-nous ?',
    destText: 'Bogotá, Medellín, Carthagène, Santa Marta, Salento, Guatapé et plus.',
    cta: 'Explorer les tours',
    ctaContact: 'Parler à l\'équipe',
  },
  de: {
    headline: 'Entdecke das Kolumbien, das kaum ein Reisender sieht',
    sub: 'KCE ist eine Premium-Kulturreisengentur mit Sitz in Kolumbien. Wir gestalten Erlebnisse, die internationale Reisende mit der echten Kultur, dem Essen und den Menschen des Landes verbinden.',
    mission: 'Unsere Mission',
    missionText: 'Reisen durch Kolumbien klar, sicher und unvergesslich machen. Keine unangenehmen Überraschungen, echter Support und Guides, die ihre Arbeit lieben.',
    values: [
      { icon: '🗺️', title: 'Echte Kuration', body: 'Jede Tour durchläuft einen Auswahlprozess. Was wir nicht empfehlen würden, ist nicht im Katalog.' },
      { icon: '🔒', title: 'Sicherheit & Klarheit', body: 'Professioneller Checkout mit Stripe, E-Mail-Bestätigung und PDF-Rechnung.' },
      { icon: '🤝', title: 'Menschlicher Support', body: 'Hinter dem KI-Assistenten steht immer ein echtes Team.' },
      { icon: '🌿', title: 'Lokale Wirkung', body: 'Wir arbeiten mit lokalen Guides und Anbietern zusammen.' },
    ],
    destinations: 'Wo operieren wir?',
    destText: 'Bogotá, Medellín, Cartagena, Santa Marta, Salento, Guatapé und weitere Ziele in Kolumbien.',
    cta: 'Tours erkunden',
    ctaContact: 'Mit dem Team sprechen',
  },
};

export default async function AboutPage() {
  const locale = await resolveLocale();
  const copy = COPY[locale];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      {/* Hero */}
      <section className="rounded-3xl bg-brand-blue px-8 py-12 text-white md:px-12">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-yellow">
          Knowing Cultures Enterprise
        </p>
        <h1 className="font-heading text-4xl leading-tight md:text-5xl">{copy.headline}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85">{copy.sub}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={withLocale(locale, '/tours')}
            className="rounded-full bg-brand-yellow px-6 py-3 text-sm font-bold text-brand-dark transition hover:bg-brand-yellow/90"
          >
            {copy.cta}
          </Link>
          <Link
            href={withLocale(locale, '/contact')}
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {copy.ctaContact}
          </Link>
        </div>
      </section>

      {/* Mission */}
      <section className="mt-8 rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-8">
        <h2 className="font-heading text-2xl text-brand-blue">{copy.mission}</h2>
        <p className="mt-4 text-base leading-relaxed text-[color:var(--color-text)]/80">{copy.missionText}</p>
      </section>

      {/* Values */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {copy.values.map((v) => (
          <div key={v.title} className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft">
            <div className="mb-3 text-3xl">{v.icon}</div>
            <h3 className="font-heading text-lg text-[color:var(--color-text)]">{v.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-text)]/70">{v.body}</p>
          </div>
        ))}
      </section>

      {/* Destinations */}
      <section className="mt-8 rounded-3xl border border-brand-blue/15 bg-brand-blue/5 p-8">
        <h2 className="font-heading text-2xl text-brand-blue">{copy.destinations}</h2>
        <p className="mt-3 text-base text-[color:var(--color-text)]/80">{copy.destText}</p>
        <Link
          href={withLocale(locale, '/destinations')}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:underline"
        >
          Ver destinos →
        </Link>
      </section>

      {/* Stats */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { n: '3+', label: locale === 'en' ? 'Years operating' : locale === 'fr' ? 'Ans d\'opération' : locale === 'de' ? 'Jahre in Betrieb' : 'Años operando' },
          { n: '10+', label: locale === 'en' ? 'Curated destinations' : locale === 'fr' ? 'Destinations curées' : locale === 'de' ? 'Kuratierte Ziele' : 'Destinos curados' },
          { n: '24/7', label: locale === 'en' ? 'Support' : locale === 'fr' ? 'Support' : locale === 'de' ? 'Support' : 'Soporte' },
        ].map((s) => (
          <div key={s.n} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 text-center shadow-soft">
            <div className="font-heading text-4xl font-bold text-brand-blue">{s.n}</div>
            <div className="mt-2 text-sm text-[color:var(--color-text)]/70">{s.label}</div>
          </div>
        ))}
      </section>
    </main>
  );
}

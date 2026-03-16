import type { Metadata } from 'next';
import Link from 'next/link';
import { headers, cookies } from 'next/headers';
import { ArrowRight, Compass, ShieldCheck, HeartHandshake, Leaf } from 'lucide-react';

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
    sub: 'KCE es una agencia de turismo cultural premium basada en Colombia. Diseñamos experiencias que conectan a viajeros internacionales con la cultura, la gastronomía y la gente real del país.',
    mission: 'Nuestra misión',
    missionText: 'Hacer que viajar por Colombia sea claro, seguro y profundamente memorable. Sin sorpresas desagradables, con soporte real y con guías que aman profundamente lo que hacen.',
    values: [
      { icon: Compass, title: 'Curación real', body: 'Cada tour pasa por un riguroso proceso de selección. Si no lo recomendaríamos a nuestra propia familia, no está en nuestro catálogo.' },
      { icon: ShieldCheck, title: 'Seguridad y claridad', body: 'Checkout profesional, confirmación instantánea y cero costos ocultos. Sabes exactamente qué compraste y cuándo.' },
      { icon: HeartHandshake, title: 'Soporte humano', body: 'Detrás de la tecnología siempre hay un equipo real disponible antes, durante y después de tu experiencia.' },
      { icon: Leaf, title: 'Impacto local', body: 'Trabajamos directo con guías y proveedores locales. Cada reserva apoya la economía de las comunidades que visitas.' },
    ],
    destinations: 'Destinos KCE',
    destText: 'Operamos en Bogotá, Medellín, Cartagena, Santa Marta, Eje Cafetero, Guatapé y los rincones más mágicos de Colombia.',
    cta: 'Explorar Tours',
    ctaContact: 'Contactar al Equipo',
  },
  en: {
    headline: 'Discover the Colombia few travelers ever see',
    sub: 'KCE is a premium cultural travel agency based in Colombia. We design experiences that connect international travelers with the real culture, food and people of the country.',
    mission: 'Our mission',
    missionText: 'Make traveling through Colombia clear, safe and deeply memorable. No unpleasant surprises, real support and guides who truly love what they do.',
    values: [
      { icon: Compass, title: 'Real curation', body: 'Every tour goes through a strict selection process. If we wouldn\'t recommend it to our own family, it\'s not in the catalog.' },
      { icon: ShieldCheck, title: 'Safety and clarity', body: 'Professional checkout, instant confirmation and zero hidden fees. You know exactly what you bought and when.' },
      { icon: HeartHandshake, title: 'Human support', body: 'Behind the technology there is always a real team available before, during and after your experience.' },
      { icon: Leaf, title: 'Local impact', body: 'We work directly with local guides and providers. Every booking supports the economy of the communities you visit.' },
    ],
    destinations: 'KCE Destinations',
    destText: 'We operate in Bogotá, Medellín, Cartagena, Santa Marta, Coffee Axis, Guatapé and the most magical corners of Colombia.',
    cta: 'Explore Tours',
    ctaContact: 'Contact the Team',
  },
  fr: {
    headline: 'Découvrez la Colombie que peu de voyageurs voient',
    sub: 'KCE est une agence de voyage culturel premium basée en Colombie. Nous créons des expériences qui connectent les voyageurs internationaux avec la culture, la gastronomie et les gens du pays.',
    mission: 'Notre mission',
    missionText: 'Rendre le voyage en Colombie clair, sûr et profondément mémorable. Sans mauvaises surprises, avec un vrai soutien et des guides passionnés.',
    values: [
      { icon: Compass, title: 'Curation réelle', body: 'Chaque tour passe par un processus de sélection rigoureux. S\'il n\'est pas assez bien pour notre famille, il n\'est pas dans le catalogue.' },
      { icon: ShieldCheck, title: 'Sécurité et clarté', body: 'Paiement professionnel, confirmation instantanée et sans frais cachés. Vous savez exactement ce que vous achetez.' },
      { icon: HeartHandshake, title: 'Support humain', body: 'Derrière la technologie, il y a toujours une vraie équipe disponible avant, pendant et après votre expérience.' },
      { icon: Leaf, title: 'Impact local', body: 'Nous travaillons avec des guides locaux. Chaque réservation soutient l\'économie des communautés que vous visitez.' },
    ],
    destinations: 'Destinations KCE',
    destText: 'Nous opérons à Bogotá, Medellín, Carthagène, Santa Marta, l\'Axe du Café, Guatapé et dans les coins les plus magiques de la Colombie.',
    cta: 'Explorer les Tours',
    ctaContact: 'Contacter l\'Équipe',
  },
  de: {
    headline: 'Entdecke das Kolumbien, das kaum ein Reisender sieht',
    sub: 'KCE ist eine Premium-Kulturreisengentur mit Sitz in Kolumbien. Wir gestalten Erlebnisse, die internationale Reisende mit der echten Kultur, dem Essen und den Menschen des Landes verbinden.',
    mission: 'Unsere Mission',
    missionText: 'Reisen durch Kolumbien klar, sicher und unvergesslich machen. Keine unangenehmen Überraschungen, echter Support und Guides, die ihre Arbeit lieben.',
    values: [
      { icon: Compass, title: 'Echte Kuration', body: 'Jede Tour durchläuft einen strengen Auswahlprozess. Was wir nicht unserer Familie empfehlen würden, ist nicht im Katalog.' },
      { icon: ShieldCheck, title: 'Sicherheit & Klarheit', body: 'Professioneller Checkout, sofortige Bestätigung und keine versteckten Kosten. Du weißt genau, was du gekauft hast.' },
      { icon: HeartHandshake, title: 'Menschlicher Support', body: 'Hinter der Technologie steht immer ein echtes Team, das vor, während und nach deinem Erlebnis erreichbar ist.' },
      { icon: Leaf, title: 'Lokale Wirkung', body: 'Wir arbeiten direkt mit lokalen Guides. Jede Buchung unterstützt die Wirtschaft der besuchten Gemeinden.' },
    ],
    destinations: 'KCE Reiseziele',
    destText: 'Wir operieren in Bogotá, Medellín, Cartagena, Santa Marta, der Kaffeeachse, Guatapé und den magischsten Ecken Kolumbiens.',
    cta: 'Tours Erkunden',
    ctaContact: 'Team Kontaktieren',
  },
};

export default async function AboutPage() {
  const locale = await resolveLocale();
  const copy = COPY[locale];

  return (
    <main className="w-full pb-20">
      
      {/* Hero Section (Premium Style) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-20 md:py-32 text-center">
        <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-brand-blue/20"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow backdrop-blur-md">
            Knowing Cultures Enterprise
          </div>
          <h1 className="font-heading text-4xl leading-tight md:text-6xl text-white drop-shadow-md">
            {copy.headline}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl">
            {copy.sub}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={withLocale(locale, '/tours')} className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-brand-yellow px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-brand-dark transition hover:bg-brand-yellow/90 hover:scale-105 shadow-lg">
              {copy.cta} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={withLocale(locale, '/contact')} className="w-full sm:w-auto flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm transition hover:bg-white/10 hover:border-white/50">
              {copy.ctaContact}
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6">
        
        {/* Mission */}
        <section className="relative -mt-10 z-20 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 shadow-xl text-center">
          <h2 className="font-heading text-3xl text-brand-blue">{copy.mission}</h2>
          <p className="mx-auto mt-4 max-w-3xl text-base font-light leading-relaxed text-[var(--color-text)]/80 md:text-lg">
            {copy.missionText}
          </p>
        </section>

        {/* Values */}
        <section className="mt-16">
          <div className="grid gap-6 sm:grid-cols-2">
            {copy.values.map((v, i) => (
              <div key={i} className="group rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-8 transition-all hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-md relative overflow-hidden">
                <div className="absolute -right-6 -top-6 opacity-5 transition-transform group-hover:scale-110 group-hover:rotate-12">
                  <v.icon className="h-32 w-32 text-brand-blue" />
                </div>
                <div className="relative z-10">
                  <div className="mb-5 inline-flex rounded-2xl bg-brand-blue/10 p-3 text-brand-blue border border-brand-blue/20">
                    <v.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-xl text-[var(--color-text)]">{v.title}</h3>
                  <p className="mt-3 text-sm font-light leading-relaxed text-[var(--color-text)]/70">{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Destinations & Stats */}
        <div className="mt-16 grid gap-6 lg:grid-cols-[1fr_300px]">
          <section className="rounded-[2.5rem] border border-brand-blue/20 bg-brand-blue/5 p-8 md:p-10 flex flex-col justify-center">
            <h2 className="font-heading text-3xl text-brand-blue">{copy.destinations}</h2>
            <p className="mt-4 text-base font-light leading-relaxed text-[var(--color-text)]/80">{copy.destText}</p>
            <Link href={withLocale(locale, '/destinations')} className="mt-8 inline-flex w-max items-center gap-2 rounded-full bg-brand-blue px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 hover:shadow-md">
              Explorar Mapa <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <section className="grid gap-4">
            {[
              { n: '3+', label: locale === 'en' ? 'Years Operating' : locale === 'fr' ? 'Ans d\'opération' : locale === 'de' ? 'Jahre in Betrieb' : 'Años Operando' },
              { n: '10+', label: locale === 'en' ? 'Curated Destinations' : locale === 'fr' ? 'Destinations Curées' : locale === 'de' ? 'Kuratierte Ziele' : 'Destinos Curados' },
              { n: '24/7', label: locale === 'en' ? 'Human Support' : locale === 'fr' ? 'Support Humain' : locale === 'de' ? 'Menschlicher Support' : 'Soporte Humano' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center justify-center rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-sm">
                <div className="font-heading text-4xl text-brand-blue">{s.n}</div>
                <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">{s.label}</div>
              </div>
            ))}
          </section>
        </div>

      </div>
    </main>
  );
}
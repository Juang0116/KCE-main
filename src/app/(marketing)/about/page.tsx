import type { Metadata } from 'next';
import Link from 'next/link';
import { headers, cookies } from 'next/headers';
import { ArrowRight, Compass, ShieldCheck, HeartHandshake, Leaf, Star, Globe2, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/Button';

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
  if (locale === 'es') return href;
  return `/${locale}${href}`;
}

export const metadata: Metadata = {
  title: 'Sobre KCE — Knowing Cultures Enterprise',
  description: 'Experiencias culturales premium en Colombia. Conoce quiénes somos y nuestra misión.',
};

// --- EL OBJETO COPY QUE FALTABA ---
const COPY = {
  es: {
    headline: 'Conoce la Colombia que pocos viajeros llegan a ver',
    sub: 'KCE es una agencia de turismo cultural premium basada en Colombia. Diseñamos experiencias que conectan a viajeros internacionales con la cultura, la gastronomía y la gente real del país.',
    mission: 'Nuestra Misión',
    missionText: 'Hacer que viajar por Colombia sea claro, seguro y profundamente memorable. Sin sorpresas desagradables, con soporte real y con guías que aman profundamente lo que hacen.',
    values: [
      { icon: Compass, title: 'Curación Real', body: 'Cada tour pasa por un riguroso proceso de selección. Si no lo recomendaríamos a nuestra propia familia, no está en nuestro catálogo.' },
      { icon: ShieldCheck, title: 'Seguridad y Claridad', body: 'Checkout profesional, confirmación instantánea y cero costos ocultos. Sabes exactamente qué compraste y cuándo.' },
      { icon: HeartHandshake, title: 'Soporte Humano', body: 'Detrás de la tecnología siempre hay un equipo real disponible antes, durante y después de tu experiencia.' },
      { icon: Leaf, title: 'Impacto Local', body: 'Trabajamos directo con guías y proveedores locales. Cada reserva apoya la economía de las comunidades que visitas.' },
    ],
    destinations: 'Destinos KCE',
    destText: 'Operamos en Bogotá, Medellín, Cartagena, Santa Marta, Eje Cafetero, Guatapé y los rincones más mágicos de Colombia.',
    cta: 'Explorar Tours',
    ctaContact: 'Contactar al Equipo',
  },
  en: {
    headline: 'Discover the Colombia few travelers ever see',
    sub: 'KCE is a premium cultural travel agency based in Colombia. We design experiences that connect international travelers with the real culture, food and people of the country.',
    mission: 'Our Mission',
    missionText: 'Make traveling through Colombia clear, safe and deeply memorable. No unpleasant surprises, real support and guides who truly love what they do.',
    values: [
      { icon: Compass, title: 'Real Curation', body: "Every tour goes through a strict selection process. If we wouldn't recommend it to our own family, it's not in the catalog." },
      { icon: ShieldCheck, title: 'Safety and Clarity', body: 'Professional checkout, instant confirmation and zero hidden fees. You know exactly what you bought and when.' },
      { icon: HeartHandshake, title: 'Human Support', body: 'Behind the technology there is always a real team available before, during and after your experience.' },
      { icon: Leaf, title: 'Local Impact', body: 'We work directly with local guides and providers. Every booking supports the economy of the communities you visit.' },
    ],
    destinations: 'KCE Destinations',
    destText: 'We operate in Bogotá, Medellín, Cartagena, Santa Marta, Coffee Axis, Guatapé and the most magical corners of Colombia.',
    cta: 'Explore Tours',
    ctaContact: 'Contact the Team',
  },
  fr: {
    headline: 'Découvrez la Colombie que peu de voyageurs voient',
    sub: 'KCE est une agence de voyage culturel premium basée en Colombie. Nous créons des expériences qui connectent les voyageurs internationaux avec la culture, la gastronomie et les gens du pays.',
    mission: 'Notre Mission',
    missionText: 'Rendre le voyage en Colombie clair, sûr et profondément mémorable. Sans mauvaises surprises, avec un vrai soutien et des guides passionnés.',
    values: [
      { icon: Compass, title: 'Curation Réelle', body: "Chaque tour passe par un processus de sélection rigoureux. S'il n'est pas assez bien pour notre famille, il n'est pas dans le catalogue." },
      { icon: ShieldCheck, title: 'Sécurité et Clarté', body: 'Paiement professionnel, confirmation instantanée et sans frais cachés. Vous savez exactement ce que vous achetez.' },
      { icon: HeartHandshake, title: 'Support Humain', body: 'Derrière la technologie, il y a toujours une vraie équipe disponible avant, pendant et après votre expérience.' },
      { icon: Leaf, title: 'Impact Local', body: 'Nous travaillons avec des guides locaux. Chaque réservation soutient l\'économie des communautés que vous visitez.' },
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
    <main className="w-full pb-24 bg-[var(--color-bg)] min-h-screen">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-brand-blue px-6 py-28 md:py-40 text-center">
        <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.png')] bg-repeat"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-brand-blue via-brand-blue/95 to-brand-dark"></div>
        
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md">
            <Globe2 className="size-3" /> Knowing Cultures Enterprise
          </div>
          <h1 className="font-heading text-5xl leading-[1.1] md:text-7xl lg:text-8xl text-white">
            {copy.headline}
          </h1>
          <p className="mx-auto mt-10 max-w-2xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
            {copy.sub}
          </p>
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-5">
            <Button asChild size="lg" className="w-full sm:w-auto rounded-full bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90 px-10 h-14 shadow-2xl shadow-brand-yellow/20">
              <Link href={withLocale(locale, '/tours')}>
                {copy.cta} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-full border-white/20 text-white hover:bg-white/5 px-10 h-14 backdrop-blur-sm">
              <Link href={withLocale(locale, '/contact')}>{copy.ctaContact}</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 -mt-16 relative z-20">
        
        {/* MISSION */}
        <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 md:p-20 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-b from-brand-yellow to-transparent"></div>
          <Star className="mx-auto h-10 w-10 text-brand-yellow mb-8 animate-pulse" />
          <h2 className="font-heading text-4xl md:text-5xl text-brand-blue mb-8">{copy.mission}</h2>
          <p className="mx-auto max-w-3xl text-xl md:text-2xl font-light leading-relaxed text-[var(--color-text)]/80 italic">
            &quot;{copy.missionText}&quot;
          </p>
        </section>

        {/* VALUES: Tipamos 'v' e 'i' para evitar errores de implicit any */}
        <section className="mt-20">
          <div className="grid gap-8 md:grid-cols-2">
            {copy.values.map((v: { icon: any; title: string; body: string }, i: number) => (
              <div key={i} className="group rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-10 md:p-12 transition-all duration-500 hover:-translate-y-2 hover:border-brand-blue/20 hover:shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="mb-8 inline-flex rounded-3xl bg-brand-blue/5 p-5 text-brand-blue border border-brand-blue/10 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:bg-brand-blue group-hover:text-white">
                    <v.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-heading text-2xl md:text-3xl text-brand-blue mb-4">{v.title}</h3>
                  <p className="text-base md:text-lg font-light leading-relaxed text-[var(--color-text)]/60">{v.body}</p>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-[0.03] transition-transform duration-1000 group-hover:scale-150 group-hover:rotate-12">
                  <v.icon className="h-64 w-64" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DESTINATIONS & STATS */}
        <div className="mt-20 grid gap-8 lg:grid-cols-[1fr_340px]">
          <section className="rounded-[3.5rem] border border-brand-blue/10 bg-brand-blue/[0.02] p-12 md:p-16 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 opacity-5 pointer-events-none transition-transform duration-[20s] group-hover:rotate-90">
              <Compass className="h-96 w-96 text-brand-blue" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 text-brand-blue mb-6">
                <MapPin className="size-5" />
                <span className="text-xs font-bold uppercase tracking-[0.3em]">Exploración Curada</span>
              </div>
              <h2 className="font-heading text-4xl md:text-5xl text-brand-blue mb-8">{copy.destinations}</h2>
              <p className="max-w-xl text-lg md:text-xl font-light leading-relaxed text-[var(--color-text)]/70 mb-12">
                {copy.destText}
              </p>
              <Button asChild size="lg" className="rounded-full px-10 h-14 bg-brand-blue shadow-xl shadow-brand-blue/20 text-white">
                <Link href={withLocale(locale, '/destinations')}>
                  Explorar Mapa <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>

          <section className="grid gap-6">
            {[
              { n: '3+', label: locale === 'en' ? 'Years Operating' : locale === 'fr' ? 'Ans d\'opération' : locale === 'de' ? 'Jahre in Betrieb' : 'Años Operando', icon: ShieldCheck },
              { n: '10+', label: locale === 'en' ? 'Curated Cities' : locale === 'fr' ? 'Villes Curées' : locale === 'de' ? 'Kuratierte Städte' : 'Ciudades Curadas', icon: Compass },
              { n: '24/7', label: locale === 'en' ? 'Human Support' : locale === 'fr' ? 'Support Humain' : locale === 'de' ? 'Menschlicher Support' : 'Soporte Humano', icon: HeartHandshake },
            ].map((s, i: number) => (
              <div key={i} className="flex flex-col items-center justify-center rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center shadow-sm hover:border-brand-blue/30 transition-all duration-300 group">
                <s.icon className="size-5 text-brand-blue/20 mb-4 group-hover:text-brand-yellow transition-colors" />
                <div className="font-heading text-5xl text-brand-blue mb-2">{s.n}</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40">{s.label}</div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
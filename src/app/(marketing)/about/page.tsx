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
    <main className="w-full bg-[var(--color-bg)] min-h-screen flex flex-col animate-fade-in">
      
      {/* 01. HERO SECTION (Editorial Parity) */}
      <section className="relative w-full flex flex-col justify-center overflow-hidden bg-[var(--color-surface)] border-b border-[var(--color-border)] px-6 py-20 md:py-32 text-center">
        {/* Glow Brand Blue para identidad corporativa */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] shadow-sm backdrop-blur-md">
            <Globe2 className="h-3 w-3 text-brand-blue" /> Knowing Cultures Enterprise
          </div>
          
          <h1 className="font-heading text-4xl sm:text-5xl leading-tight md:text-7xl lg:text-8xl text-[var(--color-text)] tracking-tight mb-6">
            Conoce la Colombia que <br/>
            <span className="text-brand-blue italic font-light">pocos viajeros ven.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-[var(--color-text-muted)] md:text-xl">
            {copy.sub}
          </p>
          
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Button asChild size="lg" className="w-full sm:w-auto rounded-full bg-brand-blue text-white hover:bg-brand-blue/90 px-10 py-7 text-base shadow-pop hover:-translate-y-0.5 transition-transform">
              <Link href={withLocale(locale, '/tours')}>
                {copy.cta} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-full border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] px-10 py-7 text-base transition-colors">
              <Link href={withLocale(locale, '/contact')}>{copy.ctaContact}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Breadcrumb Sutil */}
      <div className="w-full bg-[var(--color-surface-2)]/30 border-b border-[var(--color-border)] py-3 px-6">
        <div className="mx-auto max-w-[var(--container-max)] flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-80">
          <Link href={withLocale(locale, '/')} className="hover:text-brand-blue transition-colors">Inicio</Link>
          <ArrowRight className="h-3 w-3" />
          <span className="text-[var(--color-text)] opacity-50">Nuestra Historia</span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[var(--container-max)] px-6 py-24 flex flex-col gap-32 flex-1">
        
        {/* 02. MISSION (Diseño Editorial, Minimalista) */}
        <section className="text-center max-w-4xl mx-auto">
          <Star className="mx-auto h-8 w-8 text-brand-yellow mb-6 animate-pulse" />
          <h2 className="font-heading text-sm font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] mb-6">{copy.mission}</h2>
          <p className="text-2xl md:text-4xl font-light leading-relaxed text-[var(--color-text)] tracking-tight">
            &quot;{copy.missionText}&quot;
          </p>
        </section>

        {/* 03. VALUES (Cero cajas, grid fluido con iconos que reaccionan) */}
        <section>
          <div className="grid gap-12 md:grid-cols-2 lg:gap-20">
            {copy.values.map((v: { icon: any; title: string; body: string }, i: number) => (
              <div key={i} className="flex flex-col items-start group">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[var(--radius-2xl)] bg-[var(--color-surface)] border border-[var(--color-border)] text-brand-blue shadow-soft group-hover:scale-110 group-hover:border-brand-blue/30 group-hover:bg-brand-blue/5 transition-all duration-300">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-2xl text-[var(--color-text)] mb-3 group-hover:text-brand-blue transition-colors">{v.title}</h3>
                <p className="text-base font-light leading-relaxed text-[var(--color-text-muted)]">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 04. DESTINATIONS & STATS */}
        <section className="grid gap-12 lg:grid-cols-[1.5fr_1fr] items-center pb-20">
          
          {/* Destinos */}
          <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 md:p-16 shadow-soft group">
            <div className="absolute -right-10 -bottom-10 opacity-[0.02] transition-transform duration-700 group-hover:scale-125 pointer-events-none">
              <Compass className="h-64 w-64 text-brand-blue" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-brand-blue mb-6">
                <MapPin className="size-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Exploración Nacional</span>
              </div>
              <h2 className="font-heading text-4xl md:text-5xl text-[var(--color-text)] tracking-tight mb-6">{copy.destinations}</h2>
              <p className="max-w-xl text-lg font-light leading-relaxed text-[var(--color-text-muted)] mb-10">
                {copy.destText}
              </p>
              <Button asChild className="rounded-full px-8 bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all shadow-sm">
                <Link href={withLocale(locale, '/destinations')}>
                  Explorar Mapa Interactivo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Estadísticas KCE */}
          <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { n: '3+', label: locale === 'en' ? 'Years Operating' : locale === 'fr' ? 'Ans d\'opération' : locale === 'de' ? 'Jahre in Betrieb' : 'Años Operando', icon: ShieldCheck },
              { n: '10+', label: locale === 'en' ? 'Curated Cities' : locale === 'fr' ? 'Villes Curées' : locale === 'de' ? 'Kuratierte Städte' : 'Ciudades Curadas', icon: Compass },
              { n: '24/7', label: locale === 'en' ? 'Human Support' : locale === 'fr' ? 'Support Humain' : locale === 'de' ? 'Menschlicher Support' : 'Soporte Humano', icon: HeartHandshake },
            ].map((s, i: number) => (
              <div key={i} className="flex flex-col sm:flex-row lg:flex-row items-center sm:items-start lg:items-center gap-6 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/30 p-6 transition-all hover:bg-[var(--color-surface)] hover:border-brand-blue/20 hover:shadow-soft group">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-brand-blue shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                   <s.icon className="size-5" />
                </div>
                <div className="text-center sm:text-left">
                  <div className="font-heading text-3xl text-[var(--color-text)] mb-0.5 group-hover:text-brand-blue transition-colors">{s.n}</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-70">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

        </section>
        
      </div>
    </main>
  );
}
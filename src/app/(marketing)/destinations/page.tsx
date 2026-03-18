import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import { MapPin, ArrowRight, Compass, Sparkles, Star } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import FeaturedReviews from '@/features/reviews/FeaturedReviews';
import { getFacets, listTours } from '@/features/tours/catalog.server';
import { toTourLike } from '@/features/tours/adapters';
import TourCardPremium from '@/features/tours/components/TourCardPremium';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';

export const revalidate = 900;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;

  const c = await cookies();
  const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;

  return 'es';
}

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

function slugify(s: string) {
  return (s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const base = getPublicBaseUrl().replace(/\/+$/, '');
  const canonicalPath = withLocale(locale, '/destinations');
  const canonicalAbs = absoluteUrl(canonicalPath);

  return {
    metadataBase: new URL(base),
    title: 'Destinos en Colombia — KCE',
    description: 'Explora Colombia por ciudad y región con una ruta más clara hacia tours, planeación personalizada y soporte real.',
    alternates: { canonical: canonicalAbs, languages: { es: '/es/destinations', en: '/en/destinations', fr: '/fr/destinations', de: '/de/destinations' } },
    openGraph: { title: 'Destinos en Colombia — KCE', description: 'Empieza por la ciudad, compara experiencias curadas y continúa con más claridad.', url: canonicalAbs, type: 'website', images: [{ url: absoluteUrl('/images/hero-kce.jpg') }] },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function DestinationsPage() {
  const locale = await resolveLocale();
  const base = getPublicBaseUrl().replace(/\/+$/, '');

  const [{ cities }, topTours] = await Promise.all([
    getFacets(),
    listTours({ sort: 'popular', limit: 6, offset: 0 }),
  ]);

  const citySlugs = (cities || [])
    .map((c) => ({ city: c, slug: slugify(c) }))
    .filter((x) => x.slug)
    .slice(0, 24);

  const canonicalPath = withLocale(locale, '/destinations');
  const canonicalAbs = absoluteUrl(canonicalPath);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: 'Destinations', url: canonicalAbs, isPartOf: { '@type': 'WebSite', name: 'KCE', url: base } },
      { '@type': 'BreadcrumbList', itemListElement: [ { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl(withLocale(locale, '/')) }, { '@type': 'ListItem', position: 2, name: 'Destinations', item: canonicalAbs } ] },
    ],
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* HERO DESTINOS */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-28 md:py-40 text-center shadow-xl">
        <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-brand-blue/30"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md shadow-sm">
            <MapPin className="h-3 w-3" /> Colombia por Región
          </div>
          <h1 className="font-heading text-5xl leading-[1.1] text-white md:text-7xl lg:text-8xl drop-shadow-md">
            Empieza por la ciudad.<br/> 
            <span className="text-brand-yellow font-light italic">Descubre la experiencia.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl">
            Explorar Colombia puede ser abrumador. Simplifica tu viaje eligiendo tu ciudad base y descubre las mejores rutas culturales y naturales seleccionadas por KCE.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-5">
            <Button asChild size="lg" className="w-full sm:w-auto rounded-full bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90 px-10 h-14 shadow-2xl shadow-brand-yellow/20">
              <Link href={withLocale(locale, '/tours')}>
                Ver Catálogo Completo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-full border-white/20 text-white hover:bg-white/5 px-10 h-14 backdrop-blur-sm">
              <Link href={withLocale(locale, '/plan')}>
                Armar Plan Personalizado
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 -mt-16 relative z-20">
        
        {/* METODOLOGÍA KCE */}
        <section className="mb-20 rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 md:p-16 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-16">
            <div className="inline-flex rounded-3xl bg-brand-blue/5 p-4 text-brand-blue mb-6 border border-brand-blue/10 shadow-sm">
              <Compass className="h-8 w-8" />
            </div>
            <h2 className="font-heading text-3xl md:text-5xl text-brand-blue">¿Cómo planear tu ruta?</h2>
          </div>
          <div className="grid gap-10 md:grid-cols-3 relative">
            <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-px bg-brand-blue/10"></div>
            {[
              ['1', 'Elige tu base', 'Empieza por la ciudad principal a la que vas a llegar (ej. Bogotá o Medellín).'],
              ['2', 'Filtra experiencias', 'Revisa tours, estilos y ritmos de viaje curados específicamente para esa región.'],
              ['3', 'Combina destinos', 'Usa nuestro Planificador si quieres que conectemos varias ciudades por ti.'],
            ].map(([step, title, copy]) => (
              <div key={step} className="relative z-10 flex flex-col items-center text-center group">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface)] border-4 border-[var(--color-surface-2)] text-brand-blue font-heading text-2xl mb-6 shadow-md transition-colors duration-500 group-hover:border-brand-yellow group-hover:bg-brand-yellow/5">
                  {step}
                </div>
                <h3 className="text-xl md:text-2xl font-heading text-brand-blue mb-3">{title}</h3>
                <p className="text-sm md:text-base font-light text-[var(--color-text)]/60 leading-relaxed px-4">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* LISTADO DE CIUDADES (Galería) */}
        <section className="mb-24">
          <div className="mb-10 flex items-center justify-between border-b border-[var(--color-border)] pb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40 mb-2">Descubre por Región</p>
              <h2 className="font-heading text-4xl text-[var(--color-text)]">Destinos Activos</h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
              {citySlugs.length} Regiones
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {citySlugs.map((c) => (
              <Link
                key={c.slug}
                href={withLocale(locale, `/destinations/${encodeURIComponent(c.slug)}`)}
                className="group relative overflow-hidden rounded-[2.5rem] bg-brand-dark aspect-[4/3] flex flex-col justify-end p-8 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-brand-yellow/50 border border-transparent"
              >
                {/* Imagen del Destino */}
                <div className="absolute inset-0 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center opacity-40 transition-transform duration-1000 group-hover:scale-110 group-hover:opacity-60"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3 opacity-0 -translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                    <Sparkles className="h-4 w-4 text-brand-yellow" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">Tours Curados</span>
                  </div>
                  <h3 className="font-heading text-4xl lg:text-5xl text-white drop-shadow-md">
                    {c.city}
                  </h3>
                  <div className="mt-8 flex items-center justify-between">
                    <span className="text-xs font-light text-white/80 group-hover:text-white transition-colors">Explorar región</span>
                    <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-brand-yellow group-hover:text-brand-dark transition-colors shadow-lg">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* TOURS DESTACADOS GLOBALES */}
        <section className="mb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 border-b border-[var(--color-border)] pb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow mb-5 shadow-sm">
                <Star className="h-3 w-3" /> Top Selección
              </div>
              <h2 className="font-heading text-4xl text-[var(--color-text)]">Tours Destacados Nacionales</h2>
              <p className="mt-4 text-[var(--color-text)]/70 font-light text-base max-w-xl leading-relaxed">
                Si tu itinerario es flexible, adapta tus destinos para incluir estas experiencias consideradas imperdibles por nuestros expertos.
              </p>
            </div>
            <Button asChild variant="outline" size="lg" className="rounded-full shadow-sm">
              <Link href={withLocale(locale, '/tours')}>
                Ver Catálogo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {(topTours.items || []).map((t, idx) => (
              <TourCardPremium key={t.slug} tour={toTourLike(t)} priority={idx < 3} href={withLocale(locale, `/tours/${t.slug}`)} />
            ))}
          </div>
        </section>

        <section className="py-16 border-t border-[var(--color-border)]">
          <FeaturedReviews locale={locale} />
        </section>

      </div>
    </main>
  );
}

// Ojo: Añadí 'Star' en la importación de 'lucide-react' al inicio para el nuevo badge. 
// Simplemente asegúrate de que quede así en tus imports:
// import { MapPin, ArrowRight, Compass, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import { MapPin, Compass, Sparkles, ArrowRight, Globe, Navigation } from 'lucide-react';

import { slugify } from '@/lib/slugify';
import { SITE_URL } from '@/lib/env';
import { getFacets } from '@/features/tours/catalog.server';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';
import CaptureCtas from '@/features/marketing/CaptureCtas';
import { Button } from '@/components/ui/Button';

export const revalidate = 300;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || SITE_URL || 'https://kce.travel')
  .replace(/\/+$/, '');

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
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const canonicalAbs = absoluteUrl(`/${locale}/tours/destinations`);

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: 'Destinos en Colombia | KCE Travel',
    description: 'Explora nuestra selección curada de destinos en Colombia. De Bogotá al Caribe, vive experiencias auténticas con KCE.',
    alternates: {
      canonical: canonicalAbs,
      languages: {
        es: '/es/tours/destinations',
        en: '/en/tours/destinations',
        fr: '/fr/tours/destinations',
        de: '/de/tours/destinations',
      },
    },
    openGraph: {
      title: 'Destinos — KCE Colombia',
      description: 'Explora tours por ciudad en Colombia.',
      url: canonicalAbs,
      type: 'website',
      images: [{ url: absoluteUrl('/images/hero-kce.jpg'), width: 1200, height: 630, alt: 'KCE — Destinos' }],
    },
  };
}

export default async function DestinationsPage() {
  const locale = await resolveLocale();
  const { cities } = await getFacets();

  const featured = [
    { key: 'Bogotá', slug: 'bogota', blurb: 'Arte, historia y café en el corazón de los Andes.' },
    { key: 'Medellín', slug: 'medellin', blurb: 'Innovación social y cultura local vibrante.' },
    { key: 'Cartagena', slug: 'cartagena', blurb: 'Caribe, murallas y una gastronomía de clase mundial.' },
    { key: 'Eje Cafetero', slug: 'eje-cafetero', blurb: 'Fincas tradicionales y paisajes de palma de cera.' },
  ];

  const canonical = absoluteUrl(`/${locale}/tours/destinations`);
  const items = cities.slice(0, 50).map((city, i) => ({
    '@type': 'ListItem', position: i + 1, url: absoluteUrl(withLocale(locale, `/tours/city/${encodeURIComponent(slugify(city))}`)), name: city 
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: 'Destinos en Colombia', url: canonical },
      { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) },
          { '@type': 'ListItem', position: 2, name: 'Destinos', item: canonical },
        ]
      },
      ...(items.length ? [{ '@type': 'ItemList', name: 'Ciudades Disponibles', itemListElement: items }] : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <main className="min-h-screen bg-[var(--color-bg)] pb-24 pt-12 md:pt-20">
        <div className="mx-auto max-w-7xl px-6">
          
          {/* HERO SECTION */}
          <header className="relative mb-16 overflow-hidden rounded-[3.5rem] border border-[var(--color-border)] bg-brand-dark p-10 md:p-20 text-white shadow-2xl">
            <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.png')] bg-repeat"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-dark via-brand-dark/90 to-brand-blue/30"></div>
            
            <div className="relative z-10 max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md">
                <Navigation className="h-3 w-3" /> Colombia Explorer
              </div>
              <h1 className="font-heading text-4xl leading-tight md:text-6xl lg:text-7xl mb-8">
                Encuentra tu próximo <br/>
                <span className="text-brand-yellow font-light italic">punto de partida.</span>
              </h1>
              <p className="max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl mb-10">
                Hemos organizado nuestro catálogo por ciudades para que tu decisión sea rápida y precisa. De la urbe al caribe, cada destino es una historia por contar.
              </p>
              <Button asChild size="lg" className="rounded-full bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90 px-10">
                <Link href={withLocale(locale, '/tours')}>Ver Catálogo Completo</Link>
              </Button>
            </div>
          </header>

          {/* FEATURED DESTINATIONS (VIP CARDS) */}
          <section className="mb-20">
            <div className="flex items-center justify-between mb-10 border-b border-[var(--color-border)] pb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-brand-yellow" />
                <h2 className="font-heading text-2xl md:text-3xl text-brand-blue">Destinos Imprescindibles</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((d) => {
                const found = cities.find((c) => c.toLowerCase().includes(d.slug.replace('-', ' ')));
                const cityLabel = found || d.key;
                const href = withLocale(locale, `/tours/city/${encodeURIComponent(slugify(cityLabel))}`);
                
                return (
                  <Link
                    key={d.slug}
                    href={href}
                    className="group relative overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="absolute -right-6 -top-6 opacity-5 transition-transform group-hover:scale-110 group-hover:rotate-12">
                       <MapPin className="h-24 w-24 text-brand-blue" />
                    </div>
                    <div className="relative z-10">
                      <div className="mb-4 inline-block rounded-full bg-brand-blue/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-blue">VIP Choice</div>
                      <h3 className="font-heading text-2xl text-brand-blue mb-3">{cityLabel}</h3>
                      <p className="text-sm font-light leading-relaxed text-[var(--color-text)]/60 mb-6">{d.blurb}</p>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-blue">
                        Explorar <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* FULL CITY GRID */}
          <section aria-label="Todas las ciudades" className="mb-20">
            <div className="flex items-center gap-3 mb-10 border-b border-[var(--color-border)] pb-6">
              <Globe className="h-6 w-6 text-brand-blue" />
              <h2 className="font-heading text-2xl md:text-3xl text-brand-blue">Todas las Ubicaciones</h2>
            </div>

            {cities.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cities.map((city) => (
                  <Link
                    key={city}
                    href={withLocale(locale, `/tours/city/${encodeURIComponent(slugify(city))}`)}
                    className="group flex items-center justify-between rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 transition-all hover:bg-[var(--color-surface)] hover:shadow-md hover:border-brand-blue/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-heading text-xl text-brand-blue">{city}</h4>
                        <p className="text-xs font-light text-[var(--color-text)]/50 uppercase tracking-widest">Ver experiencias</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-[var(--color-text)]/20 transition-all group-hover:text-brand-blue group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[2.5rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] p-16 text-center">
                <Compass className="mx-auto h-12 w-12 text-brand-blue/20 mb-4 animate-pulse" />
                <p className="text-lg font-light text-[var(--color-text)]/60">Sincronizando destinos con el catálogo real...</p>
              </div>
            )}
          </section>

          {/* CAPTURE CTA LAYER */}
          <div className="mt-10">
            <CaptureCtas />
          </div>

        </div>
      </main>
    </>
  );
}
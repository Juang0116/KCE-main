import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import { MapPin, Compass, Sparkles, ArrowRight, Globe, Navigation, ArrowUpRight } from 'lucide-react';

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

      <main className="min-h-screen bg-[var(--color-bg)] pb-24 animate-fade-in">
        
        {/* 01. HERO EDITORIAL (PARIDAD CON EL CATÁLOGO) */}
        <section className="relative overflow-hidden bg-[var(--color-surface)] px-6 py-20 md:py-32 text-center border-b border-[var(--color-border)]">
          {/* Destello sutil esmeralda/azul para representar destinos geográficos */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-[var(--color-success)]/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm backdrop-blur-md">
              <Navigation className="h-3 w-3 text-[var(--color-success)]" /> Colombia Explorer
            </div>
            <h1 className="font-heading text-5xl leading-tight md:text-7xl text-[var(--color-text)] tracking-tight mb-6">
              Encuentra tu próximo <br/>
              <span className="text-[var(--color-success)] font-light italic">punto de partida.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-[var(--color-text-muted)] md:text-xl mb-10">
              Hemos organizado nuestro catálogo por ciudades para que tu decisión sea rápida y precisa. De la urbe andina al caribe, cada destino es una historia por contar.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild className="rounded-full px-8 bg-brand-blue text-white hover:bg-brand-blue/90 shadow-pop transition-transform hover:-translate-y-0.5">
                <Link href={withLocale(locale, '/tours')}>Ver Catálogo Completo</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[var(--container-max)] px-6 pt-20">
          
          {/* 02. DESTINOS IMPRESCINDIBLES (VIP CARDS PREMIUM) */}
          <section className="mb-24">
            <div className="text-center mb-12 border-b border-[var(--color-border)] pb-8">
              <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] mb-3">
                <Sparkles className="h-3 w-3 text-brand-yellow" /> Destinos Imprescindibles
              </div>
              <h2 className="font-heading text-3xl font-semibold text-[var(--color-text)]">Rutas Recomendadas por KCE</h2>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((d) => {
                const found = cities.find((c) => c.toLowerCase().includes(d.slug.replace('-', ' ')));
                const cityLabel = found || d.key;
                const href = withLocale(locale, `/tours/city/${encodeURIComponent(slugify(cityLabel))}`);
                
                return (
                  <Link
                    key={d.slug}
                    href={href}
                    className="group relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-soft transition-all hover:shadow-pop hover:-translate-y-1 hover:border-brand-blue/30 flex flex-col"
                  >
                    {/* Elemento decorativo de fondo */}
                    <div className="absolute -right-6 -bottom-6 opacity-[0.02] transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6 pointer-events-none">
                       <MapPin className="h-32 w-32 text-brand-blue" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="mb-4 inline-flex rounded-md bg-brand-blue/5 border border-brand-blue/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-brand-blue">
                        VIP Choice
                      </div>
                      
                      <h3 className="font-heading text-2xl text-[var(--color-text)] group-hover:text-brand-blue transition-colors tracking-tight mb-3">
                        {cityLabel}
                      </h3>
                      
                      <p className="text-sm font-light leading-relaxed text-[var(--color-text-muted)] mb-8 flex-1">
                        {d.blurb}
                      </p>
                      
                      <div className="mt-auto flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] opacity-70 group-hover:text-brand-blue group-hover:opacity-100 transition-all">
                        Explorar <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 03. FULL CITY GRID (LISTA CONTINUA - CERO CAJAS) */}
          <section aria-label="Todas las ciudades" className="mb-24">
            <div className="flex items-center gap-3 mb-10 border-b border-[var(--color-border)] pb-6">
              <Globe className="h-6 w-6 text-brand-blue" />
              <h2 className="font-heading text-2xl md:text-3xl text-[var(--color-text)]">Todas las Ubicaciones</h2>
            </div>

            {cities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                {cities.map((city) => (
                  <Link
                    key={city}
                    href={withLocale(locale, `/tours/city/${encodeURIComponent(slugify(city))}`)}
                    className="group flex items-center justify-between py-4 border-b border-[var(--color-border)]/50 last:border-0 hover:bg-[var(--color-surface-2)]/50 transition-colors -mx-4 px-4 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar del destino sutil */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-brand-blue/70 transition-colors group-hover:bg-brand-blue group-hover:border-brand-blue group-hover:text-white shadow-sm">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="font-heading text-[17px] font-medium text-[var(--color-text)] group-hover:text-brand-blue transition-colors">
                          {city}
                        </h4>
                        <p className="text-[10px] font-body text-[var(--color-text-muted)] uppercase tracking-widest mt-0.5">
                          Ver rutas disponibles
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)] opacity-30 transition-all group-hover:text-brand-blue group-hover:opacity-100 group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            ) : (
              /* EMPTY STATE PREMIUM */
              <div className="py-24 text-center rounded-[var(--radius-2xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-soft flex flex-col items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-6">
                  <Compass className="h-8 w-8 text-[var(--color-text-muted)] opacity-50 animate-pulse" />
                </div>
                <h2 className="font-heading text-2xl font-semibold text-[var(--color-text)] mb-3">Mapeando el territorio...</h2>
                <p className="max-w-md mx-auto text-sm font-light text-[var(--color-text-muted)]">
                  Sincronizando destinos con el catálogo de experiencias reales.
                </p>
              </div>
            )}
          </section>

          {/* 04. CAPTURE CTA LAYER */}
          <div className="mb-12">
            <CaptureCtas compact />
          </div>

        </div>
      </main>
    </>
  );
}
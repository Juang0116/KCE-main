/* src/app/(marketing)/tours/destinations/page.tsx */
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import {
  MapPin,
  Compass,
  Sparkles,
  ArrowRight,
  Globe,
  Navigation,
  ArrowUpRight,
} from 'lucide-react';

import { slugify } from '@/lib/slugify';
import { SITE_URL } from '@/lib/env';
import { getFacets } from '@/features/tours/catalog.server';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';
import CaptureCtas from '@/features/marketing/CaptureCtas';
import { Button } from '@/components/ui/Button';

export const revalidate = 300;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const BASE_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  SITE_URL ||
  'https://kce.travel'
).replace(/\/+$/, '');

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
    description:
      'Explora nuestra selección curada de destinos en Colombia. De Bogotá al Caribe, vive experiencias auténticas con KCE.',
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
      images: [
        {
          url: absoluteUrl('/images/hero-kce.jpg'),
          width: 1200,
          height: 630,
          alt: 'KCE — Destinos',
        },
      ],
    },
  };
}

export default async function DestinationsPage() {
  const locale = await resolveLocale();
  const { cities } = await getFacets();

  const featured = [
    { key: 'Bogotá', slug: 'bogota', blurb: 'Arte, historia y café en el corazón de los Andes.' },
    { key: 'Medellín', slug: 'medellin', blurb: 'Innovación social y cultura local vibrante.' },
    {
      key: 'Cartagena',
      slug: 'cartagena',
      blurb: 'Caribe, murallas y una gastronomía de clase mundial.',
    },
    {
      key: 'Eje Cafetero',
      slug: 'eje-cafetero',
      blurb: 'Fincas tradicionales y paisajes de palma de cera.',
    },
  ];

  const canonical = absoluteUrl(`/${locale}/tours/destinations`);
  const items = cities.slice(0, 50).map((city, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: absoluteUrl(withLocale(locale, `/tours/city/${encodeURIComponent(slugify(city))}`)),
    name: city,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: 'Destinos en Colombia', url: canonical },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) },
          { '@type': 'ListItem', position: 2, name: 'Destinos', item: canonical },
        ],
      },
      ...(items.length
        ? [{ '@type': 'ItemList', name: 'Ciudades Disponibles', itemListElement: items }]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <main className="min-h-screen animate-fade-in bg-base pb-24">
        {/* 01. HERO EDITORIAL (ADN KCE PREMIUM) */}
        <section className="relative overflow-hidden border-b border-brand-dark/10 bg-brand-dark px-6 py-24 text-center md:py-32">
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-full max-w-3xl -translate-x-1/2 rounded-full bg-brand-blue/20 blur-[120px]" />

          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-sm backdrop-blur-md">
              <Navigation className="h-3 w-3 text-brand-yellow" /> Colombia Explorer
            </div>

            <h1 className="mb-6 font-heading text-5xl leading-[1.05] tracking-tight text-white md:text-7xl">
              Encuentra tu próximo <br />
              <span className="font-light italic text-brand-yellow opacity-90">
                punto de partida.
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
              Hemos organizado nuestro catálogo por ciudades para que tu decisión sea rápida y
              precisa. De la urbe andina al caribe, cada destino es una historia por contar.
            </p>

            <div className="flex justify-center">
              <Button
                asChild
                className="w-full rounded-full bg-brand-blue px-10 py-6 text-xs font-bold uppercase tracking-widest text-white shadow-pop transition-transform hover:-translate-y-1 hover:bg-white hover:text-brand-blue sm:w-auto"
              >
                <Link href={withLocale(locale, '/tours')}>Ver Catálogo Completo</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[var(--container-max)] px-6 pt-20">
          {/* 02. DESTINOS IMPRESCINDIBLES (VIP CARDS PREMIUM) */}
          <section className="mb-24">
            <div className="mb-16 border-b border-brand-dark/5 pb-10 text-center dark:border-white/5">
              <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
                <Sparkles className="h-3 w-3 text-brand-yellow" /> Destinos Imprescindibles
              </div>
              <h2 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
                Rutas Recomendadas por KCE
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-2 xl:grid-cols-4">
              {featured.map((d) => {
                const found = cities.find((c) =>
                  c.toLowerCase().includes(d.slug.replace('-', ' ')),
                );
                const cityLabel = found || d.key;
                const href = withLocale(
                  locale,
                  `/tours/city/${encodeURIComponent(slugify(cityLabel))}`,
                );

                return (
                  <Link
                    key={d.slug}
                    href={href}
                    className="group relative flex flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-pop dark:border-white/5"
                  >
                    {/* Elemento decorativo de fondo */}
                    <div className="pointer-events-none absolute -bottom-8 -right-8 opacity-[0.02] transition-transform duration-700 group-hover:-rotate-6 group-hover:scale-125">
                      <MapPin className="h-40 w-40 text-brand-blue" />
                    </div>

                    <div className="relative z-10 flex h-full flex-col">
                      <div className="mb-6 inline-flex self-start rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-blue">
                        VIP Choice
                      </div>

                      <h3 className="mb-4 font-heading text-3xl tracking-tight text-main transition-colors group-hover:text-brand-blue">
                        {cityLabel}
                      </h3>

                      <p className="mb-10 flex-1 text-base font-light leading-relaxed text-muted">
                        {d.blurb}
                      </p>

                      <div className="text-muted/70 mt-auto flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all group-hover:text-brand-blue">
                        Explorar{' '}
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 03. FULL CITY GRID (LISTA ELEGANTE MINIMALISTA) */}
          <section
            aria-label="Todas las ciudades"
            className="mb-24"
          >
            <div className="mb-12 flex flex-col justify-between gap-6 border-b border-brand-dark/5 pb-8 dark:border-white/5 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <Globe className="h-8 w-8 text-brand-blue opacity-80" />
                <h2 className="font-heading text-3xl tracking-tight text-main md:text-4xl">
                  Todas las Ubicaciones
                </h2>
              </div>
            </div>

            {cities.length > 0 ? (
              <div className="grid grid-cols-1 gap-x-12 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                {cities.map((city) => (
                  <Link
                    key={city}
                    href={withLocale(locale, `/tours/city/${encodeURIComponent(slugify(city))}`)}
                    className="group flex items-center justify-between border-b border-brand-dark/5 py-5 transition-colors hover:border-brand-blue/30 dark:border-white/5"
                  >
                    <div className="flex items-center gap-5">
                      {/* Avatar del destino sutil */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-dark/5 bg-surface-2 text-muted shadow-sm transition-colors duration-300 group-hover:border-brand-blue group-hover:bg-brand-blue group-hover:text-white dark:border-white/5">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="font-heading text-xl font-medium tracking-tight text-main transition-colors group-hover:text-brand-blue">
                          {city}
                        </h4>
                        <p className="text-muted/70 mt-1 text-[10px] font-bold uppercase tracking-widest transition-colors group-hover:text-brand-blue/70">
                          Ver rutas
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted opacity-30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-blue group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            ) : (
              /* EMPTY STATE PREMIUM */
              <div className="flex flex-col items-center justify-center rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface py-24 text-center shadow-soft dark:border-white/5">
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-brand-dark/5 bg-surface-2 shadow-sm dark:border-white/5">
                  <Compass className="h-8 w-8 animate-pulse text-muted opacity-50" />
                </div>
                <h2 className="mb-4 font-heading text-3xl tracking-tight text-main">
                  Mapeando el territorio...
                </h2>
                <p className="mx-auto max-w-md text-base font-light leading-relaxed text-muted">
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

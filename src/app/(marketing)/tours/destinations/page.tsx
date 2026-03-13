// src/app/(marketing)/tours/destinations/page.tsx
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';

import { slugify } from '@/lib/slugify';
import { SITE_URL } from '@/lib/env';
import { getFacets } from '@/features/tours/catalog.server';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';
import CaptureCtas from '@/features/marketing/CaptureCtas';

export const revalidate = 300;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || SITE_URL || 'https://kce.travel')
  .replace(/\/+$/, '');

async function resolveLocale(): Promise<SupportedLocale> {
  // Header (si lo setea middleware/proxy) tiene prioridad
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

  // evita duplicar si ya viene con /es /en /fr /de
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;

  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();

  const canonicalPath = `/${locale}/tours/destinations`;
  const canonicalAbs = absoluteUrl(canonicalPath);

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: 'Destinos — Tours en Colombia',
    description:
      'Explora tours por ciudad. Bogotá, Cartagena, Caldas y más destinos culturales en Colombia.',
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
      title: 'Destinos — KCE',
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
    twitter: {
      card: 'summary_large_image',
      images: [absoluteUrl('/images/hero-kce.jpg')],
    },
  };
}

export default async function DestinationsPage() {
  const locale = await resolveLocale();
  const { cities } = await getFacets();

  const featured = [
    { key: 'Bogotá', slug: 'bogota', blurb: 'Arte, historia, café y vida urbana. Ideal para primer viaje.' },
    { key: 'Medellín', slug: 'medellin', blurb: 'Innovación, cultura local y experiencias con guías.' },
    { key: 'Cartagena', slug: 'cartagena', blurb: 'Caribe, ciudad amurallada y gastronomía.' },
    { key: 'Eje Cafetero', slug: 'eje-cafetero', blurb: 'Fincas, paisajes y café auténtico.' },
  ];

  const base = (SITE_URL || getPublicBaseUrl() || BASE_SITE_URL).replace(/\/+$/, '');
  const canonical = absoluteUrl(`/${locale}/tours/destinations`);

  const items = cities.slice(0, 50).map((city, i) => {
    const s = slugify(city);
    const href = absoluteUrl(withLocale(locale, `/tours/city/${encodeURIComponent(s)}`));
    return { '@type': 'ListItem', position: i + 1, url: href, name: city };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Destinos en Colombia',
        url: canonical,
        isPartOf: { '@type': 'WebSite', name: 'KCE', url: base },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) },
          { '@type': 'ListItem', position: 2, name: 'Tours', item: absoluteUrl(`/${locale}/tours`) },
          { '@type': 'ListItem', position: 3, name: 'Destinos', item: canonical },
        ],
      },
      ...(items.length ? [{ '@type': 'ItemList', name: 'Destinos', itemListElement: items }] : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <main className="mx-auto max-w-[var(--container-max)] px-4 py-10">
        <div className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue/80">Destinations</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="font-heading text-3xl text-brand-blue">Destinos en Colombia</h1>
              <p className="mt-2 text-sm text-[color:var(--color-text)]/75">
                Páginas pensadas para mercado europeo: claridad, confianza y rutas de decisión rápidas. Explora por
                ciudad y encuentra el tour correcto en 2–3 clics.
              </p>
            </div>
            <div className="text-sm">
              <Link className="font-semibold text-brand-blue hover:underline" href={withLocale(locale, '/tours')}>
                Ver catálogo completo →
              </Link>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((d) => {
              // Si existe la ciudad en facets, usa el slug real; si no, usa el slug sugerido.
              const found = cities.find((c) => c.toLowerCase().includes(d.slug.replace('-', ' ')));
              const cityLabel = found || d.key;
              const s = slugify(cityLabel);
              const href = withLocale(locale, `/tours/city/${encodeURIComponent(s)}`);
              return (
                <Link
                  key={d.slug}
                  href={href}
                  className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4 shadow-soft hover:bg-[color:var(--color-surface)]"
                >
                  <div className="text-xs text-[color:var(--color-text)]/60">Destino</div>
                  <div className="mt-1 font-heading text-lg text-brand-blue">{cityLabel}</div>
                  <div className="mt-2 text-sm text-[color:var(--color-text)]/70">{d.blurb}</div>
                </Link>
              );
            })}
          </div>
        </div>

        <section aria-label="Ciudades" className="mt-8">
          {cities.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cities.map((city) => {
                const s = slugify(city);
                const href = withLocale(locale, `/tours/city/${encodeURIComponent(s)}`);
                return (
                  <Link
                    key={city}
                    href={href}
                    className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft hover:bg-[color:var(--color-surface-2)]"
                  >
                    <div className="text-xs text-[color:var(--color-text)]/60">Ciudad</div>
                    <div className="mt-1 font-heading text-xl text-brand-blue">{city}</div>
                    <div className="mt-2 text-sm text-[color:var(--color-text)]/70">
                      Explora experiencias curadas en {city}.
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 text-sm text-[color:var(--color-text)]/75">
              Aún no hay ciudades publicadas. Agrega tours con campo <b>city</b> para que aparezcan aquí.
            </div>
          )}
        </section>

        <div className="mt-10">
          <CaptureCtas />
        </div>
      </main>
    </>
  );
}

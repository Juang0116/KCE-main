// src/app/(marketing)/tours/city/[city]/page.tsx
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import CaptureCtas from '@/features/marketing/CaptureCtas';
import { getFacets, listTours } from '@/features/tours/catalog.server';
import { toTourLike } from '@/features/tours/adapters';
import TourCardPremium from '@/features/tours/components/TourCardPremium';
import Pagination from '@/features/tours/components/Pagination';
import ToursToolbarLite from '@/features/tours/components/ToursToolbarLite';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';
import { slugify } from '@/lib/slugify';

export const revalidate = 300;

type SearchParams = { [key: string]: string | string[] | undefined };
type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? '') : (v ?? ''));
const isSort = (v: string): v is 'price-asc' | 'price-desc' => v === 'price-asc' || v === 'price-desc';

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;

  const c = await cookies();
  const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;

  return 'es';
}

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;

  // evita duplicar si ya viene con /es /en /fr /de
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;

  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

async function resolveCityName(citySlug: string): Promise<string | null> {
  const { cities } = await getFacets();
  const match = cities.find((c) => slugify(c) === citySlug);
  return match || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale();
  const { city } = await params;

  const name = await resolveCityName(city);
  if (!name) {
    return {
      metadataBase: new URL(getPublicBaseUrl()),
      title: 'Destinos — KCE',
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `/${locale}/tours/city/${encodeURIComponent(city)}`;
  const canonicalUrl = absoluteUrl(canonicalPath);

  return {
    metadataBase: new URL(getPublicBaseUrl()),
    title: `${name} — Tours | KCE`,
    description: `Tours y experiencias en ${name}, Colombia. Explora cultura, gastronomía y aventura con KCE.`,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: absoluteUrl(`/es/tours/city/${encodeURIComponent(city)}`),
        en: absoluteUrl(`/en/tours/city/${encodeURIComponent(city)}`),
        fr: absoluteUrl(`/fr/tours/city/${encodeURIComponent(city)}`),
        de: absoluteUrl(`/de/tours/city/${encodeURIComponent(city)}`),
      },
    },
    openGraph: {
      title: `${name} — KCE`,
      description: `Explora tours en ${name}.`,
      url: canonicalUrl,
      type: 'website',
      images: [
        {
          url: absoluteUrl('/images/hero-kce.jpg'),
          width: 1200,
          height: 630,
          alt: `Tours en ${name} — KCE`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: [absoluteUrl('/images/hero-kce.jpg')],
    },
  };
}

export default async function ToursByCityPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const locale = await resolveLocale();
  const { city: citySlug } = await params;

  const cityName = await resolveCityName(citySlug);
  if (!cityName) notFound();

  const sp = (await Promise.resolve(searchParams ?? {})) as SearchParams;

  const q = pick(sp.q).trim();
  const tag = pick(sp.tag).trim();

  const pminRaw = pick(sp.pmin).trim();
  const pmaxRaw = pick(sp.pmax).trim();
  const pmin = pminRaw && Number.isFinite(Number(pminRaw)) ? Number(pminRaw) : undefined;
  const pmax = pmaxRaw && Number.isFinite(Number(pmaxRaw)) ? Number(pmaxRaw) : undefined;

  const pageRaw = pick(sp.page).trim();
  const page = Math.max(1, Math.trunc(Number(pageRaw || '1') || 1));

  const sortRaw = pick(sp.sort).trim();
  const sort: 'popular' | 'price-asc' | 'price-desc' = isSort(sortRaw) ? sortRaw : 'popular';

  const limit = 12;
  const offset = (page - 1) * limit;

  const [{ tags }, toursRes] = await Promise.all([
    getFacets(),
    listTours({
      q,
      tag,
      city: cityName,
      sort,
      limit,
      offset,
      ...(pmin !== undefined ? { minPrice: pmin } : {}),
      ...(pmax !== undefined ? { maxPrice: pmax } : {}),
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil((toursRes.total || 0) / limit));
  const basePath = withLocale(locale, `/tours/city/${encodeURIComponent(citySlug)}`);

  const base = absoluteUrl('/'); // Website base absoluto (seoJson decide host)
  const canonical = absoluteUrl(`/${locale}/tours/city/${encodeURIComponent(citySlug)}`);

  const items = (toursRes.items ?? []).slice(0, limit).map((t, i) => {
    const ui = toTourLike(t);
    const url = absoluteUrl(withLocale(locale, `/tours/${encodeURIComponent(ui.slug)}`));

    // image: soporta string o [{url,...}]
    const firstImg =
      (Array.isArray(ui.images) &&
        ui.images.length > 0 &&
        (typeof ui.images[0] === 'string'
          ? ui.images[0]
          : (ui.images[0] as any)?.url)) ||
      ui.image ||
      '';

    const imageAbs = firstImg ? absoluteUrl(firstImg) : undefined;

    return {
      '@type': 'ListItem',
      position: i + 1,
      url,
      item: {
        '@type': 'TouristTrip',
        name: ui.title,
        url,
        ...(imageAbs ? { image: imageAbs } : {}),
      },
    };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `Tours en ${cityName}`,
        url: canonical,
        isPartOf: { '@type': 'WebSite', name: 'KCE', url: base },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) },
          { '@type': 'ListItem', position: 2, name: 'Tours', item: absoluteUrl(`/${locale}/tours`) },
          { '@type': 'ListItem', position: 3, name: cityName, item: canonical },
        ],
      },
      ...(items.length
        ? [
            {
              '@type': 'ItemList',
              name: `Tours en ${cityName}`,
              itemListElement: items,
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <main className="mx-auto max-w-[var(--container-max)] px-4 py-10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-heading text-3xl text-brand-blue">Tours en {cityName}</h1>
            <p className="mt-2 text-[color:var(--color-text)]/75">
              Descubre experiencias culturales, gastronómicas y de aventura en {cityName}.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <Link className="font-semibold text-brand-blue hover:underline" href={withLocale(locale, '/tours')}>
                Ver todo el catálogo
              </Link>
              <span className="text-[color:var(--color-text)]/30">•</span>
              <Link
                className="font-semibold text-brand-blue hover:underline"
                href={withLocale(locale, '/tours/destinations')}
              >
                Otros destinos
              </Link>
            </div>
          </div>

          <div className="text-[color:var(--color-text)]/65 flex flex-col items-start gap-2 text-sm lg:items-end">
            <div>
              <span className="font-medium text-[color:var(--color-text)]">{toursRes.total}</span> resultados
            </div>
            <div>
              Fuente: <span className="font-medium text-[color:var(--color-text)]">{toursRes.source}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <ToursToolbarLite initial={{ q, tag, sort, pmin: pminRaw, pmax: pmaxRaw }} tags={tags} />
        </div>

        <div className="mt-6">
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue/80">Planifica mejor en {cityName}</p>
                <p className="mt-2 text-sm text-[color:var(--color-text)]/75">Compara experiencias, filtra por presupuesto y pasa a checkout cuando tengas claro tu tour ideal.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={withLocale(locale, '/plan')}
                  className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-soft hover:opacity-95"
                >
                  Recibir recomendación
                </Link>
                <Link
                  href={withLocale(locale, '/contact')}
                  className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-semibold text-brand-blue hover:bg-[color:var(--color-surface)]"
                >
                  Hablar con un asesor
                </Link>
              </div>
            </div>
          </div>

          <CaptureCtas compact />
        </div>

        <section aria-label="Resultados" className="mt-8">
          {toursRes.items.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {toursRes.items.map((tour, idx) => {
                const ui = toTourLike(tour);
                return (
                  <TourCardPremium
                    key={ui.slug}
                    tour={ui}
                    priority={idx < 6}
                    href={withLocale(locale, `/tours/${ui.slug}`)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="card mt-2 p-6">
              <h2 className="font-heading text-lg text-brand-blue">Sin resultados</h2>
              <p className="mt-2 text-sm text-[color:var(--color-text)]/75">
                No encontramos tours en {cityName} con esos filtros.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={basePath}
                  className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-soft hover:opacity-95"
                >
                  Limpiar filtros
                </Link>
                <Link
                  href={withLocale(locale, '/tours')}
                  className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm font-semibold text-brand-blue shadow-soft hover:bg-[color:var(--color-surface-2)]"
                >
                  Ver todo el catálogo
                </Link>
                <Link
                  href={withLocale(locale, '/contact')}
                  className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm font-semibold text-brand-blue shadow-soft hover:bg-[color:var(--color-surface-2)]"
                >
                  Pedir ayuda
                </Link>
              </div>
            </div>
          )}
        </section>

        <Pagination
          basePath={basePath}
          query={{
            q: q || undefined,
            tag: tag || undefined,
            sort: sort !== 'popular' ? sort : undefined,
            pmin: pminRaw || undefined,
            pmax: pmaxRaw || undefined,
          }}
          page={page}
          totalPages={totalPages}
        />
      </main>
    </>
  );
}

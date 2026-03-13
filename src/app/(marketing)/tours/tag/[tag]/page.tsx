// src/app/(marketing)/tours/tag/[tag]/page.tsx
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { slugify } from '@/lib/slugify';
import { SITE_URL } from '@/lib/env';
import CaptureCtas from '@/features/marketing/CaptureCtas';
import { getFacets, listTours } from '@/features/tours/catalog.server';
import { toTourLike } from '@/features/tours/adapters';
import TourCardPremium from '@/features/tours/components/TourCardPremium';
import Pagination from '@/features/tours/components/Pagination';
import ToursToolbarLite from '@/features/tours/components/ToursToolbarLite';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';

export const revalidate = 300;

type SearchParams = { [key: string]: string | string[] | undefined };
type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);
const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? '') : (v ?? ''));
const isSort = (v: string): v is 'price-asc' | 'price-desc' => v === 'price-asc' || v === 'price-desc';

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

  // evita duplicar si ya viene con /es /en /fr /de
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;

  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

function abs(path: string) {
  // usa tu helper existente absoluteUrl, pero asegurando base estable via env
  // (absoluteUrl normalmente ya lo hace, pero esta función te permite swap rápido si lo necesitas)
  return absoluteUrl(path);
}

async function resolveTagName(tagSlug: string): Promise<string | null> {
  const { tags } = await getFacets();
  const match = (tags || []).find((t) => slugify(t) === tagSlug);
  return match || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale();
  const { tag } = await params;

  const name = await resolveTagName(tag);
  if (!name) {
    return {
      metadataBase: new URL(BASE_SITE_URL),
      title: 'Estilos — KCE',
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `/${locale}/tours/tag/${encodeURIComponent(tag)}`;
  const canonicalAbs = abs(canonicalPath);

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: `${name} — Tours`,
    description: `Tours con estilo “${name}” en Colombia. Cultura, gastronomía, aventura y más.`,
    alternates: {
      canonical: canonicalAbs,
      languages: {
        es: `/es/tours/tag/${encodeURIComponent(tag)}`,
        en: `/en/tours/tag/${encodeURIComponent(tag)}`,
        fr: `/fr/tours/tag/${encodeURIComponent(tag)}`,
        de: `/de/tours/tag/${encodeURIComponent(tag)}`,
      },
    },
    openGraph: {
      title: `${name} — KCE`,
      description: `Explora tours con estilo “${name}”.`,
      url: canonicalAbs,
      type: 'website',
      images: [
        {
          url: abs('/images/hero-kce.jpg'),
          width: 1200,
          height: 630,
          alt: `KCE — ${name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: [abs('/images/hero-kce.jpg')],
    },
  };
}

export default async function ToursByTagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const locale = await resolveLocale();
  const { tag: tagSlug } = await params;

  const tagName = await resolveTagName(tagSlug);
  if (!tagName) notFound();

  const sp = (await Promise.resolve(searchParams ?? {})) as SearchParams;

  const q = pick(sp.q).trim();
  const city = pick(sp.city).trim();

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

  const [{ cities, tags }, toursRes] = await Promise.all([
    getFacets(),
    listTours({
      q,
      tag: tagName,
      ...(city ? { city } : {}),
      sort,
      limit,
      offset,
      ...(pmin !== undefined ? { minPrice: pmin } : {}),
      ...(pmax !== undefined ? { maxPrice: pmax } : {}),
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil((toursRes.total || 0) / limit));
  const basePath = withLocale(locale, `/tours/tag/${encodeURIComponent(tagSlug)}`);

  const base = (SITE_URL || getPublicBaseUrl() || BASE_SITE_URL).replace(/\/+$/, '');
  const canonical = abs(`/${locale}/tours/tag/${encodeURIComponent(tagSlug)}`);

  const items = (toursRes.items ?? []).slice(0, 12).map((t, i) => {
    const ui = toTourLike(t);
    const url = abs(withLocale(locale, `/tours/${encodeURIComponent(ui.slug)}`));
    const image =
      Array.isArray(ui.images) && ui.images[0]?.url ? ui.images[0].url : (ui.image ?? undefined);

    return {
      '@type': 'ListItem',
      position: i + 1,
      url,
      item: {
        '@type': 'TouristTrip',
        name: ui.title,
        url,
        ...(image ? { image } : {}),
      },
    };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `Tours: ${tagName}`,
        url: canonical,
        isPartOf: { '@type': 'WebSite', name: 'KCE', url: base },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: abs(`/${locale}`) },
          { '@type': 'ListItem', position: 2, name: 'Tours', item: abs(`/${locale}/tours`) },
          { '@type': 'ListItem', position: 3, name: tagName, item: canonical },
        ],
      },
      ...(items.length
        ? [{ '@type': 'ItemList', name: `Tours: ${tagName}`, itemListElement: items }]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <main className="mx-auto max-w-[var(--container-max)] px-4 py-10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-heading text-3xl text-brand-blue">Tours “{tagName}”</h1>
            <p className="mt-2 text-[color:var(--color-text)]/75">
              Filtra por ciudad, precio y popularidad. Páginas perfectas para SEO y campañas.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <Link
                className="font-semibold text-brand-blue hover:underline"
                href={withLocale(locale, '/tours')}
              >
                Ver todo el catálogo
              </Link>
              <span className="text-[color:var(--color-text)]/30">•</span>
              <Link
                className="font-semibold text-brand-blue hover:underline"
                href={withLocale(locale, '/tours/styles')}
              >
                Otros estilos
              </Link>
            </div>
          </div>

          <div className="text-[color:var(--color-text)]/65 flex flex-col items-start gap-2 text-sm lg:items-end">
            <div>
              <span className="font-medium text-[color:var(--color-text)]">{toursRes.total}</span>{' '}
              resultados
            </div>
            <div>
              Fuente:{' '}
              <span className="font-medium text-[color:var(--color-text)]">{toursRes.source}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <ToursToolbarLite
            initial={{ q, tag: '', city, sort, pmin: pminRaw, pmax: pmaxRaw }}
            tags={tags}
          />
        </div>

        {/* City quick links */}
        {cities?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {cities.slice(0, 10).map((c) => (
              <Link
                key={c}
                href={`${basePath}?city=${encodeURIComponent(c)}`}
                className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-[color:var(--color-surface-2)]"
              >
                {c}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-6">
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue/80">Estilo curado</p>
                <p className="mt-2 text-sm text-[color:var(--color-text)]/75">Esta selección reúne tours con una intención similar para comparar mejor y decidir más rápido.</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue/80">Filtra por ciudad</p>
                <p className="mt-2 text-sm text-[color:var(--color-text)]/75">Cruza el estilo con destino y presupuesto para aterrizar el tour que realmente encaja contigo.</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue/80">Pasa a reserva</p>
                <p className="mt-2 text-sm text-[color:var(--color-text)]/75">Cuando lo tengas claro, entra al detalle del tour y reserva con pago seguro y confirmación rápida.</p>
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
                No encontramos tours con el estilo “{tagName}” para esos filtros.
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
                  href={withLocale(locale, '/plan')}
                  className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm font-semibold text-brand-blue shadow-soft hover:bg-[color:var(--color-surface-2)]"
                >
                  Recibir ayuda guiada
                </Link>
              </div>
            </div>
          )}
        </section>

        <Pagination
          basePath={basePath}
          query={{
            q: q || undefined,
            city: city || undefined,
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

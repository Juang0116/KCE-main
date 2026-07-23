/* src/app/(marketing)/tours/city/[city]/page.tsx */
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import { MapPin, Compass, Sparkles, ArrowRight, FilterX } from 'lucide-react';

import CaptureCtas from '@/features/marketing/CaptureCtas';
import { getFacets, listTours } from '@/features/tours/catalog.server';
import { toTourLike } from '@/features/tours/adapters';
import TourCardPremium from '@/features/tours/components/TourCardPremium';
import Pagination from '@/features/tours/components/Pagination';
import ToursToolbarLite from '@/features/tours/components/ToursToolbarLite';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';
import { slugify } from '@/lib/slugify';
import { Button } from '@/components/ui/Button';

export const revalidate = 300;

type SearchParams = { [key: string]: string | string[] | undefined };
type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);
const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? '') : (v ?? ''));
const isSort = (v: string): v is 'price-asc' | 'price-desc' =>
  v === 'price-asc' || v === 'price-desc';

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
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

async function resolveCityName(citySlug: string): Promise<string> {
  const { cities } = await getFacets();
  const match = cities.find((c) => slugify(c) === citySlug);
  // Si no hay tours activos en esta ciudad, devolvemos el nombre formateado para no romper la web.
  if (match) return match;
  return citySlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale();
  const { city } = await params;
  const name = await resolveCityName(city);

  const canonicalUrl = absoluteUrl(`/${locale}/tours/city/${encodeURIComponent(city)}`);

  return {
    metadataBase: new URL(getPublicBaseUrl()),
    title: `${name} — Tours de lujo | KCE`,
    description: `Explora los mejores tours y experiencias en ${name}, Colombia. Selección curada de cultura y aventura por KCE.`,
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
      description: `Experiencias exclusivas en ${name}.`,
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
    twitter: { card: 'summary_large_image', images: [absoluteUrl('/images/hero-kce.jpg')] },
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

  // Ahora cityName siempre es un string, nunca detendrá el renderizado
  const cityName = await resolveCityName(citySlug);

  const sp = (await Promise.resolve(searchParams ?? {})) as SearchParams;
  const q = pick(sp.q).trim();
  const tag = pick(sp.tag).trim();
  const pminRaw = pick(sp.pmin).trim();
  const pmaxRaw = pick(sp.pmax).trim();
  const pmin = pminRaw && Number.isFinite(Number(pminRaw)) ? Number(pminRaw) : undefined;
  const pmax = pmaxRaw && Number.isFinite(Number(pmaxRaw)) ? Number(pmaxRaw) : undefined;
  const page = Math.max(1, Math.trunc(Number(pick(sp.page).trim() || '1') || 1));
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
  const canonical = absoluteUrl(`/${locale}/tours/city/${encodeURIComponent(citySlug)}`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: `Tours en ${cityName}`, url: canonical },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Tours',
            item: absoluteUrl(`/${locale}/tours`),
          },
          { '@type': 'ListItem', position: 3, name: cityName, item: canonical },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <main className="min-h-screen animate-fade-in bg-base pb-24">
        {/* 01. HERO EDITORIAL (ESTILO INMERSIVO LUXURY) */}
        <section className="relative overflow-hidden border-b border-brand-dark/10 bg-brand-dark px-6 py-24 text-center md:py-32">
          {/* Destello sutil azul medianoche */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-full max-w-3xl -translate-x-1/2 rounded-full bg-brand-blue/20 blur-[120px]" />

          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-sm backdrop-blur-md">
              <MapPin className="h-3 w-3 text-brand-yellow" /> Destino KCE
            </div>
            <h1 className="mb-6 font-heading text-5xl leading-[1.05] tracking-tight text-white md:text-7xl">
              Experiencias en{' '}
              <span className="font-light italic text-brand-yellow opacity-90">{cityName}</span>.
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
              Desde joyas ocultas hasta clásicos reimaginados. Explora nuestra selección curada de
              aventuras y cultura en el corazón de {cityName}.
            </p>
            <div className="flex justify-center">
              <Link
                href={withLocale(locale, '/tours/destinations')}
                className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 transition-colors hover:text-white"
              >
                <ArrowRight className="h-3 w-3 rotate-180 transition-transform group-hover:-translate-x-1" />{' '}
                Ver todos los destinos
              </Link>
            </div>
          </div>
        </section>

        {/* 02. TOOLBAR & RESULTADOS */}
        <section className="mx-auto max-w-[var(--container-max)] px-6 py-12">
          {/* Barra de Búsqueda Refinada */}
          <div className="mb-12 flex flex-col gap-8 border-b border-brand-dark/5 pb-12 dark:border-white/5 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-3xl flex-1">
              <ToursToolbarLite
                initial={{ q, tag, sort, pmin: pminRaw, pmax: pmaxRaw }}
                tags={tags}
              />
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-brand-dark/5 bg-surface-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted shadow-sm dark:border-white/5">
              <span className="font-heading text-base tracking-tight text-main">
                {toursRes.total}
              </span>{' '}
              Tours encontrados
            </div>
          </div>

          {/* 03. VIP CONCIERGE CARD (AHORA PREMIUM) */}
          <div className="mb-16">
            <div className="group relative overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft dark:border-white/5 md:p-14">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue/5 blur-[100px] transition-transform duration-700 group-hover:scale-125" />

              <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-dark/5 bg-surface-2 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted dark:border-white/5">
                    <Sparkles className="h-3 w-3 text-brand-yellow" /> Servicio Personalizado
                  </div>
                  <h3 className="mb-4 font-heading text-3xl tracking-tight text-main transition-colors group-hover:text-brand-blue md:text-4xl">
                    ¿Buscas algo diferente en {cityName}?
                  </h3>
                  <p className="text-base font-light leading-relaxed text-muted md:text-lg">
                    Si no encuentras el tour exacto que imaginas, nuestro equipo puede diseñar una
                    ruta privada cruzando tus intereses con la esencia única de este destino.
                  </p>
                </div>
                <div className="flex w-full shrink-0 flex-col gap-4 sm:w-auto sm:flex-row">
                  <Button
                    asChild
                    className="w-full rounded-full bg-brand-blue px-8 py-6 text-xs font-bold uppercase tracking-widest text-white shadow-pop transition-transform hover:-translate-y-1 hover:bg-white hover:text-brand-blue sm:w-auto"
                  >
                    <Link href={withLocale(locale, '/plan')}>Crear Plan a Medida</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-full border-brand-dark/10 bg-surface px-8 py-6 text-xs font-bold uppercase tracking-widest text-main transition-transform hover:-translate-y-1 hover:bg-surface-2 dark:border-white/10 sm:w-auto"
                  >
                    <Link href={withLocale(locale, '/contact')}>Hablar con Asesor</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 04. GRID DE RESULTADOS */}
          {toursRes.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 xl:grid-cols-3">
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
            /* 05. EMPTY STATE (Premium) - Evita el 404 */
            <div className="flex flex-col items-center justify-center rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface py-24 text-center shadow-soft dark:border-white/5">
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-brand-dark/5 bg-surface-2 shadow-sm dark:border-white/5">
                <FilterX className="h-8 w-8 text-muted opacity-50" />
              </div>
              <h2 className="mb-4 font-heading text-3xl tracking-tight text-main">
                Mapeando el territorio...
              </h2>
              <p className="mx-auto mb-10 max-w-md text-base font-light leading-relaxed text-muted">
                Actualmente no tenemos tours publicados en {cityName}, pero nuestro equipo está
                diseñando nuevas experiencias aquí.
              </p>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-brand-dark/10 bg-surface px-8 py-6 text-xs font-bold uppercase tracking-widest text-main transition-transform hover:-translate-y-1 hover:bg-surface-2 dark:border-white/10"
              >
                <Link href={withLocale(locale, '/tours')}>Ver Catálogo Completo</Link>
              </Button>
            </div>
          )}

          {/* 06. PAGINACIÓN */}
          <div className="mt-20 flex justify-center">
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
          </div>
        </section>

        {/* 07. CAPTURE CTA LAYER */}
        <div className="mx-auto mt-12 max-w-[var(--container-max)] px-6">
          <CaptureCtas compact />
        </div>
      </main>
    </>
  );
}

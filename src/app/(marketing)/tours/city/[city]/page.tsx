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
import { MapPin, Search } from 'lucide-react';

export const revalidate = 300;

type SearchParams = { [key: string]: string | string[] | undefined };
type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);
const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? '') : (v ?? ''));
const isSort = (v: string): v is 'price-asc' | 'price-desc' => v === 'price-asc' || v === 'price-desc';

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers(); const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;
  const c = await cookies(); const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;
  return 'es';
}

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

async function resolveCityName(citySlug: string): Promise<string | null> {
  const { cities } = await getFacets();
  const match = cities.find((c) => slugify(c) === citySlug);
  return match || null;
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const locale = await resolveLocale();
  const { city } = await params;
  const name = await resolveCityName(city);
  if (!name) return { metadataBase: new URL(getPublicBaseUrl()), title: 'Destinos — KCE', robots: { index: false, follow: false } };
  const canonicalUrl = absoluteUrl(`/${locale}/tours/city/${encodeURIComponent(city)}`);

  return {
    metadataBase: new URL(getPublicBaseUrl()), title: `${name} — Tours | KCE`, description: `Tours y experiencias en ${name}, Colombia. Explora cultura, gastronomía y aventura con KCE.`, alternates: { canonical: canonicalUrl, languages: { es: absoluteUrl(`/es/tours/city/${encodeURIComponent(city)}`), en: absoluteUrl(`/en/tours/city/${encodeURIComponent(city)}`), fr: absoluteUrl(`/fr/tours/city/${encodeURIComponent(city)}`), de: absoluteUrl(`/de/tours/city/${encodeURIComponent(city)}`) } },
    openGraph: { title: `${name} — KCE`, description: `Explora tours en ${name}.`, url: canonicalUrl, type: 'website', images: [{ url: absoluteUrl('/images/hero-kce.jpg'), width: 1200, height: 630, alt: `Tours en ${name} — KCE` }] }, twitter: { card: 'summary_large_image', images: [absoluteUrl('/images/hero-kce.jpg')] },
  };
}

export default async function ToursByCityPage({ params, searchParams }: { params: Promise<{ city: string }>; searchParams?: Promise<SearchParams> | SearchParams; }) {
  const locale = await resolveLocale();
  const { city: citySlug } = await params;
  const cityName = await resolveCityName(citySlug);
  if (!cityName) notFound();

  const sp = (await Promise.resolve(searchParams ?? {})) as SearchParams;
  const q = pick(sp.q).trim(); const tag = pick(sp.tag).trim();
  const pminRaw = pick(sp.pmin).trim(); const pmaxRaw = pick(sp.pmax).trim();
  const pmin = pminRaw && Number.isFinite(Number(pminRaw)) ? Number(pminRaw) : undefined;
  const pmax = pmaxRaw && Number.isFinite(Number(pmaxRaw)) ? Number(pmaxRaw) : undefined;
  const page = Math.max(1, Math.trunc(Number(pick(sp.page).trim() || '1') || 1));
  const sortRaw = pick(sp.sort).trim(); const sort: 'popular' | 'price-asc' | 'price-desc' = isSort(sortRaw) ? sortRaw : 'popular';
  const limit = 12; const offset = (page - 1) * limit;

  const [{ tags }, toursRes] = await Promise.all([
    getFacets(),
    listTours({ q, tag, city: cityName, sort, limit, offset, ...(pmin !== undefined ? { minPrice: pmin } : {}), ...(pmax !== undefined ? { maxPrice: pmax } : {}) }),
  ]);

  const totalPages = Math.max(1, Math.ceil((toursRes.total || 0) / limit));
  const basePath = withLocale(locale, `/tours/city/${encodeURIComponent(citySlug)}`);
  const canonical = absoluteUrl(`/${locale}/tours/city/${encodeURIComponent(citySlug)}`);
  const base = absoluteUrl('/');

  const items = (toursRes.items ?? []).slice(0, limit).map((t, i) => {
    const ui = toTourLike(t);
    const url = absoluteUrl(withLocale(locale, `/tours/${encodeURIComponent(ui.slug)}`));
    const firstImg = (Array.isArray(ui.images) && ui.images.length > 0 && (typeof ui.images[0] === 'string' ? ui.images[0] : (ui.images[0] as any)?.url)) || ui.image || '';
    const imageAbs = firstImg ? absoluteUrl(firstImg) : undefined;
    return { '@type': 'ListItem', position: i + 1, url, item: { '@type': 'TouristTrip', name: ui.title, url, ...(imageAbs ? { image: imageAbs } : {}) } };
  });

  const jsonLd = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'CollectionPage', name: `Tours en ${cityName}`, url: canonical, isPartOf: { '@type': 'WebSite', name: 'KCE', url: base } },
      { '@type': 'BreadcrumbList', itemListElement: [ { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) }, { '@type': 'ListItem', position: 2, name: 'Tours', item: absoluteUrl(`/${locale}/tours`) }, { '@type': 'ListItem', position: 3, name: cityName, item: canonical } ] },
      ...(items.length ? [{ '@type': 'ItemList', name: `Tours en ${cityName}`, itemListElement: items }] : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <main className="min-h-screen bg-[color:var(--color-bg)] pb-24">
        
        {/* HEADER CIUDAD */}
        <section className="bg-brand-dark px-6 py-20 text-center text-white">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow backdrop-blur-md">
            <MapPin className="h-3 w-3" /> Explorando Destino
          </div>
          <h1 className="font-heading text-4xl md:text-6xl drop-shadow-md">
            Tours en {cityName}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-light text-white/80">
            Descubre experiencias culturales, gastronómicas y de aventura seleccionadas por KCE.
          </p>
        </section>

        {/* CONTENEDOR DE RESULTADOS */}
        <section className="mx-auto max-w-[var(--container-max)] px-6 py-12">
          
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-8 border-b border-[var(--color-border)] pb-8">
            <ToursToolbarLite initial={{ q, tag, sort, pmin: pminRaw, pmax: pmaxRaw }} tags={tags} />
            <div className="flex flex-col items-start gap-1 lg:items-end text-xs uppercase tracking-widest font-bold text-[var(--color-text)]/40">
              <div><span className="text-brand-blue">{toursRes.total}</span> Experiencias</div>
              <div className="flex items-center gap-3 mt-2">
                <Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/tours')}>Catálogo General</Link>
                <span>|</span>
                <Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/destinations')}>Cambiar Ciudad</Link>
              </div>
            </div>
          </div>

          {/* TARJETAS DE CONVERSIÓN */}
          <div className="mb-10">
            <div className="rounded-[2rem] border border-brand-blue/20 bg-brand-blue/5 p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="font-heading text-xl text-brand-blue">¿Buscas algo más específico en {cityName}?</h3>
                  <p className="mt-1 text-sm font-light text-[var(--color-text)]/70">Si no encuentras el tour ideal, nuestra IA puede armar una ruta cruzando tus gustos con este destino.</p>
                </div>
                <div className="flex flex-wrap gap-3 shrink-0">
                  <Link href={withLocale(locale, '/plan')} className="rounded-full bg-brand-blue px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-md hover:scale-105 transition-transform">
                    Plan Personalizado
                  </Link>
                  <Link href={withLocale(locale, '/contact')} className="rounded-full border border-brand-blue/30 bg-white/60 px-6 py-3 text-xs font-bold uppercase tracking-widest text-brand-blue hover:bg-white transition-colors">
                    Hablar con Asesor
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* RESULTADOS */}
          {toursRes.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {toursRes.items.map((tour, idx) => {
                const ui = toTourLike(tour);
                return (
                  <TourCardPremium key={ui.slug} tour={ui} priority={idx < 6} href={withLocale(locale, `/tours/${ui.slug}`)} />
                );
              })}
            </div>
          ) : (
            <div className="py-24 text-center rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm">
              <Search className="mx-auto h-12 w-12 text-brand-blue/20 mb-4" />
              <h2 className="font-heading text-3xl text-brand-blue">No hay resultados exactos</h2>
              <p className="mt-4 max-w-lg mx-auto text-[color:var(--color-text)]/70 font-light leading-relaxed">
                No encontramos tours en {cityName} que coincidan con estos filtros. Prueba ampliando tu búsqueda o habla con nosotros.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Link href={basePath} className="rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text)]/60 hover:text-brand-blue transition-colors">
                  Limpiar Filtros
                </Link>
              </div>
            </div>
          )}

          <div className="mt-16">
            <Pagination
              basePath={basePath}
              query={{ q: q || undefined, tag: tag || undefined, sort: sort !== 'popular' ? sort : undefined, pmin: pminRaw || undefined, pmax: pmaxRaw || undefined }}
              page={page}
              totalPages={totalPages}
            />
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6">
          <CaptureCtas compact />
        </div>

      </main>
    </>
  );
}
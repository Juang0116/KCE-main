import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MapPin, Search, Compass, Sparkles, ArrowRight, FilterX } from 'lucide-react';

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
    metadataBase: new URL(getPublicBaseUrl()), 
    title: `${name} — Tours de lujo | KCE`, 
    description: `Explora los mejores tours y experiencias en ${name}, Colombia. Selección curada de cultura y aventura por KCE.`, 
    alternates: { canonical: canonicalUrl, languages: { es: absoluteUrl(`/es/tours/city/${encodeURIComponent(city)}`), en: absoluteUrl(`/en/tours/city/${encodeURIComponent(city)}`), fr: absoluteUrl(`/fr/tours/city/${encodeURIComponent(city)}`), de: absoluteUrl(`/de/tours/city/${encodeURIComponent(city)}`) } },
    openGraph: { title: `${name} — KCE`, description: `Experiencias exclusivas en ${name}.`, url: canonicalUrl, type: 'website', images: [{ url: absoluteUrl('/images/hero-kce.jpg'), width: 1200, height: 630, alt: `Tours en ${name} — KCE` }] }, 
    twitter: { card: 'summary_large_image', images: [absoluteUrl('/images/hero-kce.jpg')] },
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

  // JSON-LD logic intacta (funciona perfecto para SEO)
  const jsonLd = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'CollectionPage', name: `Tours en ${cityName}`, url: canonical },
      { '@type': 'BreadcrumbList', itemListElement: [ { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) }, { '@type': 'ListItem', position: 2, name: 'Tours', item: absoluteUrl(`/${locale}/tours`) }, { '@type': 'ListItem', position: 3, name: cityName, item: canonical } ] },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <main className="min-h-screen bg-[var(--color-bg)] pb-24">
        
        {/* HERO CIUDAD (STORYTELLING) */}
        <section className="relative overflow-hidden bg-brand-dark px-6 py-24 text-center text-white shadow-2xl">
          <div className="absolute inset-0 opacity-20 bg-[url('/brand/pattern.png')] bg-repeat"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
          
          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md">
              <MapPin className="h-3 w-3" /> Destino Confirmado
            </div>
            <h1 className="font-heading text-4xl leading-tight md:text-6xl lg:text-7xl mb-6">
              Tours en {cityName}.
            </h1>
            <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl">
              Desde joyas ocultas hasta clásicos reimaginados. Explora nuestra selección curada de experiencias en el corazón de {cityName}.
            </p>
          </div>
        </section>

        {/* TOOLBAR & FILTERS CONTAINER */}
        <section className="mx-auto max-w-7xl px-6 py-12">
          
          <div className="mb-12 flex flex-col gap-8 border-b border-[var(--color-border)] pb-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <ToursToolbarLite initial={{ q, tag, sort, pmin: pminRaw, pmax: pmaxRaw }} tags={tags} />
            </div>
            <div className="flex flex-col items-start gap-4 lg:items-end">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40">
                <span className="text-brand-blue">{toursRes.total}</span> Experiencias encontradas
              </div>
              <nav className="flex items-center gap-4">
                <Link className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/60 hover:text-brand-blue transition-colors" href={withLocale(locale, '/tours')}>Todos los Tours</Link>
                <span className="h-1 w-1 rounded-full bg-[var(--color-border)]"></span>
                <Link className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/60 hover:text-brand-blue transition-colors" href={withLocale(locale, '/destinations')}>Ver otros Destinos</Link>
              </nav>
            </div>
          </div>

          {/* VIP CONCIERGE CARD (CONVERSION) */}
          <div className="mb-16">
            <div className="overflow-hidden rounded-[3rem] border border-brand-blue/10 bg-brand-blue/5 p-8 md:p-12 shadow-inner relative group">
              <div className="absolute -right-10 -bottom-10 opacity-[0.03] transition-transform group-hover:scale-110">
                <Compass className="h-64 w-64 text-brand-blue" />
              </div>
              <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-blue">
                    <Sparkles className="h-3 w-3" /> Servicio Personalizado
                  </div>
                  <h3 className="font-heading text-2xl md:text-3xl text-brand-blue mb-4">¿Buscas una experiencia a medida en {cityName}?</h3>
                  <p className="text-base font-light leading-relaxed text-[var(--color-text)]/70">
                    Si no encuentras el tour exacto que imaginas, nuestro equipo puede diseñar una ruta privada cruzando tus intereses con la esencia de este destino.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 shrink-0">
                  <Button asChild size="lg" className="rounded-full shadow-lg">
                    <Link href={withLocale(locale, '/plan')}>Crear Plan Personalizado</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full border-brand-blue/20 text-brand-blue hover:bg-brand-blue/5">
                    <Link href={withLocale(locale, '/contact')}>Hablar con Concierge</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* TOUR RESULTS GRID */}
          {toursRes.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-3">
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
            /* EMPTY STATE REFINADO */
            <div className="py-24 text-center rounded-[3.5rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-surface)] shadow-sm text-brand-blue/20">
                <FilterX className="h-10 w-10" />
              </div>
              <h2 className="font-heading text-3xl text-brand-blue mb-4">No hay coincidencias exactas</h2>
              <p className="mx-auto max-w-md text-lg font-light leading-relaxed text-[var(--color-text)]/60 mb-10">
                Ajusta los filtros o limpia tu búsqueda para descubrir más opciones en {cityName}.
              </p>
              <Button asChild variant="outline" className="rounded-full px-10">
                <Link href={basePath}>Limpiar todos los filtros</Link>
              </Button>
            </div>
          )}

          {/* PAGINATION AREA */}
          <div className="mt-20 flex justify-center">
            <Pagination
              basePath={basePath}
              query={{ q: q || undefined, tag: tag || undefined, sort: sort !== 'popular' ? sort : undefined, pmin: pminRaw || undefined, pmax: pmaxRaw || undefined }}
              page={page}
              totalPages={totalPages}
            />
          </div>
        </section>

        {/* BOTTOM CAPTURE LAYER */}
        <div className="mx-auto max-w-7xl px-6 mt-12">
          <CaptureCtas compact />
        </div>

      </main>
    </>
  );
}
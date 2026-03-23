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

async function resolveCityName(citySlug: string): Promise<string> {
  const { cities } = await getFacets();
  const match = cities.find((c) => slugify(c) === citySlug);
  // Si no hay tours activos en esta ciudad, devolvemos el nombre formateado para no romper la web.
  if (match) return match;
  return citySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const locale = await resolveLocale();
  const { city } = await params;
  const name = await resolveCityName(city);
  
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
  
  // Ahora cityName siempre es un string, nunca detendrá el renderizado
  const cityName = await resolveCityName(citySlug);

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

  const jsonLd = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'CollectionPage', name: `Tours en ${cityName}`, url: canonical },
      { '@type': 'BreadcrumbList', itemListElement: [ { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) }, { '@type': 'ListItem', position: 2, name: 'Tours', item: absoluteUrl(`/${locale}/tours`) }, { '@type': 'ListItem', position: 3, name: cityName, item: canonical } ] },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <main className="min-h-screen bg-base pb-24 animate-fade-in">
        
        {/* 01. HERO EDITORIAL (ESTILO INMERSIVO LUXURY) */}
        <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center border-b border-brand-dark/10">
          {/* Destello sutil azul medianoche */}
          <div className="absolute top-0 left-1/2 w-full max-w-3xl h-64 bg-brand-blue/20 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-sm backdrop-blur-md">
              <MapPin className="h-3 w-3 text-brand-yellow" /> Destino KCE
            </div>
            <h1 className="font-heading text-5xl md:text-7xl text-white tracking-tight leading-[1.05] mb-6">
              Experiencias en <span className="text-brand-yellow italic font-light opacity-90">{cityName}</span>.
            </h1>
            <p className="mx-auto max-w-2xl text-lg md:text-xl font-light leading-relaxed text-white/70 mb-10">
              Desde joyas ocultas hasta clásicos reimaginados. Explora nuestra selección curada de aventuras y cultura en el corazón de {cityName}.
            </p>
            <div className="flex justify-center">
               <Link href={withLocale(locale, '/tours/destinations')} className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 hover:text-white transition-colors flex items-center gap-2 group">
                 <ArrowRight className="h-3 w-3 rotate-180 group-hover:-translate-x-1 transition-transform" /> Ver todos los destinos
               </Link>
            </div>
          </div>
        </section>

        {/* 02. TOOLBAR & RESULTADOS */}
        <section className="mx-auto max-w-[var(--container-max)] px-6 py-12">
          
          {/* Barra de Búsqueda Refinada */}
          <div className="mb-12 border-b border-brand-dark/5 dark:border-white/5 pb-12 flex flex-col lg:flex-row gap-8 lg:items-end lg:justify-between">
            <div className="flex-1 w-full max-w-3xl">
              <ToursToolbarLite initial={{ q, tag, sort, pmin: pminRaw, pmax: pmaxRaw }} tags={tags} />
            </div>
            
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted shrink-0 flex items-center gap-3 bg-surface-2 px-5 py-2.5 rounded-xl border border-brand-dark/5 dark:border-white/5 shadow-sm">
              <span className="text-main text-base font-heading tracking-tight">{toursRes.total}</span> Tours encontrados
            </div>
          </div>

          {/* 03. VIP CONCIERGE CARD (AHORA PREMIUM) */}
          <div className="mb-16">
            <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-14 shadow-soft group">
              <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-brand-blue/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-700 group-hover:scale-125" />
              
              <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-surface-2 border border-brand-dark/5 dark:border-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                    <Sparkles className="h-3 w-3 text-brand-yellow" /> Servicio Personalizado
                  </div>
                  <h3 className="font-heading text-3xl md:text-4xl text-main tracking-tight mb-4 group-hover:text-brand-blue transition-colors">
                    ¿Buscas algo diferente en {cityName}?
                  </h3>
                  <p className="text-base md:text-lg font-light leading-relaxed text-muted">
                    Si no encuentras el tour exacto que imaginas, nuestro equipo puede diseñar una ruta privada cruzando tus intereses con la esencia única de este destino.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full sm:w-auto">
                  <Button asChild className="rounded-full bg-brand-blue text-white hover:bg-white hover:text-brand-blue shadow-pop transition-transform hover:-translate-y-1 px-8 py-6 text-xs font-bold uppercase tracking-widest w-full sm:w-auto">
                    <Link href={withLocale(locale, '/plan')}>Crear Plan a Medida</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-brand-dark/10 dark:border-white/10 bg-surface text-main hover:bg-surface-2 transition-transform hover:-translate-y-1 px-8 py-6 text-xs font-bold uppercase tracking-widest w-full sm:w-auto">
                    <Link href={withLocale(locale, '/contact')}>Hablar con Asesor</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 04. GRID DE RESULTADOS */}
          {toursRes.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:gap-10 sm:grid-cols-2 xl:grid-cols-3">
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
            <div className="py-24 text-center rounded-[var(--radius-2xl)] bg-surface border border-brand-dark/5 dark:border-white/5 shadow-soft flex flex-col items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-surface-2 border border-brand-dark/5 dark:border-white/5 flex items-center justify-center mb-8 shadow-sm">
                <FilterX className="h-8 w-8 text-muted opacity-50" />
              </div>
              <h2 className="font-heading text-3xl text-main tracking-tight mb-4">Mapeando el territorio...</h2>
              <p className="max-w-md mx-auto text-base font-light leading-relaxed text-muted mb-10">
                Actualmente no tenemos tours publicados en {cityName}, pero nuestro equipo está diseñando nuevas experiencias aquí.
              </p>
              <Button asChild variant="outline" className="rounded-full px-8 py-6 border-brand-dark/10 dark:border-white/10 bg-surface hover:bg-surface-2 text-main text-xs font-bold uppercase tracking-widest transition-transform hover:-translate-y-1">
                <Link href={withLocale(locale, '/tours')}>Ver Catálogo Completo</Link>
              </Button>
            </div>
          )}

          {/* 06. PAGINACIÓN */}
          <div className="mt-20 flex justify-center">
            <Pagination
              basePath={basePath}
              query={{ q: q || undefined, tag: tag || undefined, sort: sort !== 'popular' ? sort : undefined, pmin: pminRaw || undefined, pmax: pmaxRaw || undefined }}
              page={page}
              totalPages={totalPages}
            />
          </div>
        </section>

        {/* 07. CAPTURE CTA LAYER */}
        <div className="mx-auto max-w-[var(--container-max)] px-6 mt-12">
          <CaptureCtas compact />
        </div>

      </main>
    </>
  );
}
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Tag, MapPin, Sparkles, Search, Compass, ArrowRight, FilterX, Info } from 'lucide-react';

import { slugify } from '@/lib/slugify';
import { SITE_URL } from '@/lib/env';
import CaptureCtas from '@/features/marketing/CaptureCtas';
import { getFacets, listTours } from '@/features/tours/catalog.server';
import { toTourLike } from '@/features/tours/adapters';
import TourCardPremium from '@/features/tours/components/TourCardPremium';
import Pagination from '@/features/tours/components/Pagination';
import ToursToolbarLite from '@/features/tours/components/ToursToolbarLite';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';
import { Button } from '@/components/ui/Button';

export const revalidate = 300;

type SearchParams = { [key: string]: string | string[] | undefined };
type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);
const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? '') : (v ?? ''));
const isSort = (v: string): v is 'price-asc' | 'price-desc' => v === 'price-asc' || v === 'price-desc';

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

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

async function resolveTagName(tagSlug: string): Promise<string | null> {
  const { tags } = await getFacets();
  const match = (tags || []).find((t) => slugify(t) === tagSlug);
  return match || null;
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const locale = await resolveLocale();
  const { tag } = await params;
  const name = await resolveTagName(tag);
  if (!name) return { metadataBase: new URL(BASE_SITE_URL), title: 'Estilo — KCE', robots: { index: false, follow: false } };

  const canonicalUrl = absoluteUrl(`/${locale}/tours/tag/${encodeURIComponent(tag)}`);

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: `${name} en Colombia | KCE Travel`,
    description: `Explora nuestra selección de tours con estilo ${name}. Experiencias auténticas diseñadas para viajeros exigentes.`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `Tours de ${name} — KCE`,
      description: `Las mejores experiencias de ${name.toLowerCase()} en Colombia.`,
      url: canonicalUrl,
      type: 'website',
      images: [{ url: absoluteUrl('/images/hero-kce.jpg'), width: 1200, height: 630, alt: `KCE — ${name}` }],
    },
  };
}

export default async function ToursByTagPage({ params, searchParams }: { params: Promise<{ tag: string }>; searchParams?: Promise<SearchParams> | SearchParams; }) {
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
  const page = Math.max(1, Math.trunc(Number(pick(sp.page).trim() || '1') || 1));
  const sortRaw = pick(sp.sort).trim();
  const sort: 'popular' | 'price-asc' | 'price-desc' = isSort(sortRaw) ? sortRaw : 'popular';
  const limit = 12;
  const offset = (page - 1) * limit;

  const [{ cities, tags }, toursRes] = await Promise.all([
    getFacets(),
    listTours({ q, tag: tagName, ...(city ? { city } : {}), sort, limit, offset, ...(pmin !== undefined ? { minPrice: pmin } : {}), ...(pmax !== undefined ? { maxPrice: pmax } : {}) }),
  ]);

  const totalPages = Math.max(1, Math.ceil((toursRes.total || 0) / limit));
  const basePath = withLocale(locale, `/tours/tag/${encodeURIComponent(tagSlug)}`);
  const canonical = absoluteUrl(`/${locale}/tours/tag/${encodeURIComponent(tagSlug)}`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: `Tours: ${tagName}`, url: canonical },
      { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) },
          { '@type': 'ListItem', position: 2, name: 'Estilos', item: absoluteUrl(`/${locale}/tours/styles`) },
          { '@type': 'ListItem', position: 3, name: tagName, item: canonical },
        ]
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <main className="min-h-screen bg-[var(--color-bg)] pb-24">
        
        {/* HERO ESTILO (PREMIUM DARK) */}
        <section className="relative overflow-hidden bg-brand-dark px-6 py-24 text-center text-white shadow-2xl">
          <div className="absolute inset-0 opacity-20 bg-[url('/brand/pattern.png')] bg-repeat"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
          
          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md">
              <Tag className="h-3 w-3" /> Curaduría por Estilo
            </div>
            <h1 className="font-heading text-4xl leading-tight md:text-6xl lg:text-7xl mb-6">
              Viajes de {tagName}.
            </h1>
            <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl">
              Experiencias inmersivas enfocadas en la esencia de {tagName.toLowerCase()}. Filtra por destino para encontrar tu ruta ideal.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
               <Link href={withLocale(locale, '/tours/styles')} className="text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-brand-yellow transition-colors">
                  ← Ver todos los estilos
               </Link>
            </div>
          </div>
        </section>

        {/* CONTAINER FILTROS & RESULTADOS */}
        <section className="mx-auto max-w-7xl px-6 py-12">
          
          {/* BARRA DE HERRAMIENTAS REFINADA */}
          <div className="mb-10 flex flex-col gap-8 border-b border-[var(--color-border)] pb-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <ToursToolbarLite initial={{ q, tag: '', city, sort, pmin: pminRaw, pmax: pmaxRaw }} tags={tags} />
              
              {/* City quick chips */}
              {cities?.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="mr-2 self-center text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">Destinos:</span>
                  {cities.slice(0, 8).map((c) => (
                    <Link
                      key={c}
                      href={`${basePath}?city=${encodeURIComponent(c)}`}
                      className={`rounded-full border border-[var(--color-border)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-brand-blue hover:text-white ${city === c ? 'bg-brand-blue text-white' : 'bg-white text-[var(--color-text)]/60'}`}
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40 shrink-0">
              <span className="text-brand-blue">{toursRes.total}</span> Tours encontrados
            </div>
          </div>

          {/* CARTA DE CONTEXTO EDITORIAL */}
          <div className="mb-16">
            <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 shadow-inner relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Info className="h-32 w-32 text-brand-blue" />
               </div>
               <div className="relative z-10 grid gap-8 md:grid-cols-3">
                  <div>
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/5 text-brand-blue">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading text-lg text-brand-blue mb-2">Selección Curada</h3>
                    <p className="text-sm font-light text-[var(--color-text)]/70 leading-relaxed">Experiencias verificadas que comparten la misma intención y calidad.</p>
                  </div>
                  <div>
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/5 text-brand-blue">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading text-lg text-brand-blue mb-2">Filtra por Ciudad</h3>
                    <p className="text-sm font-light text-[var(--color-text)]/70 leading-relaxed">Cruza el estilo con el destino que prefieras para aterrizar tu plan.</p>
                  </div>
                  <div>
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/5 text-brand-blue">
                      <Compass className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading text-lg text-brand-blue mb-2">Ayuda Humana</h3>
                    <p className="text-sm font-light text-[var(--color-text)]/70 leading-relaxed">¿No encuentras el tour perfecto? Nuestro equipo puede diseñarlo.</p>
                  </div>
               </div>
            </div>
          </div>

          {/* GRID DE RESULTADOS */}
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
            /* EMPTY STATE */
            <div className="py-24 text-center rounded-[3.5rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-surface)] shadow-sm text-brand-blue/20">
                <FilterX className="h-10 w-10" />
              </div>
              <h2 className="font-heading text-3xl text-brand-blue mb-4">Sin resultados para {tagName}</h2>
              <p className="mx-auto max-w-md text-lg font-light leading-relaxed text-[var(--color-text)]/60 mb-10">
                Prueba ajustando los filtros o explorando otros estilos de viaje en nuestro catálogo completo.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild variant="outline" className="rounded-full px-10">
                  <Link href={basePath}>Limpiar filtros</Link>
                </Button>
                <Button asChild className="rounded-full px-10">
                  <Link href={withLocale(locale, '/tours')}>Ver todo el catálogo</Link>
                </Button>
              </div>
            </div>
          )}

          {/* PAGINACIÓN */}
          <div className="mt-20 flex justify-center">
            <Pagination
              basePath={basePath}
              query={{ q: q || undefined, city: city || undefined, sort: sort !== 'popular' ? sort : undefined, pmin: pminRaw || undefined, pmax: pmaxRaw || undefined }}
              page={page}
              totalPages={totalPages}
            />
          </div>
        </section>

        {/* CTAS DE CAPTACIÓN FINAL */}
        <div className="mx-auto max-w-7xl px-6 mt-12">
          <CaptureCtas compact />
        </div>

      </main>
    </>
  );
}
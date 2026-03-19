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

      <main className="min-h-screen bg-[var(--color-bg)] pb-24 animate-fade-in">
        
        {/* 01. HERO EDITORIAL (LIMPIO Y ELEGANTE) */}
        <section className="relative overflow-hidden bg-[var(--color-surface)] px-6 py-20 md:py-32 text-center border-b border-[var(--color-border)]">
          {/* Destello sutil en el fondo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-brand-terra/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-terra shadow-sm backdrop-blur-md">
              <Tag className="h-3 w-3" /> Curaduría por Estilo
            </div>
            <h1 className="font-heading text-5xl leading-tight md:text-7xl text-[var(--color-text)] tracking-tight mb-6">
              Viajes de <span className="text-brand-terra italic font-light">{tagName}</span>.
            </h1>
            <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-[var(--color-text-muted)] md:text-xl">
              Experiencias inmersivas enfocadas en la esencia de {tagName.toLowerCase()}. Filtra por destino para encontrar tu ruta ideal.
            </p>
            <div className="mt-10 flex justify-center">
               <Link href={withLocale(locale, '/tours/styles')} className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] hover:text-brand-blue transition-colors flex items-center gap-2 group">
                 <ArrowRight className="h-3 w-3 rotate-180 group-hover:-translate-x-1 transition-transform" /> Ver todos los estilos
               </Link>
            </div>
          </div>
        </section>

        {/* 02. CONTAINER FILTROS & RESULTADOS */}
        <section className="mx-auto max-w-[var(--container-max)] px-6 py-12">
          
          {/* BARRA DE HERRAMIENTAS REFINADA (Sin cajas, alineada horizontalmente) */}
          <div className="mb-12 border-b border-[var(--color-border)] pb-12 flex flex-col lg:flex-row gap-8 lg:items-end lg:justify-between">
            <div className="flex-1 w-full max-w-3xl">
              <ToursToolbarLite initial={{ q, tag: '', city, sort, pmin: pminRaw, pmax: pmaxRaw }} tags={tags} />
              
              {/* City quick chips (Flotantes y orgánicas) */}
              {cities?.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Destinos:</span>
                  {cities.slice(0, 8).map((c) => (
                    <Link
                      key={c}
                      href={`${basePath}?city=${encodeURIComponent(c)}`}
                      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all shadow-soft hover:shadow-pop ${
                        city === c 
                          ? 'border-brand-blue bg-brand-blue text-white' 
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:text-brand-blue hover:border-brand-blue'
                      }`}
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* Contador de resultados minimalista */}
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] shrink-0 flex items-center gap-2 bg-[var(--color-surface-2)] px-4 py-2 rounded-lg border border-[var(--color-border)]">
              <span className="text-[var(--color-text)] text-sm">{toursRes.total}</span> Tours encontrados
            </div>
          </div>

          {/* 03. CARTA DE CONTEXTO (Destruimos la caja gigante, ahora es un Grid flotante) */}
          <div className="mb-16 border-b border-[var(--color-border)] pb-16">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center md:items-start text-center md:text-left group">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-brand-blue group-hover:scale-110 group-hover:border-brand-blue/30 transition-all shadow-soft">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg text-[var(--color-text)] mb-2">Selección Curada</h3>
                <p className="text-sm font-light text-[var(--color-text-muted)] leading-relaxed">Experiencias verificadas que comparten la misma intención y calidad KCE.</p>
              </div>
              <div className="flex flex-col items-center md:items-start text-center md:text-left group">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-brand-terra group-hover:scale-110 group-hover:border-brand-terra/30 transition-all shadow-soft">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg text-[var(--color-text)] mb-2">Filtra por Ciudad</h3>
                <p className="text-sm font-light text-[var(--color-text-muted)] leading-relaxed">Cruza el estilo con el destino que prefieras para aterrizar tu plan ideal.</p>
              </div>
              <div className="flex flex-col items-center md:items-start text-center md:text-left group">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-brand-yellow group-hover:scale-110 group-hover:border-brand-yellow/30 transition-all shadow-soft">
                  <Compass className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg text-[var(--color-text)] mb-2">Asistencia Humana</h3>
                <p className="text-sm font-light text-[var(--color-text-muted)] leading-relaxed">¿No encuentras el tour perfecto? Nuestro equipo puede diseñarlo a medida.</p>
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
            /* 05. EMPTY STATE (Estilo Premium sin líneas punteadas) */
            <div className="py-24 text-center rounded-[var(--radius-2xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-soft flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-6">
                <FilterX className="h-8 w-8 text-[var(--color-text-muted)] opacity-50" />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-[var(--color-text)] mb-3">Sin resultados para {tagName}</h2>
              <p className="max-w-md mx-auto text-sm font-light text-[var(--color-text-muted)] mb-8">
                Prueba ajustando los filtros de destino o explora otros estilos de viaje en nuestro catálogo completo.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild variant="outline" className="rounded-full px-8 border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)]">
                  <Link href={basePath}>Limpiar filtros</Link>
                </Button>
                <Button asChild className="rounded-full px-8 bg-brand-blue text-white hover:bg-brand-blue/90 shadow-pop transition-transform hover:-translate-y-0.5">
                  <Link href={withLocale(locale, '/tours')}>Ver todo el catálogo</Link>
                </Button>
              </div>
            </div>
          )}

          {/* 06. PAGINACIÓN */}
          <div className="mt-20 flex justify-center">
            <Pagination
              basePath={basePath}
              query={{ q: q || undefined, city: city || undefined, sort: sort !== 'popular' ? sort : undefined, pmin: pminRaw || undefined, pmax: pmaxRaw || undefined }}
              page={page}
              totalPages={totalPages}
            />
          </div>
        </section>

        {/* 07. CTAS DE CAPTACIÓN FINAL */}
        <div className="mx-auto max-w-[var(--container-max)] px-6 mt-12">
          <CaptureCtas compact />
        </div>

      </main>
    </>
  );
}
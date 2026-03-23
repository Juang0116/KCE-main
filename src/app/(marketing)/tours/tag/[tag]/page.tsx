/* src/app/(marketing)/tours/tag/[tag]/page.tsx */
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Tag, MapPin, Sparkles, Search, Compass, ArrowRight, FilterX, Info, Globe2 } from 'lucide-react';

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

      <main className="min-h-screen bg-base pb-24 animate-fade-in">
        
        {/* 01. HERO EDITORIAL (ADN KCE PREMIUM) */}
        <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center border-b border-brand-dark/10">
          {/* Destello sutil de fondo */}
          <div className="absolute top-0 left-1/2 w-full max-w-4xl h-80 bg-brand-terra/10 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
              <Tag className="h-3.5 w-3.5 text-brand-terra" /> Curaduría por Estilo
            </div>
            
            <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white tracking-tight leading-[1.05] mb-8">
              Viajes de <br className="hidden md:block" />
              <span className="text-brand-terra font-light italic opacity-90">{tagName}</span>.
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg md:text-xl font-light leading-relaxed text-white/70">
              Experiencias inmersivas enfocadas en la esencia de <span className="text-white font-medium">{tagName.toLowerCase()}</span>. Encuentra tu ruta ideal filtrando por destino.
            </p>
            
            <div className="mt-10">
               <Link href={withLocale(locale, '/tours/styles')} className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-brand-blue transition-colors flex items-center gap-3 group">
                 <ArrowRight className="h-3 w-3 rotate-180 group-hover:-translate-x-1 transition-transform" /> Ver todos los estilos
               </Link>
            </div>
          </div>
        </section>

        {/* 02. CONTAINER FILTROS & RESULTADOS */}
        <section className="mx-auto w-full max-w-[var(--container-max)] px-6 py-12">
          
          {/* BARRA DE HERRAMIENTAS REFINADA */}
          <div className="mb-16 border-b border-brand-dark/5 dark:border-white/5 pb-12 flex flex-col lg:flex-row gap-10 lg:items-end lg:justify-between">
            <div className="flex-1 w-full max-w-4xl">
              <ToursToolbarLite initial={{ q, tag: '', city, sort, pmin: pminRaw, pmax: pmaxRaw }} tags={tags} />
              
              {/* City quick chips (Editorial Style) */}
              {cities?.length > 0 && (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted mr-2">Filtrar por Destino:</span>
                  {cities.slice(0, 10).map((c) => (
                    <Link
                      key={c}
                      href={`${basePath}?city=${encodeURIComponent(c)}`}
                      className={`rounded-full border px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 shadow-sm ${
                        city === c 
                          ? 'border-brand-blue bg-brand-blue text-white shadow-pop scale-105' 
                          : 'border-brand-dark/10 dark:border-white/10 bg-surface text-muted hover:border-brand-blue hover:text-brand-blue'
                      }`}
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* Contador de resultados */}
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted shrink-0 flex items-center gap-3 bg-surface-2 px-6 py-3 rounded-full border border-brand-dark/5 shadow-sm">
              <span className="text-brand-blue text-base font-heading">{toursRes.total}</span> Experiencias
            </div>
          </div>

          {/* 03. CARTA DE CONTEXTO (Grid de Beneficios Premium) */}
          <div className="mb-20 border-b border-brand-dark/5 dark:border-white/5 pb-20">
            <div className="grid gap-12 md:grid-cols-3">
              {[
                { icon: Sparkles, color: 'text-brand-blue', title: 'Selección Curada', copy: 'Experiencias verificadas en el terreno que comparten la misma intención de calidad KCE.' },
                { icon: MapPin, color: 'text-brand-terra', title: 'Filtra por Ciudad', copy: 'Cruza el estilo con el destino que prefieras para aterrizar tu plan ideal en segundos.' },
                { icon: Compass, color: 'text-brand-yellow', title: 'Asistencia Humana', copy: '¿No encuentras el tour perfecto? Nuestro concierge puede diseñarlo a medida para ti.' },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center md:items-start text-center md:text-left group">
                  <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-brand-dark/5 ${item.color} group-hover:scale-110 group-hover:border-brand-blue/20 transition-all duration-500 shadow-soft`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-xl text-main mb-2 tracking-tight">{item.title}</h3>
                  <p className="text-sm font-light text-muted leading-relaxed">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 04. GRID DE RESULTADOS */}
          {toursRes.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {toursRes.items.map((tour, idx) => (
                <TourCardPremium 
                  key={tour.slug} 
                  tour={toTourLike(tour)} 
                  priority={idx < 6} 
                  href={withLocale(locale, `/tours/${tour.slug}`)} 
                />
              ))}
            </div>
          ) : (
            /* 05. EMPTY STATE EDITORIAL */
            <div className="py-32 text-center rounded-[var(--radius-3xl)] bg-surface border border-brand-dark/5 shadow-soft flex flex-col items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-surface-2 flex items-center justify-center mb-8">
                <FilterX className="h-8 w-8 text-muted opacity-30" />
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-main tracking-tight mb-4">Sin resultados para {tagName}</h2>
              <p className="max-w-md mx-auto text-base font-light text-muted leading-relaxed mb-10 px-4">
                Prueba ajustando los filtros de destino o explora otros estilos de viaje en nuestro catálogo completo.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 w-full px-6 sm:w-auto">
                <Button asChild variant="outline" className="rounded-full px-10 py-6 border-brand-dark/10 bg-surface text-main transition-transform hover:-translate-y-1 text-xs font-bold uppercase tracking-widest">
                  <Link href={basePath}>Limpiar Filtros</Link>
                </Button>
                <Button asChild className="rounded-full px-10 py-6 bg-brand-blue text-white shadow-pop transition-transform hover:-translate-y-1 text-xs font-bold uppercase tracking-widest">
                  <Link href={withLocale(locale, '/tours')}>Ver Todo el Catálogo</Link>
                </Button>
              </div>
            </div>
          )}

          {/* 06. PAGINACIÓN */}
          <div className="mt-24 flex justify-center">
            <Pagination
              basePath={basePath}
              query={{ q: q || undefined, city: city || undefined, sort: sort !== 'popular' ? sort : undefined, pmin: pminRaw || undefined, pmax: pmaxRaw || undefined }}
              page={page}
              totalPages={totalPages}
            />
          </div>
        </section>

        {/* 07. CTAS DE CAPTACIÓN FINAL (Glassmorphism) */}
        <section className="mx-auto w-full max-w-[var(--container-max)] px-6 mt-16 mb-12">
          <div className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-12 md:p-24 text-center shadow-soft group">
            {/* Brillos inmersivos */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none transition-transform duration-1000 group-hover:scale-150" />
            
            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 border border-brand-dark/5 text-brand-blue mb-10 shadow-sm transition-transform duration-500 group-hover:scale-110">
                <Globe2 className="h-8 w-8" />
              </div>
              <h2 className="font-heading text-4xl md:text-5xl text-main tracking-tight mb-6">¿Quieres algo exclusivo?</h2>
              <p className="text-lg md:text-xl font-light text-muted leading-relaxed mb-12">
                Nuestros expertos pueden diseñar una expedición privada que combine tus estilos favoritos en una sola ruta de autor.
              </p>
              <Button asChild size="lg" className="rounded-full bg-brand-blue text-white hover:bg-white hover:text-brand-blue px-12 py-7 shadow-pop transition-all hover:-translate-y-1 text-xs font-bold uppercase tracking-widest">
                <Link href={withLocale(locale, '/contact')} className="flex items-center gap-3">Hablar con un Experto <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
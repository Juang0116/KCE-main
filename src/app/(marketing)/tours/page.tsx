/* src/app/(marketing)/tours/page.tsx */
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import { 
  CalendarDays, ArrowRight, Sparkles, Map, 
  Search, Navigation, Compass, ShieldCheck, Globe, MapPin 
} from 'lucide-react';

import FeaturedReviews from '@/features/reviews/FeaturedReviews';
import { toTourLike } from '@/features/tours/adapters';
import { getFacets, listTours } from '@/features/tours/catalog.server';
import TourCardPremium from '@/features/tours/components/TourCardPremium';
import ToursToolbar from '@/features/tours/components/ToursToolbar';
import Pagination from '@/features/tours/components/Pagination';
import { absoluteUrl, getPublicBaseUrl } from '@/lib/seoJson';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { buildContextHref, type MarketingLocale } from '@/features/marketing/contactContext';
import { Button } from '@/components/ui/Button';

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

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

type PageCopy = {
  badge: string; title: string; subtitle: string; quickTitle: string; quickStyles: string;
  resultPrefix: string; decisionTitle: string; decisionCopy: string; decisionPlan: string; decisionContact: string;
};

function getCopy(locale: SupportedLocale): PageCopy {
  switch (locale) {
    case 'en': return { badge: 'Curated by Knowing Cultures S.A.S.', title: 'Catalog of Wonders', subtitle: 'Explore a premium selection of Colombian experiences. Compare by city, interest, and budget with expert guidance.', quickTitle: 'By Destination', quickStyles: 'By Passion', resultPrefix: 'Displaying', decisionTitle: 'Custom-made for you?', decisionCopy: 'If our catalog isn’t enough, our team and AI can design a route that mirrors your specific travel style.', decisionPlan: 'Create my plan', decisionContact: 'Talk to KCE' };
    case 'fr': return { badge: 'Curaté par Knowing Cultures S.A.S.', title: 'Catalogue d’Émotions', subtitle: 'Découvrez une sélection premium d’expériences colombiennes. Comparez par ville et budget avec un accompagnement expert.', quickTitle: 'Par Destination', quickStyles: 'Par Passion', resultPrefix: 'Affichage de', decisionTitle: 'Un voyage sur mesure ?', decisionCopy: 'Si notre catalogue ne suffit pas, notre équipe peut concevoir un itinéraire qui reflète votre style de voyage.', decisionPlan: 'Créer mon plan', decisionContact: 'Parler à KCE' };
    case 'de': return { badge: 'Kuratiert von Knowing Cultures S.A.S.', title: 'Erlebniskatalog', subtitle: 'Entdecken Sie eine Premium-Auswahl kolumbianischer Erlebnisse. Vergleichen Sie nach Stadt, Interesse und Budget mit Expertenberatung.', quickTitle: 'Nach Reiseziel', quickStyles: 'Nach Leidenschaft', resultPrefix: 'Anzeigen von', decisionTitle: 'Eine Reise nach Maß?', decisionCopy: 'Wenn unser Katalog nicht ausreicht, kann unser Team eine private Route gestalten, die genau Ihrem Reisestil entspricht.', decisionPlan: 'Meinen Plan erstellen', decisionContact: 'Mit KCE sprechen' };
    default: return { badge: 'Curaduría oficial Knowing Cultures S.A.S.', title: 'Catálogo de Historias', subtitle: 'Explora nuestra selección premium de tours con precios transparentes y atención humana lista para ayudarte a reservar.', quickTitle: 'Destinos', quickStyles: 'Intereses', resultPrefix: 'Mostrando', decisionTitle: '¿Un viaje a tu medida?', decisionCopy: 'Si el catálogo no es suficiente, nuestro equipo puede diseñar una ruta privada que refleje exactamente tu forma de viajar.', decisionPlan: 'Crear plan personalizado', decisionContact: 'Hablar con un asesor' };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const base = getPublicBaseUrl().replace(/\/+$/, '');
  const canonicalAbs = absoluteUrl(withLocale(locale, '/tours'));
  return {
    metadataBase: new URL(base), 
    title: 'Catálogo de Tours en Colombia | KCE', 
    description: 'Compara y reserva experiencias culturales auténticas en Colombia. Selección curada por ciudad, estilo y precio.',
    alternates: { canonical: canonicalAbs, languages: { es: '/es/tours', en: '/en/tours', fr: '/fr/tours', de: '/de/tours' } },
  };
}

export default async function ToursPage({ searchParams }: { searchParams?: Promise<SearchParams> | SearchParams; }) {
  const locale = await resolveLocale();
  const copy = getCopy(locale);
  const sp = (await Promise.resolve(searchParams ?? {})) as SearchParams;

  const q = pick(sp.q).trim();
  const tag = pick(sp.tag).trim();
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

  const [{ tags, cities }, toursRes] = await Promise.all([
    getFacets(),
    listTours({ q, tag, city, sort, limit, offset, ...(pmin !== undefined ? { minPrice: pmin } : {}), ...(pmax !== undefined ? { maxPrice: pmax } : {}) }),
  ]);

  const totalPages = Math.max(1, Math.ceil((toursRes.total || 0) / limit));
  const contactHref = buildContextHref(locale as MarketingLocale, '/contact', { source: 'tours', topic: 'catalog', city: city || undefined });

  return (
    <main className="min-h-screen bg-base pb-24 animate-fade-in">
      
      {/* 01. HERO EDITORIAL (ESTILO INMERSIVO LUXURY) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center border-b border-brand-dark/10">
        <div className="absolute top-0 left-1/2 w-full max-w-3xl h-64 bg-brand-blue/20 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-brand-yellow" /> {copy.badge}
          </div>
          
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white tracking-tight leading-[1.05] mb-8">
            {copy.title.split(' ')[0]} <br/>
            <span className="text-brand-yellow font-light italic opacity-90">{copy.title.split(' ').slice(1).join(' ')}</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg md:text-xl font-light leading-relaxed text-white/70">
            {copy.subtitle}
          </p>
        </div>
      </section>

      {/* 02. NAVEGACIÓN RÁPIDA (EDITORIAL PILLS) */}
      {(cities.length > 0 || tags.length > 0) && !q && !tag && !city && (
        <section className="mx-auto max-w-[var(--container-max)] px-6 py-16 md:py-24 relative z-20">
          <div className="flex flex-col md:flex-row md:items-start justify-center gap-16 md:gap-32">
            
            {/* Por Destino */}
            <div className="flex flex-col items-center md:items-start gap-8">
              <div className="flex items-center gap-3 border-b border-brand-dark/5 dark:border-white/5 pb-4 w-full">
                <Globe className="h-5 w-5 text-brand-blue opacity-80" />
                <h2 className="font-heading text-2xl text-main tracking-tight">{copy.quickTitle}</h2>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 max-w-lg">
                {cities.slice(0, 8).map(c => (
                  <Link key={c} href={`${withLocale(locale, '/tours')}?city=${encodeURIComponent(c)}`} className="group flex items-center gap-3 rounded-full border border-brand-dark/10 dark:border-white/10 bg-surface px-6 py-3 transition-all duration-300 hover:border-brand-blue/30 hover:shadow-pop hover:-translate-y-1">
                    <MapPin className="h-4 w-4 text-muted group-hover:text-brand-blue transition-colors" />
                    <span className="text-sm font-bold uppercase tracking-widest text-muted group-hover:text-main transition-colors">
                      {c}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Por Interés */}
            <div className="flex flex-col items-center md:items-start gap-8 md:border-l md:border-brand-dark/5 md:dark:border-white/5 md:pl-24">
              <div className="flex items-center gap-3 border-b border-brand-dark/5 dark:border-white/5 pb-4 w-full">
                <Navigation className="h-5 w-5 text-brand-terra opacity-80" />
                <h2 className="font-heading text-2xl text-main tracking-tight">{copy.quickStyles}</h2>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 max-w-lg">
                {tags.slice(0, 8).map(t => (
                  <Link key={t} href={`${withLocale(locale, '/tours')}?tag=${encodeURIComponent(t)}`} className="group flex items-center gap-3 rounded-full border border-brand-dark/10 dark:border-white/10 bg-surface px-6 py-3 transition-all duration-300 hover:border-brand-terra/30 hover:shadow-pop hover:-translate-y-1">
                    <span className="text-sm font-bold uppercase tracking-widest text-muted group-hover:text-main transition-colors">
                      {t}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 03. BARRA DE HERRAMIENTAS Y RESULTADOS */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 py-12">
        <div className="mb-16 border-b border-brand-dark/5 dark:border-white/5 pb-16">
          <ToursToolbar initial={{ q, tag, city, sort, pmin: pminRaw, pmax: pmaxRaw }} tags={tags} cities={cities} />
        </div>

        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted">Exploración Activa</h2>
            <p className="text-lg font-light text-main">
              {copy.resultPrefix} <span className="font-heading text-2xl text-brand-blue tracking-tight">{toursRes.total}</span> experiencias locales
            </p>
          </div>
          {(q || tag || city || pmin || pmax) && (
            <Button asChild variant="outline" className="rounded-full border-brand-dark/10 text-muted hover:text-main bg-surface px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all">
              <Link href={withLocale(locale, '/tours')}>Limpiar Filtros ✕</Link>
            </Button>
          )}
        </div>

        {/* TOUR GRID */}
        {toursRes.items.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {toursRes.items.map((tour, idx) => (
              <TourCardPremium key={tour.slug} tour={toTourLike(tour)} priority={idx < 6} href={withLocale(locale, `/tours/${tour.slug}`)} />
            ))}
          </div>
        ) : (
          <div className="py-32 text-center rounded-[var(--radius-3xl)] bg-surface border border-brand-dark/5 shadow-soft flex flex-col items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-surface-2 border border-brand-dark/5 flex items-center justify-center mb-8 shadow-sm">
              <Search className="h-8 w-8 text-muted opacity-30" />
            </div>
            <h2 className="font-heading text-3xl md:text-4xl text-main tracking-tight mb-4">No encontramos coincidencias exactas</h2>
            <p className="max-w-md mx-auto text-base font-light text-muted leading-relaxed mb-10 px-4">
              Cada viaje es único. Si no encuentras lo que buscas, nuestro concierge puede diseñar una expedición exclusiva basada en tus intereses. 
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full px-6 sm:w-auto">
              <Button asChild size="lg" className="rounded-full bg-brand-blue text-white shadow-pop transition-transform hover:-translate-y-1 text-xs font-bold uppercase tracking-widest px-10 py-6">
                <Link href={withLocale(locale, '/tours')}>Ver Todo el Catálogo</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-brand-dark/10 bg-surface text-main transition-transform hover:-translate-y-1 text-xs font-bold uppercase tracking-widest px-10 py-6">
                <Link href={withLocale(locale, '/plan')}>Diseñar mi Plan</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="mt-24 flex justify-center">
          <Pagination basePath={withLocale(locale, '/tours')} query={{ q, tag, city, sort, pmin: pminRaw, pmax: pmaxRaw }} page={page} totalPages={totalPages} />
        </div>
      </section>

      {/* 04. DECISION LAYER (CONCIERGE GLASSMORPHISM) */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 py-12 mb-24">
        <div className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-12 md:p-24 text-center shadow-soft">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-blue/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-yellow/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />
          
          <div className="relative z-10 mx-auto max-w-3xl flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center mb-10 shadow-sm">
              <Compass className="h-8 w-8 text-brand-blue animate-pulse" />
            </div>
            <h2 className="font-heading text-4xl md:text-6xl text-main tracking-tight mb-8">
              {copy.decisionTitle}
            </h2>
            <p className="text-lg md:text-xl font-light text-muted mb-12 leading-relaxed">
              {copy.decisionCopy} [cite: 35]
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-5 w-full sm:w-auto">
              <Button asChild size="lg" className="rounded-full bg-brand-blue text-white hover:bg-white hover:text-brand-blue px-12 py-7 shadow-pop transition-all hover:-translate-y-1 text-xs font-bold uppercase tracking-widest w-full sm:w-auto">
                <Link href={withLocale(locale, '/plan')}>
                  {copy.decisionPlan} <ArrowRight className="ml-3 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-brand-dark/10 bg-surface text-main hover:bg-surface-2 px-12 py-7 text-xs font-bold uppercase tracking-widest w-full sm:w-auto transition-all hover:-translate-y-1">
                <Link href={contactHref}>
                  {copy.decisionContact}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-24 md:py-32 border-t border-brand-dark/5 dark:border-white/5 bg-surface-2">
        <div className="mx-auto max-w-[var(--container-max)] px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted mb-4">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-blue" /> Confianza KCE
            </div>
            <h2 className="font-heading text-4xl md:text-5xl text-main tracking-tight leading-tight">Historias Reales de <br/> nuestros viajeros</h2>
          </div>
          <FeaturedReviews locale={locale} />
        </div>
      </section>
      
    </main>
  );
}
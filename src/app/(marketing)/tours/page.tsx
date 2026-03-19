import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import { 
  CalendarDays, ArrowRight, Sparkles, Map, 
  Search, Navigation, Compass, ShieldCheck 
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
import { getDictionary } from '@/i18n/getDictionary';
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
    case 'en': return { badge: 'Curated experiences', title: 'Catalog of Wonders', subtitle: 'Explore a premium selection of Colombian experiences. Compare by city, interest, and budget with expert guidance.', quickTitle: 'By Destination', quickStyles: 'By Passion', resultPrefix: 'Displaying', decisionTitle: 'Custom-made for you?', decisionCopy: 'If our catalog isn’t enough, our team and AI can design a route that mirrors your specific travel style.', decisionPlan: 'Create my plan', decisionContact: 'Talk to KCE' };
    case 'fr': return { badge: 'Expériences curées', title: 'Catalogue d’Émotions', subtitle: 'Découvrez une sélection premium d’expériences colombiennes. Comparez par ville et budget avec un accompagnement expert.', quickTitle: 'Par Destination', quickStyles: 'Par Passion', resultPrefix: 'Affichage de', decisionTitle: 'Un voyage sur mesure ?', decisionCopy: 'Si notre catalogue ne suffit pas, notre équipe peut concevoir un itinéraire qui reflète votre style de voyage.', decisionPlan: 'Créer mon plan', decisionContact: 'Parler à KCE' };
    default: return { badge: 'Experiencias curadas', title: 'Catálogo de Historias', subtitle: 'Explora nuestra selección premium de tours con precios transparentes y atención humana lista para ayudarte a reservar.', quickTitle: 'Destinos', quickStyles: 'Intereses', resultPrefix: 'Mostrando', decisionTitle: '¿Un viaje a tu medida?', decisionCopy: 'Si el catálogo no es suficiente, nuestro equipo puede diseñar una ruta privada que refleje exactamente tu forma de viajar.', decisionPlan: 'Crear plan personalizado', decisionContact: 'Hablar con un asesor' };
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
    <main className="min-h-screen bg-[var(--color-bg)] pb-24 animate-fade-in">
      
      {/* HERO EDITORIAL (LIMPIO Y ELEGANTE) */}
      <section className="relative overflow-hidden bg-[var(--color-surface)] px-6 py-20 md:py-32 text-center border-b border-[var(--color-border)]">
        {/* Un destello sutil de luz KCE en el fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-brand-terra" /> {copy.badge}
          </div>
          <h1 className="font-heading text-5xl leading-tight md:text-7xl text-[var(--color-text)] tracking-tight">
            {copy.title.split(' ')[0]} <br/>
            <span className="text-brand-terra font-light italic">{copy.title.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-[var(--color-text-muted)]">
            {copy.subtitle}
          </p>
        </div>
      </section>

      {/* NAVEGACIÓN RÁPIDA (CHIPS FLOTANTES SIN CAJAS) */}
      {(cities.length > 0 || tags.length > 0) && !q && !tag && !city && (
        <section className="mx-auto max-w-[var(--container-max)] px-6 pt-12 pb-6 relative z-20">
          <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-16">
            
            {/* Destinos */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] flex items-center gap-2">
                <Map className="h-3 w-3" /> {copy.quickTitle}
              </span>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 max-w-lg">
                {cities.slice(0, 8).map(c => (
                  <Link key={c} href={`${withLocale(locale, '/tours')}?city=${encodeURIComponent(c)}`} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-brand-blue hover:text-brand-blue shadow-soft hover:shadow-pop">
                    {c}
                  </Link>
                ))}
              </div>
            </div>

            {/* Intereses */}
            <div className="flex flex-col items-center md:items-start gap-4 md:border-l md:border-[var(--color-border)] md:pl-16">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] flex items-center gap-2">
                <Navigation className="h-3 w-3" /> {copy.quickStyles}
              </span>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 max-w-lg">
                {tags.slice(0, 8).map(t => (
                  <Link key={t} href={`${withLocale(locale, '/tours')}?tag=${encodeURIComponent(t)}`} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-brand-terra hover:text-brand-terra shadow-soft hover:shadow-pop">
                    {t}
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* FILTROS Y RESULTADOS */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 py-12">
        
        {/* Barra de Búsqueda Integrada */}
        <div className="mb-12 border-b border-[var(--color-border)] pb-12">
          <ToursToolbar initial={{ q, tag, city, sort, pmin: pminRaw, pmax: pmaxRaw }} tags={tags} cities={cities} />
        </div>

        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Resultados</h2>
            <p className="text-sm font-body text-[var(--color-text)]">
              {copy.resultPrefix} <strong className="font-bold text-brand-blue">{toursRes.total}</strong> experiencias únicas
            </p>
          </div>
          {(q || tag || city || pmin || pmax) && (
            <Button asChild variant="outline" className="rounded-full border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] text-xs h-8 px-4 transition-colors">
              <Link href={withLocale(locale, '/tours')}>Limpiar Filtros ✖</Link>
            </Button>
          )}
        </div>

        {/* TOUR GRID (Las TourCardPremium se mantienen porque ya son estilizadas) */}
        {toursRes.items.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:gap-10 sm:grid-cols-2 xl:grid-cols-3">
            {toursRes.items.map((tour, idx) => (
              <TourCardPremium key={tour.slug} tour={toTourLike(tour)} priority={idx < 6} href={withLocale(locale, `/tours/${tour.slug}`)} />
            ))}
          </div>
        ) : (
          /* EMPTY STATE PREMIUM (Sin cajas punteadas) */
          <div className="py-24 text-center rounded-[var(--radius-2xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-soft flex flex-col items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-6">
              <Search className="h-8 w-8 text-[var(--color-text-muted)] opacity-50" />
            </div>
            <h2 className="font-heading text-2xl font-semibold text-[var(--color-text)] mb-3">No encontramos coincidencias</h2>
            <p className="max-w-md mx-auto text-sm font-light text-[var(--color-text-muted)] mb-8">
              Quizás la experiencia de tus sueños requiere un toque personalizado. Ajusta los filtros o diseña tu propia ruta con nuestros asesores.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild className="rounded-full px-8 bg-brand-blue text-white hover:bg-brand-blue/90 shadow-pop transition-transform hover:-translate-y-0.5">
                <Link href={withLocale(locale, '/tours')}>Ver Catálogo Completo</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-8 border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]">
                <Link href={withLocale(locale, '/plan')}>Armar un Plan</Link>
              </Button>
            </div>
          </div>
        )}

        {/* PAGINATION */}
        <div className="mt-20 flex justify-center">
          <Pagination basePath={withLocale(locale, '/tours')} query={{ q, tag, city, sort, pmin: pminRaw, pmax: pmaxRaw }} page={page} totalPages={totalPages} />
        </div>
      </section>

      {/* DECISION LAYER (GLASSMORPHISM PREMIUM - Cero fondos negros pesados) */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 mb-24">
        <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur-2xl p-12 md:p-20 text-center shadow-soft">
          {/* Brillos sutiles KCE */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-brand-yellow/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
          
          <div className="relative z-10 mx-auto max-w-2xl flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center mb-8 shadow-sm">
              <Compass className="h-6 w-6 text-brand-terra animate-pulse" />
            </div>
            <h2 className="font-heading text-4xl md:text-5xl text-[var(--color-text)] tracking-tight mb-6">
              {copy.decisionTitle}
            </h2>
            <p className="text-base md:text-lg font-light text-[var(--color-text-muted)] mb-10 leading-relaxed">
              {copy.decisionCopy}
            </p>
            <div className="flex flex-wrap justify-center gap-4 w-full sm:w-auto">
              <Button asChild size="lg" className="w-full sm:w-auto rounded-full bg-brand-blue text-white hover:bg-brand-blue/90 px-10 shadow-pop transition-transform hover:-translate-y-0.5">
                <Link href={withLocale(locale, '/plan')}>
                  {copy.decisionPlan} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-full border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] px-10">
                <Link href={contactHref}>
                  {copy.decisionContact}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF SUTIL Y SEPARADO */}
      <section className="py-20 border-t border-[var(--color-border)]/50 bg-[var(--color-surface-2)]/30">
        <div className="mx-auto max-w-[var(--container-max)] px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] mb-3">
              <ShieldCheck className="h-3 w-3 text-brand-blue" /> Confianza KCE
            </div>
            <h2 className="font-heading text-3xl font-semibold text-[var(--color-text)]">Lo que dicen nuestros viajeros</h2>
          </div>
          <FeaturedReviews locale={locale} />
        </div>
      </section>
      
    </main>
  );
}
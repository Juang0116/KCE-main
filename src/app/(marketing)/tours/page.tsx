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
    default: return { badge: 'Experiencias curadas', title: 'Catálogo de Historias', subtitle: 'Explora nuestra selección premium de tours con precios transparentes y atención humana lista para ayudarte a reservar.', quickTitle: 'Por Destino', quickStyles: 'Por Interés', resultPrefix: 'Mostrando', decisionTitle: '¿Un viaje a tu medida?', decisionCopy: 'Si el catálogo no es suficiente, nuestro equipo puede diseñar una ruta privada que refleje exactamente tu forma de viajar.', decisionPlan: 'Crear plan personalizado', decisionContact: 'Hablar con un asesor' };
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
    <main className="min-h-screen bg-[var(--color-bg)] pb-24">
      
      {/* HERO EDITORIAL (ESTILO MAGAZINE) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center text-white shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[url('/brand/pattern.png')] bg-repeat"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md">
            <Sparkles className="h-3 w-3" /> {copy.badge}
          </div>
          <h1 className="font-heading text-5xl leading-tight md:text-7xl lg:text-8xl drop-shadow-xl">
            {copy.title.split(' ')[0]} <br/>
            <span className="text-brand-yellow font-light italic">{copy.title.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
            {copy.subtitle}
          </p>
        </div>
      </section>

      {/* NAVEGACIÓN RÁPIDA (CHIPS PREMIUM) */}
      {(cities.length > 0 || tags.length > 0) && !q && !tag && !city && (
        <section className="mx-auto max-w-7xl px-6 -mt-12 relative z-20">
          <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 shadow-2xl">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                  <Map className="h-3 w-3" /> {copy.quickTitle}
                </div>
                <div className="flex flex-wrap gap-2">
                  {cities.slice(0, 8).map(c => (
                    <Link key={c} href={`${withLocale(locale, '/tours')}?city=${encodeURIComponent(c)}`} className="rounded-full border border-brand-blue/10 bg-brand-blue/5 px-4 py-2 text-xs font-medium text-brand-blue transition-all hover:bg-brand-blue hover:text-white">
                      {c}
                    </Link>
                  ))}
                  <Link href={withLocale(locale, '/tours/destinations')} className="px-4 py-2 text-xs font-bold text-brand-blue/40 hover:text-brand-blue transition-colors uppercase tracking-widest flex items-center gap-1">
                    Ver más <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              <div className="space-y-4 md:border-l md:border-[var(--color-border)] md:pl-12">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                  <Navigation className="h-3 w-3" /> {copy.quickStyles}
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 8).map(t => (
                    <Link key={t} href={`${withLocale(locale, '/tours')}?tag=${encodeURIComponent(t)}`} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-xs font-medium text-[var(--color-text)]/60 transition-all hover:border-brand-blue hover:text-brand-blue">
                      {t}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FILTROS Y RESULTADOS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12">
          <ToursToolbar initial={{ q, tag, city, sort, pmin: pminRaw, pmax: pmaxRaw }} tags={tags} cities={cities} />
        </div>

        <div className="mb-10 flex justify-between items-end border-b border-[var(--color-border)] pb-8">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text)]/30">Resultados</span>
            <p className="text-sm font-light text-[var(--color-text)]/60">
              {copy.resultPrefix} <span className="font-bold text-brand-blue">{toursRes.total}</span> experiencias únicas
            </p>
          </div>
          {(q || tag || city || pmin || pmax) && (
            <Button asChild variant="ghost" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full px-6">
              <Link href={withLocale(locale, '/tours')}>Limpiar Filtros ✖</Link>
            </Button>
          )}
        </div>

        {/* TOUR GRID */}
        {toursRes.items.length > 0 ? (
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-3">
            {toursRes.items.map((tour, idx) => (
              <TourCardPremium key={tour.slug} tour={toTourLike(tour)} priority={idx < 6} href={withLocale(locale, `/tours/${tour.slug}`)} />
            ))}
          </div>
        ) : (
          /* EMPTY STATE VAULT */
          <div className="py-24 text-center rounded-[3.5rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]">
            <Search className="mx-auto h-16 w-16 text-brand-blue/10 mb-6" />
            <h2 className="font-heading text-3xl text-brand-blue mb-4">No hay coincidencias exactas</h2>
            <p className="mt-4 max-w-lg mx-auto text-lg font-light leading-relaxed text-[var(--color-text)]/60">
              Prueba ampliando los filtros o cuéntanos qué buscas para diseñarlo a tu medida.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button asChild className="rounded-full px-10">
                <Link href={withLocale(locale, '/tours')}>Ver Catálogo Completo</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-10">
                <Link href={withLocale(locale, '/plan')}>Armar un Plan</Link>
              </Button>
            </div>
          </div>
        )}

        {/* PAGINATION AREA */}
        <div className="mt-24 flex justify-center border-t border-[var(--color-border)] pt-12">
          <Pagination basePath={withLocale(locale, '/tours')} query={{ q, tag, city, sort, pmin: pminRaw, pmax: pmaxRaw }} page={page} totalPages={totalPages} />
        </div>
      </section>

      {/* DECISION LAYER (CONVERSION VAULT) */}
      <section className="mx-auto max-w-7xl px-6 mb-24">
        <div className="relative overflow-hidden rounded-[4rem] bg-brand-dark p-12 md:p-24 text-center text-white shadow-2xl">
          <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.png')] bg-repeat"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-dark/90 to-brand-blue/40"></div>
          
          <div className="relative z-10 mx-auto max-w-3xl">
            <Compass className="mx-auto h-12 w-12 text-brand-yellow mb-8 animate-pulse" />
            <h2 className="font-heading text-4xl md:text-6xl leading-tight mb-8">
              {copy.decisionTitle}
            </h2>
            <p className="mx-auto text-lg md:text-xl font-light leading-relaxed text-white/70 mb-12">
              {copy.decisionCopy}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Button asChild size="lg" className="rounded-full bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90 px-12 shadow-xl hover:scale-105 transition-transform">
                <Link href={withLocale(locale, '/plan')}>
                  {copy.decisionPlan} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-white/20 text-white hover:bg-white/10 backdrop-blur-md px-12">
                <Link href={contactHref}>
                  {copy.decisionContact}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-24 border-t border-[var(--color-border)]/30">
        <div className="mx-auto max-w-4xl px-6 text-center mb-16">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue mb-4">
            <ShieldCheck className="h-3 w-3" /> Confianza KCE
          </div>
          <h2 className="font-heading text-4xl text-brand-blue">Lo que dicen nuestros viajeros</h2>
        </div>
        <FeaturedReviews locale={locale} />
      </section>
      
    </main>
  );
}
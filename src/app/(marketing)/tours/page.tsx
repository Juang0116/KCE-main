import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';

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
import { CalendarDays, ArrowRight } from 'lucide-react';

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
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

type PageCopy = {
  badge: string;
  title: string;
  subtitle: string;
  quickTitle: string;
  quickStyles: string;
  resultPrefix: string;
  decisionTitle: string;
  decisionCopy: string;
  decisionPlan: string;
  decisionContact: string;
};

function getCopy(locale: SupportedLocale): PageCopy {
  switch (locale) {
    case 'en': return { badge: 'Curated experiences', title: 'Find your route in Colombia', subtitle: 'Compare curated experiences with clearer pricing, calmer guidance and a more direct route toward the right booking.', quickTitle: 'Explore by city', quickStyles: 'Explore by style', resultPrefix: 'Showing', decisionTitle: 'Need a custom route?', decisionCopy: 'Move to the next step with a clearer path: compare tours, ask for a personalized plan or speak with an advisor.', decisionPlan: 'Open personalized plan', decisionContact: 'Talk to an advisor' };
    case 'fr': return { badge: 'Expériences curées', title: 'Trouve ta route en Colombie', subtitle: 'Compare des expériences curées avec des prix plus lisibles, un meilleur accompagnement et une route directe vers ta réservation.', quickTitle: 'Explorer par ville', quickStyles: 'Explorer par style', resultPrefix: 'Affichage', decisionTitle: 'Besoin d’un parcours sur mesure ?', decisionCopy: 'Passe à l’étape suivante avec un chemin plus clair : ouvrir un plan personnalisé ou parler avec un conseiller.', decisionPlan: 'Ouvrir le plan personnalisé', decisionContact: 'Parler à un conseiller' };
    case 'de': return { badge: 'Kuratierte Erlebnisse', title: 'Finde deine Route in Kolumbien', subtitle: 'Vergleiche kuratierte Erlebnisse mit klareren Preisen, ruhigerer Führung und einem direkteren Weg zur passenden Buchung.', quickTitle: 'Nach Stadt erkunden', quickStyles: 'Nach Stil erkunden', resultPrefix: 'Anzeige', decisionTitle: 'Brauchst du eine maßgeschneiderte Route?', decisionCopy: 'Führe den Reisenden mit einem klareren Pfad weiter: persönlicher Plan oder Beratung.', decisionPlan: 'Persönlichen Plan öffnen', decisionContact: 'Mit Berater sprechen' };
    default: return { badge: 'Experiencias curadas', title: 'Encuentra tu ruta en Colombia', subtitle: 'Explora nuestra selección premium de tours con precios transparentes, ritmo flexible y atención humana lista para ayudarte a reservar.', quickTitle: 'Explorar por ciudad', quickStyles: 'Explorar por estilo', resultPrefix: 'Mostrando', decisionTitle: '¿Prefieres un viaje a medida?', decisionCopy: 'Da el siguiente paso con una ruta más clara: pide a nuestra IA un plan personalizado en segundos o habla directamente con un experto de KCE.', decisionPlan: 'Crear plan personalizado', decisionContact: 'Hablar con un asesor' };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const base = getPublicBaseUrl().replace(/\/+$/, '');
  const canonicalAbs = absoluteUrl(withLocale(locale, '/tours'));
  return {
    metadataBase: new URL(base), title: 'KCE Tours — curated tours in Colombia', description: 'Compara tours en Colombia con una ruta más premium: ciudad, estilo y precio.',
    alternates: { canonical: canonicalAbs, languages: { es: '/es/tours', en: '/en/tours', fr: '/fr/tours', de: '/de/tours' } },
  };
}

export default async function ToursPage({ searchParams }: { searchParams?: Promise<SearchParams> | SearchParams; }) {
  const locale = await resolveLocale();
  const copy = getCopy(locale);
  const _dict = await getDictionary(locale);
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
    listTours({ ...(q ? { q } : {}), ...(tag ? { tag } : {}), ...(city ? { city } : {}), sort, limit, offset, ...(pmin !== undefined ? { minPrice: pmin } : {}), ...(pmax !== undefined ? { maxPrice: pmax } : {}) }),
  ]);

  const totalPages = Math.max(1, Math.ceil((toursRes.total || 0) / limit));
  const contactHref = buildContextHref(locale as MarketingLocale, '/contact', { source: 'tours', topic: 'catalog', city: city || undefined, q: q || undefined, tag: tag || undefined });

  return (
    <main className="min-h-screen bg-[color:var(--color-bg)]">
      {/* HEADER EDITORIAL */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-blue shadow-sm">
          <CalendarDays className="h-3 w-3" /> {copy.badge}
        </span>
        <h1 className="mt-6 font-heading text-4xl md:text-6xl text-brand-blue leading-tight drop-shadow-sm">
          {copy.title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-[color:var(--color-text)]/70 font-light leading-relaxed">
          {copy.subtitle}
        </p>
      </section>

      {/* NAVEGACIÓN RÁPIDA */}
      {(cities.length > 0 || tags.length > 0) && !q && !tag && !city && (
        <section className="mx-auto max-w-6xl px-6 pb-12 border-b border-[color:var(--color-border)]/50">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 mb-4">{copy.quickTitle}</h3>
              <div className="flex flex-wrap gap-2">
                {cities.slice(0, 8).map(c => (
                  <Link key={c} href={`${withLocale(locale, '/tours')}?city=${encodeURIComponent(c)}`} className="text-sm font-medium text-brand-blue hover:text-brand-dark transition-colors px-3 py-1.5 rounded-full border border-brand-blue/20 bg-brand-blue/5 hover:bg-brand-blue/10">
                    {c}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 mb-4">{copy.quickStyles}</h3>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 8).map(t => (
                  <Link key={t} href={`${withLocale(locale, '/tours')}?tag=${encodeURIComponent(t)}`} className="text-sm font-medium text-[color:var(--color-text)]/70 hover:text-brand-blue transition-colors px-3 py-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] hover:border-brand-blue/30 hover:bg-[color:var(--color-surface)] shadow-sm">
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
        <div className="mb-10">
          <ToursToolbar initial={{ q, tag, city, sort, pmin: pminRaw, pmax: pmaxRaw }} tags={tags} cities={cities} />
        </div>

        <div className="mb-8 flex justify-between items-center">
          <span className="text-xs text-[color:var(--color-text)]/50 uppercase tracking-widest font-bold">
            {copy.resultPrefix} {toursRes.total} resultados
          </span>
          {(q || tag || city || pmin || pmax) && (
            <Link href={withLocale(locale, '/tours')} className="text-xs font-bold uppercase tracking-widest text-rose-600 hover:text-rose-700 transition-colors">
              Limpiar filtros ✖
            </Link>
          )}
        </div>

        {toursRes.items.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {toursRes.items.map((tour, idx) => (
              <TourCardPremium key={tour.slug} tour={toTourLike(tour)} priority={idx < 6} href={withLocale(locale, `/tours/${tour.slug}`)} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm">
            <h2 className="font-heading text-3xl text-brand-blue">No hay resultados exactos</h2>
            <p className="mt-4 max-w-lg mx-auto text-[color:var(--color-text)]/70 font-light leading-relaxed">
              No encontramos tours que coincidan con estos filtros específicos. Prueba ampliando tu búsqueda o cuéntanos qué necesitas.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={withLocale(locale, '/tours')} className="w-full sm:w-auto rounded-full bg-brand-blue px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-md hover:scale-105 transition-transform">
                Ver Todo el Catálogo
              </Link>
              <Link href={withLocale(locale, '/plan')} className="w-full sm:w-auto rounded-full border border-brand-blue/30 bg-brand-blue/5 px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-brand-blue hover:bg-brand-blue/10 transition-colors">
                Armar un plan
              </Link>
            </div>
          </div>
        )}

        <div className="mt-16">
          <Pagination basePath={withLocale(locale, '/tours')} query={{ q, tag, city, sort, pmin: pminRaw, pmax: pmaxRaw }} page={page} totalPages={totalPages} />
        </div>
      </section>

      {/* CTA EDITORIAL PREMIUM */}
      <section className="bg-brand-dark py-24 mt-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark to-transparent"></div>
        
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center text-white">
          <h2 className="font-heading text-3xl md:text-5xl drop-shadow-md">{copy.decisionTitle}</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 font-light leading-relaxed">
            {copy.decisionCopy}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={withLocale(locale, '/plan')} className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-brand-yellow text-brand-dark px-8 py-4 text-xs font-bold uppercase tracking-widest transition hover:scale-105 shadow-xl">
              {copy.decisionPlan} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={contactHref} className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-8 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/10 backdrop-blur-sm">
              {copy.decisionContact}
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <FeaturedReviews locale={locale} />
      </section>
    </main>
  );
}
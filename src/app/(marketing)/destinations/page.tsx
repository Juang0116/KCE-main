/* src/app/(marketing)/destinations/page.tsx */
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import { MapPin, ArrowRight, Compass, Sparkles, Star, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import FeaturedReviews from '@/features/reviews/FeaturedReviews';
import { getFacets, listTours } from '@/features/tours/catalog.server';
import { toTourLike } from '@/features/tours/adapters';
import TourCardPremium from '@/features/tours/components/TourCardPremium';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';
import CaptureCtas from '@/features/marketing/CaptureCtas';
import { getDictionary, t, type SupportedLocale } from '@/i18n/getDictionary';

export const revalidate = 900;

const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

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
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

function slugify(s: string) {
  return (s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const dict = await getDictionary(locale);
  const base = getPublicBaseUrl().replace(/\/+$/, '');
  const canonicalAbs = absoluteUrl(withLocale(locale, '/destinations'));
  return {
    metadataBase: new URL(base),
    title: `${t(dict, 'nav.destinations', 'Destinations')} | KCE`,
    description: t(dict, 'destinations.hero_sub', ''),
    alternates: { canonical: canonicalAbs, languages: { es: '/es/destinations', en: '/en/destinations', fr: '/fr/destinations', de: '/de/destinations' } },
    openGraph: { title: `${t(dict, 'nav.destinations', 'Destinations')} | KCE`, description: t(dict, 'destinations.hero_sub', ''), url: canonicalAbs, type: 'website', images: [{ url: absoluteUrl('/images/hero-kce.jpg') }] },
  };
}

export default async function DestinationsPage() {
  const locale = await resolveLocale();
  const dict = await getDictionary(locale);
  const base = getPublicBaseUrl().replace(/\/+$/, '');

  const [{ cities }, topTours] = await Promise.all([
    getFacets(),
    listTours({ sort: 'popular', limit: 6 }),
  ]);

  const citySlugs = (cities || []).map((c) => ({ city: c, slug: slugify(c) })).filter((x) => x.slug).slice(0, 24);
  const canonicalAbs = absoluteUrl(withLocale(locale, '/destinations'));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: t(dict, 'nav.destinations', 'Destinations'), url: canonicalAbs },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl(withLocale(locale, '/')) },
        { '@type': 'ListItem', position: 2, name: t(dict, 'nav.destinations', 'Destinations'), item: canonicalAbs },
      ]},
    ],
  };

  return (
    <main className="min-h-screen bg-base flex flex-col animate-fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* 01. HERO EDITORIAL (Oscuro e Inmersivo) */}
      <section className="relative min-h-[85vh] w-full flex flex-col justify-center overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 opacity-40 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-96 bg-brand-blue/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pt-32 pb-16 text-center flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white backdrop-blur-md shadow-sm">
            <MapPin className="h-3 w-3 text-brand-yellow" /> {t(dict, 'destinations.hero_kicker', 'Colombia by Region')}
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white drop-shadow-lg tracking-tight leading-[1.05] mb-6">
            {t(dict, 'destinations.hero_title', 'Start with a city.')}<br/>
            <span className="text-brand-yellow font-light italic opacity-90">{t(dict, 'destinations.hero_title_span', 'Discover the route.')}</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg sm:text-xl font-light leading-relaxed text-white/80 mb-12">
            {t(dict, 'destinations.hero_sub', '')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Button asChild size="lg" className="w-full sm:w-auto rounded-full bg-brand-blue text-white hover:bg-white hover:text-brand-blue shadow-pop transition-transform hover:-translate-y-1 px-10 py-6 text-xs font-bold uppercase tracking-widest">
              <Link href={withLocale(locale, '/tours')}>
                {t(dict, 'destinations.hero_cta', 'View catalog')} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-full border-white/30 text-white bg-white/5 hover:bg-white hover:text-brand-dark backdrop-blur-md transition-transform hover:-translate-y-1 px-10 py-6 text-xs font-bold uppercase tracking-widest">
              <Link href={withLocale(locale, '/plan')}>
                {t(dict, 'destinations.hero_cta2', 'Build plan')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* BREADCRUMB ELEGANTE */}
      <div className="w-full bg-surface border-b border-brand-dark/5 dark:border-white/5 py-3 px-6">
        <div className="mx-auto max-w-[var(--container-max)] flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
          <Link href={withLocale(locale, '/')} className="hover:text-brand-blue transition-colors">
            {t(dict, 'brand.short', 'KCE')}
          </Link>
          <ArrowRight className="h-3 w-3" />
          <span className="text-main opacity-70">{t(dict, 'destinations.breadcrumb', 'Explore by Region')}</span>
        </div>
      </div>

      {/* METHODOLOGY STEPS */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 py-24 md:py-32">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue mb-4">
            <Compass className="h-3 w-3" /> {t(dict, 'destinations.method_kicker', 'KCE Methodology')}
          </div>
          <h2 className="font-heading text-4xl md:text-5xl text-main tracking-tight">
            {t(dict, 'destinations.method_title', 'How to plan your route?')}
          </h2>
        </div>

        <div className="grid gap-12 md:gap-8 md:grid-cols-3 relative">
          <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-brand-dark/10 dark:via-white/10 to-transparent" />
          {[
            { step: '01', titleKey: 'destinations.step1_title', copyKey: 'destinations.step1_copy' },
            { step: '02', titleKey: 'destinations.step2_title', copyKey: 'destinations.step2_copy' },
            { step: '03', titleKey: 'destinations.step3_title', copyKey: 'destinations.step3_copy' },
          ].map(({ step, titleKey, copyKey }) => (
            <div key={step} className="relative z-10 flex flex-col items-center text-center group">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface border border-brand-dark/10 dark:border-white/10 text-brand-blue font-heading text-2xl mb-8 shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:border-brand-blue group-hover:bg-brand-blue group-hover:text-white">
                {step}
              </div>
              <h3 className="text-2xl font-heading text-main tracking-tight mb-4 group-hover:text-brand-blue transition-colors">
                {t(dict, titleKey, '')}
              </h3>
              <p className="text-base font-light text-muted leading-relaxed px-4">
                {t(dict, copyKey, '')}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CITIES GRID */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 pb-24 md:pb-32">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-brand-dark/5 dark:border-white/5 pb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted mb-3">
              {t(dict, 'destinations.regions_kicker', 'KCE Destinations')}
            </p>
            <h2 className="font-heading text-4xl md:text-5xl text-main tracking-tight">
              {t(dict, 'destinations.regions_title', 'Active Regions')}
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl bg-surface-2 border border-brand-dark/5 dark:border-white/5 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted shadow-sm">
            <MapPin className="h-4 w-4 text-brand-blue" /> <span className="text-main text-base font-heading">{citySlugs.length}</span> {t(dict, 'destinations.regions_unit', 'Regions')}
          </span>
        </div>

        {citySlugs.length === 0 ? (
          <div className="py-24 text-center rounded-[var(--radius-2xl)] bg-surface border border-brand-dark/5 shadow-soft">
            <p className="text-lg text-muted font-light">{t(dict, 'tours.empty', 'No destinations available yet.')}</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {citySlugs.map((c) => (
              <Link key={c.slug} href={withLocale(locale, `/tours/city/${encodeURIComponent(c.slug)}`)}
                className="group relative overflow-hidden rounded-[var(--radius-2xl)] bg-brand-dark aspect-[4/3] flex flex-col justify-end p-8 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-pop hover:border-brand-blue/30 border border-brand-dark/10">
                <div className="absolute inset-0 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center opacity-50 transition-transform duration-1000 group-hover:scale-105 group-hover:opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/30 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
                <div className="relative z-10">
                  <h3 className="font-heading text-3xl text-white drop-shadow-md tracking-tight group-hover:text-brand-yellow transition-colors">{c.city}</h3>
                  <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">
                      {t(dict, 'destinations.explore_region', 'Explore region')}
                    </span>
                    <ArrowRight className="h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FEATURED TOURS */}
      <section className="bg-surface-2 border-t border-brand-dark/5 dark:border-white/5 py-24 md:py-32">
        <div className="mx-auto max-w-[var(--container-max)] px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-brand-dark/5 dark:border-white/5 pb-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue mb-4">
                <Star className="h-3 w-3" /> {t(dict, 'destinations.tours_kicker', 'Top Selection')}
              </div>
              <h2 className="font-heading text-4xl md:text-5xl text-main tracking-tight">{t(dict, 'destinations.tours_title', 'Featured Tours')}</h2>
              <p className="mt-4 text-lg text-muted font-light leading-relaxed">{t(dict, 'destinations.tours_sub', '')}</p>
            </div>
            <Button asChild variant="outline" className="rounded-full border-brand-dark/10 hover:border-brand-blue hover:text-brand-blue bg-surface px-8 py-6 text-xs font-bold uppercase tracking-widest transition-transform hover:-translate-y-1">
              <Link href={withLocale(locale, '/tours')}>{t(dict, 'destinations.tours_cta', 'View Catalog')} <ArrowRight className="ml-2 h-4 w-4 inline" /></Link>
            </Button>
          </div>
          
          <div className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
            {(topTours.items || []).map((tour, idx) => (
              <TourCardPremium key={tour.slug} tour={toTourLike(tour)} priority={idx < 3} href={withLocale(locale, `/tours/${tour.slug}`)} />
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="py-24 md:py-32 border-t border-brand-dark/5 dark:border-white/5 bg-base">
        <div className="mx-auto max-w-[var(--container-max)] px-6 text-center">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue mb-4">
            <ShieldCheck className="h-3 w-3" /> {t(dict, 'destinations.reviews_kicker', 'KCE Trust')}
          </div>
          <h2 className="font-heading text-4xl md:text-5xl text-main tracking-tight mb-16">{t(dict, 'destinations.reviews_title', 'What our travelers say')}</h2>
          <FeaturedReviews locale={locale} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-brand-dark/5 dark:border-white/5 bg-surface-2">
        <div className="mx-auto max-w-[var(--container-max)] px-6">
          <CaptureCtas compact />
        </div>
      </section>
      
    </main>
  );
}
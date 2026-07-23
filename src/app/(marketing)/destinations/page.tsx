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
  return (s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
    alternates: {
      canonical: canonicalAbs,
      languages: {
        es: '/es/destinations',
        en: '/en/destinations',
        fr: '/fr/destinations',
        de: '/de/destinations',
      },
    },
    openGraph: {
      title: `${t(dict, 'nav.destinations', 'Destinations')} | KCE`,
      description: t(dict, 'destinations.hero_sub', ''),
      url: canonicalAbs,
      type: 'website',
      images: [{ url: absoluteUrl('/images/hero-kce.jpg') }],
    },
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

  const citySlugs = (cities || [])
    .map((c) => ({ city: c, slug: slugify(c) }))
    .filter((x) => x.slug)
    .slice(0, 24);
  const canonicalAbs = absoluteUrl(withLocale(locale, '/destinations'));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: t(dict, 'nav.destinations', 'Destinations'),
        url: canonicalAbs,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: absoluteUrl(withLocale(locale, '/')),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: t(dict, 'nav.destinations', 'Destinations'),
            item: canonicalAbs,
          },
        ],
      },
    ],
  };

  return (
    <main className="flex min-h-screen animate-fade-in flex-col bg-base">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      {/* 01. HERO EDITORIAL (Oscuro e Inmersivo) */}
      <section className="relative flex min-h-[85vh] w-full flex-col justify-center overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 scale-105 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue/20 blur-[120px]" />

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-16 pt-32 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
            <MapPin className="h-3 w-3 text-brand-yellow" />{' '}
            {t(dict, 'destinations.hero_kicker', 'Colombia by Region')}
          </div>
          <h1 className="mb-6 font-heading text-5xl leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-6xl md:text-7xl lg:text-8xl">
            {t(dict, 'destinations.hero_title', 'Start with a city.')}
            <br />
            <span className="font-light italic text-brand-yellow opacity-90">
              {t(dict, 'destinations.hero_title_span', 'Discover the route.')}
            </span>
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-lg font-light leading-relaxed text-white/80 sm:text-xl">
            {t(dict, 'destinations.hero_sub', '')}
          </p>
          <div className="flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
            <Button
              asChild
              size="lg"
              className="w-full rounded-full bg-brand-blue px-10 py-6 text-xs font-bold uppercase tracking-widest text-white shadow-pop transition-transform hover:-translate-y-1 hover:bg-white hover:text-brand-blue sm:w-auto"
            >
              <Link href={withLocale(locale, '/tours')}>
                {t(dict, 'destinations.hero_cta', 'View catalog')}{' '}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full rounded-full border-white/30 bg-white/5 px-10 py-6 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md transition-transform hover:-translate-y-1 hover:bg-white hover:text-brand-dark sm:w-auto"
            >
              <Link href={withLocale(locale, '/plan')}>
                {t(dict, 'destinations.hero_cta2', 'Build plan')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* BREADCRUMB ELEGANTE */}
      <div className="w-full border-b border-brand-dark/5 bg-surface px-6 py-3 dark:border-white/5">
        <div className="mx-auto flex max-w-[var(--container-max)] items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
          <Link
            href={withLocale(locale, '/')}
            className="transition-colors hover:text-brand-blue"
          >
            {t(dict, 'brand.short', 'KCE')}
          </Link>
          <ArrowRight className="h-3 w-3" />
          <span className="text-main opacity-70">
            {t(dict, 'destinations.breadcrumb', 'Explore by Region')}
          </span>
        </div>
      </div>

      {/* METHODOLOGY STEPS */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 py-24 md:py-32">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Compass className="h-3 w-3" />{' '}
            {t(dict, 'destinations.method_kicker', 'KCE Methodology')}
          </div>
          <h2 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
            {t(dict, 'destinations.method_title', 'How to plan your route?')}
          </h2>
        </div>

        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          <div className="absolute left-[15%] right-[15%] top-10 hidden h-px bg-gradient-to-r from-transparent via-brand-dark/10 to-transparent dark:via-white/10 md:block" />
          {[
            {
              step: '01',
              titleKey: 'destinations.step1_title',
              copyKey: 'destinations.step1_copy',
            },
            {
              step: '02',
              titleKey: 'destinations.step2_title',
              copyKey: 'destinations.step2_copy',
            },
            {
              step: '03',
              titleKey: 'destinations.step3_title',
              copyKey: 'destinations.step3_copy',
            },
          ].map(({ step, titleKey, copyKey }) => (
            <div
              key={step}
              className="group relative z-10 flex flex-col items-center text-center"
            >
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-brand-dark/10 bg-surface font-heading text-2xl text-brand-blue shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:border-brand-blue group-hover:bg-brand-blue group-hover:text-white dark:border-white/10">
                {step}
              </div>
              <h3 className="mb-4 font-heading text-2xl tracking-tight text-main transition-colors group-hover:text-brand-blue">
                {t(dict, titleKey, '')}
              </h3>
              <p className="px-4 text-base font-light leading-relaxed text-muted">
                {t(dict, copyKey, '')}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CITIES GRID */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 pb-24 md:pb-32">
        <div className="mb-12 flex flex-col justify-between gap-6 border-b border-brand-dark/5 pb-8 dark:border-white/5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
              {t(dict, 'destinations.regions_kicker', 'KCE Destinations')}
            </p>
            <h2 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
              {t(dict, 'destinations.regions_title', 'Active Regions')}
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl border border-brand-dark/5 bg-surface-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted shadow-sm dark:border-white/5">
            <MapPin className="h-4 w-4 text-brand-blue" />{' '}
            <span className="font-heading text-base text-main">{citySlugs.length}</span>{' '}
            {t(dict, 'destinations.regions_unit', 'Regions')}
          </span>
        </div>

        {citySlugs.length === 0 ? (
          <div className="rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface py-24 text-center shadow-soft">
            <p className="text-lg font-light text-muted">
              {t(dict, 'tours.empty', 'No destinations available yet.')}
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3">
            {citySlugs.map((c) => (
              <Link
                key={c.slug}
                href={withLocale(locale, `/tours/city/${encodeURIComponent(c.slug)}`)}
                className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/10 bg-brand-dark p-8 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:border-brand-blue/30 hover:shadow-pop"
              >
                <div className="absolute inset-0 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center opacity-50 transition-transform duration-1000 group-hover:scale-105 group-hover:opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/30 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
                <div className="relative z-10">
                  <h3 className="font-heading text-3xl tracking-tight text-white drop-shadow-md transition-colors group-hover:text-brand-yellow">
                    {c.city}
                  </h3>
                  <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 transition-colors group-hover:text-white">
                      {t(dict, 'destinations.explore_region', 'Explore region')}
                    </span>
                    <ArrowRight className="h-5 w-5 text-white/70 transition-all group-hover:translate-x-1 group-hover:text-white" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FEATURED TOURS */}
      <section className="border-t border-brand-dark/5 bg-surface-2 py-24 dark:border-white/5 md:py-32">
        <div className="mx-auto max-w-[var(--container-max)] px-6">
          <div className="mb-16 flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-8 dark:border-white/5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                <Star className="h-3 w-3" /> {t(dict, 'destinations.tours_kicker', 'Top Selection')}
              </div>
              <h2 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
                {t(dict, 'destinations.tours_title', 'Featured Tours')}
              </h2>
              <p className="mt-4 text-lg font-light leading-relaxed text-muted">
                {t(dict, 'destinations.tours_sub', '')}
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-brand-dark/10 bg-surface px-8 py-6 text-xs font-bold uppercase tracking-widest transition-transform hover:-translate-y-1 hover:border-brand-blue hover:text-brand-blue"
            >
              <Link href={withLocale(locale, '/tours')}>
                {t(dict, 'destinations.tours_cta', 'View Catalog')}{' '}
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
            {(topTours.items || []).map((tour, idx) => (
              <TourCardPremium
                key={tour.slug}
                tour={toTourLike(tour)}
                priority={idx < 3}
                href={withLocale(locale, `/tours/${tour.slug}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="border-t border-brand-dark/5 bg-base py-24 dark:border-white/5 md:py-32">
        <div className="mx-auto max-w-[var(--container-max)] px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <ShieldCheck className="h-3 w-3" />{' '}
            {t(dict, 'destinations.reviews_kicker', 'KCE Trust')}
          </div>
          <h2 className="mb-16 font-heading text-4xl tracking-tight text-main md:text-5xl">
            {t(dict, 'destinations.reviews_title', 'What our travelers say')}
          </h2>
          <FeaturedReviews locale={locale} />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-brand-dark/5 bg-surface-2 py-24 dark:border-white/5">
        <div className="mx-auto max-w-[var(--container-max)] px-6">
          <CaptureCtas compact />
        </div>
      </section>
    </main>
  );
}

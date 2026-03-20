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
    <main className="min-h-screen bg-[color:var(--color-bg)] flex flex-col animate-fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* HERO */}
      <section className="relative min-h-[85vh] w-full flex flex-col justify-center overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 opacity-40 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-96 bg-brand-blue/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-32 pb-16 text-center flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white backdrop-blur-xl">
            <MapPin className="h-3 w-3 text-brand-yellow" /> {t(dict, 'destinations.hero_kicker', 'Colombia by Region')}
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-8xl text-white drop-shadow-lg tracking-tight leading-tight mb-6">
            {t(dict, 'destinations.hero_title', 'Start with a city.')}<br/>
            <span className="text-brand-yellow font-light italic opacity-90">{t(dict, 'destinations.hero_title_span', 'Discover the route.')}</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg sm:text-xl font-light leading-relaxed text-white/80 mb-12">
            {t(dict, 'destinations.hero_sub', '')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full bg-brand-blue text-white hover:bg-brand-blue/90 px-10">
              <Link href={withLocale(locale, '/tours')}>{t(dict, 'destinations.hero_cta', 'View catalog')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-white/30 text-white bg-white/5 hover:bg-white/10 backdrop-blur-md px-10">
              <Link href={withLocale(locale, '/plan')}>{t(dict, 'destinations.hero_cta2', 'Build plan')}</Link>
            </Button>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40 hidden md:block">
          <ArrowRight className="h-6 w-6 rotate-90 text-white" />
        </div>
      </section>

      {/* BREADCRUMB */}
      <div className="w-full bg-[color:var(--color-surface)] border-b border-[color:var(--color-border)] py-3 px-6">
        <div className="mx-auto max-w-6xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
          <Link href={withLocale(locale, '/')} className="hover:text-brand-blue transition-colors">
            {t(dict, 'brand.short', 'KCE')}
          </Link>
          <ArrowRight className="h-3 w-3" />
          <span className="text-[color:var(--color-text)]">{t(dict, 'destinations.breadcrumb', 'Explore by Region')}</span>
        </div>
      </div>

      {/* METHODOLOGY STEPS */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue mb-4">
            <Compass className="h-3 w-3" /> {t(dict, 'destinations.method_kicker', 'KCE Methodology')}
          </div>
          <h2 className="font-heading text-4xl md:text-5xl text-[color:var(--color-text)] tracking-tight">
            {t(dict, 'destinations.method_title', 'How to plan your route?')}
          </h2>
        </div>

        <div className="grid gap-12 md:grid-cols-3 relative">
          <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-[color:var(--color-border)] to-transparent" />
          {[
            { step: '01', titleKey: 'destinations.step1_title', copyKey: 'destinations.step1_copy' },
            { step: '02', titleKey: 'destinations.step2_title', copyKey: 'destinations.step2_copy' },
            { step: '03', titleKey: 'destinations.step3_title', copyKey: 'destinations.step3_copy' },
          ].map(({ step, titleKey, copyKey }) => (
            <div key={step} className="relative z-10 flex flex-col items-center text-center group">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-surface)] border-2 border-[color:var(--color-border)] text-brand-blue font-heading text-xl mb-6 shadow-soft transition-all group-hover:scale-110 group-hover:border-brand-blue group-hover:bg-brand-blue group-hover:text-white">
                {step}
              </div>
              <h3 className="text-xl font-heading text-[color:var(--color-text)] mb-3 group-hover:text-brand-blue transition-colors">
                {t(dict, titleKey, '')}
              </h3>
              <p className="text-sm font-light text-[color:var(--color-text-muted)] leading-relaxed px-4">
                {t(dict, copyKey, '')}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CITIES GRID */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[color:var(--color-border)] pb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)] mb-2">
              {t(dict, 'destinations.regions_kicker', 'KCE Destinations')}
            </p>
            <h2 className="font-heading text-4xl text-[color:var(--color-text)] tracking-tight">
              {t(dict, 'destinations.regions_title', 'Active Regions')}
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)]">
            <MapPin className="h-3 w-3 text-brand-blue" /> {citySlugs.length} {t(dict, 'destinations.regions_unit', 'Regions')}
          </span>
        </div>

        {citySlugs.length === 0 ? (
          <div className="py-16 text-center text-[color:var(--color-text-muted)]">
            {t(dict, 'tours.empty', 'No destinations available yet.')}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {citySlugs.map((c) => (
              <Link key={c.slug} href={withLocale(locale, `/tours/city/${encodeURIComponent(c.slug)}`)}
                className="group relative overflow-hidden rounded-3xl bg-brand-dark aspect-[4/3] flex flex-col justify-end p-8 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-pop">
                <div className="absolute inset-0 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center opacity-50 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/30 to-transparent" />
                <div className="relative z-10">
                  <h3 className="font-heading text-4xl text-white drop-shadow-md tracking-tight">{c.city}</h3>
                  <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">
                      {t(dict, 'destinations.explore_region', 'Explore region')}
                    </span>
                    <ArrowRight className="h-4 w-4 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FEATURED TOURS */}
      <section className="bg-[color:var(--color-surface-2)] border-t border-[color:var(--color-border)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 border-b border-[color:var(--color-border)] pb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue mb-4">
                <Star className="h-3 w-3" /> {t(dict, 'destinations.tours_kicker', 'Top Selection')}
              </div>
              <h2 className="font-heading text-4xl text-[color:var(--color-text)] tracking-tight">{t(dict, 'destinations.tours_title', 'Featured Tours')}</h2>
              <p className="mt-3 text-[color:var(--color-text-muted)] font-light max-w-xl">{t(dict, 'destinations.tours_sub', '')}</p>
            </div>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link href={withLocale(locale, '/tours')}>{t(dict, 'destinations.tours_cta', 'View Catalog')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {(topTours.items || []).map((tour, idx) => (
              <TourCardPremium key={tour.slug} tour={toTourLike(tour)} priority={idx < 3} href={withLocale(locale, `/tours/${tour.slug}`)} />
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="py-24 border-t border-[color:var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue mb-3">
            <ShieldCheck className="h-3 w-3" /> {t(dict, 'destinations.reviews_kicker', 'KCE Trust')}
          </div>
          <h2 className="font-heading text-3xl text-[color:var(--color-text)] mb-12">{t(dict, 'destinations.reviews_title', 'What our travelers say')}</h2>
          <FeaturedReviews locale={locale} />
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 border-t border-[color:var(--color-border)] pt-24 bg-[color:var(--color-surface-2)]">
        <div className="mx-auto max-w-6xl px-6">
          <CaptureCtas />
        </div>
      </section>
    </main>
  );
}

import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MapPin, ArrowRight, ShieldCheck, Compass, HeartHandshake } from 'lucide-react';

import CaptureCtas from '@/features/marketing/CaptureCtas';
import FeaturedReviews from '@/features/reviews/FeaturedReviews';
import { getFacets, listTours } from '@/features/tours/catalog.server';
import { toTourLike } from '@/features/tours/adapters';
import TourCardPremium from '@/features/tours/components/TourCardPremium';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';
import { Button } from '@/components/ui/Button';

export const revalidate = 900;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
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
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
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

function titleCase(s: string) {
  return (s || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ');
}

export async function generateMetadata(ctx: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const locale = await resolveLocale();
  const { slug } = await ctx.params;
  const base = getPublicBaseUrl().replace(/\/+$/, '');

  const cityLabel = titleCase(String(slug || '').replace(/-/g, ' '));
  const canonicalPath = withLocale(locale, `/destinations/${encodeURIComponent(slug)}`);
  const canonicalAbs = absoluteUrl(canonicalPath);

  return {
    metadataBase: new URL(base),
    title: `${cityLabel} — Destinos | KCE`,
    description: `Explora experiencias curadas en ${cityLabel} con apoyo real, reserva clara y ayuda para elegir mejor tu próxima ruta.`,
    alternates: {
      canonical: canonicalAbs,
      languages: {
        es: `/es/destinations/${slug}`,
        en: `/en/destinations/${slug}`,
        fr: `/fr/destinations/${slug}`,
        de: `/de/destinations/${slug}`,
      },
    },
    openGraph: { title: `${cityLabel} — KCE`, description: `Descubre tours y experiencias en ${cityLabel} con una ruta clara para comparar y reservar.`, url: canonicalAbs, type: 'website' },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function DestinationCityPage(ctx: { params: Promise<{ slug: string }> }) {
  const locale = await resolveLocale();
  const base = getPublicBaseUrl().replace(/\/+$/, '');
  const { slug } = await ctx.params;
  const slugNorm = String(slug || '').trim().toLowerCase();

  const { cities } = await getFacets();
  const match = (cities || []).find((c) => slugify(c) === slugNorm);
  const city = match || null;
  if (!city) return notFound();

  const tours = await listTours({ city, sort: 'popular', limit: 9, offset: 0 });
  const canonicalPath = withLocale(locale, `/destinations/${encodeURIComponent(slugNorm)}`);
  const canonicalAbs = absoluteUrl(canonicalPath);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', name: `${city} — Destinations`, url: canonicalAbs, isPartOf: { '@type': 'WebSite', name: 'KCE', url: base } },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(withLocale(locale, '/')) },
          { '@type': 'ListItem', position: 2, name: 'Destinos', item: absoluteUrl(withLocale(locale, '/destinations')) },
          { '@type': 'ListItem', position: 3, name: city, item: canonicalAbs },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* HERO DESTINATION */}
      <section className="relative overflow-hidden bg-brand-blue px-6 py-28 md:py-40 text-center shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.png')] bg-repeat"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md shadow-sm">
            <MapPin className="h-3 w-3" /> Destino KCE
          </div>
          <h1 className="font-heading text-5xl leading-tight md:text-7xl lg:text-8xl text-white drop-shadow-md">
            {city}
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl">
            Descubre experiencias en {city} con apoyo real antes de reservar, pago seguro y una forma más simple de comparar antes de decidir tu ruta.
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-8 bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90 shadow-xl">
              <Link href={withLocale(locale, `/tours/city/${encodeURIComponent(slugNorm)}`)}>
                Ver todos los tours <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 border-white/20 text-white hover:bg-white/5 backdrop-blur-sm">
              <Link href={withLocale(locale, '/plan')}>
                Plan personalizado
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA / VALOR KCE */}
      <div className="mx-auto max-w-6xl px-6 -mt-16 relative z-20 space-y-8">
        
        <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-10 md:p-16">
              <h2 className="font-heading text-3xl md:text-4xl text-brand-blue mb-8">Cómo explorar {city} con KCE</h2>
              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  { step: '01', title: 'Explora', copy: 'Filtra y compara desde un punto claro.' },
                  { step: '02', title: 'Compara', copy: 'Revisa detalles, reseñas y opciones.' },
                  { step: '03', title: 'Reserva', copy: 'Pago seguro y soporte humano activo.' },
                ].map(({ step, title, copy }) => (
                  <div key={step} className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6">
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue/50 mb-3">{step}</div>
                    <div className="font-heading text-xl text-brand-blue mb-2">{title}</div>
                    <div className="text-sm font-light text-[var(--color-text)]/70 leading-relaxed">{copy}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-brand-blue p-10 md:p-16 text-white flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-[var(--color-border)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-6">El estándar KCE</p>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="h-6 w-6 text-brand-yellow shrink-0" />
                  <span className="font-light">Pago seguro vía Stripe</span>
                </div>
                <div className="flex items-center gap-4">
                  <HeartHandshake className="h-6 w-6 text-brand-yellow shrink-0" />
                  <span className="font-light">Soporte real 24/7</span>
                </div>
                <div className="flex items-center gap-4">
                  <Compass className="h-6 w-6 text-brand-yellow shrink-0" />
                  <span className="font-light">Cero costos ocultos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TOURS DESTACADOS */}
        <section className="pt-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40 mb-2">Selección Curada</p>
              <h2 className="text-3xl md:text-4xl font-heading text-brand-blue">Experiencias en {city}</h2>
            </div>
            <Link href={withLocale(locale, '/destinations')} className="text-sm font-bold uppercase tracking-widest text-brand-blue hover:text-brand-yellow transition-colors">
              Todos los destinos
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(tours.items || []).map((t) => {
              const ui = toTourLike(t);
              return (
                <TourCardPremium
                  key={ui.slug}
                  tour={ui}
                  href={withLocale(locale, `/tours/${ui.slug}`)}
                />
              );
            })}
          </div>
        </section>

        <section className="pt-16">
          <FeaturedReviews locale={locale} />
        </section>

        <section className="pt-16">
          <CaptureCtas locale={locale} />
        </section>

      </div>
    </main>
  );
}
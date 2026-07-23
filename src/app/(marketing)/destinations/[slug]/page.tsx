/* src/app/(marketing)/destinations/[slug]/page.tsx */
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MapPin,
  ArrowRight,
  ShieldCheck,
  Compass,
  HeartHandshake,
  Sparkles,
  Star,
} from 'lucide-react';

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

export async function generateMetadata(ctx: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
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
    openGraph: {
      title: `${cityLabel} — KCE`,
      description: `Descubre tours y experiencias en ${cityLabel} con una ruta clara para comparar y reservar.`,
      url: canonicalAbs,
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function DestinationCityPage(ctx: { params: Promise<{ slug: string }> }) {
  const locale = await resolveLocale();
  const base = getPublicBaseUrl().replace(/\/+$/, '');
  const { slug } = await ctx.params;
  const slugNorm = String(slug || '')
    .trim()
    .toLowerCase();

  const { cities } = await getFacets();

  // SOLUCIÓN: Prevenir el 404 forzando el formato si no hay tours activos.
  const match = (cities || []).find((c) => slugify(c) === slugNorm);
  const city =
    match ||
    slugNorm
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const tours = await listTours({ city, sort: 'popular', limit: 9, offset: 0 });
  const canonicalPath = withLocale(locale, `/destinations/${encodeURIComponent(slugNorm)}`);
  const canonicalAbs = absoluteUrl(canonicalPath);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `${city} — Destinations`,
        url: canonicalAbs,
        isPartOf: { '@type': 'WebSite', name: 'KCE', url: base },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Inicio',
            item: absoluteUrl(withLocale(locale, '/')),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Destinos',
            item: absoluteUrl(withLocale(locale, '/destinations')),
          },
          { '@type': 'ListItem', position: 3, name: city, item: canonicalAbs },
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

      {/* 01. HERO DESTINATION (Dark Premium Parity) */}
      <section className="relative flex min-h-[60vh] w-full flex-col justify-center overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 scale-105 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center opacity-40 mix-blend-overlay transition-transform duration-1000"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>

        {/* Glow sutil */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-yellow/10 blur-[120px]"></div>

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 pb-16 pt-32 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
            <MapPin className="h-3 w-3 text-brand-yellow" /> Destino KCE
          </div>

          <h1 className="mb-8 font-heading text-5xl leading-[1.05] tracking-tight text-white drop-shadow-md md:text-7xl lg:text-8xl">
            {city}
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl">
            Descubre experiencias auténticas en {city} con apoyo real antes de reservar, pago seguro
            y una forma más simple de comparar.
          </p>

          <div className="flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
            <Button
              asChild
              size="lg"
              className="w-full rounded-full bg-brand-yellow px-10 py-6 text-xs font-bold uppercase tracking-widest text-brand-dark shadow-pop transition-transform hover:-translate-y-1 hover:bg-white sm:w-auto"
            >
              <Link href={withLocale(locale, `/tours/city/${encodeURIComponent(slugNorm)}`)}>
                Ver catálogo local <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full rounded-full border-white/30 bg-white/5 px-10 py-6 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md transition-transform hover:-translate-y-1 hover:bg-white hover:text-brand-dark sm:w-auto"
            >
              <Link href={withLocale(locale, '/plan')}>Plan personalizado</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Breadcrumb Elegante */}
      <div className="w-full border-b border-brand-dark/5 bg-surface px-6 py-3 dark:border-white/5">
        <div className="mx-auto flex max-w-[var(--container-max)] items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-80">
          <Link
            href={withLocale(locale, '/')}
            className="transition-colors hover:text-brand-blue"
          >
            Inicio
          </Link>
          <ArrowRight className="h-3 w-3" />
          <Link
            href={withLocale(locale, '/destinations')}
            className="transition-colors hover:text-brand-blue"
          >
            Destinos
          </Link>
          <ArrowRight className="h-3 w-3" />
          <span className="text-main">{city}</span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-24 px-6 py-20 md:py-32">
        {/* 02. CÓMO FUNCIONA / VALOR KCE (Glassmorphism + Libre de Cajas) */}
        <section className="grid items-center gap-16 lg:grid-cols-[1fr_0.8fr] lg:gap-24">
          {/* Metodología (Izquierda) */}
          <div>
            <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
              <Compass className="h-3 w-3 text-brand-blue" /> Metodología KCE
            </div>
            <h2 className="mb-12 font-heading text-4xl tracking-tight text-main md:text-5xl">
              Cómo explorar {city} con nosotros
            </h2>

            {/* Timeline Vertical */}
            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[1.4rem] before:h-full before:w-px before:bg-gradient-to-b before:from-brand-dark/10 before:to-transparent dark:before:from-white/10">
              {[
                {
                  step: '01',
                  title: 'Explora el catálogo',
                  copy: 'Revisa tours, estilos y ritmos de viaje curados específicamente para esta región.',
                },
                {
                  step: '02',
                  title: 'Compara transparente',
                  copy: 'Lee detalles honestos, qué incluye realmente y reseñas verificadas de otros viajeros.',
                },
                {
                  step: '03',
                  title: 'Reserva con calma',
                  copy: 'Pago protegido vía Stripe y soporte humano por WhatsApp activo en todo el proceso.',
                },
              ].map(({ step, title, copy }) => (
                <div
                  key={step}
                  className="group relative z-10 flex items-start gap-6"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-dark/5 bg-surface-2 font-heading text-lg text-muted shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-brand-blue group-hover:bg-brand-blue group-hover:text-white dark:border-white/5">
                    <span className="text-[10px] font-bold tracking-widest">{step}</span>
                  </div>
                  <div className="pt-1.5">
                    <h3 className="mb-2 font-heading text-xl tracking-tight text-main transition-colors group-hover:text-brand-blue">
                      {title}
                    </h3>
                    <p className="max-w-sm text-base font-light leading-relaxed text-muted">
                      {copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* El estándar KCE (Derecha - Glassmorphism Premium) */}
          <div className="group relative flex h-full flex-col justify-center overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft dark:border-white/5 md:p-14">
            {/* Glow decorativo de confianza */}
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-brand-blue/5 blur-[80px] transition-transform duration-700 group-hover:scale-150"></div>

            <div className="relative z-10">
              <p className="mb-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
                <ShieldCheck className="h-4 w-4 text-brand-yellow" /> El Estándar Global
              </p>
              <div className="space-y-10">
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-blue/10 bg-brand-blue/5 text-brand-blue transition-colors duration-300 group-hover:bg-brand-blue group-hover:text-white">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="pt-1">
                    <h4 className="mb-1 font-heading text-xl tracking-tight text-main">
                      Pago protegido
                    </h4>
                    <p className="text-base font-light text-muted">
                      Infraestructura Stripe con facturación automática.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-blue/10 bg-brand-blue/5 text-brand-blue transition-colors duration-300 group-hover:bg-brand-blue group-hover:text-white">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div className="pt-1">
                    <h4 className="mb-1 font-heading text-xl tracking-tight text-main">
                      Soporte real 24/7
                    </h4>
                    <p className="text-base font-light text-muted">
                      Acompañamiento humano antes, durante y después.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-blue/10 bg-brand-blue/5 text-brand-blue transition-colors duration-300 group-hover:bg-brand-blue group-hover:text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="pt-1">
                    <h4 className="mb-1 font-heading text-xl tracking-tight text-main">
                      Cero costos ocultos
                    </h4>
                    <p className="text-base font-light text-muted">
                      Transparencia radical en cada experiencia KCE.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 03. TOURS DESTACADOS EN LA CIUDAD (Grid Limpio) */}
        <section className="border-t border-brand-dark/5 pt-16 dark:border-white/5">
          <header className="mb-16 flex flex-col justify-between gap-6 pb-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
                <Star className="h-3 w-3 text-brand-yellow" /> Catálogo Local
              </div>
              <h2 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
                Experiencias en {city}
              </h2>
            </div>
            <Link
              href={withLocale(locale, '/destinations')}
              className="group flex items-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-widest text-muted transition-colors hover:text-brand-blue"
            >
              Ver otros destinos{' '}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </header>

          {tours.items && tours.items.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3">
              {tours.items.map((t, idx) => {
                const ui = toTourLike(t);
                return (
                  <TourCardPremium
                    key={ui.slug}
                    tour={ui}
                    priority={idx < 3}
                    href={withLocale(locale, `/tours/${ui.slug}`)}
                  />
                );
              })}
            </div>
          ) : (
            /* Empty State Elegante (Evita 404 si la ciudad no tiene tours) */
            <div className="flex flex-col items-center justify-center rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface py-24 text-center shadow-soft dark:border-white/5">
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-brand-dark/5 bg-surface-2 shadow-sm dark:border-white/5">
                <Compass className="h-8 w-8 animate-pulse text-muted opacity-50" />
              </div>
              <h2 className="mb-4 font-heading text-3xl tracking-tight text-main">
                Mapeando nuevas rutas en {city}
              </h2>
              <p className="mx-auto mb-10 max-w-md text-base font-light leading-relaxed text-muted">
                Nuestros expertos están curando experiencias en este momento. Pregúntanos por planes
                a medida.
              </p>
              <Button
                asChild
                variant="outline"
                className="w-full rounded-full border-brand-dark/10 bg-surface px-10 py-6 text-xs font-bold uppercase tracking-widest text-main transition-transform hover:-translate-y-1 hover:bg-surface-2 dark:border-white/10 sm:w-auto"
              >
                <Link href={withLocale(locale, '/plan')}>Diseñar plan en {city}</Link>
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* 04. SOCIAL PROOF */}
      <section className="border-t border-brand-dark/5 bg-surface-2 py-24 dark:border-white/5 md:py-32">
        <div className="mx-auto max-w-[var(--container-max)] px-6">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
              <ShieldCheck className="h-3 w-3 text-brand-blue" /> Confianza KCE
            </div>
            <h2 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
              Lo que dicen nuestros viajeros
            </h2>
          </div>
          <FeaturedReviews locale={locale} />
        </div>
      </section>

      {/* 05. BOTTOM CAPTURE LAYER */}
      <section className="border-t border-brand-dark/5 bg-base py-24 dark:border-white/5">
        <div className="mx-auto max-w-[var(--container-max)] px-6">
          <CaptureCtas />
        </div>
      </section>
    </main>
  );
}

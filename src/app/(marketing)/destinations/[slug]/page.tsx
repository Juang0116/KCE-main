import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MapPin, ArrowRight, ShieldCheck, Compass, HeartHandshake, Sparkles } from 'lucide-react';

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
    <main className="min-h-screen bg-[color:var(--color-bg)] flex flex-col animate-fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* 01. HERO DESTINATION (Dark Premium Parity) */}
      <section className="relative min-h-[60vh] w-full flex flex-col justify-center overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 opacity-40 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay scale-105 animate-slow-zoom"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
        
        {/* Glow sutil */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-96 bg-brand-yellow/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-32 pb-16 text-center flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white backdrop-blur-xl shadow-sm">
            <MapPin className="h-3 w-3 text-brand-yellow" /> Destino KCE
          </div>
          
          <h1 className="font-heading text-5xl leading-tight md:text-7xl lg:text-8xl text-white drop-shadow-md tracking-tight mb-8">
            {city}
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl mb-12">
            Descubre experiencias auténticas en {city} con apoyo real antes de reservar, pago seguro y una forma más simple de comparar.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-10 py-7 bg-brand-yellow text-[color:var(--color-text)] hover:bg-brand-yellow/90 shadow-pop transition-transform hover:-translate-y-1 text-base">
              <Link href={withLocale(locale, `/tours/city/${encodeURIComponent(slugNorm)}`)}>
                Ver catálogo en {city} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-10 py-7 border-white/30 text-white hover:bg-white/10 backdrop-blur-md transition-all text-base">
              <Link href={withLocale(locale, '/plan')}>
                Plan personalizado
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Breadcrumb sutil y orgánico debajo del hero */}
      <div className="w-full bg-[color:var(--color-surface)] border-b border-[color:var(--color-border)] py-3 px-6">
        <div className="mx-auto max-w-[var(--container-max)] flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)] opacity-80">
          <Link href={withLocale(locale, '/')} className="hover:text-brand-blue transition-colors">Inicio</Link>
          <ArrowRight className="h-3 w-3" />
          <Link href={withLocale(locale, '/destinations')} className="hover:text-brand-blue transition-colors">Destinos</Link>
          <ArrowRight className="h-3 w-3" />
          <span className="text-[color:var(--color-text)] opacity-50">{city}</span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[var(--container-max)] px-6 py-20 flex flex-col gap-24">
        
        {/* 02. CÓMO FUNCIONA / VALOR KCE (Glassmorphism + Libre de Cajas Pesadas) */}
        <section className="grid lg:grid-cols-[1fr_0.8fr] gap-16 lg:gap-24 items-center">
          
          {/* Metodología (Izquierda) */}
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[color:var(--color-text-muted)] mb-4">
              <Compass className="h-3 w-3 text-brand-blue" /> Metodología KCE
            </div>
            <h2 className="font-heading text-4xl md:text-5xl text-[color:var(--color-text)] mb-10 tracking-tight">Cómo explorar {city} con nosotros</h2>
            
            {/* Timeline Vertical */}
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[1.4rem] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[var(--color-border)] before:to-transparent">
              {[
                { step: '01', title: 'Explora el catálogo', copy: 'Revisa tours, estilos y ritmos de viaje curados específicamente para esta región.' },
                { step: '02', title: 'Compara transparente', copy: 'Lee detalles honestos, qué incluye realmente y reseñas verificadas de otros viajeros.' },
                { step: '03', title: 'Reserva con calma', copy: 'Pago protegido vía Stripe y soporte humano por WhatsApp activo en todo el proceso.' },
              ].map(({ step, title, copy }) => (
                <div key={step} className="relative z-10 flex items-start gap-6 group">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface)] border-2 border-[color:var(--color-border)] text-[color:var(--color-text-muted)] font-heading text-lg shadow-sm transition-all duration-300 group-hover:border-brand-blue group-hover:text-brand-blue group-hover:scale-110">
                    {step}
                  </div>
                  <div className="pt-1.5">
                    <h3 className="text-xl font-heading text-[color:var(--color-text)] mb-2 group-hover:text-brand-blue transition-colors">{title}</h3>
                    <p className="text-sm font-light text-[color:var(--color-text-muted)] leading-relaxed max-w-sm">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* El estándar KCE (Derecha - Glassmorphism Premium) */}
          <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/80 backdrop-blur-xl p-10 md:p-14 shadow-soft group h-full flex flex-col justify-center">
            {/* Glow decorativo de confianza */}
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-brand-blue/5 rounded-full blur-[80px] pointer-events-none transition-transform duration-700 group-hover:scale-150"></div>
            
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)] mb-8 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-yellow" /> El Estándar Global
              </p>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="pt-1">
                    <h4 className="font-heading text-lg text-[color:var(--color-text)] mb-1">Pago protegido</h4>
                    <p className="text-sm font-light text-[color:var(--color-text-muted)]">Infraestructura Stripe con facturación automática.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div className="pt-1">
                    <h4 className="font-heading text-lg text-[color:var(--color-text)] mb-1">Soporte real 24/7</h4>
                    <p className="text-sm font-light text-[color:var(--color-text-muted)]">Acompañamiento humano antes, durante y después.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="pt-1">
                    <h4 className="font-heading text-lg text-[color:var(--color-text)] mb-1">Cero costos ocultos</h4>
                    <p className="text-sm font-light text-[color:var(--color-text-muted)]">Transparencia radical en cada experiencia KCE.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 03. TOURS DESTACADOS EN LA CIUDAD (Grid Limpio) */}
        <section className="pt-8 border-t border-[color:var(--color-border)]">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-[color:var(--color-border)] pb-6">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
                <MapPin className="h-3 w-3" /> Catálogo Local
              </div>
              <h2 className="text-4xl md:text-5xl font-heading text-[color:var(--color-text)] tracking-tight">Experiencias en {city}</h2>
            </div>
            <Link href={withLocale(locale, '/destinations')} className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] hover:text-brand-blue transition-colors flex items-center gap-2 group whitespace-nowrap">
              Ver otros destinos <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </header>

          {tours.items && tours.items.length > 0 ? (
            <div className="grid gap-8 sm:gap-10 sm:grid-cols-2 lg:grid-cols-3">
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
            /* Empty State Elegante (Por si la ciudad no tiene tours activos) */
            <div className="py-24 text-center rounded-[var(--radius-2xl)] bg-[color:var(--color-surface)] border border-[color:var(--color-border)] shadow-soft flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-[color:var(--color-surface-2)] flex items-center justify-center mb-6">
                <Compass className="h-8 w-8 text-[color:var(--color-text-muted)] opacity-50 animate-pulse" />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-[color:var(--color-text)] mb-3">Mapeando nuevas rutas en {city}</h2>
              <p className="max-w-md mx-auto text-sm font-light text-[color:var(--color-text-muted)] mb-8">
                Nuestros expertos están curando experiencias en este momento. Pregúntanos por planes a medida.
              </p>
              <Button asChild variant="outline" className="rounded-full px-8 border-[color:var(--color-border)] text-[color:var(--color-text)] bg-[color:var(--color-surface)] hover:bg-[color:var(--color-surface-2)]">
                <Link href={withLocale(locale, '/plan')}>Diseñar plan en {city}</Link>
              </Button>
            </div>
          )}
        </section>

        {/* 04. SOCIAL PROOF */}
        <section className="pt-16 border-t border-[color:var(--color-border)]">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[color:var(--color-text-muted)] mb-3">
              <ShieldCheck className="h-3 w-3 text-brand-blue" /> Confianza KCE
            </div>
            <h2 className="font-heading text-3xl font-semibold text-[color:var(--color-text)]">Lo que dicen nuestros viajeros</h2>
          </div>
          <FeaturedReviews locale={locale} />
        </section>

        {/* 05. BOTTOM CAPTURE LAYER */}
        <section className="pt-8">
          <CaptureCtas />
        </section>

      </div>
    </main>
  );
}
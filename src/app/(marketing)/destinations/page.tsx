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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const base = getPublicBaseUrl().replace(/\/+$/, '');
  const canonicalPath = withLocale(locale, '/destinations');
  const canonicalAbs = absoluteUrl(canonicalPath);

  return {
    metadataBase: new URL(base),
    title: 'Destinos en Colombia — KCE',
    description: 'Explora Colombia por ciudad y región con una ruta más clara hacia tours, planeación personalizada y soporte real.',
    alternates: { canonical: canonicalAbs, languages: { es: '/es/destinations', en: '/en/destinations', fr: '/fr/destinations', de: '/de/destinations' } },
    openGraph: { title: 'Destinos en Colombia — KCE', description: 'Empieza por la ciudad, compara experiencias curadas y continúa con más claridad.', url: canonicalAbs, type: 'website', images: [{ url: absoluteUrl('/images/hero-kce.jpg') }] },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function DestinationsPage() {
  const locale = await resolveLocale();
  const base = getPublicBaseUrl().replace(/\/+$/, '');

  const [{ cities }, topTours] = await Promise.all([
    getFacets(),
    listTours({ sort: 'popular', limit: 6, offset: 0 }),
  ]);

  const citySlugs = (cities || [])
    .map((c) => ({ city: c, slug: slugify(c) }))
    .filter((x) => x.slug)
    .slice(0, 24);

  const canonicalPath = withLocale(locale, '/destinations');
  const canonicalAbs = absoluteUrl(canonicalPath);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: 'Destinations', url: canonicalAbs, isPartOf: { '@type': 'WebSite', name: 'KCE', url: base } },
      { '@type': 'BreadcrumbList', itemListElement: [ { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl(withLocale(locale, '/')) }, { '@type': 'ListItem', position: 2, name: 'Destinations', item: canonicalAbs } ] },
    ],
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg)] flex flex-col animate-fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* 01. HERO DESTINOS */}
      <section className="relative min-h-[85vh] w-full flex flex-col justify-center overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 opacity-40 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay scale-105 animate-slow-zoom"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent"></div>
        
        {/* Glow sutil esmeralda/azul para geografía */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-96 bg-brand-blue/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-32 pb-16 text-center flex flex-col items-center mt-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white backdrop-blur-xl shadow-sm">
            <MapPin className="h-3 w-3 text-brand-blue" /> Colombia por Región
          </div>
          
          <h1 className="font-heading text-5xl sm:text-6xl md:text-8xl text-white drop-shadow-lg tracking-tight leading-tight mb-6">
            Empieza por la ciudad.<br/> 
            <span className="text-brand-blue font-light italic opacity-90">Descubre la ruta.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg sm:text-xl md:text-2xl font-light leading-relaxed text-white/80 mb-12">
            Explorar Colombia puede ser abrumador. Simplifica tu viaje eligiendo tu ciudad base y descubre las mejores experiencias culturales seleccionadas por KCE.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Button asChild size="lg" className="w-full sm:w-auto rounded-full bg-brand-blue text-white hover:bg-brand-blue/90 px-10 py-7 text-base shadow-pop hover:-translate-y-1 transition-transform">
              <Link href={withLocale(locale, '/tours')}>
                Ver Catálogo Completo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-full border-white/30 text-white bg-white/5 hover:bg-white/10 backdrop-blur-md px-10 py-7 text-base transition-colors">
              <Link href={withLocale(locale, '/plan')}>
                Armar Plan Personalizado
              </Link>
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40 hidden md:block">
           <ArrowRight className="h-6 w-6 rotate-90 text-white" />
        </div>
      </section>

      {/* Breadcrumb Orgánico debajo del Hero */}
      <div className="w-full bg-[var(--color-surface)] border-b border-[var(--color-border)] py-3 px-6">
        <div className="mx-auto max-w-[var(--container-max)] flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-80">
          <Link href={withLocale(locale, '/')} className="hover:text-brand-blue transition-colors">Inicio</Link>
          <ArrowRight className="h-3 w-3" />
          <span className="text-[var(--color-text)] opacity-50">Explorar por Región</span>
        </div>
      </div>

      {/* 02. METODOLOGÍA KCE (Limpio y Vertical) */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 py-24 md:py-32">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] mb-4">
             <Compass className="h-3 w-3 text-brand-blue" /> Metodología KCE
          </div>
          <h2 className="font-heading text-4xl md:text-5xl text-[var(--color-text)] tracking-tight">¿Cómo planear tu ruta?</h2>
        </div>

        <div className="grid gap-12 md:grid-cols-3 relative">
          {/* Línea conectora sutil de fondo (Desktop) */}
          <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent"></div>
          
          {[
            { step: '01', title: 'Elige tu base', copy: 'Empieza por la ciudad principal a la que vas a llegar (ej. Bogotá o Medellín).' },
            { step: '02', title: 'Filtra experiencias', copy: 'Revisa tours, estilos y ritmos de viaje curados específicamente para esa región.' },
            { step: '03', title: 'Combina destinos', copy: 'Usa nuestro Planificador si quieres que conectemos varias ciudades por ti.' },
          ].map(({ step, title, copy }) => (
            <div key={step} className="relative z-10 flex flex-col items-center text-center group">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-brand-blue font-heading text-xl mb-6 shadow-soft transition-all duration-500 group-hover:scale-110 group-hover:border-brand-blue group-hover:bg-brand-blue/5">
                {step}
              </div>
              <h3 className="text-xl md:text-2xl font-heading text-[var(--color-text)] mb-3 group-hover:text-brand-blue transition-colors">{title}</h3>
              <p className="text-sm md:text-base font-light text-[var(--color-text-muted)] leading-relaxed px-4">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 03. LISTADO DE CIUDADES (Galería Premium) */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 mb-32">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[var(--color-border)] pb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2">Destinos KCE</p>
            <h2 className="font-heading text-4xl text-[var(--color-text)] tracking-tight">Regiones Activas</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
            <MapPin className="h-3 w-3 text-brand-blue" /> {citySlugs.length} Regiones
          </span>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {citySlugs.map((c) => (
            <Link
              key={c.slug}
              href={withLocale(locale, `/tours/city/${encodeURIComponent(c.slug)}`)}
              className="group relative overflow-hidden rounded-[var(--radius-2xl)] bg-brand-dark aspect-[4/3] flex flex-col justify-end p-8 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-pop"
            >
              {/* Imagen del Destino */}
              <div className="absolute inset-0 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center opacity-50 transition-transform duration-1000 group-hover:scale-105 group-hover:opacity-70"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3 opacity-0 -translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                  <Sparkles className="h-4 w-4 text-brand-yellow" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">Tours Curados</span>
                </div>
                <h3 className="font-heading text-4xl lg:text-5xl text-white drop-shadow-md tracking-tight">
                  {c.city}
                </h3>
                <div className="mt-6 flex items-center justify-between border-t border-white/20 pt-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">Explorar región</span>
                  <ArrowRight className="h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 04. TOURS DESTACADOS GLOBALES */}
      <section className="bg-[var(--color-surface-2)]/30 border-t border-[var(--color-border)] py-24 md:py-32">
        <div className="mx-auto max-w-[var(--container-max)] px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-[var(--color-border)] pb-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow mb-4 shadow-sm">
                <Star className="h-3 w-3" /> Top Selección
              </div>
              <h2 className="font-heading text-4xl md:text-5xl text-[var(--color-text)] tracking-tight">Tours Destacados</h2>
              <p className="mt-4 text-[var(--color-text-muted)] font-light text-lg max-w-xl leading-relaxed">
                Si tu itinerario es flexible, adapta tus destinos para incluir estas experiencias consideradas imperdibles por nuestros expertos.
              </p>
            </div>
            <Button asChild variant="outline" size="lg" className="rounded-full shadow-sm bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text)]">
              <Link href={withLocale(locale, '/tours')}>
                Ver Catálogo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {(topTours.items || []).map((t, idx) => (
              <TourCardPremium key={t.slug} tour={toTourLike(t)} priority={idx < 3} href={withLocale(locale, `/tours/${t.slug}`)} />
            ))}
          </div>
        </div>
      </section>

      {/* 05. SOCIAL PROOF (Featured Reviews) */}
      <section className="py-24 border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[var(--container-max)] px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] mb-3">
              <ShieldCheck className="h-3 w-3 text-brand-blue" /> Confianza KCE
            </div>
            <h2 className="font-heading text-3xl font-semibold text-[var(--color-text)]">Lo que dicen nuestros viajeros</h2>
          </div>
          <FeaturedReviews locale={locale} />
        </div>
      </section>

      {/* 06. BOTTOM CAPTURE LAYER */}
      <section className="pb-24 border-t border-[var(--color-border)] pt-24 bg-[var(--color-surface-2)]/30">
        <div className="mx-auto max-w-[var(--container-max)] px-6">
           <CaptureCtas />
        </div>
      </section>

    </main>
  );
}
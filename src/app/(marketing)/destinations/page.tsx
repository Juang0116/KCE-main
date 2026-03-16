import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';

import FeaturedReviews from '@/features/reviews/FeaturedReviews';
import { getFacets, listTours } from '@/features/tours/catalog.server';
import { toTourLike } from '@/features/tours/adapters';
import TourCardPremium from '@/features/tours/components/TourCardPremium';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';
import { MapPin, ArrowRight, Compass } from 'lucide-react';

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
    title: 'Destinations in Colombia — KCE',
    description: 'Explore Colombia by city and region with a clearer route into tours, personalized planning and real support.',
    alternates: { canonical: canonicalAbs, languages: { es: '/es/destinations', en: '/en/destinations', fr: '/fr/destinations', de: '/de/destinations' } },
    openGraph: { title: 'Destinations in Colombia — KCE', description: 'Start by city, compare curated experiences and continue with more clarity.', url: canonicalAbs, type: 'website', images: [{ url: absoluteUrl('/images/hero-kce.jpg') }] },
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
    <main className="min-h-screen bg-[color:var(--color-bg)] pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* HERO DESTINOS */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-blue shadow-sm">
          <MapPin className="h-3 w-3" /> Colombia por Región
        </div>
        <h1 className="font-heading text-4xl leading-tight text-[var(--color-text)] md:text-6xl drop-shadow-sm">
          Empieza por la ciudad correcta. <br className="hidden md:block"/> Sigue hacia la experiencia ideal.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-[var(--color-text)]/70">
          Explorar Colombia puede ser abrumador. Simplifica tu viaje eligiendo un destino base y descubre las mejores experiencias culturales seleccionadas en cada zona.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link href={withLocale(locale, '/tours')} className="rounded-full bg-brand-blue px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-md hover:scale-105 transition-transform">
            Ver Catálogo Premium
          </Link>
          <Link href={withLocale(locale, '/plan')} className="rounded-full border border-brand-blue/30 bg-brand-blue/5 px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-brand-blue hover:bg-brand-blue/10 transition-colors">
            Armar Plan Personalizado
          </Link>
        </div>
      </section>

      {/* LISTADO DE CIUDADES */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {citySlugs.map((c) => (
            <Link
              key={c.slug}
              href={withLocale(locale, `/destinations/${encodeURIComponent(c.slug)}`)}
              className="group relative overflow-hidden rounded-[2rem] bg-slate-900 aspect-[4/3] flex flex-col justify-end p-8 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Imagen de fondo simulada (Idealmente cargar de Supabase, aquí ponemos un placeholder editorial) */}
              <div className="absolute inset-0 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center opacity-40 transition-transform duration-700 group-hover:scale-110"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
              
              <div className="relative z-10">
                <h3 className="font-heading text-3xl text-white drop-shadow-md group-hover:text-brand-yellow transition-colors">
                  {c.city}
                </h3>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                  Explorar Tours <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* METODOLOGÍA KCE */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-16 shadow-sm">
          <div className="text-center mb-12">
            <Compass className="mx-auto h-12 w-12 text-brand-blue mb-4" />
            <h2 className="font-heading text-3xl md:text-4xl text-[var(--color-text)]">Cómo armar tu ruta ideal</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3 relative">
            <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-px bg-brand-blue/10"></div>
            {[
              ['1', 'Elige una Ciudad', 'Empieza por el lugar que más te atrae, tu punto de llegada o la región que quieres conocer.'],
              ['2', 'Compara Experiencias', 'Al entrar a la ciudad, revisa tours, estilos y ritmos de viaje curados por nuestros expertos.'],
              ['3', 'Pide Ayuda a la IA', 'Si sigues indeciso tras ver la oferta, usa nuestro Planificador Personalizado para ordenar tus ideas.'],
            ].map(([step, title, copy]) => (
              <div key={step} className="relative z-10 flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface)] border-4 border-brand-blue/10 text-brand-blue font-heading text-2xl mb-6 shadow-sm">{step}</div>
                <h3 className="text-xl font-heading text-[var(--color-text)] mb-3">{title}</h3>
                <p className="text-sm font-light text-[var(--color-text)]/70 leading-relaxed px-4">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOURS DESTACADOS GLOBALES */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="font-heading text-3xl text-brand-blue">Tours Destacados</h2>
            <p className="mt-2 text-[var(--color-text)]/70 font-light text-sm max-w-xl">
              Nuestra selección estrella. Si tu itinerario es flexible, adapta tus destinos a estas experiencias imperdibles.
            </p>
          </div>
          <Link href={withLocale(locale, '/tours')} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-blue hover:text-brand-dark transition-colors shrink-0">
            Ver Catálogo Completo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {(topTours.items || []).map((t, idx) => (
            <TourCardPremium key={t.slug} tour={toTourLike(t)} priority={idx < 3} href={withLocale(locale, `/tours/${t.slug}`)} />
          ))}
        </div>
      </section>

      <section className="py-12">
        <FeaturedReviews locale={locale} />
      </section>

    </main>
  );
}
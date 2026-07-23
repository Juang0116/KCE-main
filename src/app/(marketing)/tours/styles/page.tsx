/* src/app/(marketing)/tours/styles/page.tsx */
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import {
  Sparkles,
  Compass,
  ArrowRight,
  Tag,
  Palette,
  Coffee,
  Utensils,
  Mountain,
  History,
  Globe2,
} from 'lucide-react';

import { slugify } from '@/lib/slugify';
import { SITE_URL } from '@/lib/env';
import { getFacets } from '@/features/tours/catalog.server';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';
import { Button } from '@/components/ui/Button';

export const revalidate = 300;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const BASE_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  SITE_URL ||
  'https://kce.travel'
).replace(/\/+$/, '');

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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const canonicalAbs = absoluteUrl(`/${locale}/tours/styles`);

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: 'Estilos de Viaje en Colombia | KCE',
    description:
      'Explora Colombia a través de tus pasiones: cultura, gastronomía, aventura y café. Tours diseñados por estilo.',
    alternates: {
      canonical: canonicalAbs,
      languages: {
        es: '/es/tours/styles',
        en: '/en/tours/styles',
        fr: '/fr/tours/styles',
        de: '/de/tours/styles',
      },
    },
    openGraph: {
      title: 'Estilos de Viaje — KCE Colombia',
      description: 'Encuentra la experiencia perfecta según tu estilo de viaje.',
      url: canonicalAbs,
      type: 'website',
      images: [
        {
          url: absoluteUrl('/images/hero-kce.jpg'),
          width: 1200,
          height: 630,
          alt: 'KCE — Estilos de Viaje',
        },
      ],
    },
  };
}

export default async function StylesPage() {
  const locale = await resolveLocale();
  const { tags } = await getFacets();

  const canonical = absoluteUrl(`/${locale}/tours/styles`);

  const items = (tags || []).slice(0, 50).map((tag, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: absoluteUrl(withLocale(locale, `/tours/tag/${encodeURIComponent(slugify(tag))}`)),
    name: tag,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: 'Estilos de Viaje en Colombia', url: canonical },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Tours',
            item: absoluteUrl(`/${locale}/tours`),
          },
          { '@type': 'ListItem', position: 3, name: 'Estilos', item: canonical },
        ],
      },
      ...(items.length
        ? [{ '@type': 'ItemList', name: 'Categorías Disponibles', itemListElement: items }]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <main className="min-h-screen animate-fade-in bg-base pb-24">
        {/* 01. HERO EDITORIAL (ADN KCE PREMIUM) */}
        <section className="relative overflow-hidden border-b border-brand-dark/10 bg-brand-dark px-6 py-24 text-center md:py-32">
          {/* Destellos de fondo */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-full max-w-4xl -translate-x-1/2 rounded-full bg-brand-blue/10 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-brand-yellow/5 blur-[100px]" />

          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
              <Palette className="h-3.5 w-3.5 text-brand-yellow" /> Curaduría de Intereses
            </div>

            <h1 className="mb-8 font-heading text-5xl leading-[1.05] tracking-tight text-white md:text-7xl lg:text-8xl">
              Elige tu forma <br />
              <span className="font-light italic text-brand-yellow opacity-90">
                de vivir Colombia.
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
              No todos los viajeros buscan lo mismo. Hemos categorizado nuestras experiencias para
              que encuentres exactamente lo que hace vibrar tu curiosidad.
            </p>

            <div className="mt-12 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
              <Button
                asChild
                size="lg"
                className="w-full rounded-full bg-brand-blue px-10 py-6 text-xs font-bold uppercase tracking-widest text-white shadow-pop transition-all hover:-translate-y-1 hover:bg-brand-dark sm:w-auto"
              >
                <Link href={withLocale(locale, '/tours')}>Ver Catálogo Completo</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full rounded-full border-white/30 bg-white/5 px-10 py-6 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white hover:text-brand-dark sm:w-auto"
              >
                <Link href={withLocale(locale, '/plan')}>Diseñar mi Ruta</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* BREADCRUMB SUTIL */}
        <div className="w-full border-b border-brand-dark/5 bg-surface px-6 py-3 dark:border-white/5">
          <div className="mx-auto flex max-w-[var(--container-max)] items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-80">
            <Link
              href={withLocale(locale, '/')}
              className="transition-colors hover:text-brand-blue"
            >
              Inicio
            </Link>
            <ArrowRight className="h-3 w-3 opacity-30" />
            <Link
              href={withLocale(locale, '/tours')}
              className="transition-colors hover:text-brand-blue"
            >
              Tours
            </Link>
            <ArrowRight className="h-3 w-3 opacity-30" />
            <span className="text-main">Estilos</span>
          </div>
        </div>

        {/* 02. GRID DE ESTILOS (Tarjetas Premium) */}
        <section
          aria-label="Explorar por etiquetas"
          className="mx-auto max-w-[var(--container-max)] px-6 py-20 md:py-32"
        >
          <div className="mb-20 text-center">
            <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
              <Sparkles className="h-3.5 w-3.5 text-brand-blue" /> Categorías Sugeridas
            </div>
            <h2 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
              Explora por Pasión
            </h2>
          </div>

          {tags && tags.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3">
              {tags.map((tag) => {
                const s = slugify(tag);
                const href = withLocale(locale, `/tours/tag/${encodeURIComponent(s)}`);

                return (
                  <Link
                    key={tag}
                    href={href}
                    className="group relative flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:border-brand-blue/30 hover:shadow-pop dark:border-white/5"
                  >
                    {/* Marca de agua sutil al fondo */}
                    <div className="pointer-events-none absolute -bottom-8 -right-8 opacity-[0.03] transition-transform duration-1000 group-hover:-rotate-12 group-hover:scale-125">
                      <Tag className="h-48 w-48 text-brand-blue" />
                    </div>

                    <div className="relative z-10 flex h-full flex-col">
                      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-blue/10 bg-brand-blue/5 text-brand-blue shadow-sm transition-all duration-300 group-hover:bg-brand-blue group-hover:text-white">
                        <Compass className="h-7 w-7" />
                      </div>

                      <h3 className="mb-4 font-heading text-2xl tracking-tight text-main transition-colors group-hover:text-brand-blue">
                        {tag}
                      </h3>

                      <p className="mb-10 text-base font-light leading-relaxed text-muted">
                        Descubre experiencias de inmersión total centradas en la esencia de{' '}
                        <span className="font-medium text-main">{tag.toLowerCase()}</span>.
                      </p>

                      <div className="mt-auto flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted transition-all group-hover:text-brand-blue">
                        Explorar Estilo{' '}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* EMPTY STATE PREMIUM */
            <div className="flex flex-col items-center justify-center rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface py-32 text-center shadow-soft">
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-brand-dark/5 bg-surface-2 shadow-sm">
                <Compass className="h-10 w-10 animate-pulse text-muted opacity-30" />
              </div>
              <h2 className="mb-4 font-heading text-3xl tracking-tight text-main">
                Mapeando nuevos estilos...
              </h2>
              <p className="mx-auto max-w-md text-lg font-light text-muted">
                Nuestros curadores están organizando las próximas rutas temáticas para ti.
              </p>
            </div>
          )}
        </section>

        {/* 03. CAPA DE CAPTACIÓN (CONCIERGE GLASSMORPHISM) */}
        <section className="mx-auto mb-24 max-w-[var(--container-max)] px-6 py-12">
          <div className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-12 text-center shadow-soft dark:border-white/5 md:p-24">
            {/* Brillos inmersivos */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue/5 blur-[100px] transition-transform duration-1000 group-hover:scale-150" />

            <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
              <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-full border border-brand-dark/5 bg-surface-2 text-brand-blue shadow-sm transition-transform duration-500 group-hover:scale-110">
                <Globe2 className="h-8 w-8" />
              </div>
              <h2 className="mb-6 font-heading text-4xl tracking-tight text-main md:text-5xl">
                ¿No encuentras tu estilo ideal?
              </h2>
              <p className="mb-12 text-lg font-light leading-relaxed text-muted md:text-xl">
                Podemos mezclar cultura, aventura y gastronomía en una expedición única diseñada
                exclusivamente para ti. Nuestros expertos en el terreno harán que suceda.
              </p>
              <Button
                asChild
                size="lg"
                className="rounded-full bg-brand-blue px-12 py-7 text-xs font-bold uppercase tracking-widest text-white shadow-pop transition-all hover:-translate-y-1 hover:bg-white hover:text-brand-blue"
              >
                <Link
                  href={withLocale(locale, '/contact')}
                  className="flex items-center gap-3"
                >
                  Hablar con un Experto <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

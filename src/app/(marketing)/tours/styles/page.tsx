import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import { Sparkles, Compass, ArrowRight, Tag, Palette, Coffee, Utensils, Mountain, History } from 'lucide-react';

import { slugify } from '@/lib/slugify';
import { SITE_URL } from '@/lib/env';
import { getFacets } from '@/features/tours/catalog.server';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';
import { Button } from '@/components/ui/Button';

export const revalidate = 300;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || SITE_URL || 'https://kce.travel')
  .replace(/\/+$/, '');

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
    description: 'Explora Colombia a través de tus pasiones: cultura, gastronomía, aventura y café. Tours diseñados por estilo.',
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
      images: [{ url: absoluteUrl('/images/hero-kce.jpg'), width: 1200, height: 630, alt: 'KCE — Estilos de Viaje' }],
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
    name: tag 
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: 'Estilos de Viaje en Colombia', url: canonical },
      { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) },
          { '@type': 'ListItem', position: 2, name: 'Tours', item: absoluteUrl(`/${locale}/tours`) },
          { '@type': 'ListItem', position: 3, name: 'Estilos', item: canonical },
        ]
      },
      ...(items.length ? [{ '@type': 'ItemList', name: 'Categorías Disponibles', itemListElement: items }] : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <main className="min-h-screen bg-[color:var(--color-bg)] pb-24 animate-fade-in">
        
        {/* 01. HERO EDITORIAL (LIMPIO Y ELEGANTE) */}
        <section className="relative overflow-hidden bg-[color:var(--color-surface)] px-6 py-20 md:py-32 text-center border-b border-[color:var(--color-border)]">
          {/* Destello sutil en el fondo (Tono cálido/amarillo para "Estilos") */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-brand-yellow/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm backdrop-blur-md">
              <Palette className="h-3 w-3 text-brand-terra" /> Curaduría por Intereses
            </div>
            <h1 className="font-heading text-5xl leading-tight md:text-7xl text-[color:var(--color-text)] tracking-tight mb-6">
              Elige tu forma <br/>
              <span className="text-brand-terra font-light italic">de vivir Colombia.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-[color:var(--color-text-muted)] md:text-xl mb-10">
              No todos los viajeros buscan lo mismo. Hemos categorizado nuestras experiencias por estilos para que encuentres exactamente lo que hace vibrar tu curiosidad.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild className="rounded-full px-8 bg-brand-blue text-white hover:bg-brand-blue/90 shadow-pop transition-transform hover:-translate-y-0.5">
                <Link href={withLocale(locale, '/tours')}>Ver Catálogo Completo</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-8 border-[color:var(--color-border)] bg-[color:var(--color-surface)] hover:bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]">
                <Link href={withLocale(locale, '/plan')}>Diseñar mi Ruta</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 02. GRID DE ESTILOS (Tarjetas Premium en lugar de cajas rígidas) */}
        <section aria-label="Explorar por etiquetas" className="mx-auto max-w-[var(--container-max)] px-6 py-20">
          <div className="text-center mb-16 border-b border-[color:var(--color-border)] pb-8">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[color:var(--color-text-muted)] mb-3">
              <Sparkles className="h-3 w-3 text-brand-yellow" /> Categorías Sugeridas
            </div>
            <h2 className="font-heading text-3xl font-semibold text-[color:var(--color-text)]">Explora por Pasión</h2>
          </div>

          {tags && tags.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {tags.map((tag) => {
                const s = slugify(tag);
                const href = withLocale(locale, `/tours/tag/${encodeURIComponent(s)}`);
                
                return (
                  <Link
                    key={tag}
                    href={href}
                    className="group relative flex flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 transition-all hover:shadow-pop hover:-translate-y-1 hover:border-brand-blue/30"
                  >
                    {/* Elemento decorativo sutil en el fondo de la tarjeta */}
                    <div className="absolute -right-6 -bottom-6 opacity-[0.02] transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12 pointer-events-none">
                       <Tag className="h-32 w-32 text-brand-blue" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col h-full">
                      {/* Icono de la categoría (Sin fondos pesados, solo sutiles) */}
                      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] text-brand-blue transition-colors group-hover:border-brand-blue/30 group-hover:bg-brand-blue/5 shadow-soft">
                        <Compass className="h-6 w-6" />
                      </div>
                      
                      <h3 className="font-heading text-2xl text-[color:var(--color-text)] mb-3 tracking-tight group-hover:text-brand-blue transition-colors">{tag}</h3>
                      
                      <p className="text-sm font-light leading-relaxed text-[color:var(--color-text-muted)] mb-8">
                        Descubre experiencias de inmersión total centradas en la esencia de {tag.toLowerCase()}.
                      </p>
                      
                      <div className="mt-auto flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] opacity-70 group-hover:text-brand-blue group-hover:opacity-100 transition-all">
                        Explorar Estilo <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* EMPTY STATE PREMIUM */
            <div className="py-24 text-center rounded-[var(--radius-2xl)] bg-[color:var(--color-surface)] border border-[color:var(--color-border)] shadow-soft flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-[color:var(--color-surface-2)] flex items-center justify-center mb-6">
                <Compass className="h-8 w-8 text-[color:var(--color-text-muted)] opacity-50 animate-pulse" />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-[color:var(--color-text)] mb-3">Organizando estilos</h2>
              <p className="max-w-md mx-auto text-sm font-light text-[color:var(--color-text-muted)]">
                Estamos preparando las categorías de viaje para ti...
              </p>
            </div>
          )}
        </section>

        {/* 03. SOPORTE DE CAPTACIÓN (Sutil, como en las demás páginas) */}
        <section className="mx-auto max-w-[var(--container-max)] px-6 mb-12">
          <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60 backdrop-blur-2xl p-10 md:p-16 text-center shadow-soft flex flex-col items-center justify-center">
            {/* Brillo sutil de fondo */}
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-brand-blue/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 max-w-2xl">
              <h3 className="font-heading text-3xl text-[color:var(--color-text)] tracking-tight mb-4">¿No encuentras tu estilo ideal?</h3>
              <p className="text-base font-light text-[color:var(--color-text-muted)] mb-8 leading-relaxed">
                Podemos mezclar cultura, aventura y gastronomía en un plan único diseñado solo para tu grupo o familia. Habla con un asesor de KCE para hacerlo realidad.
              </p>
              <Button asChild variant="outline" className="rounded-full px-10 border-[color:var(--color-border)] text-[color:var(--color-text)] bg-[color:var(--color-surface)] hover:bg-[color:var(--color-surface-2)] hover:border-brand-blue hover:text-brand-blue transition-colors shadow-sm">
                <Link href={withLocale(locale, '/contact')}>Consultar con un Experto</Link>
              </Button>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
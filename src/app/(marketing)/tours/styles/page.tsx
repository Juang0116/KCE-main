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

      <main className="min-h-screen bg-[var(--color-bg)] pb-24 pt-12 md:pt-20">
        <div className="mx-auto max-w-7xl px-6">
          
          {/* HERO SECTION (ESTILO MAGAZINE) */}
          <header className="relative mb-16 overflow-hidden rounded-[3.5rem] border border-[var(--color-border)] bg-brand-dark p-10 md:p-20 text-white shadow-2xl">
            <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.png')] bg-repeat"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-dark/90 to-brand-blue/30"></div>
            
            <div className="relative z-10 max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md">
                <Palette className="h-3 w-3" /> Curaduría por Intereses
              </div>
              <h1 className="font-heading text-4xl leading-tight md:text-6xl lg:text-7xl mb-8">
                Elige tu forma <br/>
                <span className="text-brand-yellow font-light italic">de vivir Colombia.</span>
              </h1>
              <p className="max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl mb-10">
                No todos los viajeros buscan lo mismo. Hemos categorizado nuestras experiencias por estilos para que encuentres exactamente lo que hace vibrar tu curiosidad.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="rounded-full bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90 px-10">
                  <Link href={withLocale(locale, '/tours')}>Ver Catálogo Completo</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-white/20 text-white hover:bg-white/5">
                  <Link href={withLocale(locale, '/plan')}>Diseñar mi Ruta</Link>
                </Button>
              </div>
            </div>
          </header>

          {/* GRID DE ESTILOS (VIP TAGS) */}
          <section aria-label="Explorar por etiquetas" className="mb-20">
            <div className="flex items-center justify-between mb-10 border-b border-[var(--color-border)] pb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-brand-yellow" />
                <h2 className="font-heading text-2xl md:text-3xl text-brand-blue">Categorías Sugeridas</h2>
              </div>
            </div>

            {tags && tags.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {tags.map((tag) => {
                  const s = slugify(tag);
                  const href = withLocale(locale, `/tours/tag/${encodeURIComponent(s)}`);
                  
                  return (
                    <Link
                      key={tag}
                      href={href}
                      className="group relative overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 hover:border-brand-blue/20"
                    >
                      <div className="absolute -right-4 -top-4 opacity-[0.03] transition-transform group-hover:scale-110 group-hover:rotate-12">
                         <Tag className="h-24 w-24 text-brand-blue" />
                      </div>
                      
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
                          {/* Icono dinámico simple o fallback */}
                          <Compass className="h-6 w-6" />
                        </div>
                        
                        <h3 className="font-heading text-2xl text-brand-blue mb-3">{tag}</h3>
                        <p className="text-sm font-light leading-relaxed text-[var(--color-text)]/60 mb-8">
                          Descubre experiencias de inmersión total centradas en la esencia de {tag.toLowerCase()}.
                        </p>
                        
                        <div className="mt-auto flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-blue opacity-60 group-hover:opacity-100 transition-opacity">
                          Explorar Estilo <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[2.5rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] p-16 text-center">
                <Compass className="mx-auto h-12 w-12 text-brand-blue/20 mb-4 animate-pulse" />
                <p className="text-lg font-light text-[var(--color-text)]/60">Organizando estilos de viaje para ti...</p>
              </div>
            )}
          </section>

          {/* SOPORTE DE CAPTACIÓN */}
          <div className="rounded-[3rem] border border-brand-blue/10 bg-brand-blue/5 p-10 text-center shadow-inner relative overflow-hidden group">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h3 className="font-heading text-2xl text-brand-blue mb-4">¿No encuentras tu estilo ideal?</h3>
              <p className="text-base font-light text-[var(--color-text)]/70 mb-8">
                Podemos mezclar cultura, aventura y gastronomía en un plan único diseñado solo para tu grupo o familia.
              </p>
              <Button asChild variant="outline" className="rounded-full px-10 border-brand-blue/20 text-brand-blue hover:bg-brand-blue/5">
                <Link href={withLocale(locale, '/contact')}>Consultar con un Experto</Link>
              </Button>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
/* src/app/(marketing)/tours/styles/page.tsx */
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import { Sparkles, Compass, ArrowRight, Tag, Palette, Coffee, Utensils, Mountain, History, Globe2 } from 'lucide-react';

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

      <main className="min-h-screen bg-base pb-24 animate-fade-in">
        
        {/* 01. HERO EDITORIAL (ADN KCE PREMIUM) */}
        <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center border-b border-brand-dark/10">
          {/* Destellos de fondo */}
          <div className="absolute top-0 left-1/2 w-full max-w-4xl h-80 bg-brand-blue/10 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-yellow/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
              <Palette className="h-3.5 w-3.5 text-brand-yellow" /> Curaduría de Intereses
            </div>
            
            <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white tracking-tight leading-[1.05] mb-8">
              Elige tu forma <br/>
              <span className="text-brand-yellow font-light italic opacity-90">de vivir Colombia.</span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg md:text-xl font-light leading-relaxed text-white/70">
              No todos los viajeros buscan lo mismo. Hemos categorizado nuestras experiencias para que encuentres exactamente lo que hace vibrar tu curiosidad.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
               <Button asChild size="lg" className="rounded-full bg-brand-blue text-white hover:bg-brand-dark px-10 py-6 text-xs font-bold uppercase tracking-widest shadow-pop transition-all hover:-translate-y-1 w-full sm:w-auto">
                 <Link href={withLocale(locale, '/tours')}>Ver Catálogo Completo</Link>
               </Button>
               <Button asChild variant="outline" size="lg" className="rounded-full border-white/30 text-white bg-white/5 hover:bg-white hover:text-brand-dark backdrop-blur-md px-10 py-6 text-xs font-bold uppercase tracking-widest transition-all w-full sm:w-auto">
                 <Link href={withLocale(locale, '/plan')}>Diseñar mi Ruta</Link>
               </Button>
            </div>
          </div>
        </section>

        {/* BREADCRUMB SUTIL */}
        <div className="w-full bg-surface border-b border-brand-dark/5 dark:border-white/5 py-3 px-6">
          <div className="mx-auto max-w-[var(--container-max)] flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-80">
            <Link href={withLocale(locale, '/')} className="hover:text-brand-blue transition-colors">Inicio</Link>
            <ArrowRight className="h-3 w-3 opacity-30" />
            <Link href={withLocale(locale, '/tours')} className="hover:text-brand-blue transition-colors">Tours</Link>
            <ArrowRight className="h-3 w-3 opacity-30" />
            <span className="text-main">Estilos</span>
          </div>
        </div>

        {/* 02. GRID DE ESTILOS (Tarjetas Premium) */}
        <section aria-label="Explorar por etiquetas" className="mx-auto max-w-[var(--container-max)] px-6 py-20 md:py-32">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted mb-4">
              <Sparkles className="h-3.5 w-3.5 text-brand-blue" /> Categorías Sugeridas
            </div>
            <h2 className="font-heading text-4xl md:text-5xl text-main tracking-tight">Explora por Pasión</h2>
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
                    className="group relative flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 shadow-soft transition-all duration-500 hover:shadow-pop hover:-translate-y-2 hover:border-brand-blue/30"
                  >
                    {/* Marca de agua sutil al fondo */}
                    <div className="absolute -right-8 -bottom-8 opacity-[0.03] transition-transform duration-1000 group-hover:scale-125 group-hover:-rotate-12 pointer-events-none">
                       <Tag className="h-48 w-48 text-brand-blue" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/5 border border-brand-blue/10 text-brand-blue transition-all duration-300 group-hover:bg-brand-blue group-hover:text-white shadow-sm">
                        <Compass className="h-7 w-7" />
                      </div>
                      
                      <h3 className="font-heading text-2xl text-main tracking-tight mb-4 group-hover:text-brand-blue transition-colors">
                        {tag}
                      </h3>
                      
                      <p className="text-base font-light leading-relaxed text-muted mb-10">
                        Descubre experiencias de inmersión total centradas en la esencia de <span className="text-main font-medium">{tag.toLowerCase()}</span>.
                      </p>
                      
                      <div className="mt-auto flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted group-hover:text-brand-blue transition-all">
                        Explorar Estilo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* EMPTY STATE PREMIUM */
            <div className="py-32 text-center rounded-[var(--radius-3xl)] bg-surface border border-brand-dark/5 shadow-soft flex flex-col items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-surface-2 border border-brand-dark/5 flex items-center justify-center mb-8 shadow-sm">
                <Compass className="h-10 w-10 text-muted opacity-30 animate-pulse" />
              </div>
              <h2 className="font-heading text-3xl text-main tracking-tight mb-4">Mapeando nuevos estilos...</h2>
              <p className="max-w-md mx-auto text-lg font-light text-muted">
                Nuestros curadores están organizando las próximas rutas temáticas para ti.
              </p>
            </div>
          )}
        </section>

        {/* 03. CAPA DE CAPTACIÓN (CONCIERGE GLASSMORPHISM) */}
        <section className="mx-auto max-w-[var(--container-max)] px-6 py-12 mb-24">
          <div className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-12 md:p-24 text-center shadow-soft group">
            {/* Brillos inmersivos */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none transition-transform duration-1000 group-hover:scale-150" />
            
            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 border border-brand-dark/5 text-brand-blue mb-10 shadow-sm transition-transform duration-500 group-hover:scale-110">
                <Globe2 className="h-8 w-8" />
              </div>
              <h2 className="font-heading text-4xl md:text-5xl text-main tracking-tight mb-6">¿No encuentras tu estilo ideal?</h2>
              <p className="text-lg md:text-xl font-light text-muted leading-relaxed mb-12">
                Podemos mezclar cultura, aventura y gastronomía en una expedición única diseñada exclusivamente para ti. Nuestros expertos en el terreno harán que suceda.
              </p>
              <Button asChild size="lg" className="rounded-full bg-brand-blue text-white hover:bg-white hover:text-brand-blue px-12 py-7 shadow-pop transition-all hover:-translate-y-1 text-xs font-bold uppercase tracking-widest">
                <Link href={withLocale(locale, '/contact')} className="flex items-center gap-3">Hablar con un Experto <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
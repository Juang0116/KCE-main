/* src/app/(marketing)/vlog/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

import { listPublishedVideos } from '@/features/content/content.server';
import { youTubeThumbnailUrl } from '@/lib/youtube';
import { PlayCircle, ArrowRight, Video, Sparkles, Globe2, Clapperboard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { absoluteUrl, safeJsonLd } from '@/lib/seoJson';

export const revalidate = 600;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers(); const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;
  const c = await cookies(); const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;
  return 'es';
}

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const title = 'KCE Cinema | Relatos Visuales de Colombia';
  const description = 'Documentales cortos y expediciones visuales diseñadas para inspirar tu próxima inmersión cultural.';
  const canonical = absoluteUrl(withLocale(locale, '/vlog'));

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title,
    description,
    openGraph: { title, description, url: canonical, type: 'website' },
    twitter: { card: 'summary_large_image', title },
  };
}

export default async function VlogPage() {
  const locale = await resolveLocale();
  const { items } = await listPublishedVideos({ limit: 30 });
  const canonical = absoluteUrl(withLocale(locale, '/vlog'));

  const jsonLd = {
    '@context': 'https://schema.org', 
    '@graph': [
      { '@type': 'CollectionPage', name: 'KCE Cinema', url: canonical },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) },
        { '@type': 'ListItem', position: 2, name: 'Cinema', item: canonical }
      ]}
    ],
  };

  return (
    <main className="min-h-screen bg-base pb-32 animate-fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* 01. HERO CINEMATOGRÁFICO (ADN KCE PREMIUM) */}
      <header className="relative overflow-hidden bg-brand-dark px-6 py-32 md:py-48 text-center border-b border-white/5">
        {/* Capas de textura y profundidad */}
        <div className="absolute inset-0 opacity-30 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay scale-105 animate-slow-zoom" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-blue/40 via-brand-dark to-base" />
        
        {/* Glow central */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-80 bg-brand-blue/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.4em] text-white shadow-2xl backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-brand-yellow" /> Estrenos KCE Cinema
          </div>
          
          <h1 className="font-heading text-6xl leading-[1] md:text-8xl lg:text-9xl text-white tracking-tighter mb-8">
            Historias que <br/>
            <span className="text-brand-yellow italic font-light opacity-90">cobran vida.</span>
          </h1>
          
          <p className="mx-auto mt-10 max-w-2xl text-xl font-light leading-relaxed text-white/60 md:text-2xl">
            Documentales cortos sobre la Colombia profunda, narrados desde la autenticidad y el respeto por el territorio.
          </p>
        </div>
      </header>

      {/* 02. REJILLA DE CONTENIDO (Gallery View) */}
      <section className="mx-auto max-w-7xl px-6 -mt-20 relative z-20">
        {items.length === 0 ? (
          /* EMPTY STATE EDITORIAL */
          <div className="rounded-[var(--radius-3xl)] border border-brand-dark/10 dark:border-white/10 bg-surface py-32 text-center shadow-pop">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-surface-2 text-muted mb-8 border border-brand-dark/5">
              <Video className="h-10 w-10 opacity-30" />
            </div>
            <h2 className="font-heading text-4xl text-main mb-4 tracking-tight">Próximamente en cartelera</h2>
            <p className="text-lg font-light text-muted max-w-md mx-auto leading-relaxed">
              Nuestro equipo editorial está preparando nuevas piezas visuales. Suscríbete para ser el primero en recibirlas.
            </p>
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-2 lg:gap-12">
            {items.map((v) => {
              const thumb = v.cover_url || youTubeThumbnailUrl(v.youtube_url, 'hq') || null;
              return (
                <Link
                  key={v.id}
                  href={withLocale(locale, `/vlog/${v.slug}`)}
                  className="group relative overflow-hidden rounded-[var(--radius-3xl)] bg-brand-dark aspect-[16/10] flex flex-col justify-end shadow-soft transition-all duration-700 hover:-translate-y-3 hover:shadow-pop"
                >
                  {/* Imagen de fondo inmersiva */}
                  {thumb && (
                    <div className="absolute inset-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={thumb} 
                        alt={v.title} 
                        loading="lazy" 
                        className="h-full w-full object-cover transition-all duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-40" 
                      />
                    </div>
                  )}
                  
                  {/* Gradiente de legibilidad cinematográfico */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/30 to-transparent" />

                  {/* Icono de Play "Luxe" */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 pointer-events-none">
                    <div className="h-24 w-24 rounded-full bg-brand-yellow flex items-center justify-center shadow-pop">
                      <PlayCircle className="h-10 w-10 text-brand-dark fill-brand-dark/10" />
                    </div>
                  </div>

                  {/* Información del Video */}
                  <div className="relative z-10 p-10 md:p-14">
                    <div className="mb-6 flex items-center gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-yellow">
                        <Globe2 className="h-3 w-3" /> {v.lang || 'ES'}
                      </div>
                      <div className="h-px w-8 bg-white/20" />
                      <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">
                        Expedición Visual
                      </div>
                    </div>
                    
                    <h2 className="font-heading text-3xl md:text-4xl text-white leading-tight mb-8 group-hover:text-brand-yellow transition-colors duration-300 tracking-tight">
                      {v.title}
                    </h2>
                    
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                      Ver Documental <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 03. SECCIÓN DE INVITACIÓN (Premium Glassmorphism) */}
      <section className="mt-32 px-6">
        <div className="mx-auto max-w-4xl text-center space-y-10 relative py-20 rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface-2/30 shadow-inner overflow-hidden group">
          {/* Brillos sutiles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10 space-y-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-surface border border-brand-dark/5 text-brand-blue shadow-sm mb-4">
              <Clapperboard className="h-8 w-8" />
            </div>
            <h2 className="font-heading text-4xl md:text-5xl text-main tracking-tight">¿Tienes una historia <br/>que merece ser contada?</h2>
            <p className="text-lg md:text-xl font-light text-muted max-w-2xl mx-auto leading-relaxed">
              Colaboramos con documentalistas y viajeros conscientes para mostrar la cara más auténtica y humana de nuestro territorio.
            </p>
            <Button asChild size="lg" className="rounded-full px-12 py-8 bg-brand-blue text-white hover:bg-brand-dark shadow-pop transition-all text-xs font-bold uppercase tracking-widest border-transparent">
              <Link href="/contact" className="flex items-center gap-3">
                Proponer Colaboración <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER CINEMA */}
      <footer className="mt-24 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted opacity-40">
          KCE Cinema © 2026 — Narrativas de Identidad
        </p>
      </footer>
    </main>
  );
}
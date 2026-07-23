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

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(
  /\/+$/,
  '',
);

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
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const title = 'KCE Cinema | Relatos Visuales de Colombia';
  const description =
    'Documentales cortos y expediciones visuales diseñadas para inspirar tu próxima inmersión cultural.';
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
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) },
          { '@type': 'ListItem', position: 2, name: 'Cinema', item: canonical },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen animate-fade-in bg-base pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      {/* 01. HERO CINEMATOGRÁFICO (ADN KCE PREMIUM) */}
      <header className="relative overflow-hidden border-b border-white/5 bg-brand-dark px-6 py-32 text-center md:py-48">
        {/* Capas de textura y profundidad */}
        <div className="animate-slow-zoom absolute inset-0 scale-105 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-blue/40 via-brand-dark to-base" />

        {/* Glow central */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue/10 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.4em] text-white shadow-2xl backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-brand-yellow" /> Estrenos KCE Cinema
          </div>

          <h1 className="mb-8 font-heading text-6xl leading-[1] tracking-tighter text-white md:text-8xl lg:text-9xl">
            Historias que <br />
            <span className="font-light italic text-brand-yellow opacity-90">cobran vida.</span>
          </h1>

          <p className="mx-auto mt-10 max-w-2xl text-xl font-light leading-relaxed text-white/60 md:text-2xl">
            Documentales cortos sobre la Colombia profunda, narrados desde la autenticidad y el
            respeto por el territorio.
          </p>
        </div>
      </header>

      {/* 02. REJILLA DE CONTENIDO (Gallery View) */}
      <section className="relative z-20 mx-auto -mt-20 max-w-7xl px-6">
        {items.length === 0 ? (
          /* EMPTY STATE EDITORIAL */
          <div className="rounded-[var(--radius-3xl)] border border-brand-dark/10 bg-surface py-32 text-center shadow-pop dark:border-white/10">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-brand-dark/5 bg-surface-2 text-muted">
              <Video className="h-10 w-10 opacity-30" />
            </div>
            <h2 className="mb-4 font-heading text-4xl tracking-tight text-main">
              Próximamente en cartelera
            </h2>
            <p className="mx-auto max-w-md text-lg font-light leading-relaxed text-muted">
              Nuestro equipo editorial está preparando nuevas piezas visuales. Suscríbete para ser
              el primero en recibirlas.
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
                  className="group relative flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-[var(--radius-3xl)] bg-brand-dark shadow-soft transition-all duration-700 hover:-translate-y-3 hover:shadow-pop"
                >
                  {/* Imagen de fondo inmersiva */}
                  {thumb && (
                    <div className="absolute inset-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumb}
                        alt={v.title}
                        loading="lazy"
                        className="h-full w-full object-cover opacity-60 transition-all duration-1000 group-hover:scale-110 group-hover:opacity-40"
                      />
                    </div>
                  )}

                  {/* Gradiente de legibilidad cinematográfico */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/30 to-transparent" />

                  {/* Icono de Play "Luxe" */}
                  <div className="pointer-events-none absolute inset-0 flex scale-90 items-center justify-center opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-yellow shadow-pop">
                      <PlayCircle className="h-10 w-10 fill-brand-dark/10 text-brand-dark" />
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

                    <h2 className="mb-8 font-heading text-3xl leading-tight tracking-tight text-white transition-colors duration-300 group-hover:text-brand-yellow md:text-4xl">
                      {v.title}
                    </h2>

                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/40 transition-colors group-hover:text-white">
                      Ver Documental{' '}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
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
        <div className="bg-surface-2/30 group relative mx-auto max-w-4xl space-y-10 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 py-20 text-center shadow-inner dark:border-white/5">
          {/* Brillos sutiles */}
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-brand-blue/5 blur-[80px]" />

          <div className="relative z-10 space-y-8">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-dark/5 bg-surface text-brand-blue shadow-sm">
              <Clapperboard className="h-8 w-8" />
            </div>
            <h2 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
              ¿Tienes una historia <br />
              que merece ser contada?
            </h2>
            <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-muted md:text-xl">
              Colaboramos con documentalistas y viajeros conscientes para mostrar la cara más
              auténtica y humana de nuestro territorio.
            </p>
            <Button
              asChild
              size="lg"
              className="rounded-full border-transparent bg-brand-blue px-12 py-8 text-xs font-bold uppercase tracking-widest text-white shadow-pop transition-all hover:bg-brand-dark"
            >
              <Link
                href="/contact"
                className="flex items-center gap-3"
              >
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

import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

import { listPublishedVideos } from '@/features/content/content.server';
import { youTubeThumbnailUrl } from '@/lib/youtube';
import { PlayCircle, ArrowRight, Video } from 'lucide-react';

export const revalidate = 600;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers(); const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;
  const c = await cookies(); const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;
  return 'es';
}

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

function absoluteUrl(pathOrUrl: string) {
  const s = (pathOrUrl || '').trim();
  if (!s) return BASE_SITE_URL;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return s.startsWith('/') ? `${BASE_SITE_URL}${s}` : `${BASE_SITE_URL}/${s}`;
}

function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const canonical = absoluteUrl(withLocale(locale, '/vlog'));
  const ogImage = absoluteUrl('/opengraph-image');

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: 'KCE Cinema | Vlog',
    description: 'Videos y contenido visual para inspirarte antes de viajar por Colombia.',
    robots: { index: true, follow: true },
    alternates: { canonical, languages: { es: absoluteUrl('/es/vlog'), en: absoluteUrl('/en/vlog'), fr: absoluteUrl('/fr/vlog'), de: absoluteUrl('/de/vlog') } },
    openGraph: { title: 'Vlog — KCE', description: 'Videos y contenido visual para inspirarte antes de viajar.', url: canonical, type: 'website', images: [{ url: ogImage }] },
    twitter: { card: 'summary_large_image', title: 'Vlog — KCE', description: 'Videos para inspirarte.', images: [ogImage] },
  };
}

export default async function VlogPage() {
  const locale = await resolveLocale();
  const { items } = await listPublishedVideos({ limit: 30 });
  const canonical = absoluteUrl(withLocale(locale, '/vlog'));

  const listItems = (items ?? []).slice(0, 30).map((v, i) => {
    const url = absoluteUrl(withLocale(locale, `/vlog/${encodeURIComponent(v.slug)}`));
    const image = v.cover_url || youTubeThumbnailUrl(v.youtube_url, 'hq') || undefined;
    return { '@type': 'ListItem', position: i + 1, url, item: { '@type': 'VideoObject', name: v.title, url, ...(image ? { thumbnailUrl: [image] } : {}), ...(v.description ? { description: v.description } : {}), ...(v.published_at ? { uploadDate: v.published_at } : {}) } };
  });

  const jsonLd = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'CollectionPage', name: 'Vlog', url: canonical, isPartOf: { '@type': 'WebSite', name: 'KCE', url: BASE_SITE_URL } },
      { '@type': 'BreadcrumbList', itemListElement: [ { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) }, { '@type': 'ListItem', position: 2, name: 'Vlog', item: canonical } ] },
      ...(listItems.length ? [{ '@type': 'ItemList', name: 'Vlog', itemListElement: listItems }] : []),
    ],
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* HERO VLOG / CINEMA */}
      <header className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center shadow-xl">
        <div className="absolute inset-0 opacity-30 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-brand-blue/30"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow backdrop-blur-md shadow-sm">
            <Video className="h-3 w-3" /> KCE Cinema
          </div>
          <h1 className="font-heading text-4xl leading-tight md:text-6xl lg:text-7xl text-white drop-shadow-md">
            Tu viaje <span className="text-brand-yellow font-light italic">en movimiento.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl">
            Sube el volumen y prepárate para recorrer Colombia a través de nuestra lente.
          </p>
        </div>
      </header>

      {/* GALERÍA DE VIDEOS */}
      <section className="mx-auto max-w-6xl px-6 -mt-10 relative z-20">
        {items.length === 0 ? (
          <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] py-24 text-center shadow-xl">
            <div className="inline-flex rounded-full bg-brand-blue/10 p-4 text-brand-blue mb-4">
              <PlayCircle className="h-8 w-8" />
            </div>
            <h2 className="font-heading text-3xl text-brand-blue mb-2">Preparando la cámara...</h2>
            <p className="text-sm font-light text-[var(--color-text)]/60 max-w-md mx-auto leading-relaxed">
              Próximamente estrenaremos documentales y guías visuales sobre nuestros destinos.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {items.map((v) => {
              const thumb = v.cover_url || youTubeThumbnailUrl(v.youtube_url, 'hq') || null;
              return (
                <Link
                  key={v.id}
                  href={withLocale(locale, `/vlog/${v.slug}`)}
                  className="group relative overflow-hidden rounded-[2.5rem] border border-transparent bg-brand-dark aspect-[16/10] flex flex-col justify-end shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-brand-yellow/50"
                >
                  {/* Thumbnail de Fondo */}
                  {thumb && (
                    <div className="absolute inset-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb} alt={v.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-90" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/60 to-transparent"></div>

                  {/* Play Button Centro Flotante */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                      <PlayCircle className="h-8 w-8 text-white fill-brand-blue" />
                    </div>
                  </div>

                  {/* Info Video */}
                  <div className="relative z-10 p-8 transform transition-transform duration-500 group-hover:translate-y-0 translate-y-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="rounded-full border border-brand-yellow/50 bg-brand-yellow/20 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-brand-yellow backdrop-blur-md shadow-sm">
                        Reproducir Video
                      </span>
                      {v.lang && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-md">
                          {v.lang}
                        </span>
                      )}
                    </div>
                    <h2 className="font-heading text-3xl text-white drop-shadow-md leading-tight mb-2 line-clamp-2">
                      {v.title}
                    </h2>
                    {v.description && (
                      <p className="text-sm font-light text-white/80 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                        {v.description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
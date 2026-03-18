import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft, PlayCircle, ExternalLink, Calendar, Globe2 } from 'lucide-react';

import YouTubeEmbed from '@/components/YouTubeEmbed';
import { getPublishedVideoBySlug } from '@/features/content/content.server';
import { youTubeThumbnailUrl } from '@/lib/youtube';
import OpenChatButton from '@/features/ai/OpenChatButton';

export const revalidate = 600;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

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

function absoluteUrl(pathOrUrl: string) {
  const s = (pathOrUrl || '').trim();
  if (!s) return BASE_SITE_URL;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return s.startsWith('/') ? `${BASE_SITE_URL}${s}` : `${BASE_SITE_URL}/${s}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const locale = await resolveLocale();
  const { slug } = await params;

  const { item } = await getPublishedVideoBySlug(slug);
  if (!item) {
    return {
      title: 'Vlog — KCE',
      robots: { index: false, follow: false },
      metadataBase: new URL(BASE_SITE_URL),
    };
  }

  const canonicalPath = withLocale(locale, `/vlog/${encodeURIComponent(slug)}`);
  const canonical = absoluteUrl(canonicalPath);

  const ogImage = item.cover_url || youTubeThumbnailUrl(item.youtube_url, 'hq') || absoluteUrl('/opengraph-image');

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: `${item.title} — KCE Cinema`,
    description: item.description ?? undefined,
    alternates: { canonical },
    openGraph: { title: `${item.title} — KCE`, description: item.description ?? undefined, url: canonical, type: 'video.other', images: [{ url: absoluteUrl(ogImage) }] },
    twitter: { card: 'summary_large_image', title: `${item.title} — KCE`, description: item.description ?? undefined, images: [absoluteUrl(ogImage)] },
  };
}

export default async function VlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await resolveLocale();
  const { slug } = await params;

  const { item } = await getPublishedVideoBySlug(slug);
  if (!item) notFound();

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-32 pt-24 md:pt-32">
      
      {/* Navegación Superior */}
      <div className="mx-auto max-w-5xl px-6 mb-10 flex flex-wrap items-center justify-between gap-4">
        <Link href={withLocale(locale, '/vlog')} className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/60 hover:text-brand-blue hover:border-brand-blue/30 hover:shadow-sm transition-all">
          <ArrowLeft className="h-3 w-3" /> Volver a KCE Cinema
        </Link>
        <a href={item.youtube_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/50 hover:text-brand-blue transition-colors">
          Ver en YouTube <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Contenedor Principal del Video */}
      <article className="mx-auto w-full max-w-5xl px-6">
        <div className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-6 md:p-12 overflow-hidden relative">
          
          {/* Fondo sutil */}
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-brand-blue/5 to-transparent pointer-events-none"></div>

          <div className="relative z-10">
            {/* Cabecera del Video */}
            <header className="mb-10 text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md shadow-sm">
                <PlayCircle className="h-3 w-3" /> Ahora Viendo
              </div>
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-[var(--color-text)] leading-tight mb-6">
                {item.title}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/50">
                {item.lang && (
                  <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3 w-3" /> Idioma: {item.lang.toUpperCase()}</span>
                )}
                {item.lang && item.published_at && <span className="h-1 w-1 rounded-full bg-[var(--color-border)]"></span>}
                {item.published_at && (
                  <span className="inline-flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(item.published_at).toLocaleDateString('es-CO')}</span>
                )}
              </div>
            </header>

            {/* Reproductor Embebido */}
            <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] shadow-xl bg-black aspect-video mb-12">
              <YouTubeEmbed urlOrId={item.youtube_url} title={item.title} className="h-full w-full" />
            </div>

            {/* Descripción */}
            {item.description && (
              <div className="max-w-3xl mx-auto text-center mb-12">
                <p className="text-base md:text-lg font-light leading-relaxed text-[var(--color-text)]/70">
                  {item.description}
                </p>
              </div>
            )}

            {/* Call to Action Post-Video */}
            <div className="rounded-[2.5rem] border border-brand-blue/10 bg-brand-blue/5 p-8 md:p-10 text-center shadow-sm">
              <h3 className="font-heading text-2xl text-brand-blue mb-4">¿Inspirado por el video?</h3>
              <p className="text-sm font-light text-[var(--color-text)]/70 max-w-lg mx-auto mb-8">
                Podemos armar una experiencia idéntica o personalizada basada en lo que acabas de ver.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <OpenChatButton variant="primary" addQueryParam className="rounded-full px-8 h-12 shadow-md">
                  Hablar con KCE
                </OpenChatButton>
                <Link href={withLocale(locale, '/tours')} className="inline-flex items-center justify-center h-12 px-8 rounded-full border border-brand-blue/20 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue hover:bg-brand-blue/10 transition-colors">
                  Ver Catálogo
                </Link>
              </div>
            </div>

          </div>
        </div>
      </article>
    </main>
  );
}
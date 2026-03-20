import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft, PlayCircle, ExternalLink, Calendar, Globe2, Sparkles } from 'lucide-react';

import YouTubeEmbed from '@/components/YouTubeEmbed';
import { getPublishedVideoBySlug } from '@/features/content/content.server';
import { youTubeThumbnailUrl } from '@/lib/youtube';
import OpenChatButton from '@/features/ai/OpenChatButton';
import { Button } from '@/components/ui/Button';

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

  const ogImage = item.cover_url || youTubeThumbnailUrl(item.youtube_url, 'hq') || absoluteUrl('/opengraph-image');

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: `${item.title} | KCE Cinema`,
    description: item.description ?? undefined,
    openGraph: { 
      title: `${item.title} | KCE Cinema`, 
      description: item.description ?? undefined, 
      type: 'video.other', 
      images: [{ url: absoluteUrl(ogImage) }] 
    },
    twitter: { 
      card: 'summary_large_image', 
      title: `${item.title} | KCE Cinema`, 
      images: [absoluteUrl(ogImage)] 
    },
  };
}

export default async function VlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await resolveLocale();
  const { slug } = await params;

  const { item } = await getPublishedVideoBySlug(slug);
  if (!item) notFound();

  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] pb-32 pt-24 md:pt-40 animate-fade-in">
      
      {/* NAVEGACIÓN SUPERIOR - MODO CINE */}
      <div className="mx-auto max-w-6xl px-6 mb-12 flex flex-wrap items-center justify-between gap-6 border-b border-[color:var(--color-border)] pb-8">
        <Link 
          href={withLocale(locale, '/vlog')} 
          className="group inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--brand-blue)] transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-border)] group-hover:border-[var(--brand-yellow)] group-hover:bg-[var(--brand-yellow)]/5 transition-all">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Volver a KCE Cinema
        </Link>
        <a 
          href={item.youtube_url} 
          target="_blank" 
          rel="noreferrer" 
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)] hover:text-[var(--brand-yellow)] transition-colors"
        >
          Ver en YouTube <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* CONTENEDOR CINEMATOGRÁFICO */}
      <article className="mx-auto w-full max-w-6xl px-6">
        <div className="relative rounded-[4rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-2xl p-6 md:p-16 overflow-hidden">
          
          {/* ILUMINACIÓN DE FONDO */}
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[var(--brand-blue)]/5 blur-[100px] pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[var(--brand-yellow)]/5 blur-[100px] pointer-events-none"></div>

          <div className="relative z-10">
            {/* CABECERA EDITORIAL */}
            <header className="mb-14 text-center">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--brand-blue)] shadow-sm">
                <PlayCircle className="h-4 w-4 text-[var(--brand-yellow)]" /> Experiencia Visual
              </div>
              <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-[var(--brand-blue)] tracking-tighter leading-[0.9] mb-10">
                {item.title}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
                {item.lang && (
                  <span className="inline-flex items-center gap-2">
                    <Globe2 className="h-3.5 w-3.5 text-[var(--brand-yellow)]" /> {item.lang.toUpperCase()}
                  </span>
                )}
                {item.lang && item.published_at && <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-border)]"></span>}
                {item.published_at && (
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-[var(--brand-yellow)]" /> 
                    {new Date(item.published_at).toLocaleDateString(locale === 'es' ? 'es-CO' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                )}
              </div>
            </header>

            {/* REPRODUCTOR CON MARCO PREMIUM */}
            <div className="relative group overflow-hidden rounded-[3rem] border-8 border-slate-50 shadow-[0_32px_64px_-16px_rgba(0,74,124,0.15)] bg-black aspect-video mb-16 transform transition-transform duration-700 hover:scale-[1.01]">
              <YouTubeEmbed urlOrId={item.youtube_url} title={item.title} className="h-full w-full" />
            </div>

            {/* DESCRIPCIÓN TIPO ARTÍCULO */}
            {item.description && (
              <div className="max-w-3xl mx-auto text-center mb-16">
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[color:var(--color-text-muted)] italic">
                  "{item.description}"
                </p>
              </div>
            )}

            {/* CTA: DE LA PANTALLA A LA REALIDAD */}
            <div className="relative rounded-[3.5rem] border border-[color:var(--color-border)] bg-[var(--brand-blue)] p-10 md:p-16 text-center shadow-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                <Sparkles className="size-40 text-white" />
              </div>
              
              <div className="relative z-10">
                <h3 className="font-heading text-3xl md:text-4xl text-white mb-6">De la pantalla a la realidad.</h3>
                <p className="text-lg font-light text-blue-100/60 max-w-xl mx-auto mb-12">
                  ¿Te inspira lo que acabas de ver? Nuestros expertos pueden diseñar este mismo itinerario adaptado a tus tiempos y preferencias.
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-6">
                  <OpenChatButton variant="primary" addQueryParam className="rounded-full px-12 h-16 bg-[var(--brand-yellow)] hover:bg-white hover:text-[var(--brand-blue)] text-[var(--brand-blue)] shadow-xl border-none text-[11px] font-bold uppercase tracking-widest transition-all">
                    Hablar con un Concierge
                  </OpenChatButton>
                  <Link 
                    href={withLocale(locale, '/tours')} 
                    className="inline-flex items-center justify-center h-16 px-10 rounded-full border border-white/20 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
                  >
                    Explorar Catálogo
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </article>

      {/* FOOTER DE CONFIANZA */}
      <footer className="mt-20 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300">
          KCE Cinema — Relatos de un mundo por descubrir
        </p>
      </footer>
    </main>
  );
}
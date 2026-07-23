/* src/app/(marketing)/vlog/[slug]/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  PlayCircle,
  ExternalLink,
  Calendar,
  Globe2,
  Sparkles,
  Film,
  Share2,
} from 'lucide-react';

import YouTubeEmbed from '@/components/YouTubeEmbed';
import { getPublishedVideoBySlug } from '@/features/content/content.server';
import { youTubeThumbnailUrl } from '@/lib/youtube';
import OpenChatButton from '@/features/ai/OpenChatButton';
import { Button } from '@/components/ui/Button';

export const revalidate = 600;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const BASE_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
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
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

function absoluteUrl(pathOrUrl: string) {
  const s = (pathOrUrl || '').trim();
  if (!s) return BASE_SITE_URL;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return s.startsWith('/') ? `${BASE_SITE_URL}${s}` : `${BASE_SITE_URL}/${s}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const { item } = await getPublishedVideoBySlug(slug);
  if (!item) {
    return {
      title: 'Vlog — KCE',
      robots: { index: false, follow: false },
      metadataBase: new URL(BASE_SITE_URL),
    };
  }

  const ogImage =
    item.cover_url ||
    youTubeThumbnailUrl(item.youtube_url, 'hq') ||
    absoluteUrl('/opengraph-image');

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: `${item.title} | KCE Cinema`,
    description: item.description ?? undefined,
    openGraph: {
      title: `${item.title} | KCE Cinema`,
      description: item.description ?? undefined,
      type: 'video.other',
      images: [{ url: absoluteUrl(ogImage) }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${item.title} | KCE Cinema`,
      images: [absoluteUrl(ogImage)],
    },
  };
}

export default async function VlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await resolveLocale();
  const { slug } = await params;

  const { item } = await getPublishedVideoBySlug(slug);
  if (!item) notFound();

  return (
    <main className="min-h-screen animate-fade-in bg-base pb-32 pt-24 md:pt-40">
      {/* 01. NAVEGACIÓN SUPERIOR (Premium Minimalist) */}
      <div className="mx-auto mb-16 flex max-w-6xl flex-wrap items-center justify-between gap-6 border-b border-brand-dark/5 px-6 pb-8 dark:border-white/5">
        <Link
          href={withLocale(locale, '/vlog')}
          className="group inline-flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue transition-all"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-dark/10 transition-all duration-300 group-hover:border-brand-yellow/50 group-hover:bg-brand-yellow/5 dark:border-white/10">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Volver a KCE Cinema
        </Link>

        <div className="flex items-center gap-6">
          <a
            href={item.youtube_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:text-brand-yellow"
          >
            Ver en YouTube <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* 02. CONTENEDOR CINEMATOGRÁFICO */}
      <article className="mx-auto w-full max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-6 shadow-soft dark:border-white/5 md:p-16 lg:p-24">
          {/* ILUMINACIÓN AMBIENTAL */}
          <div className="pointer-events-none absolute -left-24 -top-24 h-[500px] w-[500px] rounded-full bg-brand-blue/5 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-[500px] w-[500px] rounded-full bg-brand-yellow/5 blur-[120px]" />

          <div className="relative z-10">
            {/* CABECERA EDITORIAL */}
            <header className="mb-16 flex flex-col items-center text-center">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-dark/10 bg-surface-2 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue shadow-sm dark:border-white/10">
                <PlayCircle className="h-4 w-4 text-brand-yellow" /> Experiencia Visual KCE
              </div>

              <h1 className="mb-12 font-heading text-5xl leading-[1.05] tracking-tight text-main md:text-7xl lg:text-8xl">
                {item.title.split(' ').slice(0, -2).join(' ')} <br className="hidden md:block" />
                <span className="font-light italic text-brand-blue opacity-90">
                  {item.title.split(' ').slice(-2).join(' ')}
                </span>
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-8 text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
                {item.lang && (
                  <span className="flex items-center gap-2.5">
                    <Globe2 className="h-4 w-4 text-brand-yellow" /> {item.lang.toUpperCase()}
                  </span>
                )}
                {item.lang && item.published_at && (
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-dark/10 dark:bg-white/10" />
                )}
                {item.published_at && (
                  <span className="flex items-center gap-2.5">
                    <Calendar className="h-4 w-4 text-brand-yellow" />
                    {new Date(item.published_at).toLocaleDateString(
                      locale === 'es' ? 'es-CO' : 'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric' },
                    )}
                  </span>
                )}
              </div>
            </header>

            {/* REPRODUCTOR CON MARCO DE LUJO */}
            <div className="group relative mb-20 aspect-video transform overflow-hidden rounded-[2.5rem] border-[12px] border-brand-dark/5 bg-black shadow-pop transition-all duration-1000 hover:scale-[1.01] dark:border-white/5 md:rounded-[4rem]">
              <YouTubeEmbed
                urlOrId={item.youtube_url}
                title={item.title}
                className="h-full w-full"
              />
              {/* Overlay sutil para indicar interacción */}
              <div className="pointer-events-none absolute inset-0 z-20 rounded-[2.5rem] border border-white/10 md:rounded-[4rem]" />
            </div>

            {/* DESCRIPCIÓN TIPO CRÓNICA */}
            {item.description && (
              <div className="mx-auto mb-20 max-w-4xl text-center">
                <div className="mb-8 flex justify-center opacity-20">
                  <Film className="h-8 w-8 text-brand-blue" />
                </div>
                <p className="text-xl font-light italic leading-relaxed text-muted md:text-3xl">
                  &quot;{item.description}&quot;
                </p>
                <div className="mx-auto mt-12 h-px w-24 bg-brand-yellow/30" />
              </div>
            )}

            {/* CTA: DE LA PANTALLA A LA REALIDAD (Premium Dark Section) */}
            <div className="group relative overflow-hidden rounded-[3rem] bg-brand-dark p-10 text-center shadow-pop md:rounded-[4rem] md:p-20">
              {/* Glows inmersivos del CTA */}
              <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 -translate-y-1/3 translate-x-1/3 rounded-full bg-brand-blue/20 blur-[100px]" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 -translate-x-1/3 translate-y-1/3 rounded-full bg-brand-yellow/10 blur-[100px]" />

              <div className="relative z-10">
                <div className="mb-10 inline-flex h-20 w-20 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 text-brand-yellow shadow-inner transition-transform duration-700 group-hover:rotate-12">
                  <Sparkles className="h-10 w-10" />
                </div>

                <h3 className="mb-8 font-heading text-4xl tracking-tight text-white md:text-6xl">
                  De la pantalla a la realidad.
                </h3>
                <p className="mx-auto mb-14 max-w-2xl text-lg font-light leading-relaxed text-white/60 md:text-xl">
                  ¿Te inspira lo que acabas de ver? Nuestros expertos pueden diseñar este mismo
                  itinerario adaptado a tus tiempos, ritmo y curiosidades personales.
                </p>

                <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                  <OpenChatButton
                    variant="primary"
                    addQueryParam
                    className="w-full rounded-full bg-brand-blue px-12 py-8 text-xs font-bold uppercase tracking-widest text-white shadow-xl transition-all hover:bg-white hover:text-brand-dark sm:w-auto"
                  >
                    Hablar con un Concierge
                  </OpenChatButton>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-full border-white/20 bg-white/5 px-12 py-8 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white hover:text-brand-dark sm:w-auto"
                  >
                    <Link href={withLocale(locale, '/tours')}>Explorar Catálogo</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* FOOTER DE LA EXPERIENCIA */}
      <footer className="mt-24 text-center">
        <div className="mb-6 flex items-center justify-center gap-4">
          <div className="h-px w-8 bg-brand-dark/10" />
          <Share2 className="h-4 w-4 text-brand-blue opacity-40" />
          <div className="h-px w-8 bg-brand-dark/10" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-60">
          KCE Cinema — Relatos de un mundo por descubrir · 2026
        </p>
      </footer>
    </main>
  );
}

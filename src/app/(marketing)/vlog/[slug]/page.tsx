// src/app/(marketing)/vlog/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import YouTubeEmbed from '@/components/YouTubeEmbed';
import { getPublishedVideoBySlug } from '@/features/content/content.server';
import { youTubeThumbnailUrl } from '@/lib/youtube';

export const revalidate = 600;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kce.travel').replace(
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

  // evita duplicar si ya viene con /es /en /fr /de
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;

  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

function absoluteUrl(pathOrUrl: string) {
  const s = (pathOrUrl || '').trim();
  if (!s) return BASE_SITE_URL;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${BASE_SITE_URL}${s}`;
  return `${BASE_SITE_URL}/${s}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
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

  const ogImage =
    item.cover_url ||
    youTubeThumbnailUrl(item.youtube_url, 'hq') ||
    absoluteUrl('/opengraph-image');

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: `${item.title} — KCE`,
    description: item.description ?? undefined,
    alternates: { canonical },
    openGraph: {
      title: `${item.title} — KCE`,
      description: item.description ?? undefined,
      url: canonical,
      type: 'article',
      images: [{ url: absoluteUrl(ogImage) }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${item.title} — KCE`,
      description: item.description ?? undefined,
      images: [absoluteUrl(ogImage)],
    },
  };
}

export default async function VlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await resolveLocale();
  const { slug } = await params;

  const { item } = await getPublishedVideoBySlug(slug);
  if (!item) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href={withLocale(locale, '/vlog')}
          className="text-sm text-[color:var(--color-text)]/80 underline underline-offset-4 hover:text-[color:var(--color-text)]"
        >
          ← Volver al Vlog
        </Link>

        <a
          href={item.youtube_url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-[color:var(--color-text)]/80 underline underline-offset-4 hover:text-[color:var(--color-text)]"
        >
          Ver en YouTube →
        </a>
      </div>

      <header className="mb-6 space-y-2">
        <h1 className="font-heading text-3xl text-brand-blue">{item.title}</h1>

        {item.description ? (
          <p className="text-[color:var(--color-text)]/75">{item.description}</p>
        ) : null}

        <div className="text-xs text-[color:var(--color-text)]/60">
          {item.lang?.toUpperCase?.() ?? ''}
          {item.published_at
            ? ` · ${new Date(item.published_at).toLocaleDateString('es-CO')}`
            : ''}
        </div>
      </header>

      <YouTubeEmbed urlOrId={item.youtube_url} title={item.title} className="mb-8" />

      <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5 text-sm text-[color:var(--color-text)]/75">
        ¿Quieres recomendaciones personalizadas? Usa el chat y te propongo tours reales según tus
        gustos.
      </div>
    </main>
  );
}

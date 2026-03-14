// src/app/(marketing)/vlog/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

import { listPublishedVideos } from '@/features/content/content.server';
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

function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();

  const canonicalPath = withLocale(locale, '/vlog');
  const canonical = absoluteUrl(canonicalPath);

  // Imagen genérica para OG si no hay cover
  const ogImage = absoluteUrl('/opengraph-image');

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: 'Vlog — KCE',
    description: 'Videos y contenido visual para inspirarte antes de viajar por Colombia.',
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: {
        es: absoluteUrl('/es/vlog'),
        en: absoluteUrl('/en/vlog'),
        fr: absoluteUrl('/fr/vlog'),
        de: absoluteUrl('/de/vlog'),
      },
    },
    openGraph: {
      title: 'Vlog — KCE',
      description: 'Videos y contenido visual para inspirarte antes de viajar.',
      url: canonical,
      type: 'website',
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Vlog — KCE',
      description: 'Videos y contenido visual para inspirarte antes de viajar.',
      images: [ogImage],
    },
  };
}

export default async function VlogPage() {
  const locale = await resolveLocale();
  const { items } = await listPublishedVideos({ limit: 30 });

  const canonical = absoluteUrl(withLocale(locale, '/vlog'));

  // JSON-LD: CollectionPage + Breadcrumbs + ItemList
  const listItems = (items ?? []).slice(0, 30).map((v, i) => {
    const url = absoluteUrl(withLocale(locale, `/vlog/${encodeURIComponent(v.slug)}`));
    const image = v.cover_url || youTubeThumbnailUrl(v.youtube_url, 'hq') || undefined;

    return {
      '@type': 'ListItem',
      position: i + 1,
      url,
      item: {
        '@type': 'VideoObject',
        name: v.title,
        url,
        ...(image ? { thumbnailUrl: [image] } : {}),
        ...(v.description ? { description: v.description } : {}),
        ...(v.published_at ? { uploadDate: v.published_at } : {}),
      },
    };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Vlog',
        url: canonical,
        isPartOf: { '@type': 'WebSite', name: 'KCE', url: BASE_SITE_URL },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) },
          { '@type': 'ListItem', position: 2, name: 'Vlog', item: canonical },
        ],
      },
      ...(listItems.length ? [{ '@type': 'ItemList', name: 'Vlog', itemListElement: listItems }] : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-8 space-y-2">
          <h1 className="font-heading text-3xl text-brand-blue">Vlog</h1>
          <p className="text-[color:var(--color-text)]/75">
            Videos y contenido visual para inspirarte antes de viajar.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link className="font-semibold text-brand-blue hover:underline" href={withLocale(locale, '/tours')}>
              Ver tours →
            </Link>
            <span className="text-[color:var(--color-text)]/30">•</span>
            <Link className="font-semibold text-brand-blue hover:underline" href={withLocale(locale, '/contact')}>
              Contacto
            </Link>
          </div>
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-6 text-[color:var(--color-text)]/75">
            Aún no hay videos publicados.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((v) => {
              const thumb = v.cover_url || youTubeThumbnailUrl(v.youtube_url, 'hq') || null;
              return (
                <Link
                  key={v.id}
                  href={withLocale(locale, `/vlog/${v.slug}`)}
                  className="group rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft hover:bg-[color:var(--color-surface-2)]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-xs text-[color:var(--color-text)]/75">
                        Video
                      </span>
                      <div className="text-xs text-[color:var(--color-text)]/60">
                        {v.lang?.toUpperCase?.() ?? ''}
                      </div>
                    </div>

                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={v.title}
                        className="h-44 w-full rounded-xl object-cover"
                        loading="lazy"
                      />
                    ) : null}

                    <div className="space-y-1">
                      <h2 className="font-heading text-lg text-brand-blue group-hover:underline group-hover:underline-offset-4">
                        {v.title}
                      </h2>
                      {v.description ? (
                        <p className="text-sm text-[color:var(--color-text)]/75">{v.description}</p>
                      ) : null}
                      {v.published_at ? (
                        <div className="text-xs text-[color:var(--color-text)]/60">
                          {new Date(v.published_at).toLocaleDateString('es-CO')}
                        </div>
                      ) : null}
                    </div>

                    <div className="inline-flex text-sm font-semibold text-brand-blue underline underline-offset-4">
                      Ver →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

// src/app/(marketing)/tours/styles/page.tsx
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';

import { slugify } from '@/lib/slugify';
import { SITE_URL } from '@/lib/env';
import { getFacets } from '@/features/tours/catalog.server';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';

export const revalidate = 300;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const BASE_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  SITE_URL ||
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

  // evita duplicar si ya viene con /es /en /fr /de
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;

  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();

  const canonicalPath = `/${locale}/tours/styles`;
  const canonicalAbs = absoluteUrl(canonicalPath);

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: 'Estilos — Tours en Colombia',
    description:
      'Explora tours por estilo: cultura, gastronomía, aventura, café y más. Páginas optimizadas para SEO.',
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
      title: 'Estilos — KCE',
      description: 'Explora tours por estilo en Colombia.',
      url: canonicalAbs,
      type: 'website',
      images: [
        {
          url: absoluteUrl('/images/hero-kce.jpg'),
          width: 1200,
          height: 630,
          alt: 'KCE — Estilos',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: [absoluteUrl('/images/hero-kce.jpg')],
    },
  };
}

export default async function StylesPage() {
  const locale = await resolveLocale();
  const { tags } = await getFacets();

  const base = (SITE_URL || getPublicBaseUrl() || BASE_SITE_URL).replace(/\/+$/, '');
  const canonical = absoluteUrl(`/${locale}/tours/styles`);

  const items = (tags || []).slice(0, 50).map((tag, i) => {
    const s = slugify(tag);
    const href = absoluteUrl(withLocale(locale, `/tours/tag/${encodeURIComponent(s)}`));
    return { '@type': 'ListItem', position: i + 1, url: href, name: tag };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Estilos de tours',
        url: canonical,
        isPartOf: { '@type': 'WebSite', name: 'KCE', url: base },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) },
          { '@type': 'ListItem', position: 2, name: 'Tours', item: absoluteUrl(`/${locale}/tours`) },
          { '@type': 'ListItem', position: 3, name: 'Estilos', item: canonical },
        ],
      },
      ...(items.length
        ? [{ '@type': 'ItemList', name: 'Estilos', itemListElement: items }]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <main className="mx-auto max-w-[var(--container-max)] px-4 py-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl text-brand-blue">Estilos</h1>
            <p className="mt-2 text-sm text-[color:var(--color-text)]/75">
              Páginas optimizadas para SEO por estilo (tags). Perfectas para campañas y contenido.
            </p>
          </div>

          <div className="text-sm">
            <Link
              className="font-semibold text-brand-blue hover:underline"
              href={withLocale(locale, '/tours')}
            >
              Ver catálogo completo →
            </Link>
          </div>
        </div>

        <section aria-label="Tags" className="mt-8">
          {tags?.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tags.map((tag) => {
                const s = slugify(tag);
                const href = withLocale(locale, `/tours/tag/${encodeURIComponent(s)}`);
                const canonicalTag = `${base}/${locale}/tours/tag/${encodeURIComponent(s)}`;

                return (
                  <Link
                    key={tag}
                    href={href}
                    className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft hover:bg-[color:var(--color-surface-2)]"
                  >
                    <div className="text-xs text-[color:var(--color-text)]/60">Estilo</div>
                    <div className="mt-1 font-heading text-xl text-brand-blue">{tag}</div>
                    <div className="mt-2 text-sm text-[color:var(--color-text)]/70">
                      Explorar tours con estilo “{tag}”.
                      <span className="block text-xs text-[color:var(--color-text)]/55">
                        URL canónica: {canonicalTag}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 text-sm text-[color:var(--color-text)]/75">
              Aún no hay tags publicados. Agrega tours con campo <b>tags</b> para que aparezcan aquí.
            </div>
          )}
        </section>
      </main>
    </>
  );
}

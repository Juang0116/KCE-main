// src/app/(marketing)/layout.tsx
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import { cookies, headers } from 'next/headers';

import { SITE_URL } from '@/lib/env';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0D5BA1' },
    { media: '(prefers-color-scheme: dark)', color: '#0B3F78' },
  ],
};

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

function getBaseUrl() {
  // SITE_URL ya contempla NEXT_PUBLIC_SITE_URL y fallback a VERCEL_URL en server.
  return (SITE_URL || 'https://kce.travel').trim().replace(/\/+$/, '');
}

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;

  const c = await cookies();
  const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;

  return 'es';
}

function absoluteUrl(base: string, pathOrUrl: string) {
  const s = (pathOrUrl || '').trim();
  if (!s) return base;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${base}${s}`;
  return `${base}/${s}`;
}

/** Serializa JSON-LD evitando cierre prematuro del script por `</script>`. */
function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

/**
 * SEO global para (marketing).
 * - Canonical base absoluto
 * - Robots default
 * - Alternates por idioma (si tienes rutas /es /en /fr /de)
 */
export async function generateMetadata(): Promise<Metadata> {
  const base = getBaseUrl();
  const locale = await resolveLocale();

  return {
    metadataBase: new URL(base),
    title: { default: 'KCE', template: '%s — KCE' },
    alternates: {
      canonical: absoluteUrl(base, `/${locale}`),
      languages: {
        es: absoluteUrl(base, '/es'),
        en: absoluteUrl(base, '/en'),
        fr: absoluteUrl(base, '/fr'),
        de: absoluteUrl(base, '/de'),
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        // si más adelante agregas páginas privadas, lo controlas por page-level metadata
        // y listo. Acá queda “marketing = indexable”.
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const base = getBaseUrl();
  const locale = await resolveLocale();

  const INSTAGRAM = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM?.trim();
  const YOUTUBE = process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE?.trim();
  const FACEBOOK = process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK?.trim();
  const sameAs = [INSTAGRAM, YOUTUBE, FACEBOOK].filter(Boolean) as string[];

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

  // Nota: si tu logo real está en otra ruta, cámbiala aquí.
  const logo = absoluteUrl(base, '/logo.png');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Knowing Cultures Enterprise',
        url: base,
        logo,
        ...(sameAs.length ? { sameAs } : {}),
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            availableLanguage: ['es', 'en', 'fr', 'de'],
            ...(contactEmail ? { email: contactEmail } : {}),
          },
        ],
      },
      {
        '@type': 'WebSite',
        name: 'Knowing Cultures Enterprise',
        url: base,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            // Importante: absoluto + locale, para que el SearchAction no apunte a rutas “sin idioma”.
            urlTemplate: absoluteUrl(base, `/${locale}/tours?q={search_term_string}`),
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <>
      {children}

      {/* JSON-LD en head, antes de interactive, para crawlers */}
      <Script
        id="kce-jsonld-org-website"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
    </>
  );
}

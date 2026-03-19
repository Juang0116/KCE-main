import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import { cookies, headers } from 'next/headers';

import { SITE_URL } from '@/lib/env';

// Configuración visual de la barra de direcciones: Usamos el Azul KCE Institucional
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#004A7C' }, // Azul KCE Premium
    { media: '(prefers-color-scheme: dark)', color: '#002D4D' },  // Azul Noche KCE
  ],
  width: 'device-width',
  initialScale: 1,
};

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const getBaseUrl = () => (SITE_URL || 'https://kce.travel').trim().replace(/\/+$/, '');

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;

  const c = await cookies();
  const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;

  return 'es';
}

const absoluteUrl = (base: string, path: string) => {
  const s = path.trim();
  if (!s) return base;
  if (s.startsWith('http')) return s;
  return `${base}${s.startsWith('/') ? '' : '/'}${s}`;
};

const safeJsonLd = (data: unknown) => 
  JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

/**
 * SEO GLOBAL: La identidad de KCE ante el mundo.
 */
export async function generateMetadata(): Promise<Metadata> {
  const base = getBaseUrl();
  const locale = await resolveLocale();

  return {
    metadataBase: new URL(base),
    title: {
      default: 'KCE Colombia | Knowing Cultures Enterprise',
      template: '%s | KCE Colombia', // Cambiado a "|" para un look más limpio y moderno
    },
    description: 'Plataforma editorial y operadora de experiencias culturales premium en Colombia. Conectamos viajeros con la esencia real de los territorios.',
    alternates: {
      canonical: absoluteUrl(base, `/${locale}`),
      languages: {
        'es-CO': absoluteUrl(base, '/es'),
        'en-US': absoluteUrl(base, '/en'),
        'fr-FR': absoluteUrl(base, '/fr'),
        'de-DE': absoluteUrl(base, '/de'),
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'KCE Colombia',
      locale: locale === 'en' ? 'en_US' : 'es_CO',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@kce_travel', // Asegúrate de que este sea tu handle
    }
  };
}

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const base = getBaseUrl();
  const locale = await resolveLocale();

  const sameAs = [
    process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM,
    process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE,
    process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK,
    process.env.NEXT_PUBLIC_SOCIAL_TIKTOK
  ].filter(Boolean) as string[];

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  const logo = absoluteUrl(base, '/brand/logo-kce.png'); 

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${base}/#organization`,
        name: 'Knowing Cultures Enterprise',
        alternateName: 'KCE',
        url: base,
        logo: {
          '@type': 'ImageObject',
          url: logo,
          width: '512',
          height: '512'
        },
        sameAs,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: contactEmail,
          availableLanguage: ['Spanish', 'English', 'French', 'German'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        name: 'KCE Colombia',
        url: base,
        publisher: { '@id': `${base}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: absoluteUrl(base, `/${locale}/tours?q={search_term_string}`),
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <>
      {/* Contenedor principal sin paddings para que las páginas controlen sus propios márgenes */}
      <div className="flex flex-col min-h-screen">
        {children}
      </div>

      {/* SEO Semántico invisible pero poderoso */}
      <Script
        id="kce-structured-data"
        type="application/ld+json"
        strategy="afterInteractive" // Cambiado a afterInteractive para no bloquear el renderizado inicial
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
    </>
  );
}
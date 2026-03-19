'use client';

import { usePathname } from 'next/navigation';
import { DefaultSeo, type DefaultSeoProps } from 'next-seo';
import { useMemo } from 'react';

/**
 * Construye una URL canónica limpia sin duplicar slashes.
 */
function buildCanonical(base: string, pathname: string) {
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  // Eliminamos query strings para la canónica (SEO Best Practice)
  const pathOnly = cleanPath.split('?')[0] || '/';
  return `${cleanBase}${pathOnly}`;
}

/**
 * Heurística de indexación: solo permitimos indexar si es Producción Real.
 */
function isIndexableClient(base: string) {
  let hostname = '';
  try {
    hostname = new URL(base).hostname.toLowerCase();
  } catch {
    // Si falla la URL, por seguridad no indexamos
    return false;
  }

  const isProd = process.env.NODE_ENV === 'production';
  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isPreview = hostname.endsWith('.vercel.app');
  
  // Override manual desde variables de entorno
  const forceDisable = process.env.NEXT_PUBLIC_ROBOTS_DISABLE_INDEXING === 'true';

  return isProd && !isLocal && !isPreview && !forceDisable;
}

export default function SEOProvider() {
  const rawBase = process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel';
  const pathname = usePathname() || '/';
  
  const canonical = useMemo(() => buildCanonical(rawBase, pathname), [rawBase, pathname]);
  const indexable = useMemo(() => isIndexableClient(rawBase), [rawBase]);

  const seoConfig = useMemo<DefaultSeoProps>(
    () => ({
      titleTemplate: '%s | KCE World-Class Travel',
      defaultTitle: 'KCE | Experiencias de Viaje Premium',
      description: 'Elevando el estándar del viaje con logística impecable y curación experta.',
      canonical,
      
      // Control de Robots: noindex en staging/preview/local
      dangerouslySetAllPagesToNoIndex: !indexable,
      dangerouslySetAllPagesToNoFollow: !indexable,

      openGraph: {
        type: 'website',
        locale: 'es_ES',
        url: canonical,
        site_name: 'KCE',
        images: [
          {
            url: `${rawBase}/og-default.jpg`,
            width: 1200,
            height: 630,
            alt: 'KCE Travel Experience',
          },
        ],
      },
      twitter: {
        handle: '@kcetravel',
        site: '@kcetravel',
        cardType: 'summary_large_image',
      },
    }),
    [canonical, indexable, rawBase]
  );

  return <DefaultSeo {...seoConfig} />;
}
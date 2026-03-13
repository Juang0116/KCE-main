import type { MetadataRoute } from 'next';

import { SITE_URL, robotsDisabled } from '@/lib/env';

/**
 * Robots:
 * - Por defecto: indexar en producción.
 * - En preview/dev (o si ROBOTS_DISABLE_INDEXING=1): no indexar.
 */
export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.NODE_ENV === 'production';
  const disallowAll = !isProd || robotsDisabled;

  return {
    rules: disallowAll
      ? {
          userAgent: '*',
          disallow: '/',
        }
      : {
          userAgent: '*',
          allow: '/',
          // No indexar rutas privadas o técnicas.
          disallow: [
            '/admin',
            '/api',
            '/_debug',
            '/login',
            '/register',
            '/forgot-password',
            '/reset-password',
            '/verify-email',
            '/account',
            '/wishlist',
            // Prefijos i18n (robots soporta '*')
            '/*/login',
            '/*/register',
            '/*/forgot-password',
            '/*/reset-password',
            '/*/verify-email',
            '/*/account',
            '/*/wishlist',
          ],
        },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

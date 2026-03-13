// src/components/seo/SEOProvider.tsx
'use client';

import { usePathname } from 'next/navigation';
import { DefaultSeo, type DefaultSeoProps } from 'next-seo';
import { useMemo } from 'react';

function buildCanonical(base: string, pathname: string) {
  const b = base.replace(/\/+$/, '');
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${b}${p}`;
}

function isIndexableClient(base: string) {
  // En cliente NO confíes en VERCEL_ENV a menos que tú lo expongas como NEXT_PUBLIC_...
  // Heurística segura: indexar solo si estás en producción y no es .vercel.app / localhost.
  const host = (() => {
    try {
      return new URL(base).hostname.toLowerCase();
    } catch {
      return '';
    }
  })();

  const isProd = process.env.NODE_ENV === 'production';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const isPreview = host.endsWith('.vercel.app');

  // Si quieres un override manual desde .env:
  const disable = (process.env.NEXT_PUBLIC_ROBOTS_DISABLE_INDEXING || '').toLowerCase() === 'true';

  return isProd && !isLocal && !isPreview && !disable;
}

export default function SEOProvider() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(/\/+$/, '');
  const pathname = usePathname() || '/';
  const canonical = buildCanonical(base, pathname);
  const indexable = isIndexableClient(base);

  const seo = useMemo<DefaultSeoProps>(
    () => ({
      canonical,

      // Solo control de indexación en cliente (preview/local)
      dangerouslySetAllPagesToNoIndex: !indexable,
      dangerouslySetAllPagesToNoFollow: !indexable,
    }),
    [canonical, indexable],
  );

  return <DefaultSeo {...seo} />;
}

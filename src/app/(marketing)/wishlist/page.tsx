// src/app/(marketing)/wishlist/page.tsx
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';

import WishlistView from '@/features/wishlist/WishlistView';

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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();

  const t =
    locale === 'en'
      ? { title: 'Wishlist — KCE', desc: 'Your saved tours.' }
      : locale === 'fr'
        ? { title: 'Liste de favoris — KCE', desc: 'Vos tours enregistrés.' }
        : locale === 'de'
          ? { title: 'Wunschliste — KCE', desc: 'Deine gespeicherten Touren.' }
          : { title: 'Wishlist — KCE', desc: 'Tus tours guardados.' };

  const canonicalPath = withLocale(locale, '/wishlist');
  const canonical = absoluteUrl(canonicalPath);

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: t.title,
    description: t.desc,
    alternates: {
      canonical,
      languages: {
        es: absoluteUrl('/es/wishlist'),
        en: absoluteUrl('/en/wishlist'),
        fr: absoluteUrl('/fr/wishlist'),
        de: absoluteUrl('/de/wishlist'),
      },
    },
    // ✅ privado / personalizado => no indexar
    robots: { index: false, follow: false },
    openGraph: {
      title: t.title,
      description: t.desc,
      url: canonical,
      type: 'website',
    },
  };
}

export default function WishlistPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <WishlistView />
    </main>
  );
}

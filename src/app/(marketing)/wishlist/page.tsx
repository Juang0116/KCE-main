import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import WishlistView from '@/features/wishlist/WishlistView';
import { Heart } from 'lucide-react';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

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
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
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
  const t = locale === 'en' ? { title: 'Wishlist — KCE', desc: 'Your saved tours.' } : locale === 'fr' ? { title: 'Liste de favoris — KCE', desc: 'Vos tours enregistrés.' } : locale === 'de' ? { title: 'Wunschliste — KCE', desc: 'Deine gespeicherten Touren.' } : { title: 'Wishlist — KCE', desc: 'Tus tours guardados.' };
  const canonical = absoluteUrl(withLocale(locale, '/wishlist'));

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: t.title,
    description: t.desc,
    alternates: { canonical, languages: { es: absoluteUrl('/es/wishlist'), en: absoluteUrl('/en/wishlist'), fr: absoluteUrl('/fr/wishlist'), de: absoluteUrl('/de/wishlist') } },
    robots: { index: false, follow: false },
    openGraph: { title: t.title, description: t.desc, url: canonical, type: 'website' },
  };
}

export default function WishlistPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16 pb-32">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--color-border)] pb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-600 shadow-sm mb-4">
            <Heart className="h-3 w-3" fill="currentColor"/> Tus Favoritos
          </div>
          <h1 className="font-heading text-4xl text-brand-blue">Tu Wishlist en KCE</h1>
          <p className="mt-2 text-sm font-light text-[var(--color-text)]/70 max-w-xl">
            Tours y experiencias que has guardado para tu próximo viaje a Colombia. 
          </p>
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-12 shadow-sm">
        <WishlistView />
      </div>
    </main>
  );
}
import '@/styles/globals.css';
import '@/branding/brand.css';

import { Bebas_Neue, Poppins } from 'next/font/google';
import { cookies, headers } from 'next/headers';

import { themeInlineScript } from '@/branding/brand.tokens';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import AppChrome from '@/components/AppChrome';
import StatusBanner from '@/components/StatusBanner';
import UtmTracker from '@/features/marketing/UtmTracker';
import { getDictionary, t } from '@/i18n/getDictionary';
import type { SupportedLocale } from '@/i18n/locales';
import { SITE_URL, serverEnv } from '@/lib/env';
import { safeJsonLd } from '@/lib/seoJson';

import type { Metadata, Viewport } from 'next';

const heading = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const body = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

/**
 * Resuelve la URL base para metadatos y enlaces absolutos.
 */
function resolveSiteUrl() {
  const fromEnv = (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const vercel = (process.env.VERCEL_URL || '').trim();
  if (vercel) return `https://${vercel}`.replace(/\/+$/, '');
  return 'http://localhost:3000';
}

const SITE = resolveSiteUrl();
const SUPPORTED_LOCALES = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

/**
 * Lógica central de resolución de idioma.
 */
async function resolveRequestLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED_LOCALES.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get('kce.locale')?.value;
  
  if (fromCookie && SUPPORTED_LOCALES.has(fromCookie as SupportedLocale)) {
    return fromCookie as SupportedLocale;
  }
  
  return 'es';
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveRequestLocale();
  const dict = await getDictionary(locale);

  const titleDefault = t(dict, 'seo.title', 'Knowing Cultures Enterprise — More than a trip');
  const description = t(dict, 'seo.description', 'Colombia auténtica y transformadora.');

  const ogLocale = {
    en: 'en_US', fr: 'fr_FR', de: 'de_DE', es: 'es_CO'
  }[locale] || 'es_CO';

  return {
    metadataBase: new URL(SITE),
    title: { default: titleDefault, template: '%s | KCE' },
    description,
    applicationName: 'KCE',
    alternates: {
      canonical: `/${locale}`,
      languages: { es: '/es', en: '/en', fr: '/fr', de: '/de' },
    },
    manifest: '/site.webmanifest',
    openGraph: {
      title: titleDefault,
      description,
      url: `/${locale}`,
      siteName: 'KCE',
      locale: ogLocale,
      type: 'website',
      images: [{ url: '/opengraph-image' }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/opengraph-image'],
    },
    appleWebApp: { title: 'KCE', capable: true, statusBarStyle: 'default' },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'var(--color-surface)' },
    { media: '(prefers-color-scheme: dark)', color: 'var(--brand-dark)' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await resolveRequestLocale();
  const dict = await getDictionary(locale);

  // Lógica de entorno para AppChrome
  const vercelEnv = (process.env.VERCEL_ENV || '').trim().toLowerCase();
  const stripeKey = (serverEnv.STRIPE_SECRET_KEY || '').trim();
  const isLive = vercelEnv === 'production' && !stripeKey.startsWith('sk_test_');
  const envLabel = isLive ? 'LIVE' : 'TEST';

  const site = resolveSiteUrl();
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Knowing Cultures Enterprise',
    url: site,
    logo: `${site}/brand/logo.png`,
  };

  return (
    <html
      lang={locale}
      dir="ltr"
      className={`${heading.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInlineScript() }} />
        <GoogleAnalytics />
      </head>

      <body className="flex min-h-dvh flex-col bg-[color:var(--color-bg)] font-body text-[color:var(--color-text)] antialiased selection:bg-brand-yellow/40">
        
        <CookieConsentBanner />
        
        {/* Skip to content para accesibilidad */}
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-brand-blue">
          {t(dict, 'common.skip', 'Saltar al contenido')}
        </a>

        <AppChrome slot="header" locale={locale} dict={dict} envLabel={envLabel} />
        <UtmTracker />

        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: safeJsonLd([orgJsonLd]) }} 
        />

        <main id="main" className="flex-1 w-full pt-[var(--header-h)]">
          <StatusBanner />
          {children}
        </main>

        <AppChrome slot="footer" locale={locale} dict={dict} />

        <noscript>
          <div className="fixed bottom-4 left-4 right-4 z-50 rounded-xl bg-amber-50 p-4 text-xs text-amber-900 shadow-lg border border-amber-200">
            Habilita JavaScript para una experiencia completa en KCE.
          </div>
        </noscript>
      </body>
    </html>
  );
}
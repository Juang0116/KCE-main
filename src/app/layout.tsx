import '@/styles/globals.css';
import '@/branding/brand.css';

import { Bebas_Neue, Poppins } from 'next/font/google';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

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

function resolveSiteUrl() {
  const fromEnv = (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const vercel = (process.env.VERCEL_URL || '').trim();
  if (vercel) return `https://${vercel}`.replace(/\/+$/, '');
  return 'http://localhost:3000';
}

const SITE = resolveSiteUrl();
const SUPPORTED_LOCALES = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

function resolveLocale(cookieLocale?: string | null): SupportedLocale {
  if (!cookieLocale) return 'es';
  return SUPPORTED_LOCALES.has(cookieLocale as SupportedLocale)
    ? (cookieLocale as SupportedLocale)
    : 'es';
}

async function resolveRequestLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED_LOCALES.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;

  const cookieStore = await cookies();
  return resolveLocale(cookieStore.get('kce.locale')?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveRequestLocale();

  const dict = await getDictionary(locale);

  const titleDefault = t(dict, 'seo.title', 'Knowing Cultures Enterprise — More than a trip');
  const description = t(
    dict,
    'seo.description',
    'Colombia auténtica, segura y transformadora. Tours culturales en Bogotá, Caldas y Cartagena.',
  );

  const ogDescription = t(
    dict,
    'seo.og_description',
    'Cultura, café y naturaleza — reserva tu experiencia en Colombia.',
  );

  const ogLocale =
    locale === 'en' ? 'en_US' : locale === 'fr' ? 'fr_FR' : locale === 'de' ? 'de_DE' : 'es_CO';

  return {
    metadataBase: new URL(SITE),
    title: { default: titleDefault, template: '%s | KCE' },
    description,
    applicationName: 'KCE',
    alternates: {
      canonical: `/${locale}`,
      languages: {
        es: '/es',
        en: '/en',
        fr: '/fr',
        de: '/de',
      },
    },
    robots: { index: true, follow: true },
    manifest: '/site.webmanifest',
    formatDetection: { telephone: false, email: false, address: false },
    keywords: ['KCE', 'tours en Colombia', 'viajes culturales', 'Bogotá', 'Caldas', 'Cartagena', 'Premium tours'],
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
      shortcut: ['/favicon.ico'],
    },
    openGraph: {
      title: titleDefault,
      description: ogDescription,
      url: `/${locale}`,
      siteName: 'KCE',
      locale: ogLocale,
      type: 'website',
      images: [{ url: '/opengraph-image' }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@knowingcultures',
      creator: '@knowingcultures',
      images: ['/opengraph-image'],
    },
    appleWebApp: {
      title: 'KCE',
      statusBarStyle: 'default',
      capable: true,
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-visual',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFF5E1' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await resolveRequestLocale();
  const dict = await getDictionary(locale);

  // UI labels
  const vercelEnv = String(process.env.VERCEL_ENV || '').trim().toLowerCase();
  const stripeKey = String(serverEnv.STRIPE_SECRET_KEY || '').trim();
  const stripeMode = stripeKey.startsWith('sk_test_') || stripeKey.startsWith('rk_test_') ? 'test' : 'live';
  const envLabel = vercelEnv === 'production' && stripeMode === 'live' ? 'LIVE' : 'TEST';
  const envHint = vercelEnv ? `VERCEL_ENV=${vercelEnv}` : undefined;

  const site = resolveSiteUrl();
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Knowing Cultures Enterprise',
    url: site,
    logo: `${site}/brand/logo.png`,
  };
  const siteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'KCE',
    url: site,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${site}/${locale}/tours?query={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
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
        <CookieConsentBanner />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#0D5BA1" />
      </head>

      <body className="flex min-h-dvh flex-col bg-[color:var(--color-bg)] font-body text-[color:var(--color-text)] antialiased selection:bg-brand-yellow/40">
        <a href="#main" className="sr-only rounded bg-[color:var(--color-surface)] px-3 py-1 text-[color:var(--color-text)] shadow-soft focus:not-sr-only focus:absolute focus:left-4 focus:top-4 z-50">
          {t(dict, 'common.skip', 'Saltar al contenido')}
        </a>

        <AppChrome slot="header" locale={locale} dict={dict} envLabel={envLabel} {...(envHint ? { envHint } : {})} />
        <UtmTracker />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd([orgJsonLd, siteJsonLd]) }} />

        <main id="main" className="flex-1 w-full pt-[var(--header-h)]">
          <StatusBanner />
          {children}
        </main>

        <AppChrome slot="footer" locale={locale} dict={dict} />

        <noscript>
          <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl rounded-xl border border-amber-500/50 bg-amber-50 p-4 text-sm font-medium text-amber-900 shadow-xl">
            Para disfrutar la experiencia completa de KCE (incluyendo reservas y soporte inteligente), por favor habilita JavaScript en tu navegador.
          </div>
        </noscript>
      </body>
    </html>
  );
}
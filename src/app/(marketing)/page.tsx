// src/app/(marketing)/page.tsx
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

import { Button } from '@/components/ui/Button';
import OpenChatButton from '@/features/ai/OpenChatButton';
import MobileQuickActions from '@/features/marketing/MobileQuickActions';
import PublicCoreDecisionRail from '@/features/marketing/PublicCoreDecisionRail';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { ReviewsList } from '@/features/reviews/ReviewsList';
import { toTourLike } from '@/features/tours/adapters';
import { listTours } from '@/features/tours/catalog.server';
import TourCard from '@/features/tours/components/TourCard';
import { getDictionary, t, type Dictionary, type SupportedLocale } from '@/i18n/getDictionary';

export const revalidate = 3600;

const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;

  const c = await cookies();
  const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;

  return 'es';
}

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

function getBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://kce.travel';
  return raw.trim().replace(/\/+$/, '');
}

function absoluteUrl(base: string, href: string) {
  const s = (href || '').trim();
  if (!s) return base;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${base}${s}`;
  return `${base}/${s}`;
}

function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const base = getBaseUrl();
  const canonicalAbs = absoluteUrl(base, withLocale(locale, '/'));

  return {
    metadataBase: new URL(base),
    title: 'KCE — Premium travel in Colombia',
    description: 'Discover premium travel in Colombia with curated tours, personalized planning and real human support.',
    alternates: { canonical: canonicalAbs, languages: { es: '/es', en: '/en', fr: '/fr', de: '/de' } },
    openGraph: { title: 'KCE — Premium travel in Colombia', description: 'Curated tours and premium planning.', url: canonicalAbs, type: 'website', images: [{ url: absoluteUrl(base, '/images/hero-kce.jpg') }] },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function HomePage() {
  const base = getBaseUrl();
  const locale = await resolveLocale();
  const dict: Dictionary = await getDictionary(locale);

  const { items: featured } = await listTours({ sort: 'popular', limit: 6 });

  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE || 'Hola KCE, quiero información sobre un tour.',
    url: absoluteUrl(base, withLocale(locale, '/')),
  });

  return (
    <>
      {/* HERO: Más inmersivo, menos bloques grises */}
      <section aria-labelledby="home-hero-title" className="relative min-h-[85vh] w-full bg-slate-900 flex items-center">
        <Image src="/images/hero-kce.jpg" alt="Colombia experiences" fill priority sizes="100vw" className="object-cover opacity-60" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        
        <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-20 text-center">
          <p className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-yellow backdrop-blur-md">
            {t(dict, 'home.hero.kicker', 'KCE • Premium Colombia')}
          </p>

          <h1 id="home-hero-title" className="mx-auto max-w-4xl font-heading text-5xl leading-tight text-white md:text-7xl">
            {t(dict, 'home.hero.title_a', 'More than a trip,')}<br/>
            <span className="text-brand-yellow font-light italic">
              {t(dict, 'brand.tagline_home', 'a cultural awakening.')}
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl font-light">
            {t(dict, 'home.hero.subtitle', 'Discover curated experiences, clear booking and real support to plan your trip through Colombia with more confidence.')}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild className="px-8 py-4 text-base rounded-full shadow-pop">
              <Link href={withLocale(locale, '/tours')}>{t(dict, 'home.hero.cta', 'Explore tours')}</Link>
            </Button>
            <OpenChatButton variant="outline" addQueryParam className="px-8 py-4 text-base rounded-full border-white/30 bg-black/20 text-white hover:bg-white/10 backdrop-blur-md">
              {t(dict, 'home.hero.chat', 'Plan your trip')}
            </OpenChatButton>
          </div>
        </div>
      </section>

      <MobileQuickActions locale={locale} dict={dict} whatsAppHref={waHref} />
      <PublicCoreDecisionRail locale={locale} variant="home" className="mx-auto mt-4 max-w-6xl" />

      {/* WHY KCE: Estilo Editorial Boutique (Cero cajas, mucho aire) */}
      <section aria-labelledby="why-kce" className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <div className="text-center">
          <h2 id="why-kce" className="font-heading text-4xl text-brand-blue md:text-5xl">
            Viajar con extrema claridad.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[color:var(--color-text)]/70 leading-relaxed font-light">
            La experiencia KCE funciona porque eliminamos el ruido. Empieza por nuestros tours de autor, elige un destino o deja que nuestra IA diseñe un plan a tu medida. 
          </p>
        </div>

        <div className="mt-20 grid gap-16 md:grid-cols-3">
          {[
            ['01', 'Autenticidad local', 'Experiencias reales con anfitriones locales, lejos del turismo genérico y masivo.'],
            ['02', 'Booking premium', 'Checkout protegido, facturación clara y soporte humano garantizado después del pago.'],
            ['03', 'Diseño a medida', 'Nuestra tecnología cruza tus intereses con rutas reales para sugerirte el plan perfecto.'],
          ].map(([num, title, copy]) => (
            <div key={num} className="group text-center md:text-left">
              <div className="text-6xl font-heading text-brand-blue/10 transition-colors group-hover:text-brand-yellow">{num}</div>
              <h3 className="mt-6 font-heading text-2xl text-brand-blue">{title}</h3>
              <p className="mt-4 text-[color:var(--color-text)]/70 leading-relaxed">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DESTACADOS: Más limpios */}
      <section id="experiences" className="bg-[color:var(--color-surface-2)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <header className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row md:items-end">
            <div className="text-center md:text-left">
              <h2 className="font-heading text-3xl text-brand-blue">{t(dict, 'home.featured.title', 'Experiencias Destacadas')}</h2>
              <p className="mt-3 text-[color:var(--color-text)]/70 font-light">{t(dict, 'home.featured.subtitle', 'Una selección curada para inspirar tu viaje.')}</p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href={withLocale(locale, '/tours')}>{t(dict, 'home.featured.see_all', 'See all tours')} →</Link>
            </Button>
          </header>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item, idx) => (
              <TourCard key={item.id} tour={toTourLike(item)} priority={idx < 3} href={withLocale(locale, `/tours/${encodeURIComponent(item.slug)}`)} />
            ))}
          </div>
        </div>
      </section>

      {/* RESEÑAS */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h2 className="font-heading text-3xl text-brand-blue mb-12">{t(dict, 'home.reviews.title', 'Confianza real de viajeros')}</h2>
        <ReviewsList limit={6} />
      </section>

      {/* CTA FINAL */}
      <section className="bg-brand-blue py-24 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-heading text-4xl md:text-5xl">¿Listo para vivir Colombia?</h2>
          <p className="mt-6 text-lg text-white/80 font-light">
            Empieza explorando el catálogo o usa nuestro asistente inteligente para armar un plan en 10 segundos.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild className="bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90 px-8 py-3 rounded-full text-base">
              <Link href={withLocale(locale, '/tours')}>Explorar tours</Link>
            </Button>
            <OpenChatButton variant="outline" addQueryParam className="px-8 py-3 rounded-full border-white/30 hover:bg-white/10 text-base">
              Crear plan personalizado
            </OpenChatButton>
          </div>
        </div>
      </section>
    </>
  );
}
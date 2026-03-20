import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { Sparkles, ArrowRight, MapPin, ShieldCheck, Globe } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import OpenChatButton from '@/features/ai/OpenChatButton';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { ReviewsList } from '@/features/reviews/ReviewsList';
import { toTourLike } from '@/features/tours/adapters';
import { listTours } from '@/features/tours/catalog.server';
import TourCardPremium from '@/features/tours/components/TourCardPremium';
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
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

const getBaseUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const base = getBaseUrl();
  const dict = await getDictionary(locale);
  return {
    metadataBase: new URL(base),
    title: t(dict, 'seo.title', 'KCE — Premium cultural experiences in Colombia'),
    description: t(dict, 'seo.description', 'Authentic, safe and transformative Colombia.'),
    alternates: { canonical: `${base}/${locale}`, languages: { es: '/es', en: '/en', fr: '/fr', de: '/de' } },
    openGraph: { title: t(dict, 'seo.title', 'KCE'), description: t(dict, 'seo.og_description', ''), url: `${base}/${locale}`, type: 'website' },
  };
}

export default async function HomePage() {
  const locale = await resolveLocale();
  const dict: Dictionary = await getDictionary(locale);
  const base = getBaseUrl();

  const { items: featured } = await listTours({ sort: 'popular', limit: 6 });
  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: t(dict, 'nav.support_blurb', 'Hi KCE, I want information about a tour.'),
    url: `${base}/${locale}`,
  });

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-brand-dark">
        <Image src="/images/hero-kce.jpg" alt="Colombia experiences" fill priority className="object-cover opacity-55 scale-105" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-dark/30 to-brand-dark/90" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-96 bg-brand-blue/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-32 text-center flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white backdrop-blur-xl">
            <Sparkles className="h-3 w-3 text-brand-yellow" />
            {t(dict, 'home.hero.kicker', 'KCE • Premium Colombia')}
          </div>

          <h1 className="font-heading text-5xl leading-[1.05] text-white md:text-7xl lg:text-8xl tracking-tight">
            {t(dict, 'home.hero.title_a', 'More than a trip,')}<br />
            <span className="text-brand-yellow font-light italic opacity-90">
              {t(dict, 'brand.tagline_home', 'a cultural awakening.')}
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl font-light">
            {t(dict, 'home.hero.subtitle', 'Curated routes and human support to discover the real Colombia with complete confidence.')}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row justify-center">
            <Button asChild size="lg" className="rounded-full px-10 bg-brand-blue text-white hover:bg-brand-blue/90 shadow-pop hover:-translate-y-0.5 transition-all">
              <Link href={withLocale(locale, '/tours')}>
                {t(dict, 'home.hero.cta', 'Explore tours')} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <OpenChatButton variant="outline" className="rounded-full border-white/30 bg-white/5 px-10 text-white hover:bg-white/10 backdrop-blur-md transition-all">
              {t(dict, 'home.hero.chat', 'Design your plan')}
            </OpenChatButton>
          </div>

          {/* Quick nav pills */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 flex-wrap px-6">
            {[
              { href: '/tours', icon: MapPin, label: t(dict, 'nav.tours', 'Tours') },
              { href: '/plan', icon: Sparkles, label: t(dict, 'nav.quiz', 'Plan') },
              { href: '/trust', icon: ShieldCheck, label: t(dict, 'trust.badge', 'Trust') },
              { href: '/contact', icon: Globe, label: t(dict, 'nav.contact', 'Contact') },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={href} href={withLocale(locale, href)}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2 text-xs font-medium text-white hover:bg-white/20 transition-all">
                <Icon className="h-3.5 w-3.5" /> {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHY KCE */}
      <section className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <div className="text-center">
          <h2 className="font-heading text-4xl text-brand-blue md:text-5xl">
            {t(dict, 'home.why.title', 'Travel with extreme clarity.')}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[color:var(--color-text-muted)] leading-relaxed font-light">
            {t(dict, 'home.why.subtitle', 'We combine cutting-edge technology with deep local knowledge.')}
          </p>
        </div>
        <div className="mt-20 grid gap-12 md:grid-cols-3">
          {[
            ['01', t(dict, 'home.why.p1_title', 'Local authenticity'), t(dict, 'home.why.p1_body', '')],
            ['02', t(dict, 'home.why.p2_title', 'Premium booking'), t(dict, 'home.why.p2_body', '')],
            ['03', t(dict, 'home.why.p3_title', 'Custom design'), t(dict, 'home.why.p3_body', '')],
          ].map(([num, title, body]) => (
            <div key={num} className="group text-center md:text-left">
              <div className="text-6xl font-heading text-brand-blue/10 transition-colors group-hover:text-brand-yellow">{num}</div>
              <h3 className="mt-4 font-heading text-2xl text-brand-blue">{title}</h3>
              <p className="mt-3 text-[color:var(--color-text-muted)] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED TOURS */}
      <section className="bg-[color:var(--color-surface-2)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <header className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row md:items-end">
            <div className="text-center md:text-left">
              <h2 className="font-heading text-3xl text-brand-blue">
                {t(dict, 'home.featured.title', 'Curated selection')}
              </h2>
              <p className="mt-2 text-[color:var(--color-text-muted)] font-light">
                {t(dict, 'home.featured.subtitle', 'Expertly curated experiences.')}
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href={withLocale(locale, '/tours')}>
                {t(dict, 'home.featured.see_all', 'See full catalog')} →
              </Link>
            </Button>
          </header>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item, idx) => (
              <TourCardPremium key={item.id} tour={toTourLike(item)} priority={idx < 3}
                href={withLocale(locale, `/tours/${encodeURIComponent(item.slug)}`)} />
            ))}
            {featured.length === 0 && (
              <p className="col-span-3 text-center text-[color:var(--color-text-muted)] py-12">
                {t(dict, 'home.featured.empty', 'Coming soon.')}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h2 className="font-heading text-3xl text-brand-blue mb-12">
          {t(dict, 'home.reviews.title', 'Real trust from travelers')}
        </h2>
        <ReviewsList limit={6} />
      </section>

      {/* FINAL CTA */}
      <section className="bg-brand-blue py-24 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-heading text-4xl md:text-5xl">
            {t(dict, 'home.cta.title', 'Ready to experience Colombia?')}
          </h2>
          <p className="mt-6 text-lg text-white/80 font-light">
            {t(dict, 'home.cta.subtitle', 'Browse the catalog or create a plan in 10 seconds.')}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild className="bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90 px-8 rounded-full">
              <Link href={withLocale(locale, '/tours')}>
                {t(dict, 'home.cta.btn_tours', 'Explore tours')}
              </Link>
            </Button>
            <OpenChatButton variant="outline" className="px-8 rounded-full border-white/30 hover:bg-white/10">
              {t(dict, 'home.cta.btn_plan', 'Create personalized plan')}
            </OpenChatButton>
          </div>
        </div>
      </section>
    </>
  );
}

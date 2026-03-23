/* src/app/(marketing)/page.tsx */
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { Sparkles, ArrowRight, MapPin, ShieldCheck, Globe, Navigation, Compass, Star } from 'lucide-react';

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
    title: t(dict, 'seo.title', 'KCE Colombia | Knowing Cultures S.A.S.'),
    description: t(dict, 'seo.description', 'Experiencias culturales premium, seguras y transformadoras en el corazón de Colombia.'),
    alternates: { canonical: `${base}/${locale}`, languages: { es: '/es', en: '/en', fr: '/fr', de: '/de' } },
    openGraph: { title: 'KCE Colombia', description: 'El despertar cultural que buscabas.', url: `${base}/${locale}`, type: 'website' },
  };
}

export default async function HomePage() {
  const locale = await resolveLocale();
  const dict: Dictionary = await getDictionary(locale);
  const base = getBaseUrl();

  const { items: featured } = await listTours({ sort: 'popular', limit: 6 });

  return (
    <main className="animate-fade-in overflow-x-hidden">
      
      {/* 01. HERO - ULTRA PREMIUM (ADN KCE) */}
      <section className="relative min-h-[100dvh] w-full flex items-center justify-center overflow-hidden bg-brand-dark">
        <Image 
          src="/images/hero-kce.jpg" 
          alt="Premium Colombia Experiences" 
          fill 
          priority 
          className="object-cover opacity-40 scale-105 animate-slow-zoom" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/20 via-brand-dark/40 to-brand-dark" />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-brand-blue/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-32 pb-44 text-center flex flex-col items-center">
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.4em] text-white backdrop-blur-xl shadow-2xl">
            <Sparkles className="h-3.5 w-3.5 text-brand-yellow" />
            {t(dict, 'home.hero.kicker', 'Knowing Cultures S.A.S. • Elite Colombia')}
          </div>

          <h1 className="font-heading text-6xl leading-[1] text-white md:text-8xl lg:text-9xl tracking-tighter mb-10">
            {t(dict, 'home.hero.title_a', 'Más que un viaje,')}<br />
            <span className="text-brand-yellow font-light italic opacity-90 tracking-tight">
              {t(dict, 'brand.tagline_home', 'un despertar cultural.')}
            </span>
          </h1>

          <p className="max-w-2xl text-xl md:text-2xl font-light leading-relaxed text-white/60 mb-14">
            {t(dict, 'home.hero.subtitle', 'Rutas de autor y acompañamiento humano para descubrir la Colombia real con absoluta confianza.')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
            <Button asChild size="lg" className="w-full sm:w-auto rounded-full px-12 py-8 bg-brand-blue text-white hover:bg-white hover:text-brand-blue shadow-pop transition-all hover:-translate-y-1 border-transparent">
              <Link href={withLocale(locale, '/tours')} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                {t(dict, 'home.hero.cta', 'Explorar Catálogo')} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <OpenChatButton variant="outline" className="w-full sm:w-auto rounded-full border-white/30 bg-white/5 px-12 py-8 text-white hover:bg-white hover:text-brand-dark backdrop-blur-md transition-all text-xs font-bold uppercase tracking-widest">
              {t(dict, 'home.hero.chat', 'Diseñar Plan Personalizado')}
            </OpenChatButton>
          </div>
        </div>

        <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center gap-4 flex-wrap px-6">
          {[
            { href: '/tours', icon: MapPin, label: t(dict, 'nav.tours', 'Tours') },
            { href: '/plan', icon: Compass, label: t(dict, 'nav.quiz', 'Rutas') },
            { href: '/trust', icon: ShieldCheck, label: t(dict, 'trust.badge', 'Seguridad') },
            { href: '/contact', icon: Globe, label: t(dict, 'nav.contact', 'Concierge') },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={withLocale(locale, href)}
              className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-lg px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-white/70 hover:bg-white hover:text-brand-dark transition-all duration-500 shadow-xl">
              <Icon className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" /> {label}
            </Link>
          ))}
        </div>
      </section>

      {/* 02. WHY KCE - EDITORIAL STANDARDS (REPARADO DEFINITIVAMENTE) */}
      <section className="bg-base px-6 py-28 md:py-44 relative">
        <div className="absolute top-0 left-0 p-20 opacity-[0.02] pointer-events-none">
           <Navigation className="h-96 w-96 text-brand-blue -rotate-12" />
        </div>

        <div className="mx-auto max-w-[var(--container-max)] relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <span className="text-brand-blue text-[10px] font-bold uppercase tracking-[0.4em] mb-6 block">El Estándar Knowing Cultures</span>
            <h2 className="font-heading text-5xl md:text-7xl text-main tracking-tight leading-tight">
              {t(dict, 'home.why.title', 'Viaja con una claridad absoluta.')}
            </h2>
            <p className="mt-8 text-xl md:text-2xl text-muted leading-relaxed font-light">
              {t(dict, 'home.why.subtitle', 'Fusionamos curaduría local profunda con protocolos internacionales de seguridad y servicio.')}
            </p>
          </div>

          <div className="grid gap-16 md:gap-12 md:grid-cols-3 relative">
            <div className="hidden md:block absolute top-16 left-20 right-20 h-px bg-brand-dark/5 dark:bg-white/5" />
            
            {[
              ['01', t(dict, 'home.why.p1_title', 'Autenticidad Real'), 'Conectamos con anfitriones locales validados en el terreno.'],
              ['02', t(dict, 'home.why.p2_title', 'Booking de Autor'), 'Procesos de pago seguros Stripe y gestión de vouchers premium.'],
              ['03', t(dict, 'home.why.p3_title', 'Diseño de Rutas'), 'Itinerarios adaptados a tu ritmo, curiosidad y estilo de vida.'],
            ].map(([num, title, body]) => (
              <div key={num} className="group text-center flex flex-col items-center">
                {/* SOLUCIÓN FINAL: 
                    1. dark:bg-white/10 -> Fondo visible en círculo oscuro
                    2. dark:text-slate-200 -> Color sólido casi blanco
                    3. dark:border-white/30 -> Borde firme
                */}
                <div className="flex h-28 w-28 items-center justify-center rounded-[2.5rem] bg-surface dark:bg-white/10 border border-brand-dark/10 dark:border-white/30 shadow-soft text-5xl font-heading text-brand-dark/10 dark:text-slate-200 transition-all duration-700 group-hover:scale-110 group-hover:border-brand-yellow group-hover:text-brand-yellow mb-10 group-hover:rotate-6">
                  {num}
                </div>
                <h3 className="font-heading text-3xl text-main mb-5 tracking-tight">{title}</h3>
                <p className="text-lg text-muted leading-relaxed font-light px-4">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 03. FEATURED TOURS */}
      <section className="bg-surface-2 py-28 md:py-44 border-y border-brand-dark/5 dark:border-white/5">
        <div className="mx-auto max-w-[var(--container-max)] px-6">
          <header className="mb-20 flex flex-col items-center justify-between gap-10 md:flex-row md:items-end">
            <div className="text-center md:text-left max-w-2xl">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-terra mb-4 justify-center md:justify-start">
                 <Star className="h-3 w-3 fill-current" /> Selección de Temporada
              </div>
              <h2 className="font-heading text-5xl md:text-6xl text-main tracking-tight leading-[1.1]">
                {t(dict, 'home.featured.title', 'Expediciones Curadas')}
              </h2>
              <p className="mt-6 text-xl text-muted font-light leading-relaxed">
                {t(dict, 'home.featured.subtitle', 'Una colección de historias esperando ser vividas.')}
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full border-brand-dark/10 hover:border-brand-blue hover:text-brand-blue hover:bg-white px-10 py-7 transition-all duration-500 shadow-sm hover:shadow-pop">
              <Link href={withLocale(locale, '/tours')} className="text-xs font-bold uppercase tracking-widest flex items-center gap-3">
                {t(dict, 'home.featured.see_all', 'Ver Catálogo Completo')} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </header>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item, idx) => (
              <TourCardPremium 
                key={item.id} 
                tour={toTourLike(item)} 
                priority={idx < 3}
                href={withLocale(locale, `/tours/${encodeURIComponent(item.slug)}`)} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* 04. REVIEWS */}
      <section className="bg-base px-6 py-28 md:py-44 text-center">
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-blue/5 border border-brand-blue/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue mb-10">
             <ShieldCheck className="h-3.5 w-3.5" /> Confianza Validada
          </div>
          <h2 className="font-heading text-5xl md:text-7xl text-main tracking-tight mb-20 max-w-4xl mx-auto">
            {t(dict, 'home.reviews.title', 'Relatos de quienes ya cruzaron la frontera cultural.')}
          </h2>
          <ReviewsList limit={6} />
        </div>
      </section>

      {/* 05. FINAL CTA */}
      <section className="relative overflow-hidden bg-brand-dark py-32 md:py-48 text-center text-white">
        <div className="absolute inset-0 bg-[url('/brand/pattern.png')] bg-repeat opacity-5" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-blue/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-yellow/5 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2 pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-4xl px-6">
          <h2 className="font-heading text-6xl md:text-8xl tracking-tight leading-[1] mb-10">
            {t(dict, 'home.cta.title', '¿Listo para lo auténtico?')}
          </h2>
          <p className="text-xl md:text-2xl text-white/60 font-light leading-relaxed mb-16 max-w-2xl mx-auto">
            {t(dict, 'home.cta.subtitle', 'Explora nuestro catálogo editorial o diseña una ruta privada en segundos con nuestro concierge.')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button asChild size="lg" className="w-full sm:w-auto bg-brand-blue text-white hover:bg-white hover:text-brand-blue px-14 py-8 rounded-full shadow-2xl transition-all hover:-translate-y-1 border-transparent">
              <Link href={withLocale(locale, '/tours')} className="text-xs font-bold uppercase tracking-widest">
                {t(dict, 'home.cta.btn_tours', 'Explorar Tours')}
              </Link>
            </Button>
            <OpenChatButton variant="outline" className="w-full sm:w-auto px-14 py-8 rounded-full border-white/20 text-white bg-white/5 hover:bg-white hover:text-brand-dark backdrop-blur-md transition-all text-xs font-bold uppercase tracking-widest">
              {t(dict, 'home.cta.btn_plan', 'Plan a Medida')}
            </OpenChatButton>
          </div>

          <div className="mt-20 pt-10 border-t border-white/5 opacity-30">
             <p className="text-[10px] font-bold uppercase tracking-[0.5em]">Knowing Cultures S.A.S. · Colombia 2026</p>
          </div>
        </div>
      </section>
    </main>
  );
}
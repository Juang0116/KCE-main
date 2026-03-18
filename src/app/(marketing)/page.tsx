import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { 
  Sparkles, ArrowRight, PlayCircle, Compass, 
  MapPin, ShieldCheck, Heart, Globe, 
  ChevronRight, MessageSquare 
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import OpenChatButton from '@/features/ai/OpenChatButton';
import MobileQuickActions from '@/features/marketing/MobileQuickActions';
import PublicCoreDecisionRail from '@/features/marketing/PublicCoreDecisionRail';
import LaunchTrustRail from '@/features/marketing/LaunchTrustRail';
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
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

const getBaseUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const base = getBaseUrl();
  const canonicalAbs = `${base}/${locale}`;

  return {
    metadataBase: new URL(base),
    title: 'KCE Travel | Experiencias Culturales Premium en Colombia',
    description: 'Descubre Colombia a través de rutas curadas por expertos. Tours privados, gastronomía y cultura con soporte bilingüe real.',
    alternates: { canonical: canonicalAbs, languages: { es: '/es', en: '/en', fr: '/fr', de: '/de' } },
    openGraph: {
      title: 'KCE — Premium travel in Colombia',
      description: 'Más que un viaje, un despertar cultural.',
      url: canonicalAbs,
      type: 'website',
      images: [{ url: `${base}/images/hero-kce.jpg`, width: 1200, height: 630 }],
    },
  };
}

export default async function HomePage() {
  const base = getBaseUrl();
  const locale = await resolveLocale();
  const dict: Dictionary = await getDictionary(locale);

  const { items: featured } = await listTours({ sort: 'popular', limit: 3 });

  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: 'Hola KCE, acabo de entrar a la web y me gustaría planear un viaje a Colombia.',
    url: `${base}/${locale}`,
  });

  return (
    <>
      {/* HERO SECTION: INMERSIVO & DARK PREMIUM */}
      <section className="relative min-h-screen w-full flex items-center overflow-hidden bg-brand-dark">
        <Image 
          src="/images/hero-kce.jpg" 
          alt="Colombia authentic experiences" 
          fill 
          priority 
          className="object-cover opacity-50 scale-105 animate-slow-zoom" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent" />
        
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-32">
          <div className="max-w-4xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-yellow backdrop-blur-xl shadow-2xl">
              <Sparkles className="h-3.5 w-3.5" /> {t(dict, 'home.hero.kicker', 'KCE • Premium Colombia')}
            </div>

            <h1 className="font-heading text-6xl leading-[1.05] text-white md:text-8xl lg:text-9xl drop-shadow-2xl">
              {t(dict, 'home.hero.title_a', 'More than a trip,')}<br/>
              <span className="text-brand-yellow font-light italic opacity-90">
                {t(dict, 'brand.tagline_home', 'a cultural awakening.')}
              </span>
            </h1>

            <p className="mt-10 max-w-2xl text-lg leading-relaxed text-white/80 md:text-2xl font-light">
              {t(dict, 'home.hero.subtitle', 'Rutas curadas y soporte humano para descubrir la Colombia real con total seguridad.')}
            </p>

            <div className="mt-12 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="rounded-full px-10 py-8 text-lg shadow-2xl hover:scale-105 transition-transform bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90">
                <Link href={withLocale(locale, '/tours')}>{t(dict, 'home.hero.cta', 'Explore tours')}</Link>
              </Button>
              
              <OpenChatButton variant="outline" className="group rounded-full border-white/20 bg-white/5 px-10 py-8 text-lg text-white backdrop-blur-md hover:bg-white/10 transition-all">
                <PlayCircle className="mr-2 h-6 w-6 text-brand-yellow" />
                {t(dict, 'home.hero.chat', 'Plan your trip')}
              </OpenChatButton>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-30">
          <div className="h-10 w-6 rounded-full border-2 border-white flex justify-center p-1">
             <div className="h-2 w-1 bg-white rounded-full"></div>
          </div>
        </div>
      </section>

      <MobileQuickActions locale={locale} dict={dict} whatsAppHref={waHref} />

      {/* RAÍL DE DECISIÓN: El puente entre el Hero y el contenido */}
      <section className="relative z-30 -mt-16 mx-auto max-w-7xl px-6">
        <PublicCoreDecisionRail locale={locale} variant="home" />
      </section>

      {/* EL MANIFIESTO: Estilo Editorial Boutique */}
      <section className="mx-auto max-w-7xl px-6 py-32 md:py-48">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-20 items-center">
          <div className="relative">
             <div className="absolute -top-20 -left-10 text-[180px] font-heading text-brand-blue/[0.03] select-none">KCE</div>
             <h2 className="relative z-10 font-heading text-5xl md:text-7xl text-brand-blue leading-tight">
               Viajar con <br/>
               <span className="text-brand-yellow italic font-light">extrema claridad.</span>
             </h2>
             <div className="mt-12 space-y-6 text-xl text-[var(--color-text)]/70 font-light leading-relaxed">
                <p>La experiencia KCE nace para eliminar el ruido del turismo masivo.</p>
                <p>Unificamos tecnología de vanguardia con el conocimiento profundo de anfitriones locales para diseñar planes que no se encuentran en guías convencionales.</p>
             </div>
             <Button asChild variant="ghost" className="mt-10 p-0 text-brand-blue hover:bg-transparent group">
               <Link href="/trust" className="flex items-center gap-3 font-bold uppercase tracking-widest text-xs">
                 Conoce nuestro compromiso <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
               </Link>
             </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              { icon: Globe, title: 'Cultura Real', text: 'Acceso a comunidades y lugares fuera del radar tradicional.' },
              { icon: ShieldCheck, title: 'Pago Protegido', text: 'Infraestructura de Stripe con facturación bilingüe automática.' },
              { icon: Compass, title: 'Guía Experta', text: 'Soporte humano por WhatsApp antes, durante y después del tour.' },
              { icon: Heart, title: 'Impacto Social', text: 'Cada reserva apoya directamente el desarrollo de guías locales.' }
            ].map((item, i) => (
              <div key={i} className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 shadow-sm transition-all hover:shadow-xl group">
                <item.icon className="mb-6 h-8 w-8 text-brand-blue group-hover:text-brand-yellow transition-colors" />
                <h3 className="font-heading text-xl text-brand-blue mb-3">{item.title}</h3>
                <p className="text-sm font-light leading-relaxed text-[var(--color-text)]/60">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCIAS DESTACADAS: Grid Curado */}
      <section className="bg-[var(--color-surface-2)] py-32 rounded-[4rem] mx-4 shadow-inner">
        <div className="mx-auto max-w-7xl px-6">
          <header className="mb-20 flex flex-col md:flex-row items-end justify-between gap-10">
            <div className="max-w-2xl">
              <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue opacity-50">Curated Catalog</div>
              <h2 className="font-heading text-4xl md:text-6xl text-brand-blue">Selección de Autor</h2>
              <p className="mt-6 text-lg text-[color:var(--color-text)]/60 font-light">Una muestra de las experiencias mejor valoradas por nuestra comunidad internacional.</p>
            </div>
            <Button asChild size="lg" variant="outline" className="rounded-full border-brand-blue/20 hover:bg-brand-blue hover:text-white px-10">
              <Link href={withLocale(locale, '/tours')}>Ver todo el catálogo</Link>
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

      {/* SOCIAL PROOF & TRUST */}
      <section className="py-32 overflow-hidden">
        <div className="mx-auto max-w-4xl px-6 text-center mb-20">
           <h2 className="font-heading text-4xl md:text-5xl text-brand-blue mb-6">Confianza de Clase Mundial</h2>
           <p className="text-lg font-light text-[var(--color-text)]/60">Viajeros de todo el mundo ya han descubierto Colombia con KCE.</p>
        </div>
        <ReviewsList limit={6} />
        <div className="mt-20 flex justify-center">
           <LaunchTrustRail locale={locale} />
        </div>
      </section>

      {/* CONVERSION VAULT: El cierre final */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-[4rem] bg-brand-dark p-12 md:p-32 text-center text-white shadow-2xl">
          <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.png')] bg-repeat scale-150"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-dark/90 to-brand-blue/40"></div>
          
          <div className="relative z-10 mx-auto max-w-3xl">
            <h2 className="font-heading text-4xl md:text-7xl leading-tight mb-10">
              ¿Listo para tu <br/>
              <span className="text-brand-yellow italic font-light">próxima historia?</span>
            </h2>
            <p className="text-xl md:text-2xl font-light text-white/70 mb-14 leading-relaxed">
              Ya sea un tour de autor o un plan diseñado por IA, estamos aquí para asegurar que tu viaje sea impecable.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Button asChild size="lg" className="rounded-full bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90 px-12 py-8 text-lg shadow-xl hover:scale-105 transition-transform">
                <Link href={withLocale(locale, '/tours')}>Ver todos los tours</Link>
              </Button>
              <OpenChatButton size="lg" variant="outline" className="rounded-full border-white/20 bg-white/5 px-12 py-8 text-lg backdrop-blur-md hover:bg-white/10">
                Hablar con un experto
              </OpenChatButton>
            </div>
          </div>
        </div>
      </section>

      {/* Sutil Footer de Marca */}
      <footer className="py-12 text-center border-t border-[var(--color-border)]/30 mx-auto max-w-7xl">
         <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--color-text)]/20 italic">
           Knowing Cultures Enterprise · Colombia · 2026
         </p>
      </footer>
    </>
  );
}
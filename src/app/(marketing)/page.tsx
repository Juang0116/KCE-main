import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { 
  Sparkles, ArrowRight, PlayCircle, Compass, 
  MapPin, ShieldCheck, Heart, Globe, 
  ChevronRight, MessageSquare, Map 
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import OpenChatButton from '@/features/ai/OpenChatButton';
import MobileQuickActions from '@/features/marketing/MobileQuickActions';
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
    <main className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      
      {/* 01. HERO SECTION: INMERSIVO & DARK PREMIUM */}
      <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-brand-dark">
        <Image 
          src="/images/hero-kce.jpg" 
          alt="Colombia authentic experiences" 
          fill 
          priority 
          className="object-cover opacity-60 scale-105 animate-slow-zoom" 
        />
        {/* Gradient más suave para que el contenido fluya orgánicamente hacia abajo */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-dark/40 to-brand-dark/95" />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-96 bg-brand-blue/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-32 text-center flex flex-col items-center mt-10">
          <div className="max-w-4xl flex flex-col items-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white backdrop-blur-xl shadow-sm">
              <Sparkles className="h-3 w-3 text-brand-yellow" /> {t(dict, 'home.hero.kicker', 'KCE • Premium Colombia')}
            </div>

            <h1 className="font-heading text-6xl leading-[1.05] text-white md:text-8xl lg:text-9xl drop-shadow-lg tracking-tight">
              {t(dict, 'home.hero.title_a', 'More than a trip,')}<br/>
              <span className="text-brand-yellow font-light italic opacity-90">
                {t(dict, 'brand.tagline_home', 'a cultural awakening.')}
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/80 md:text-2xl font-light mx-auto">
              {t(dict, 'home.hero.subtitle', 'Rutas curadas y soporte humano para descubrir la Colombia real con total seguridad.')}
            </p>

            <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:items-center justify-center w-full max-w-lg mx-auto">
              <Button asChild size="lg" className="w-full sm:w-auto rounded-full px-10 py-7 text-base shadow-pop hover:-translate-y-1 transition-all bg-brand-blue text-white hover:bg-brand-blue/90 border border-brand-blue/50">
                <Link href={withLocale(locale, '/tours')}>{t(dict, 'home.hero.cta', 'Explore tours')}</Link>
              </Button>
              
              <OpenChatButton variant="outline" className="w-full sm:w-auto group rounded-full border-white/30 bg-white/5 px-10 py-7 text-base text-white backdrop-blur-md hover:bg-white/10 transition-all hover:border-white/50">
                <PlayCircle className="mr-2 h-5 w-5 text-brand-yellow" />
                {t(dict, 'home.hero.chat', 'Plan your trip')}
              </OpenChatButton>
            </div>
          </div>
        </div>

        {/* 02. NAVEGACIÓN RÁPIDA (Reemplaza al "Carril" ruidoso) */}
        {/* Estas píldoras flotan abajo en el hero, son limpias, no tienen sombras pesadas ni fondos sólidos. */}
        <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center px-6">
          <div className="flex flex-wrap justify-center gap-3">
             <Link href={withLocale(locale, '/tours/destinations')} className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2.5 text-xs font-medium text-white transition-all hover:bg-white/20 hover:border-white/40">
               <MapPin className="h-4 w-4 opacity-70 group-hover:text-brand-yellow transition-colors" /> Explorar por Ciudad
             </Link>
             <Link href={withLocale(locale, '/tours/styles')} className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2.5 text-xs font-medium text-white transition-all hover:bg-white/20 hover:border-white/40">
               <Compass className="h-4 w-4 opacity-70 group-hover:text-brand-terra transition-colors" /> Filtrar por Estilo
             </Link>
             <Link href={withLocale(locale, '/plan')} className="hidden sm:flex group items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2.5 text-xs font-medium text-white transition-all hover:bg-white/20 hover:border-white/40">
               <Map className="h-4 w-4 opacity-70 group-hover:text-brand-blue transition-colors" /> Crear Plan Personalizado
             </Link>
          </div>
        </div>
      </section>

      <MobileQuickActions locale={locale} dict={dict} whatsAppHref={waHref} />

      {/* 03. EL MANIFIESTO: Estilo Editorial Boutique (Sin cajas de colores) */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 py-24 md:py-32">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-16 md:gap-24 items-start">
          
          <div className="sticky top-32">
             <h2 className="relative z-10 font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[var(--color-text)] leading-[1.1] tracking-tight">
               Viajar con <br/>
               <span className="text-brand-blue italic font-light">extrema claridad.</span>
             </h2>
             <div className="mt-8 space-y-6 text-lg text-[var(--color-text-muted)] font-light leading-relaxed max-w-lg">
                <p>La experiencia KCE nace para eliminar el ruido del turismo masivo.</p>
                <p>Unificamos tecnología de vanguardia con el conocimiento profundo de anfitriones locales para diseñar planes que no se encuentran en guías convencionales.</p>
             </div>
             <Button asChild variant="ghost" className="mt-8 p-0 text-brand-terra hover:bg-transparent group">
               <Link href={withLocale(locale, '/trust')} className="flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                 Conoce nuestro compromiso <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
               </Link>
             </Button>
          </div>

          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 pt-4">
            {[
              { icon: Globe, title: 'Cultura Real', text: 'Acceso a comunidades y lugares fuera del radar tradicional.' },
              { icon: ShieldCheck, title: 'Pago Protegido', text: 'Infraestructura de Stripe con facturación bilingüe automática.' },
              { icon: Compass, title: 'Guía Experta', text: 'Soporte humano por WhatsApp antes, durante y después del tour.' },
              { icon: Heart, title: 'Impacto Social', text: 'Cada reserva apoya directamente el desarrollo de guías locales.' }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-start group">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-soft text-brand-blue group-hover:border-brand-blue/30 group-hover:bg-brand-blue/5 transition-all">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-xl text-[var(--color-text)] mb-2 group-hover:text-brand-blue transition-colors">{item.title}</h3>
                <p className="text-sm font-light leading-relaxed text-[var(--color-text-muted)]">{item.text}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 04. EXPERIENCIAS DESTACADAS: Grid Limpio */}
      <section className="py-24 border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[var(--container-max)] px-6">
          <header className="mb-16 flex flex-col md:flex-row items-end justify-between gap-8 border-b border-[var(--color-border)] pb-8">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
                <Sparkles className="h-3 w-3 text-brand-yellow" /> Curated Catalog
              </div>
              <h2 className="font-heading text-4xl md:text-5xl text-[var(--color-text)] tracking-tight">Selección de Autor</h2>
              <p className="mt-4 text-base md:text-lg text-[var(--color-text-muted)] font-light">
                Una muestra de las experiencias mejor valoradas por nuestra comunidad internacional.
              </p>
            </div>
            <Link href={withLocale(locale, '/tours')} className="text-xs font-bold uppercase tracking-widest text-[var(--color-text)] hover:text-brand-blue transition-colors flex items-center gap-2 group whitespace-nowrap">
              Ver catálogo <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </header>

          <div className="grid gap-8 sm:gap-10 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* 05. SOCIAL PROOF & TRUST */}
      <section className="py-24 md:py-32 bg-[var(--color-surface-2)]/30 border-t border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-4xl px-6 text-center mb-16">
           <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] mb-4">
              <ShieldCheck className="h-3 w-3 text-brand-blue" /> Confianza Global
           </div>
           <h2 className="font-heading text-4xl md:text-5xl text-[var(--color-text)] tracking-tight mb-4">Viajeros de todo el mundo.</h2>
           <p className="text-lg font-light text-[var(--color-text-muted)]">Descubre Colombia con el respaldo de experiencias reales.</p>
        </div>
        <div className="mx-auto max-w-[var(--container-max)] px-6">
          <ReviewsList limit={6} />
        </div>
        <div className="mt-20 flex justify-center px-6">
           <LaunchTrustRail locale={locale} />
        </div>
      </section>

      {/* 06. CONVERSION VAULT (Glassmorphism Premium) */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 py-24 pb-32">
        <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur-2xl p-12 md:p-24 text-center shadow-soft group">
          {/* Brillos KCE dinámicos */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none transition-transform duration-1000 group-hover:scale-150"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-yellow/5 rounded-full blur-[100px] pointer-events-none transition-transform duration-1000 group-hover:scale-150"></div>
          
          <div className="relative z-10 mx-auto max-w-3xl flex flex-col items-center">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-sm">
               <Compass className="h-8 w-8 text-brand-terra animate-pulse" />
            </div>
            
            <h2 className="font-heading text-4xl md:text-6xl text-[var(--color-text)] leading-tight tracking-tight mb-6">
              ¿Listo para tu <br/>
              <span className="text-brand-blue italic font-light">próxima historia?</span>
            </h2>
            
            <p className="text-lg md:text-xl font-light text-[var(--color-text-muted)] mb-12 leading-relaxed">
              Ya sea un tour de autor o un plan diseñado por IA, estamos aquí para asegurar que tu viaje sea impecable.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 w-full sm:w-auto">
              <Button asChild size="lg" className="w-full sm:w-auto rounded-full bg-brand-blue text-white hover:bg-brand-blue/90 px-10 py-6 text-base shadow-pop hover:-translate-y-0.5 transition-transform">
                <Link href={withLocale(locale, '/tours')}>Ver todos los tours <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <OpenChatButton size="lg" variant="outline" className="w-full sm:w-auto rounded-full border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] px-10 py-6 text-base">
                Hablar con un experto
              </OpenChatButton>
            </div>
          </div>
        </div>
      </section>

      {/* 07. Sutil Footer de Marca */}
      <footer className="py-12 text-center border-t border-[var(--color-border)]/30 mx-auto w-full max-w-[var(--container-max)]">
         <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--color-text-muted)] opacity-50 flex items-center justify-center gap-3">
           <span>KCE Travel</span>
           <span className="h-1 w-1 bg-[var(--color-border)] rounded-full"></span>
           <span>Colombia</span>
           <span className="h-1 w-1 bg-[var(--color-border)] rounded-full"></span>
           <span>2026</span>
         </p>
      </footer>
    </main>
  );
}
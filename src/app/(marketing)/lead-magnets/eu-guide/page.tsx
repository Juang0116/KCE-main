/*src/app/(marketing)/lead-magnets/eu-guide/page.tsx*/
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { DownloadCloud, FileCheck, Map, Globe, ShieldCheck, ArrowRight, Sparkles, Mail } from 'lucide-react';

import EuGuideLeadMagnetForm from '@/features/marketing/EuGuideLeadMagnetForm';
import InternationalGrowthDeck from '@/features/marketing/InternationalGrowthDeck';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { Button } from '@/components/ui/Button';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
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

function getBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') || 'https://kce.travel';
  return raw.trim().replace(/\/+$/, '');
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const base = getBaseUrl();
  const canonical = withLocale(locale, '/lead-magnets/eu-guide');
  return {
    metadataBase: new URL(base),
    title: 'Guía Europa → Colombia | Recurso Exclusivo KCE',
    description: 'Descarga nuestra guía práctica premium para viajeros europeos planificando su ruta por Colombia. Tips de seguridad, logística y rutas curadas.',
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: {
        es: '/es/lead-magnets/eu-guide',
        en: '/en/lead-magnets/eu-guide',
        fr: '/fr/lead-magnets/eu-guide',
        de: '/de/lead-magnets/eu-guide',
      },
    },
  };
}

export default async function EuGuideLeadMagnetPage() {
  const locale = await resolveLocale();
  const base = getBaseUrl();
  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: 'Hola KCE, quiero la guía Europa → Colombia.',
    url: `${base}${withLocale(locale, '/lead-magnets/eu-guide')}`,
  });

  return (
    <main className="min-h-screen bg-base flex flex-col animate-fade-in">
      
      {/* 01. HERO LANDING PAGE (ADN KCE PREMIUM) */}
      <section className="relative w-full overflow-hidden bg-brand-dark border-b border-brand-dark/10 px-6 py-20 md:py-32">
        {/* Destellos inmersivos */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-blue/10 rounded-full blur-[120px] pointer-events-none translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-yellow/5 rounded-full blur-[100px] pointer-events-none -translate-x-1/4 translate-y-1/4" />
        
        <div className="relative z-10 mx-auto max-w-[var(--container-max)]">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-16 lg:gap-24 items-center">
            
            {/* Columna Izquierda: Mensaje Central */}
            <div>
              <header className="mb-12">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-brand-yellow" /> Recurso Gratuito Premium
                </div>
                
                <h1 className="font-heading text-5xl leading-[1.05] md:text-7xl text-white tracking-tight">
                  Guía de Viaje: <br/>
                  <span className="text-brand-yellow italic font-light opacity-90">Europa → Colombia</span>
                </h1>
                
                <p className="mt-8 text-lg md:text-xl font-light leading-relaxed text-white/70 max-w-xl">
                  Hemos sintetizado años de experiencia local en una guía práctica diseñada específicamente para el viajero europeo. Rutas, seguridad y logística sin complicaciones.
                </p>
              </header>

              {/* El Formulario (Tarjeta de Captación Lujo) */}
              <div className="rounded-[var(--radius-2xl)] bg-surface border border-white/10 p-8 md:p-12 shadow-pop relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue via-brand-yellow to-brand-blue opacity-50"></div>
                
                <div className="mb-8 flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue/5 border border-brand-blue/10 text-brand-blue shadow-sm">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-heading text-main tracking-tight">Recíbela en tu bandeja</h2>
                    <p className="text-sm font-light text-muted">Formato PDF de alta resolución.</p>
                  </div>
                </div>

                <div className="relative z-10">
                  <EuGuideLeadMagnetForm />
                </div>
              </div>
            </div>

            {/* Columna Derecha: Beneficios (Sidebar Editorial) */}
            <aside className="relative rounded-[var(--radius-2xl)] border border-white/10 bg-white/5 backdrop-blur-xl p-10 md:p-14 shadow-soft overflow-hidden group">
              {/* Decoración de fondo sutil */}
              <DownloadCloud className="absolute -bottom-12 -right-12 h-80 w-80 text-white opacity-[0.03] rotate-12 transition-transform duration-1000 group-hover:scale-110" />
              
              <div className="relative z-10">
                <h3 className="font-heading text-2xl text-white mb-10 border-b border-white/10 pb-6 tracking-tight">¿Qué descubrirás?</h3>
                
                <div className="space-y-10">
                  <div className="flex items-start gap-6 group/item">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue group-hover/item:bg-brand-blue group-hover/item:text-white transition-colors duration-300">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div className="pt-1">
                      <h4 className="text-lg font-heading text-white mb-1 tracking-tight">Checklist Definitivo</h4>
                      <p className="text-sm font-light text-white/60 leading-relaxed">Todo lo que necesitas preparar antes, durante y después de aterrizar.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-6 group/item">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue group-hover/item:bg-brand-blue group-hover/item:text-white transition-colors duration-300">
                      <Map className="h-5 w-5" />
                    </div>
                    <div className="pt-1">
                      <h4 className="text-lg font-heading text-white mb-1 tracking-tight">Destinos Curados</h4>
                      <p className="text-sm font-light text-white/60 leading-relaxed">Selección de experiencias culturales y naturales que encajan con tu ritmo.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6 group/item">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue group-hover/item:bg-brand-blue group-hover/item:text-white transition-colors duration-300">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="pt-1">
                      <h4 className="text-lg font-heading text-white mb-1 tracking-tight">Tips de Seguridad</h4>
                      <p className="text-sm font-light text-white/60 leading-relaxed">Recomendaciones reales de locales para moverte con total confianza.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-14 pt-8 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-5 w-5 text-green-400" />
                    </div>
                    <span className="text-[11px] font-light text-white/50 italic leading-relaxed">
                      Tu privacidad es sagrada. No enviamos spam, solo contenido de alto valor para tu viaje.
                    </span>
                  </div>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </section>

      {/* 02. GROWTH DECK SECTION */}
      <section className="mx-auto w-full max-w-[var(--container-max)] px-6 py-24 md:py-32">
        <InternationalGrowthDeck locale={locale} whatsAppHref={waHref} compact />
      </section>

      {/* 03. FOOTER LANDING PAGE (Consistente y Minimalista) */}
      <footer className="border-t border-brand-dark/5 dark:border-white/5 bg-surface-2 mt-auto">
        <div className="mx-auto max-w-[var(--container-max)] px-6 py-16 md:py-24 text-center">
          <p className="text-base text-muted font-light max-w-2xl mx-auto leading-relaxed mb-12">
            KCE (Knowing Cultures Enterprise) es tu aliado para descubrir una Colombia auténtica y segura. 
            Esta guía es un obsequio de nuestro equipo humano para ayudarte a empezar tu viaje con el pie derecho.
          </p>

          <nav aria-label="Enlaces de apoyo" className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em]">
            <Link href={withLocale(locale, '/privacy')} className="text-muted hover:text-brand-blue transition-colors">Privacidad</Link>
            <Link href={withLocale(locale, '/cookies')} className="text-muted hover:text-brand-blue transition-colors">Cookies</Link>
            <Link href={withLocale(locale, '/tours')} className="text-muted hover:text-brand-blue transition-colors">Catálogo de Tours</Link>
            <Link href={withLocale(locale, '/contact')} className="text-muted hover:text-brand-blue transition-colors">Soporte</Link>
          </nav>
        </div>
      </footer>

    </main>
  );
}
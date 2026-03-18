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
    <main className="min-h-screen bg-[var(--color-bg)] pb-24 pt-24 md:pt-32">
      <div className="mx-auto max-w-6xl px-6">
        
        {/* MAIN CONVERSION CARD */}
        <div className="overflow-hidden rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl relative">
          {/* Subtle Accent Line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-blue via-brand-yellow to-brand-blue"></div>
          
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            
            {/* Left Column: Context & Form */}
            <div className="p-10 md:p-16">
              <header className="mb-10">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
                  <Sparkles className="h-3 w-3" /> Recurso Gratuito Premium
                </div>
                
                <h1 className="font-heading text-4xl leading-tight text-brand-blue md:text-5xl">
                  Guía Europa → Colombia
                </h1>
                
                <p className="mt-6 text-lg font-light leading-relaxed text-[var(--color-text)]/70">
                  Hemos sintetizado años de experiencia local en una guía práctica diseñada específicamente para el viajero europeo. Rutas, seguridad y logística sin complicaciones.
                </p>
              </header>

              <section aria-label="Formulario de descarga" className="rounded-3xl bg-[var(--color-surface-2)] p-8 border border-[var(--color-border)] shadow-inner">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue text-white">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-bold text-brand-blue uppercase tracking-widest">Recíbela en tu bandeja</div>
                </div>
                <EuGuideLeadMagnetForm />
              </section>
            </div>

            {/* Right Column: What's inside */}
            <aside className="bg-brand-blue p-10 md:p-16 text-white flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/10 relative overflow-hidden">
              {/* Decorative background icon */}
              <DownloadCloud className="absolute -bottom-10 -right-10 h-64 w-64 text-white/5 rotate-12" />
              
              <div className="relative z-10">
                <h2 className="font-heading text-2xl mb-8 border-b border-white/20 pb-4">Contenido de la guía</h2>
                
                <ul className="space-y-8">
                  <li className="flex gap-4 group">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-brand-yellow transition-transform group-hover:scale-110">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white mb-1">Checklist Definitivo</div>
                      <p className="text-sm font-light text-white/60 leading-relaxed">Todo lo que necesitas preparar antes, durante y después de aterrizar.</p>
                    </div>
                  </li>
                  
                  <li className="flex gap-4 group">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-brand-yellow transition-transform group-hover:scale-110">
                      <Map className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white mb-1">Destinos Curados</div>
                      <p className="text-sm font-light text-white/60 leading-relaxed">Selección de experiencias culturales y naturales que encajan con tu ritmo.</p>
                    </div>
                  </li>

                  <li className="flex gap-4 group">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-brand-yellow transition-transform group-hover:scale-110">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white mb-1">Tips de Seguridad</div>
                      <p className="text-sm font-light text-white/60 leading-relaxed">Recomendaciones reales de locales para moverte con total confianza.</p>
                    </div>
                  </li>
                </ul>

                <div className="mt-12 pt-8 border-t border-white/20">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                    <span className="text-xs font-light text-white/50 italic">Tu privacidad es sagrada. No enviamos spam.</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* GROWTH DECK SECTION */}
        <section className="mt-16">
          <InternationalGrowthDeck locale={locale} whatsAppHref={waHref} compact />
        </section>

        {/* REFINED FOOTER */}
        <footer className="mt-16 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-10 text-center">
          <p className="text-sm text-[var(--color-text)]/50 max-w-2xl mx-auto leading-relaxed mb-8">
            KCE (Knowing Cultures Enterprise) es tu aliado para descubrir una Colombia auténtica y segura. 
            Esta guía es un obsequio de nuestro equipo humano para ayudarte a empezar tu viaje con el pie derecho.
          </p>

          <nav aria-label="Enlaces de apoyo" className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase tracking-widest">
            <Link href={withLocale(locale, '/privacy')} className="text-brand-blue hover:text-brand-yellow transition-colors">Privacidad</Link>
            <Link href={withLocale(locale, '/cookies')} className="text-brand-blue hover:text-brand-yellow transition-colors">Cookies</Link>
            <Link href={withLocale(locale, '/tours')} className="text-brand-blue hover:text-brand-yellow transition-colors">Ver Catálogo de Tours</Link>
            <Link href={withLocale(locale, '/contact')} className="text-brand-blue hover:text-brand-yellow transition-colors">Hablar con Soporte</Link>
          </nav>
        </footer>

      </div>
    </main>
  );
}
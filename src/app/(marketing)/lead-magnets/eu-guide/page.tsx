import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { DownloadCloud, FileCheck, Map, Globe, ShieldCheck, ArrowRight, Sparkles, Mail } from 'lucide-react';

import EuGuideLeadMagnetForm from '@/features/marketing/EuGuideLeadMagnetForm';
import InternationalGrowthDeck from '@/features/marketing/InternationalGrowthDeck';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';

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
    <main className="min-h-screen bg-[color:var(--color-bg)] flex flex-col animate-fade-in">
      
      {/* 01. HERO LANDING PAGE (Editorial Parity) */}
      <section className="relative w-full overflow-hidden bg-[color:var(--color-surface)] border-b border-[color:var(--color-border)] px-6 py-20 md:py-32">
        {/* Destellos sutiles de fondo */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-yellow/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 mx-auto max-w-[var(--container-max)]">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-16 lg:gap-24 items-center">
            
            {/* Columna Izquierda: Contexto y Formulario */}
            <div>
              <header className="mb-10">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-brand-yellow" /> Recurso Gratuito Premium
                </div>
                
                <h1 className="font-heading text-5xl leading-[1.05] md:text-6xl lg:text-7xl text-[color:var(--color-text)] tracking-tight">
                  Guía de Viaje: <br/>
                  <span className="text-brand-blue italic font-light">Europa → Colombia</span>
                </h1>
                
                <p className="mt-6 text-lg font-light leading-relaxed text-[color:var(--color-text-muted)] max-w-xl">
                  Hemos sintetizado años de experiencia local en una guía práctica diseñada específicamente para el viajero europeo. Rutas, seguridad y logística sin complicaciones.
                </p>
              </header>

              {/* El Formulario (Sin la doble caja asfixiante) */}
              <div className="rounded-[var(--radius-2xl)] bg-[color:var(--color-surface-2)]/50 border border-[color:var(--color-border)] p-8 md:p-10 shadow-soft relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue via-brand-yellow to-brand-blue opacity-50"></div>
                <div className="mb-8 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--color-surface)] border border-[color:var(--color-border)] text-brand-blue shadow-sm group-hover:scale-105 transition-transform">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading text-[color:var(--color-text)]">Recíbela en tu bandeja</h2>
                    <p className="text-xs font-light text-[color:var(--color-text-muted)]">Descarga inmediata en PDF.</p>
                  </div>
                </div>
                <EuGuideLeadMagnetForm />
              </div>
            </div>

            {/* Columna Derecha: Beneficios (Glassmorphism Sidebar) */}
            <aside className="relative rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/80 backdrop-blur-xl p-10 shadow-soft overflow-hidden group">
              {/* Decoración de fondo */}
              <DownloadCloud className="absolute -bottom-10 -right-10 h-64 w-64 text-[color:var(--color-text-muted)] opacity-5 rotate-12 transition-transform duration-700 group-hover:scale-110" />
              
              <div className="relative z-10">
                <h3 className="font-heading text-2xl text-[color:var(--color-text)] mb-8 border-b border-[color:var(--color-border)] pb-4 tracking-tight">¿Qué incluye la guía?</h3>
                
                <div className="space-y-8">
                  <div className="flex items-start gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-xl)] bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] text-brand-blue group-hover:border-brand-blue group-hover:text-brand-blue transition-colors">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div className="pt-1">
                      <h4 className="text-base font-heading text-[color:var(--color-text)] mb-1">Checklist Definitivo</h4>
                      <p className="text-sm font-light text-[color:var(--color-text-muted)] leading-relaxed">Todo lo que necesitas preparar antes, durante y después de aterrizar.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-xl)] bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] text-brand-blue group-hover:border-brand-blue group-hover:text-brand-blue transition-colors">
                      <Map className="h-5 w-5" />
                    </div>
                    <div className="pt-1">
                      <h4 className="text-base font-heading text-[color:var(--color-text)] mb-1">Destinos Curados</h4>
                      <p className="text-sm font-light text-[color:var(--color-text-muted)] leading-relaxed">Selección de experiencias culturales y naturales que encajan con tu ritmo.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-xl)] bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] text-brand-blue group-hover:border-brand-blue group-hover:text-brand-blue transition-colors">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="pt-1">
                      <h4 className="text-base font-heading text-[color:var(--color-text)] mb-1">Tips de Seguridad</h4>
                      <p className="text-sm font-light text-[color:var(--color-text-muted)] leading-relaxed">Recomendaciones reales de locales para moverte con total confianza.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-[color:var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-[color:var(--color-success)] shrink-0" />
                    <span className="text-xs font-light text-[color:var(--color-text-muted)] italic leading-relaxed">
                      Tu privacidad es sagrada. No enviamos spam, solo contenido de alto valor para tu viaje.
                    </span>
                  </div>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </section>

      {/* 02. GROWTH DECK SECTION (Sin cajas extra) */}
      <section className="mx-auto w-full max-w-[var(--container-max)] px-6 py-24">
        <InternationalGrowthDeck locale={locale} whatsAppHref={waHref} compact />
      </section>

      {/* 03. FOOTER LANDING PAGE (Minimalista) */}
      <footer className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/30 mt-auto">
        <div className="mx-auto max-w-[var(--container-max)] px-6 py-12 md:py-16 text-center">
          <p className="text-sm text-[color:var(--color-text-muted)] font-light max-w-2xl mx-auto leading-relaxed mb-8">
            KCE (Knowing Cultures Enterprise) es tu aliado para descubrir una Colombia auténtica y segura. 
            Esta guía es un obsequio de nuestro equipo humano para ayudarte a empezar tu viaje con el pie derecho.
          </p>

          <nav aria-label="Enlaces de apoyo" className="flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase tracking-widest">
            <Link href={withLocale(locale, '/privacy')} className="text-[color:var(--color-text-muted)] hover:text-brand-blue transition-colors">Privacidad</Link>
            <Link href={withLocale(locale, '/cookies')} className="text-[color:var(--color-text-muted)] hover:text-brand-blue transition-colors">Cookies</Link>
            <Link href={withLocale(locale, '/tours')} className="text-[color:var(--color-text-muted)] hover:text-brand-blue transition-colors">Catálogo de Tours</Link>
            <Link href={withLocale(locale, '/contact')} className="text-[color:var(--color-text-muted)] hover:text-brand-blue transition-colors">Soporte</Link>
          </nav>
        </div>
      </footer>

    </main>
  );
}
/*src/app/(marketing)/lead-magnets/eu-guide/page.tsx*/
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import {
  DownloadCloud,
  FileCheck,
  Map,
  Globe,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Mail,
} from 'lucide-react';

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
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://kce.travel';
  return raw.trim().replace(/\/+$/, '');
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const base = getBaseUrl();
  const canonical = withLocale(locale, '/lead-magnets/eu-guide');
  return {
    metadataBase: new URL(base),
    title: 'Guía Europa → Colombia | Recurso Exclusivo KCE',
    description:
      'Descarga nuestra guía práctica premium para viajeros europeos planificando su ruta por Colombia. Tips de seguridad, logística y rutas curadas.',
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
    <main className="flex min-h-screen animate-fade-in flex-col bg-base">
      {/* 01. HERO LANDING PAGE (ADN KCE PREMIUM) */}
      <section className="relative w-full overflow-hidden border-b border-brand-dark/10 bg-brand-dark px-6 py-20 md:py-32">
        {/* Destellos inmersivos */}
        <div className="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] -translate-y-1/4 translate-x-1/4 rounded-full bg-brand-blue/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] -translate-x-1/4 translate-y-1/4 rounded-full bg-brand-yellow/5 blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-[var(--container-max)]">
          <div className="grid items-center gap-16 lg:grid-cols-[1.2fr_0.8fr] lg:gap-24">
            {/* Columna Izquierda: Mensaje Central */}
            <div>
              <header className="mb-12">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-brand-yellow" /> Recurso Gratuito Premium
                </div>

                <h1 className="font-heading text-5xl leading-[1.05] tracking-tight text-white md:text-7xl">
                  Guía de Viaje: <br />
                  <span className="font-light italic text-brand-yellow opacity-90">
                    Europa → Colombia
                  </span>
                </h1>

                <p className="mt-8 max-w-xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
                  Hemos sintetizado años de experiencia local en una guía práctica diseñada
                  específicamente para el viajero europeo. Rutas, seguridad y logística sin
                  complicaciones.
                </p>
              </header>

              {/* El Formulario (Tarjeta de Captación Lujo) */}
              <div className="group relative overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-surface p-8 shadow-pop md:p-12">
                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-brand-blue via-brand-yellow to-brand-blue opacity-50"></div>

                <div className="mb-8 flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-blue/10 bg-brand-blue/5 text-brand-blue shadow-sm">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl tracking-tight text-main">
                      Recíbela en tu bandeja
                    </h2>
                    <p className="text-sm font-light text-muted">Formato PDF de alta resolución.</p>
                  </div>
                </div>

                <div className="relative z-10">
                  <EuGuideLeadMagnetForm />
                </div>
              </div>
            </div>

            {/* Columna Derecha: Beneficios (Sidebar Editorial) */}
            <aside className="group relative overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-white/5 p-10 shadow-soft backdrop-blur-xl md:p-14">
              {/* Decoración de fondo sutil */}
              <DownloadCloud className="absolute -bottom-12 -right-12 h-80 w-80 rotate-12 text-white opacity-[0.03] transition-transform duration-1000 group-hover:scale-110" />

              <div className="relative z-10">
                <h3 className="mb-10 border-b border-white/10 pb-6 font-heading text-2xl tracking-tight text-white">
                  ¿Qué descubrirás?
                </h3>

                <div className="space-y-10">
                  <div className="group/item flex items-start gap-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-blue/20 bg-brand-blue/10 text-brand-blue transition-colors duration-300 group-hover/item:bg-brand-blue group-hover/item:text-white">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div className="pt-1">
                      <h4 className="mb-1 font-heading text-lg tracking-tight text-white">
                        Checklist Definitivo
                      </h4>
                      <p className="text-sm font-light leading-relaxed text-white/60">
                        Todo lo que necesitas preparar antes, durante y después de aterrizar.
                      </p>
                    </div>
                  </div>

                  <div className="group/item flex items-start gap-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-blue/20 bg-brand-blue/10 text-brand-blue transition-colors duration-300 group-hover/item:bg-brand-blue group-hover/item:text-white">
                      <Map className="h-5 w-5" />
                    </div>
                    <div className="pt-1">
                      <h4 className="mb-1 font-heading text-lg tracking-tight text-white">
                        Destinos Curados
                      </h4>
                      <p className="text-sm font-light leading-relaxed text-white/60">
                        Selección de experiencias culturales y naturales que encajan con tu ritmo.
                      </p>
                    </div>
                  </div>

                  <div className="group/item flex items-start gap-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-blue/20 bg-brand-blue/10 text-brand-blue transition-colors duration-300 group-hover/item:bg-brand-blue group-hover/item:text-white">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="pt-1">
                      <h4 className="mb-1 font-heading text-lg tracking-tight text-white">
                        Tips de Seguridad
                      </h4>
                      <p className="text-sm font-light leading-relaxed text-white/60">
                        Recomendaciones reales de locales para moverte con total confianza.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-14 border-t border-white/10 pt-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                      <ShieldCheck className="h-5 w-5 text-green-400" />
                    </div>
                    <span className="text-[11px] font-light italic leading-relaxed text-white/50">
                      Tu privacidad es sagrada. No enviamos spam, solo contenido de alto valor para
                      tu viaje.
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
        <InternationalGrowthDeck
          locale={locale}
          whatsAppHref={waHref}
          compact
        />
      </section>

      {/* 03. FOOTER LANDING PAGE (Consistente y Minimalista) */}
      <footer className="mt-auto border-t border-brand-dark/5 bg-surface-2 dark:border-white/5">
        <div className="mx-auto max-w-[var(--container-max)] px-6 py-16 text-center md:py-24">
          <p className="mx-auto mb-12 max-w-2xl text-base font-light leading-relaxed text-muted">
            KCE (Knowing Cultures Enterprise) es tu aliado para descubrir una Colombia auténtica y
            segura. Esta guía es un obsequio de nuestro equipo humano para ayudarte a empezar tu
            viaje con el pie derecho.
          </p>

          <nav
            aria-label="Enlaces de apoyo"
            className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em]"
          >
            <Link
              href={withLocale(locale, '/privacy')}
              className="text-muted transition-colors hover:text-brand-blue"
            >
              Privacidad
            </Link>
            <Link
              href={withLocale(locale, '/cookies')}
              className="text-muted transition-colors hover:text-brand-blue"
            >
              Cookies
            </Link>
            <Link
              href={withLocale(locale, '/tours')}
              className="text-muted transition-colors hover:text-brand-blue"
            >
              Catálogo de Tours
            </Link>
            <Link
              href={withLocale(locale, '/contact')}
              className="text-muted transition-colors hover:text-brand-blue"
            >
              Soporte
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

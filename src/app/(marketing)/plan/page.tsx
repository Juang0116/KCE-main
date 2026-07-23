/* src/app/(marketing)/plan/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import {
  Sparkles,
  MapPin,
  CheckCircle2,
  HeadphonesIcon,
  Compass,
  ArrowRight,
  ShieldCheck,
  Globe2,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import MobileQuickActions from '@/features/marketing/MobileQuickActions';
import PersonalizedPlanForm from '@/features/marketing/PersonalizedPlanForm';
import LaunchTrustRail from '@/features/marketing/LaunchTrustRail';
import PremiumConversionStrip from '@/features/marketing/PremiumConversionStrip';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { getDictionary, type Dictionary } from '@/i18n/getDictionary';

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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const title = 'Diseño de Ruta Personalizada | KCE Colombia';
  const description =
    'Cuéntanos tu estilo de viaje y recibe una propuesta de itinerario oficial de Knowing Cultures S.A.S. diseñada por expertos locales.';
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: withLocale(locale, '/plan') },
  };
}

export default async function PlanPage() {
  const locale = await resolveLocale();
  const dict: Dictionary = await getDictionary(locale);
  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: 'Hola KCE, quiero ayuda con mi plan personalizado para Colombia.',
    url: withLocale(locale, '/plan'),
  });

  return (
    <main className="flex min-h-screen animate-fade-in flex-col overflow-x-hidden bg-base">
      {/* Accesibilidad */}
      <a
        href="#plan-form"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-brand-blue"
      >
        Saltar al formulario
      </a>

      <MobileQuickActions
        locale={locale}
        dict={dict}
        whatsAppHref={waHref}
      />

      {/* 01. HERO PLANIFICADOR (ADN KCE PREMIUM) */}
      <section className="relative w-full overflow-hidden border-b border-white/5 bg-brand-dark px-6 py-24 text-center md:py-32">
        {/* Capas de iluminación inmersiva */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-full max-w-4xl -translate-x-1/2 rounded-full bg-brand-blue/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-brand-yellow/5 blur-[120px]" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.4em] text-white shadow-xl backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-brand-yellow" /> Knowing Cultures S.A.S. • Atelier
            de Viajes
          </div>

          <h1 className="mb-10 font-heading text-5xl leading-[1.05] tracking-tight text-white md:text-7xl lg:text-8xl">
            Tu viaje, diseñado <br className="hidden md:block" />
            <span className="font-light italic text-brand-yellow opacity-90">a tu medida.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-white/60 md:text-xl">
            Cuéntanos cómo te gusta viajar. Cruzaremos tus pasiones con nuestra curaduría oficial
            para entregarte una propuesta de ruta personalizada en menos de 2 minutos.
          </p>
        </div>
      </section>

      {/* Breadcrumb de Navegación */}
      <div className="w-full border-b border-brand-dark/5 bg-surface px-6 py-4 dark:border-white/5">
        <div className="mx-auto flex max-w-[var(--container-max)] items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-muted opacity-80 sm:justify-start">
          <Link
            href={withLocale(locale, '/')}
            className="transition-colors hover:text-brand-blue"
          >
            Inicio
          </Link>
          <ArrowRight className="h-3 w-3 opacity-30" />
          <Link
            href={withLocale(locale, '/tours')}
            className="transition-colors hover:text-brand-blue"
          >
            Tours
          </Link>
          <ArrowRight className="h-3 w-3 opacity-30" />
          <span className="text-main">Planificador de Autor</span>
        </div>
      </div>

      {/* 02. CONTENEDOR DE DISEÑO PRINCIPAL */}
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-1 flex-col gap-24 px-6 py-20 md:py-32">
        <section className="grid items-start gap-16 lg:grid-cols-[1fr_420px]">
          {/* EL FORMULARIO (Espacio de Trabajo) */}
          <div className="relative">
            <header className="mb-16 flex items-center justify-between border-b border-brand-dark/5 pb-12 dark:border-white/5">
              <div className="flex items-center gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-blue/10 bg-brand-blue/5 text-brand-blue shadow-sm transition-transform duration-500 hover:scale-105">
                  <Compass className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="mb-2 font-heading text-3xl tracking-tight text-main md:text-4xl">
                    Configura tu experiencia
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
                    Fase 1: Preferencias y Estilo de Vida
                  </p>
                </div>
              </div>
              <ShieldCheck className="hidden h-10 w-10 text-brand-blue/10 lg:block" />
            </header>

            <div
              id="plan-form"
              className="w-full"
            >
              {/* El componente PersonalizedPlanForm hereda la limpieza visual */}
              <PersonalizedPlanForm />
            </div>
          </div>

          {/* SIDEBAR DE CONFIANZA (Institutional Sidebar) */}
          <aside className="sticky top-32 space-y-10">
            {/* Razones para usar el planificador */}
            <div className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft dark:border-white/10">
              <div className="pointer-events-none absolute right-0 top-0 p-8 text-brand-blue opacity-[0.02]">
                <Globe2 className="h-32 w-32" />
              </div>
              <h3 className="mb-12 font-heading text-2xl tracking-tight text-main">
                El valor de planificar con KCE
              </h3>
              <div className="space-y-12">
                {[
                  {
                    icon: Sparkles,
                    title: 'Opciones Reales',
                    copy: 'No generamos itinerarios genéricos. Te conectamos con experiencias verificadas y disponibles en el terreno.',
                  },
                  {
                    icon: HeadphonesIcon,
                    title: 'Conciergerie Humana',
                    copy: 'Un experto de Knowing Cultures S.A.S. revisará tu selección para asegurar la viabilidad logística.',
                  },
                  {
                    icon: CheckCircle2,
                    title: 'Transparencia Total',
                    copy: 'Recibe tu ruta con precios claros, sin cargos ocultos y con todas las garantías legales de nuestro contrato.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="group/item flex items-start gap-6"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-dark/5 bg-surface-2 text-muted shadow-sm transition-all duration-500 group-hover/item:scale-110 group-hover/item:bg-brand-blue group-hover/item:text-white dark:border-white/5">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="pt-1">
                      <h4 className="mb-2 font-heading text-base tracking-tight text-main transition-colors group-hover/item:text-brand-blue">
                        {item.title}
                      </h4>
                      <p className="text-sm font-light leading-relaxed text-muted">{item.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ACCESO DIRECTO AL CATÁLOGO (Visual Inspiration) */}
            <div className="group relative overflow-hidden rounded-[var(--radius-3xl)] bg-brand-dark p-12 text-center shadow-pop">
              {/* Brillo de fondo */}
              <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-brand-blue/20 blur-[80px]" />

              <div className="pointer-events-none absolute -bottom-8 -right-8 opacity-[0.05] transition-transform duration-1000 group-hover:scale-125">
                <MapPin className="h-64 w-64 text-white" />
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <h3 className="mb-6 font-heading text-2xl tracking-tight text-white">
                  ¿Prefieres explorar solo?
                </h3>
                <p className="mb-10 text-base font-light leading-relaxed text-white/50">
                  Si ya tienes un destino en mente, puedes saltar directamente a nuestro catálogo de
                  historias curadas.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-full border-white/20 bg-white/5 py-8 text-xs font-bold uppercase tracking-widest text-white shadow-xl transition-all hover:bg-white hover:text-brand-dark"
                >
                  <Link
                    href={withLocale(locale, '/tours')}
                    className="flex items-center justify-center gap-3"
                  >
                    Ver Catálogo Completo{' '}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </aside>
        </section>
      </div>

      {/* 03. RAÍL DE CONFIANZA & CONVERSIÓN FINAL */}
      <section className="border-t border-brand-dark/5 bg-surface-2 dark:border-white/5">
        <div className="mx-auto max-w-[var(--container-max)] px-6 py-24 md:py-32">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
              <ShieldCheck className="h-4 w-4" /> Garantía Knowing Cultures
            </div>
            <h2 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
              Estándares de Seguridad
            </h2>
          </div>
          <LaunchTrustRail locale={locale} />
        </div>
      </section>

      {/* Barra de Conversión Inferior */}
      <div className="mt-auto border-t border-brand-dark/5">
        <PremiumConversionStrip
          locale={locale}
          whatsAppHref={waHref ?? null}
        />
      </div>

      {/* Marca de agua legal sutil */}
      <div className="bg-base py-12 text-center">
        <p className="text-muted/30 text-[9px] font-bold uppercase tracking-[0.5em]">
          Knowing Cultures S.A.S. © 2026 — Bogotá, Colombia
        </p>
      </div>
    </main>
  );
}

/* src/app/(marketing)/plan/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { Sparkles, MapPin, CheckCircle2, HeadphonesIcon, Compass, ArrowRight, ShieldCheck, Globe2 } from 'lucide-react';

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
  const description = 'Cuéntanos tu estilo de viaje y recibe una propuesta de itinerario oficial de Knowing Cultures S.A.S. diseñada por expertos locales.';
  return { 
    title, 
    description, 
    robots: { index: true, follow: true },
    alternates: { canonical: withLocale(locale, '/plan') }
  };
}

export default async function PlanPage() {
  const locale = await resolveLocale();
  const dict: Dictionary = await getDictionary(locale);
  const waHref = buildWhatsAppHref({ 
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null, 
    message: 'Hola KCE, quiero ayuda con mi plan personalizado para Colombia.', 
    url: withLocale(locale, '/plan') 
  });

  return (
    <main className="min-h-screen bg-base flex flex-col animate-fade-in overflow-x-hidden">
      {/* Accesibilidad */}
      <a href="#plan-form" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-brand-blue">
        Saltar al formulario
      </a>

      <MobileQuickActions locale={locale} dict={dict} whatsAppHref={waHref} />

      {/* 01. HERO PLANIFICADOR (ADN KCE PREMIUM) */}
      <section className="relative w-full overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center border-b border-white/5">
        {/* Capas de iluminación inmersiva */}
        <div className="absolute top-0 left-1/2 w-full max-w-4xl h-80 bg-brand-blue/10 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-yellow/5 rounded-full blur-[120px] pointer-events-none translate-x-1/3 translate-y-1/3" />
        
        <div className="relative z-10 mx-auto max-w-5xl flex flex-col items-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.4em] text-white shadow-xl backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-brand-yellow" /> Knowing Cultures S.A.S. • Atelier de Viajes
          </div>
          
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white tracking-tight leading-[1.05] mb-10">
            Tu viaje, diseñado <br className="hidden md:block"/>
            <span className="text-brand-yellow font-light italic opacity-90">a tu medida.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg md:text-xl font-light leading-relaxed text-white/60">
            Cuéntanos cómo te gusta viajar. Cruzaremos tus pasiones con nuestra curaduría oficial para entregarte una propuesta de ruta personalizada en menos de 2 minutos.
          </p>
        </div>
      </section>

      {/* Breadcrumb de Navegación */}
      <div className="w-full bg-surface border-b border-brand-dark/5 dark:border-white/5 py-4 px-6">
        <div className="mx-auto max-w-[var(--container-max)] flex items-center justify-center sm:justify-start gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-muted opacity-80">
          <Link href={withLocale(locale, '/')} className="hover:text-brand-blue transition-colors">Inicio</Link>
          <ArrowRight className="h-3 w-3 opacity-30" />
          <Link href={withLocale(locale, '/tours')} className="hover:text-brand-blue transition-colors">Tours</Link>
          <ArrowRight className="h-3 w-3 opacity-30" />
          <span className="text-main">Planificador de Autor</span>
        </div>
      </div>

      {/* 02. CONTENEDOR DE DISEÑO PRINCIPAL */}
      <div className="mx-auto w-full max-w-[var(--container-max)] px-6 py-20 md:py-32 flex flex-col gap-24 flex-1">
        
        <section className="grid gap-16 lg:grid-cols-[1fr_420px] items-start">
          
          {/* EL FORMULARIO (Espacio de Trabajo) */}
          <div className="relative">
            <header className="mb-16 flex items-center justify-between border-b border-brand-dark/5 dark:border-white/5 pb-12">
              <div className="flex items-center gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/5 border border-brand-blue/10 text-brand-blue shadow-sm transition-transform hover:scale-105 duration-500">
                  <Compass className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="font-heading text-3xl md:text-4xl text-main tracking-tight mb-2">Configura tu experiencia</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">Fase 1: Preferencias y Estilo de Vida</p>
                </div>
              </div>
              <ShieldCheck className="hidden lg:block h-10 w-10 text-brand-blue/10" />
            </header>
            
            <div id="plan-form" className="w-full">
              {/* El componente PersonalizedPlanForm hereda la limpieza visual */}
              <PersonalizedPlanForm />
            </div>
          </div>

          {/* SIDEBAR DE CONFIANZA (Institutional Sidebar) */}
          <aside className="space-y-10 sticky top-32">
            
            {/* Razones para usar el planificador */}
            <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/10 bg-surface p-10 shadow-soft relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-brand-blue pointer-events-none">
                 <Globe2 className="h-32 w-32" />
              </div>
              <h3 className="font-heading text-2xl text-main mb-12 tracking-tight">El valor de planificar con KCE</h3>
              <div className="space-y-12">
                {[
                  { icon: Sparkles, title: 'Opciones Reales', copy: 'No generamos itinerarios genéricos. Te conectamos con experiencias verificadas y disponibles en el terreno.' },
                  { icon: HeadphonesIcon, title: 'Conciergerie Humana', copy: 'Un experto de Knowing Cultures S.A.S. revisará tu selección para asegurar la viabilidad logística.' },
                  { icon: CheckCircle2, title: 'Transparencia Total', copy: 'Recibe tu ruta con precios claros, sin cargos ocultos y con todas las garantías legales de nuestro contrato.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-6 group/item">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 border border-brand-dark/5 dark:border-white/5 text-muted transition-all duration-500 group-hover/item:bg-brand-blue group-hover/item:text-white group-hover/item:scale-110 shadow-sm">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="pt-1">
                      <h4 className="text-base font-heading text-main tracking-tight group-hover/item:text-brand-blue transition-colors mb-2">{item.title}</h4>
                      <p className="text-sm font-light leading-relaxed text-muted">{item.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ACCESO DIRECTO AL CATÁLOGO (Visual Inspiration) */}
            <div className="relative overflow-hidden rounded-[var(--radius-3xl)] bg-brand-dark p-12 text-center shadow-pop group">
              {/* Brillo de fondo */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              
              <div className="absolute -right-8 -bottom-8 opacity-[0.05] transition-transform duration-1000 group-hover:scale-125 pointer-events-none">
                <MapPin className="h-64 w-64 text-white" />
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <h3 className="font-heading text-2xl text-white mb-6 tracking-tight">¿Prefieres explorar solo?</h3>
                <p className="text-base font-light text-white/50 mb-10 leading-relaxed">
                  Si ya tienes un destino en mente, puedes saltar directamente a nuestro catálogo de historias curadas.
                </p>
                <Button asChild variant="outline" className="w-full rounded-full border-white/20 text-white bg-white/5 hover:bg-white hover:text-brand-dark transition-all py-8 text-xs font-bold uppercase tracking-widest shadow-xl">
                  <Link href={withLocale(locale, '/tours')} className="flex items-center justify-center gap-3">
                    Ver Catálogo Completo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>

          </aside>

        </section>

      </div>

      {/* 03. RAÍL DE CONFIANZA & CONVERSIÓN FINAL */}
      <section className="bg-surface-2 border-t border-brand-dark/5 dark:border-white/5">
        <div className="mx-auto max-w-[var(--container-max)] px-6 py-24 md:py-32">
          <div className="mb-16 text-center">
             <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue mb-4">
                <ShieldCheck className="h-4 w-4" /> Garantía Knowing Cultures
             </div>
             <h2 className="font-heading text-4xl md:text-5xl text-main tracking-tight">Estándares de Seguridad</h2>
          </div>
          <LaunchTrustRail locale={locale} />
        </div>
      </section>

      {/* Barra de Conversión Inferior */}
      <div className="mt-auto border-t border-brand-dark/5">
        <PremiumConversionStrip locale={locale} whatsAppHref={waHref ?? null} />
      </div>
      
      {/* Marca de agua legal sutil */}
      <div className="py-12 text-center bg-base">
         <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-muted/30">
            Knowing Cultures S.A.S. © 2026 — Bogotá, Colombia
         </p>
      </div>
      
    </main>
  );
}
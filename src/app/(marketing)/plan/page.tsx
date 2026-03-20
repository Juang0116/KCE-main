import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { Sparkles, MapPin, CheckCircle2, HeadphonesIcon, Compass, ArrowRight, ShieldCheck } from 'lucide-react';

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
  const title = 'Plan Personalizado | KCE Colombia';
  const description = 'Cuéntanos tu estilo de viaje y recibe una ruta personalizada por Colombia diseñada por expertos locales.';
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
    <main className="min-h-screen bg-[color:var(--color-bg)] flex flex-col animate-fade-in">
      {/* Accesibilidad */}
      <a href="#plan-form" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-brand-blue">
        Saltar al formulario
      </a>

      <MobileQuickActions locale={locale} dict={dict} whatsAppHref={waHref} />

      {/* 01. HERO PLANIFICADOR (Editorial Parity - Sin fondos oscuros ni cajas ruidosas) */}
      <section className="relative w-full flex flex-col justify-center overflow-hidden bg-[color:var(--color-surface)] border-b border-[color:var(--color-border)] px-6 py-20 md:py-32 text-center">
        {/* Destello sutil azul/amarillo indicando IA + Humano */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-brand-yellow/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-brand-yellow" /> Diseño a Medida
          </div>
          
          <h1 className="font-heading text-5xl leading-tight md:text-7xl lg:text-8xl text-[color:var(--color-text)] drop-shadow-sm tracking-tight mb-6">
            Tu viaje, diseñado <br/>
            <span className="text-brand-blue italic font-light">a tu medida.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-[color:var(--color-text-muted)] md:text-xl">
            Cuéntanos cómo te gusta viajar. Cruzaremos tus intereses con nuestro catálogo para entregarte una ruta clara y personalizada por Colombia en menos de 2 minutos.
          </p>
        </div>
      </section>

      {/* Breadcrumb Orgánico */}
      <div className="w-full bg-[color:var(--color-surface-2)]/30 border-b border-[color:var(--color-border)] py-3 px-6">
        <div className="mx-auto max-w-[var(--container-max)] flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)] opacity-80">
          <Link href={withLocale(locale, '/')} className="hover:text-brand-blue transition-colors">Inicio</Link>
          <ArrowRight className="h-3 w-3" />
          <Link href={withLocale(locale, '/tours')} className="hover:text-brand-blue transition-colors">Tours</Link>
          <ArrowRight className="h-3 w-3" />
          <span className="text-[color:var(--color-text)] opacity-50">Planificador</span>
        </div>
      </div>

      {/* 02. CONTENEDOR PRINCIPAL (Flujo ininterrumpido) */}
      <div className="mx-auto w-full max-w-[var(--container-max)] px-6 py-20 flex flex-col gap-24 flex-1">
        
        <section className="grid gap-12 lg:grid-cols-[1fr_380px] items-start">
          
          {/* EL FORMULARIO (Totalmente fundido con la página, sin caja delimitadora) */}
          <div className="relative">
            <header className="mb-10 flex items-center justify-between border-b border-[color:var(--color-border)] pb-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] text-brand-blue shadow-sm">
                  <Compass className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-heading text-3xl text-[color:var(--color-text)] tracking-tight mb-1">Configura tu experiencia</h2>
                  <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] opacity-70">Paso 1: Estilo y ritmo</p>
                </div>
              </div>
              <ShieldCheck className="hidden sm:block h-8 w-8 text-brand-blue/20" />
            </header>
            
            {/* El formulario respira libremente, eliminamos bg-[color:var(--color-surface)] y shadow-soft */}
            <div id="plan-form" className="w-full">
              <PersonalizedPlanForm />
            </div>
          </div>

          {/* SIDEBAR DE CONFIANZA */}
          <aside className="space-y-8 sticky top-32">
            
            {/* Razones para usar el planificador */}
            <div className="rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/50 p-8 shadow-soft">
              <h3 className="font-heading text-2xl text-[color:var(--color-text)] mb-8 tracking-tight">¿Por qué usar el planificador?</h3>
              <div className="space-y-8">
                {[
                  { icon: Sparkles, title: 'Opciones Reales', copy: 'No generamos itinerarios genéricos. Te conectamos con tours verificados de nuestro catálogo premium.' },
                  { icon: HeadphonesIcon, title: 'Soporte Humano', copy: 'Un asesor KCE revisará tu selección para darte consejos logísticos antes de cualquier pago.' },
                  { icon: CheckCircle2, title: 'Cero Compromiso', copy: 'Recibe tu ruta, analízala con calma y decide si quieres reservar una o varias experiencias.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 group">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-surface)] border border-[color:var(--color-border)] text-[color:var(--color-text-muted)] transition-all group-hover:border-brand-blue group-hover:text-brand-blue group-hover:shadow-sm">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="pt-0.5">
                      <h4 className="text-sm font-semibold text-[color:var(--color-text)] group-hover:text-brand-blue transition-colors mb-1">{item.title}</h4>
                      <p className="text-sm font-light leading-relaxed text-[color:var(--color-text-muted)]">{item.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ACCESO DIRECTO AL CATÁLOGO (Glassmorphism sutil) */}
            <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 text-center shadow-soft group">
              <div className="absolute -right-8 -bottom-8 opacity-[0.03] transition-transform duration-700 group-hover:scale-125">
                <MapPin className="h-40 w-40 text-brand-blue" />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <h3 className="font-heading text-xl text-[color:var(--color-text)] mb-3 tracking-tight">¿Prefieres explorar solo?</h3>
                <p className="text-sm font-light text-[color:var(--color-text-muted)] mb-8 leading-relaxed">
                  Si ya tienes claro lo que buscas, puedes saltar directamente a nuestro catálogo completo y reservar.
                </p>
                <Button asChild variant="outline" className="w-full rounded-full bg-[color:var(--color-surface-2)] border-[color:var(--color-border)] hover:border-brand-blue hover:text-brand-blue transition-colors">
                  <Link href={withLocale(locale, '/tours')} className="flex items-center justify-center gap-2">
                    Ver Catálogo Completo <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

          </aside>

        </section>

      </div>

      {/* 03. RAÍL DE CONFIANZA & CONVERSIÓN */}
      <section className="bg-[color:var(--color-surface-2)]/30 border-t border-[color:var(--color-border)]">
        <div className="mx-auto max-w-[var(--container-max)] px-6 py-20">
          <LaunchTrustRail locale={locale} />
        </div>
      </section>

      {/* Footer Premium Conversion Strip */}
      <div className="mt-auto">
        <PremiumConversionStrip locale={locale} whatsAppHref={waHref ?? null} />
      </div>
      
    </main>
  );
}
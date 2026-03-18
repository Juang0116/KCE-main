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
    <main className="min-h-screen bg-[var(--color-bg)] pb-24">
      {/* Accesibilidad */}
      <a href="#plan-form" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-brand-blue">
        Saltar al formulario
      </a>

      <MobileQuickActions locale={locale} dict={dict} whatsAppHref={waHref} />

      {/* HERO PLANIFICADOR (PREMIUM DARK) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center text-white shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[url('/brand/pattern.png')] bg-repeat"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md">
            <Sparkles className="h-3 w-3" /> IA & Expertos Locales
          </div>
          <h1 className="font-heading text-4xl leading-[1.1] md:text-6xl lg:text-7xl">
            Tu viaje, diseñado <br/>
            <span className="text-brand-yellow font-light italic">a tu medida.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
            Cuéntanos cómo te gusta viajar. En menos de 2 minutos, cruzaremos tus intereses con nuestro catálogo para entregarte una ruta clara y personalizada por Colombia.
          </p>
        </div>
      </section>

      {/* CONTENEDOR DEL FORMULARIO */}
      <section className="mx-auto max-w-7xl px-6 -mt-12 relative z-20">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          
          {/* EL FORMULARIO (BOVEDA BLANCA) */}
          <div className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-16 shadow-2xl">
            <header className="mb-10 flex items-center justify-between border-b border-[var(--color-border)] pb-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
                  <Compass className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl text-brand-blue">Configura tu experiencia</h2>
                  <p className="text-xs font-light text-[var(--color-text)]/50">Paso 1: Definición de estilo y ritmo</p>
                </div>
              </div>
              <ShieldCheck className="hidden sm:block h-8 w-8 text-emerald-500/20" />
            </header>
            
            <div id="plan-form">
              <PersonalizedPlanForm />
            </div>
          </div>

          {/* SIDEBAR DE CONFIANZA */}
          <aside className="space-y-6">
            <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 shadow-sm">
              <h3 className="font-heading text-2xl text-brand-blue mb-8">¿Por qué usar el planificador?</h3>
              <div className="space-y-8">
                {[
                  { icon: Sparkles, title: 'Opciones Reales', copy: 'No generamos itinerarios genéricos. Te conectamos con tours específicos de nuestro catálogo premium.' },
                  { icon: HeadphonesIcon, title: 'Soporte Humano', copy: 'Un asesor de KCE revisará tu selección para darte consejos expertos antes de cualquier pago.' },
                  { icon: CheckCircle2, title: 'Cero Compromiso', copy: 'Recibe tu ruta, analízala con calma y decide si quieres reservar una o varias experiencias.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 group">
                    <div className="rounded-2xl bg-brand-blue/5 p-3 text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-brand-blue">{item.title}</h4>
                      <p className="mt-2 text-sm font-light leading-relaxed text-[var(--color-text)]/60">{item.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ACCESO DIRECTO AL CATALOGO */}
            <div className="rounded-[3rem] border border-brand-blue/10 bg-brand-blue/5 p-10 text-center shadow-inner overflow-hidden relative group">
              <div className="absolute -right-10 -bottom-10 opacity-5 transition-transform group-hover:scale-110">
                <MapPin className="h-40 w-40 text-brand-blue" />
              </div>
              <div className="relative z-10">
                <h3 className="font-heading text-xl text-brand-blue mb-3">¿Prefieres explorar solo?</h3>
                <p className="text-sm font-light text-[var(--color-text)]/60 mb-8 leading-relaxed">
                  Si ya tienes claro lo que buscas, puedes saltar directamente a nuestro catálogo completo.
                </p>
                <Button asChild className="w-full rounded-full py-6 shadow-lg">
                  <Link href={withLocale(locale, '/tours')}>
                    Ver Catálogo Completo <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </aside>

        </div>
      </section>

      {/* RAÍL DE CONFIANZA & CONVERSIÓN */}
      <div className="mx-auto max-w-7xl px-6 mt-24">
        <LaunchTrustRail locale={locale} />
      </div>

      <div className="mt-16">
        <PremiumConversionStrip locale={locale} whatsAppHref={waHref ?? null} />
      </div>
    </main>
  );
}
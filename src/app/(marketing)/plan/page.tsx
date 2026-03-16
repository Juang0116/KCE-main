import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

import MobileQuickActions from '@/features/marketing/MobileQuickActions';
import PersonalizedPlanForm from '@/features/marketing/PersonalizedPlanForm';
import LaunchTrustRail from '@/features/marketing/LaunchTrustRail';
import PremiumConversionStrip from '@/features/marketing/PremiumConversionStrip';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { getDictionary, type Dictionary } from '@/i18n/getDictionary';
import { Sparkles, MapPin, CheckCircle2, HeadphonesIcon } from 'lucide-react';

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
  const canonical = withLocale(locale, '/plan');
  const title = 'Plan personalizado | KCE';
  const description = 'Cuéntanos cómo quieres viajar y recibe experiencias KCE recomendadas según tu estilo, presupuesto y ritmo.';
  return { title, description, robots: { index: true, follow: true }, alternates: { canonical }, openGraph: { title, description, url: canonical, type: 'website' }, twitter: { card: 'summary_large_image', title, description } };
}

export default async function PlanPage() {
  const locale = await resolveLocale();
  const dict: Dictionary = await getDictionary(locale);
  const waHref = buildWhatsAppHref({ number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null, message: process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE || 'Hola KCE, quiero ayuda con un plan personalizado.', url: withLocale(locale, '/plan') });

  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] pb-24">
      <a href="#plan-form" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-modal)] focus:rounded-full focus:bg-[color:var(--color-surface)] focus:px-4 focus:py-2 focus:text-sm focus:shadow-pop">
        Saltar al formulario
      </a>

      <MobileQuickActions locale={locale} dict={dict} whatsAppHref={waHref} />

      {/* HERO PLANIFICADOR */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-20 md:py-28 text-center text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('/images/pattern.svg')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark to-transparent"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow backdrop-blur-md shadow-sm">
            <Sparkles className="h-3 w-3" /> IA & Expertos Locales
          </div>
          <h1 className="font-heading text-4xl leading-tight md:text-6xl drop-shadow-md">
            Tu viaje, diseñado a tu medida.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl">
            Cuéntanos cómo te gusta viajar. En menos de 2 minutos, cruzaremos tus intereses con nuestro catálogo para darte una ruta clara por Colombia.
          </p>
        </div>
      </section>

      {/* CONTENEDOR PRINCIPAL */}
      <section className="mx-auto max-w-6xl px-6 -mt-10 relative z-20">
        
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          
          {/* EL FORMULARIO (Izquierda) */}
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-12 shadow-xl">
            <div className="flex items-center gap-3 mb-2 border-b border-[var(--color-border)] pb-4">
              <MapPin className="h-6 w-6 text-brand-blue" />
              <h2 className="font-heading text-2xl text-[var(--color-text)]">Configura tu experiencia</h2>
            </div>
            
            <div id="plan-form" className="mt-8">
              <PersonalizedPlanForm />
            </div>
          </div>

          {/* SIDEBAR INFORMATIVO (Derecha) */}
          <aside className="space-y-6">
            
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-sm">
              <h3 className="font-heading text-2xl text-brand-blue mb-6">¿Por qué usar el planificador?</h3>
              <div className="space-y-6">
                {[
                  { icon: Sparkles, title: 'Opciones Reales', copy: 'No generamos viajes al azar. Te conectamos con tours específicos de nuestro catálogo premium.' },
                  { icon: HeadphonesIcon, title: 'Soporte Humano', copy: 'Al dejar tu correo, un asesor de KCE podrá revisar tu plan y darte consejos antes de que pagues.' },
                  { icon: CheckCircle2, title: 'Cero Compromiso', copy: 'Recibe tu ruta, mírala con calma y decide si quieres reservar una o varias experiencias.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="rounded-full bg-brand-blue/10 p-2 text-brand-blue shrink-0">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-text)]">{item.title}</h4>
                      <p className="mt-1 text-sm font-light leading-relaxed text-[var(--color-text)]/70">{item.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-brand-blue/20 bg-brand-blue/5 p-8 text-center shadow-sm">
              <h3 className="font-heading text-xl text-brand-blue mb-2">¿Prefieres ver opciones?</h3>
              <p className="text-sm font-light text-[var(--color-text)]/70 mb-6">
                Si te gusta organizar todo por tu cuenta, nuestro catálogo está abierto.
              </p>
              <Link href={withLocale(locale, '/tours')} className="inline-flex w-full items-center justify-center rounded-full bg-brand-blue px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 shadow-md">
                Ver Catálogo Completo
              </Link>
            </div>

          </aside>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 mt-16">
        <LaunchTrustRail locale={locale} />
      </div>

      <PremiumConversionStrip locale={locale} whatsAppHref={waHref ?? null} className="px-6 py-16" />
    </main>
  );
}
import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';

import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import BookingsView from '@/features/bookings/BookingsView';
import AccountServiceRail from '@/features/bookings/components/AccountServiceRail';
import BookingTrustStrip from '@/features/bookings/components/BookingTrustStrip';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';
import { Compass, FileText, LifeBuoy, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mis reservas | KCE',
  description: 'Gestiona y consulta tus reservas en KCE.',
  robots: { index: false, follow: false },
};

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const c = await cookies();
  const v = (h.get('x-kce-locale') || c.get('kce.locale')?.value || '').toLowerCase();
  return SUPPORTED.has(v as SupportedLocale) ? (v as SupportedLocale) : 'es';
}

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (locale === 'es') return href;
  return `/${locale}${href}`;
}

export default async function AccountBookingsPage() {
  const locale = await resolveLocale();

  return (
    <PageShell className="mx-auto max-w-6xl px-6 py-12">
      
      {/* Hero Section VIP */}
      <section className="relative overflow-hidden rounded-[3.5rem] bg-brand-dark shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[url('/images/pattern.svg')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/95 to-brand-blue/40"></div>
        
        <div className="relative z-10 grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-10 md:p-16">
            <div className="inline-flex items-center rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md shadow-sm">
              <Compass className="h-3 w-3 mr-2" /> Itinerario de Viaje
            </div>
            <h1 className="mt-8 font-heading text-4xl text-white md:text-6xl leading-[1.1] drop-shadow-md">
              Tus próximas <br /> aventuras con KCE
            </h1>
            <p className="mt-6 max-w-xl text-base font-light leading-relaxed text-white/70">
              Accede a tus tickets, descarga tus facturas y contacta a tu conserje directamente desde aquí. Todo organizado para que solo te preocupes por disfrutar.
            </p>

            <div className="mt-12 flex flex-wrap gap-5">
              <Button asChild size="lg" className="rounded-full bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90 px-10 h-14 shadow-xl shadow-brand-yellow/10">
                <Link href={withLocale(locale, '/tours')}>
                  Explorar más tours <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-white/20 text-white hover:bg-white/5 px-10 h-14 backdrop-blur-sm">
                <Link href={withLocale(locale, '/account/support')}>
                  Necesito ayuda
                </Link>
              </Button>
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/5 p-10 text-white backdrop-blur-xl lg:border-l lg:border-t-0 md:p-16 flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-yellow/80 mb-10 border-b border-white/10 pb-6">Gestión Rápida</p>
            <div className="space-y-8">
              
              <div className="flex gap-5 group">
                <div className="rounded-2xl bg-white/10 p-3 shrink-0 h-min transition-colors duration-300 group-hover:bg-brand-yellow/20 group-hover:text-brand-yellow">
                  <Compass className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-heading text-xl text-white">Tickets & Fechas</p>
                  <p className="mt-1 text-sm font-light text-white/50 leading-relaxed">Revisa los puntos de encuentro y horarios de tus tours.</p>
                </div>
              </div>
              
              <div className="flex gap-5 group">
                <div className="rounded-2xl bg-white/10 p-3 shrink-0 h-min transition-colors duration-300 group-hover:bg-brand-yellow/20 group-hover:text-brand-yellow">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-heading text-xl text-white">Facturación Segura</p>
                  <p className="mt-1 text-sm font-light text-white/50 leading-relaxed">Descarga tus recibos en PDF generados a través de Stripe.</p>
                </div>
              </div>
              
              <div className="flex gap-5 group">
                <div className="rounded-2xl bg-white/10 p-3 shrink-0 h-min transition-colors duration-300 group-hover:bg-brand-yellow/20 group-hover:text-brand-yellow">
                  <LifeBuoy className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-heading text-xl text-white">Soporte Contextual</p>
                  <p className="mt-1 text-sm font-light text-white/50 leading-relaxed">Pide ayuda sobre una reserva específica sin repetir datos.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <div className="mt-12">
        <BookingTrustStrip />
      </div>

      {/* Historial Activo */}
      <section className="mt-12 rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 md:p-16 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-blue via-brand-yellow to-emerald-500"></div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 border-b border-[var(--color-border)] pb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/50">Historial Activo</p>
            <h2 className="mt-3 font-heading text-4xl text-brand-blue">Tus Reservas</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 shadow-sm">
            <CheckCircle2 className="h-4 w-4" /> Transacciones Seguras
          </div>
        </div>
        <BookingsView />
      </section>

      <section className="mt-16">
        <AccountServiceRail localePrefix={locale === 'es' ? '' : `/${locale}`} />
      </section>

      <section className="mt-16">
        <LaunchCommandActionDeck
          eyebrow="Comandos de Ayuda"
          title="¿Necesitas modificar algo?"
          description="Selecciona la ruta adecuada si deseas escalar un caso con un agente de KCE o seguir explorando."
          actions={[
            { href: withLocale(locale, '/account/support?source=account-bookings'), label: 'Abrir ticket de soporte', detail: 'Atención personalizada para tus reservas actuales.', tone: 'primary' },
            { href: withLocale(locale, '/contact?source=account-bookings'), label: 'Contactar Asesor', detail: 'Handoff humano para casos complejos o tours privados.' },
            { href: withLocale(locale, '/account'), label: 'Volver a Perfil', detail: 'Revisa seguridad y actividad de tu cuenta.' },
            { href: withLocale(locale, '/tours'), label: 'Ver más tours', detail: 'El viaje no termina aquí. Descubre más de Colombia.' },
          ]}
        />
      </section>
    </PageShell>
  );
}
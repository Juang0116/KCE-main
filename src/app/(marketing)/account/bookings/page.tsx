import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { PageShell } from '@/components/layout/PageShell';
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

async function resolveLocale(): Promise<SupportedLocale> {
  const c = await cookies();
  const v = (c.get('kce.locale')?.value || '').toLowerCase();
  return v === 'en' || v === 'fr' || v === 'de' ? v : 'es';
}

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

export default async function AccountBookingsPage() {
  const locale = await resolveLocale();

  return (
    <PageShell className="mx-auto max-w-6xl px-6 py-12">
      
      {/* Hero Section VIP */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-brand-dark shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[url('/images/pattern.svg')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark to-brand-blue/40"></div>
        
        <div className="relative z-10 grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-8 md:p-12">
            <div className="inline-flex items-center rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow backdrop-blur-md">
              Itinerario de Viaje
            </div>
            <h1 className="mt-5 font-heading text-4xl text-white md:text-5xl leading-tight">
              Tus próximas aventuras con KCE
            </h1>
            <p className="mt-4 max-w-xl text-sm font-light leading-relaxed text-white/80 md:text-base">
              Accede a tus tickets, descarga tus facturas y contacta a tu conserje directamente desde aquí. Todo organizado para que solo te preocupes por disfrutar.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={withLocale(locale, '/tours')} className="flex items-center gap-2 rounded-full bg-brand-yellow px-6 py-3 text-xs font-bold uppercase tracking-widest text-brand-dark transition hover:bg-brand-yellow/90 hover:scale-105 shadow-md">
                Explorar más tours <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={withLocale(locale, '/account/support')} className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-brand-dark backdrop-blur-sm">
                Necesito ayuda
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/5 p-8 text-white backdrop-blur-sm lg:border-l lg:border-t-0 md:p-12 flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-yellow/80 mb-5">Gestión Rápida</p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Compass className="h-6 w-6 text-brand-yellow shrink-0" />
                <div>
                  <p className="font-heading text-lg text-white">Tickets & Fechas</p>
                  <p className="mt-1 text-xs font-light text-white/70 leading-relaxed">Revisa los puntos de encuentro y horarios de tus tours reservados.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <FileText className="h-6 w-6 text-brand-yellow shrink-0" />
                <div>
                  <p className="font-heading text-lg text-white">Facturación Segura</p>
                  <p className="mt-1 text-xs font-light text-white/70 leading-relaxed">Descarga tus recibos en PDF generados a través de Stripe.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <LifeBuoy className="h-6 w-6 text-brand-yellow shrink-0" />
                <div>
                  <p className="font-heading text-lg text-white">Soporte Contextual</p>
                  <p className="mt-1 text-xs font-light text-white/70 leading-relaxed">Pide ayuda sobre una reserva específica sin repetir tu información.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10">
        <BookingTrustStrip />
      </div>

      {/* Bookings View (El Client Component que carga los datos) */}
      <section className="mt-10 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-soft md:p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-blue via-brand-yellow to-emerald-500"></div>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Historial Activo</p>
            <h2 className="mt-2 font-heading text-3xl text-brand-blue">Tus Reservas</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Transacciones Seguras
          </div>
        </div>
        <BookingsView />
      </section>

      <section className="mt-10">
        <AccountServiceRail localePrefix={`/${locale}`} />
      </section>

      <section className="mt-10">
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
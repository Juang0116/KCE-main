import Link from 'next/link';
import type { Metadata } from 'next';

import { cookies } from 'next/headers';

import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import BookingsView from '@/features/bookings/BookingsView';
import AccountServiceRail from '@/features/bookings/components/AccountServiceRail';
import BookingTrustStrip from '@/features/bookings/components/BookingTrustStrip';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';

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
    <PageShell className="max-w-6xl px-6">
      <section className="overflow-hidden rounded-[2rem] border border-brand-blue/12 bg-[color:var(--color-surface)] shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-8 md:p-10">
            <div className="inline-flex items-center rounded-full border border-brand-blue/12 bg-brand-blue/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-brand-blue">
              Mis reservas
            </div>
            <h1 className="mt-5 font-heading text-3xl text-brand-blue md:text-5xl">Gestiona tus reservas sin perder el hilo</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--color-text)]/72 md:text-base">
              Esta vista reúne lo importante: abrir una reserva, revisar la factura, volver a soporte o seguir explorando experiencias sin empezar desde cero.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={withLocale(locale, '/account/support')}>Necesito ayuda</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={withLocale(locale, '/tours')}>Explorar tours</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={withLocale(locale, '/wishlist')}>Ver wishlist</Link>
              </Button>
            </div>
          </div>

          <div className="border-t border-brand-blue/10 bg-brand-blue p-8 text-white lg:border-l lg:border-t-0 md:p-10">
            <p className="text-xs uppercase tracking-[0.18em] text-white/65">Qué puedes resolver aquí</p>
            <div className="mt-5 space-y-3">
              {[
                ['Reserva', 'Reabre tu booking y encuentra la experiencia correcta más rápido.'],
                ['Factura', 'Abre o descarga tu invoice sin depender del checkout inicial.'],
                ['Soporte', 'Pide ayuda con el contexto correcto desde la misma cuenta.'],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-2xl bg-white/10 p-4">
                  <p className="font-heading text-lg text-white">{title}</p>
                  <p className="mt-1 text-sm text-white/78">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8">
        <BookingTrustStrip />
      </div>

      <section className="mt-8">
        <AccountServiceRail localePrefix={`/${locale}`} />
      </section>


      <section className="mt-8">
        <LaunchCommandActionDeck
          eyebrow="booking command"
          title="Tus reservas ya deberían tener una salida rápida hacia soporte, contacto y reentrada comercial"
          description="Esta franja final mantiene visible qué hacer cuando el viajero solo quiere recuperar un documento, resolver una incidencia o seguir explorando."
          actions={[
            { href: withLocale(locale, '/account/support?source=account-bookings'), label: 'Abrir soporte', detail: 'Escala problemas de booking o factura sin crear fricción extra.', tone: 'primary' },
            { href: withLocale(locale, '/contact?source=account-bookings'), label: 'Hablar con KCE', detail: 'Deja un handoff humano cuando el caso necesite seguimiento comercial.' },
            { href: withLocale(locale, '/account'), label: 'Volver a cuenta', detail: 'Revisa seguridad, actividad y continuidad desde el mismo centro.' },
            { href: withLocale(locale, '/tours'), label: 'Ver más tours', detail: 'Extiende el viaje o compara nuevas experiencias desde el catálogo.' },
          ]}
        />
      </section>

      <section className="mt-8 rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">Booking hub</p>
            <h2 className="mt-2 font-heading text-2xl text-brand-blue">Tus reservas activas</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-brand-blue">
            cuenta clara
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-[color:var(--color-text)]/72">
          Usa esta vista para volver a una reserva, abrir activos post-compra o pedir ayuda sin duplicar conversaciones.
        </p>

        <div className="mt-6">
          <BookingsView />
        </div>
      </section>
    </PageShell>
  );
}

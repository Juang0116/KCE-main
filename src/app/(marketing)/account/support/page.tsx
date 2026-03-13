// src/app/(marketing)/account/support/page.tsx
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { PageShell } from '@/components/layout/PageShell';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';
import SupportCenter from '@/features/auth/SupportCenter';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

export const metadata: Metadata = {
  title: 'Soporte | KCE',
  description: 'Crea tickets de soporte y consulta el estado de tus solicitudes.',
  robots: { index: false, follow: false },
};

async function resolveLocale(): Promise<SupportedLocale> {
  const c = await cookies();
  const v = (c.get('kce.locale')?.value || '').toLowerCase();
  return v === 'en' || v === 'fr' || v === 'de' ? v : 'es';
}

export default async function AccountSupportPage() {
  const locale = await resolveLocale();
  const localePrefix = `/${locale}`;

  return (
    <PageShell className="max-w-6xl px-6 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      <section className="overflow-hidden rounded-[2rem] border border-brand-blue/12 bg-[color:var(--color-surface)] shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-8 md:p-10">
            <div className="inline-flex items-center rounded-full border border-brand-blue/12 bg-brand-blue/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-brand-blue">
              soporte con continuidad
            </div>
            <h1 className="mt-5 font-heading text-3xl text-brand-blue md:text-5xl">Abre soporte sin romper el hilo de tu viaje</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--color-text)]/72 md:text-base">
              Desde aquí puedes crear tickets, retomar conversaciones activas y escalar incidencias con el contexto correcto de booking, pago o logística.
            </p>
          </div>

          <div className="border-t border-brand-blue/10 bg-brand-blue p-8 text-white lg:border-l lg:border-t-0 md:p-10">
            <p className="text-xs uppercase tracking-[0.18em] text-white/65">Qué conviene traer</p>
            <div className="mt-5 space-y-3">
              {[
                ['Booking / invoice', 'Si vienes desde una reserva, conserva el ID o el enlace seguro para no perder continuidad.'],
                ['Resumen corto', 'Explica qué pasó, qué esperabas y qué resultado necesitas.'],
                ['Canal correcto', 'Si el caso sigue vivo, abre o continúa el ticket antes de escribir por varios lados.'],
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


      <section className="mt-8">
        <LaunchCommandActionDeck
          eyebrow="support command"
          title="Antes de abrir un caso, deja visibles las reentradas que evitan perder tiempo"
          description="Soporte funciona mejor cuando el viajero puede volver a reservas, abrir contacto premium o retomar cuenta sin duplicar conversaciones."
          actions={[
            { href: `${localePrefix}/account/bookings`, label: 'Mis reservas', detail: 'Recupera el booking antes de abrir otro canal.', tone: 'primary' },
            { href: `${localePrefix}/contact?source=account-support`, label: 'Contacto premium', detail: 'Escala a KCE con contexto cuando el caso lo pida.' },
            { href: `${localePrefix}/account`, label: 'Mi cuenta', detail: 'Vuelve a seguridad, actividad y continuidad desde la base central.' },
            { href: `${localePrefix}/tours`, label: 'Explorar tours', detail: 'Retoma el catálogo si el soporte ya quedó encaminado.' },
          ]}
        />
      </section>

      <section className="mt-8">
        <SupportCenter />
      </section>
    </PageShell>
  );
}

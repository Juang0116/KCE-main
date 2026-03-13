import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { PageShell } from '@/components/layout/PageShell';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';
import TicketThread from '@/features/auth/TicketThread';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

export const metadata: Metadata = {
  title: 'Ticket | KCE',
  description: 'Seguimiento de ticket de soporte.',
  robots: { index: false, follow: false },
};

async function resolveLocale(): Promise<SupportedLocale> {
  const c = await cookies();
  const v = (c.get('kce.locale')?.value || '').toLowerCase();
  return v === 'en' || v === 'fr' || v === 'de' ? v : 'es';
}

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await resolveLocale();
  const localePrefix = `/${locale}`;

  return (
    <PageShell className="max-w-6xl px-6 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      <section className="mt-8">
        <LaunchCommandActionDeck
          eyebrow="ticket command"
          title="Este ticket ya forma parte de una salida de lanzamiento más clara"
          description="Mientras el caso está abierto, conviene dejar visibles las rutas para volver a reservas, soporte general, contacto premium o cuenta."
          actions={[
            { href: `${localePrefix}/account/bookings`, label: 'Mis reservas', detail: 'Recupera booking e invoice sin abandonar el hilo.', tone: 'primary' },
            { href: `${localePrefix}/account/support`, label: 'Centro de soporte', detail: 'Vuelve al listado general y a otros tickets cuando haga falta.' },
            { href: `${localePrefix}/contact?source=ticket-thread&ticket=${encodeURIComponent(id)}`, label: 'Escalar por contacto', detail: 'Pasa este caso al carril comercial/humano con el ticket adjunto.' },
            { href: `${localePrefix}/account`, label: 'Mi cuenta', detail: 'Regresa al centro premium del viajero sin perder continuidad.' },
          ]}
        />
      </section>

      <section className="mt-8">
        <TicketThread ticketId={id} />
      </section>
    </PageShell>
  );
}
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { PageShell } from '@/components/layout/PageShell';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';
import TicketThread from '@/features/auth/TicketThread';
import { MessagesSquare } from 'lucide-react'; // Eliminamos ShieldAlert para limpiar el warning

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

export const metadata: Metadata = {
  title: 'Detalle del Ticket | KCE',
  description: 'Seguimiento de ticket de soporte.',
  robots: { index: false, follow: false },
};

async function resolveLocale(): Promise<SupportedLocale> {
  const c = await cookies();
  const v = (c.get('kce.locale')?.value || '').toLowerCase();
  return v === 'en' || v === 'fr' || v === 'de' ? (v as SupportedLocale) : 'es';
}

export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await resolveLocale();
  
  // Evitamos rutas como /es/account... si el español es el idioma por defecto
  const localePrefix = locale === 'es' ? '' : `/${locale}`;

  return (
    <PageShell className="mx-auto max-w-4xl px-6 py-12 md:py-20 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      
      {/* Header del Ticket - Estilo Conserjería */}
      <div className="mb-12 border-b border-[var(--color-border)] pb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue mb-5 shadow-sm">
            <MessagesSquare className="h-3 w-3" /> Hilo de Conversación
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            Seguimiento de Caso
          </h1>
          <p className="mt-4 text-base font-light text-[var(--color-text)]/70 flex flex-wrap items-center justify-center md:justify-start gap-2">
            Ticket ID: <span className="font-mono text-xs bg-[var(--color-surface-2)] px-3 py-1.5 rounded-md border border-[var(--color-border)] text-[var(--color-text)]/80 shadow-sm">{id}</span>
          </p>
        </div>

        {/* Ícono de soporte flotante */}
        <div className="hidden md:flex shrink-0 items-center justify-center h-20 w-20 rounded-[1.5rem] bg-brand-blue/5 border border-brand-blue/10 shadow-sm">
          <MessagesSquare className="h-10 w-10 text-brand-blue/40" />
        </div>
      </div>

      {/* Componente del Hilo (Chat/Respuestas) - Bóveda Visual */}
      <section className="relative overflow-hidden rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl mb-16">
        {/* Línea de detalle superior */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-blue via-brand-blue/50 to-transparent"></div>
        <div className="relative z-10 p-2 md:p-6">
          <TicketThread ticketId={id} />
        </div>
      </section>

      {/* Rutas de escape si el caso no avanza */}
      <section>
        <LaunchCommandActionDeck
          eyebrow="Ticket Command"
          title="Opciones adicionales"
          description="Si tu caso es urgente o necesitas cambiar de canal, aquí tienes las rutas rápidas sin perder el contexto."
          actions={[
            { href: `${localePrefix}/account/bookings`, label: 'Mis reservas', detail: 'Revisa tu itinerario y facturas.', tone: 'primary' },
            { href: `${localePrefix}/account/support`, label: 'Volver a Soporte', detail: 'Regresa al listado general de tus tickets.' },
            { href: `${localePrefix}/contact?source=ticket-thread&ticket=${encodeURIComponent(id)}`, label: 'Escalar por Email', detail: 'Pasa este caso al carril comercial directo adjuntando este ID.' },
          ]}
        />
      </section>

    </PageShell>
  );
}
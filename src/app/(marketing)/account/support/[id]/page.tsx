/* src/app/(marketing)/account/support/[id]/page.tsx */
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { PageShell } from '@/components/layout/PageShell';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';
import TicketThread from '@/features/auth/TicketThread';
import { MessagesSquare, Hash } from 'lucide-react'; 

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
    <PageShell className="mx-auto w-full max-w-[var(--container-max)] px-6 py-12 md:py-20 pb-[calc(10rem+env(safe-area-bottom))] animate-fade-in bg-base">
      
      {/* 01. HEADER DEL TICKET (Premium Minimalista) */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/10 dark:border-white/10 pb-8">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
            <MessagesSquare className="h-3 w-3" /> Hilo de Conversación
          </div>
          
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tight">
            Seguimiento de Caso
          </h1>
          
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-light text-muted">
            <span className="opacity-80">ID de Referencia:</span>
            <div className="flex items-center gap-1.5 rounded-md border border-brand-dark/5 dark:border-white/5 bg-surface-2 px-3 py-1.5 font-mono text-[11px] font-medium text-main shadow-sm">
              <Hash className="h-3.5 w-3.5 text-brand-blue/60" /> {id}
            </div>
          </div>
        </div>

        {/* Ícono de soporte sutil */}
        <div className="hidden md:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-2 border border-brand-dark/5 dark:border-white/5 shadow-sm transition-transform hover:scale-105 group">
          <MessagesSquare className="h-8 w-8 text-muted opacity-50 group-hover:text-brand-blue group-hover:opacity-100 transition-colors" />
        </div>
      </header>

      {/* 02. ZONA PRINCIPAL (El hilo de mensajes) */}
      <section className="mb-16 rounded-[var(--radius-2xl)] border border-brand-dark/10 dark:border-white/10 bg-surface shadow-soft overflow-hidden">
        {/* Línea de detalle superior ultra fina */}
        <div className="h-1 w-full bg-gradient-to-r from-brand-blue/20 via-brand-blue/60 to-transparent"></div>
        <div className="p-6 md:p-10">
          <TicketThread ticketId={id} />
        </div>
      </section>

      {/* 03. RUTAS DE ESCAPE (Launch Command) */}
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
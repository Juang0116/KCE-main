import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { PageShell } from '@/components/layout/PageShell';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';
import SupportCenter from '@/features/auth/SupportCenter';
import { ShieldCheck, MessageSquare, HeadphonesIcon, Clock } from 'lucide-react';

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
    <PageShell className="mx-auto max-w-6xl px-6 py-12 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      
      {/* Hero Concierge */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-brand-dark shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[url('/images/pattern.svg')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-dark/90 to-brand-blue/30"></div>
        
        <div className="relative z-10 grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-8 md:p-12">
            <div className="inline-flex items-center rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow backdrop-blur-md">
              Conserjería 24/7
            </div>
            <h1 className="mt-5 font-heading text-4xl text-white md:text-5xl leading-tight">
              ¿En qué podemos ayudarte hoy?
            </h1>
            <p className="mt-4 max-w-xl text-sm font-light leading-relaxed text-white/80 md:text-base">
              Desde aquí puedes crear tickets, retomar conversaciones activas y resolver incidencias con prioridad, manteniendo siempre el contexto de tus reservas.
            </p>
          </div>

          <div className="border-t border-white/10 bg-white/5 p-8 text-white backdrop-blur-sm lg:border-l lg:border-t-0 md:p-12">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-yellow/80 mb-5">Tips para un Soporte Rápido</p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-heading text-base text-white">Booking ID</p>
                  <p className="mt-1 text-xs font-light text-white/70">Si tu consulta es sobre una reserva, tener el ID a la mano acelera la resolución.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <MessageSquare className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-heading text-base text-white">Sé Específico</p>
                  <p className="mt-1 text-xs font-light text-white/70">Explica qué pasó, qué esperabas y qué resultado necesitas del equipo.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Clock className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-heading text-base text-white">Conserva el Hilo</p>
                  <p className="mt-1 text-xs font-light text-white/70">Responde sobre el ticket abierto en lugar de crear uno nuevo para el mismo caso.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Componente Principal de Soporte */}
      <section className="mt-10 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-soft md:p-12 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Centro de Asistencia</p>
            <h2 className="mt-2 font-heading text-3xl text-brand-blue">Tus Tickets de Soporte</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-blue">
            <HeadphonesIcon className="h-3 w-3" /> Equipo Real Activo
          </div>
        </div>
        <SupportCenter />
      </section>

      <section className="mt-10">
        <LaunchCommandActionDeck
          eyebrow="Otras Rutas"
          title="¿Buscas algo más?"
          description="Soporte funciona mejor cuando evitamos duplicar conversaciones. Usa estos atajos si necesitas ir a otra sección."
          actions={[
            { href: `${localePrefix}/account/bookings`, label: 'Ir a Mis Reservas', detail: 'Recupera el booking antes de abrir un caso.', tone: 'primary' },
            { href: `${localePrefix}/contact?source=account-support`, label: 'Contacto Premium', detail: 'Solicita asesoría para tours privados a la medida.' },
            { href: `${localePrefix}/account`, label: 'Volver al Perfil', detail: 'Regresa a la pantalla principal de tu cuenta.' },
            { href: `${localePrefix}/tours`, label: 'Explorar Catálogo', detail: 'Vuelve a ver los tours si el problema ya se resolvió.' },
          ]}
        />
      </section>

    </PageShell>
  );
}
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { PageShell } from '@/components/layout/PageShell';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';
import SupportCenter from '@/features/auth/SupportCenter';
import { ShieldCheck, MessageSquare, HeadphonesIcon, Clock, HeartHandshake } from 'lucide-react';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

export const metadata: Metadata = {
  title: 'Soporte | KCE',
  description: 'Crea tickets de soporte y consulta el estado de tus solicitudes.',
  robots: { index: false, follow: false },
};

async function resolveLocale(): Promise<SupportedLocale> {
  const c = await cookies();
  const v = (c.get('kce.locale')?.value || '').toLowerCase();
  return v === 'en' || v === 'fr' || v === 'de' ? (v as SupportedLocale) : 'es';
}

export default async function AccountSupportPage() {
  const locale = await resolveLocale();
  // Arreglo para que el idioma por defecto ('es') no ensucie la URL
  const localePrefix = locale === 'es' ? '' : `/${locale}`;

  return (
    <PageShell className="mx-auto max-w-6xl px-6 py-12 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      
      {/* Hero Concierge VIP */}
      <section className="relative overflow-hidden rounded-[3.5rem] bg-brand-dark shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[url('/images/pattern.svg')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/95 to-brand-blue/40"></div>
        
        <div className="relative z-10 grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-10 md:p-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md shadow-sm">
              <HeartHandshake className="h-3 w-3" /> Conserjería 24/7
            </div>
            <h1 className="mt-8 font-heading text-4xl text-white md:text-6xl leading-[1.1] drop-shadow-md">
              ¿En qué podemos <br /> ayudarte hoy?
            </h1>
            <p className="mt-6 max-w-xl text-base font-light leading-relaxed text-white/70">
              Crea tickets, retoma conversaciones activas y resuelve incidencias con prioridad. Nuestro equipo humano tiene todo el contexto de tus reservas para ser más eficientes.
            </p>
          </div>

          <div className="border-t border-white/10 bg-white/5 p-10 text-white backdrop-blur-xl lg:border-l lg:border-t-0 md:p-16 flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-yellow/80 mb-10 border-b border-white/10 pb-6">Tips de Soporte</p>
            <div className="space-y-8">
              
              <div className="flex gap-5 group">
                <div className="rounded-2xl bg-white/10 p-3 shrink-0 h-min transition-colors duration-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-400">
                  <ShieldCheck className="h-6 w-6 text-emerald-400/70 group-hover:text-emerald-400" />
                </div>
                <div>
                  <p className="font-heading text-xl text-white">Booking ID</p>
                  <p className="mt-1 text-sm font-light text-white/50 leading-relaxed">Selecciona la reserva correcta para acelerar la resolución.</p>
                </div>
              </div>
              
              <div className="flex gap-5 group">
                <div className="rounded-2xl bg-white/10 p-3 shrink-0 h-min transition-colors duration-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-400">
                  <MessageSquare className="h-6 w-6 text-emerald-400/70 group-hover:text-emerald-400" />
                </div>
                <div>
                  <p className="font-heading text-xl text-white">Sé Específico</p>
                  <p className="mt-1 text-sm font-light text-white/50 leading-relaxed">Explica qué pasó, qué esperabas y qué necesitas del equipo.</p>
                </div>
              </div>
              
              <div className="flex gap-5 group">
                <div className="rounded-2xl bg-white/10 p-3 shrink-0 h-min transition-colors duration-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-400">
                  <Clock className="h-6 w-6 text-emerald-400/70 group-hover:text-emerald-400" />
                </div>
                <div>
                  <p className="font-heading text-xl text-white">Conserva el Hilo</p>
                  <p className="mt-1 text-sm font-light text-white/50 leading-relaxed">Responde siempre sobre el ticket abierto en lugar de crear uno nuevo.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Componente Principal de Soporte */}
      <section className="mt-12 rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 md:p-16 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-blue via-brand-blue/50 to-transparent"></div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 border-b border-[var(--color-border)] pb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/50">Centro de Asistencia</p>
            <h2 className="mt-3 font-heading text-4xl text-brand-blue">Tus Tickets de Soporte</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/10 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-brand-blue shadow-sm">
            <HeadphonesIcon className="h-4 w-4" /> Equipo Humano Activo
          </div>
        </div>
        <SupportCenter />
      </section>

      <section className="mt-16">
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
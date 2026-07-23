/* src/app/(marketing)/account/support/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

import { PageShell } from '@/components/layout/PageShell';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';
import SupportCenter from '@/features/auth/SupportCenter';
import {
  ShieldCheck,
  MessageSquare,
  HeadphonesIcon,
  Clock,
  HeartHandshake,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
    <PageShell className="mx-auto w-full max-w-[var(--container-max)] animate-fade-in bg-base px-6 py-12 md:py-20">
      {/* 01. HEADER DEL DASHBOARD (Premium Minimalista) */}
      <header className="mb-12 flex flex-col justify-between gap-6 border-b border-brand-dark/10 pb-8 dark:border-white/10 md:flex-row md:items-end">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow shadow-sm">
            <HeartHandshake className="h-3 w-3" /> Conserjería 24/7
          </div>
          <h1 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
            ¿En qué podemos ayudarte?
          </h1>
          <p className="mt-4 max-w-xl text-base font-light leading-relaxed text-muted">
            Crea tickets, retoma conversaciones activas y resuelve incidencias. Nuestro equipo tiene
            todo el contexto de tus reservas para ser más eficientes.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-4">
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-full border-brand-dark/10 bg-surface px-6 text-xs font-bold uppercase tracking-widest text-main shadow-sm transition-transform hover:-translate-y-1 hover:bg-surface-2 dark:border-white/10"
          >
            <Link href={`${localePrefix}/account/bookings`}>Ir a mis reservas</Link>
          </Button>
          <Button
            asChild
            className="h-12 rounded-full bg-green-600 px-8 text-xs font-bold uppercase tracking-widest text-white shadow-pop transition-transform hover:-translate-y-1 hover:bg-green-700"
          >
            <Link href={`${localePrefix}/contact?source=support-center`}>
              Chat Directo <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid items-start gap-12 lg:grid-cols-[1fr_350px]">
        {/* 02. ZONA PRINCIPAL (Tabla de Tickets) */}
        <div className="space-y-12">
          <section className="overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/10 bg-surface shadow-soft dark:border-white/10">
            <div className="bg-surface-2/30 flex flex-col justify-between gap-4 border-b border-brand-dark/5 p-6 dark:border-white/5 sm:flex-row sm:items-center md:p-8">
              <div>
                <h2 className="font-heading text-2xl tracking-tight text-main">
                  Centro de Asistencia
                </h2>
                <p className="mt-1 text-sm font-light text-muted">
                  Listado de tickets activos e históricos.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-brand-blue/20 bg-brand-blue/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-blue">
                <HeadphonesIcon className="h-4 w-4" /> Equipo Humano
              </div>
            </div>

            <div className="p-4 sm:p-6 md:p-8">
              {/* Aquí se renderiza tu tabla/listado real de tickets.
                  (Asegúrate de que SupportCenter no tenga corchetes feos internamente) */}
              <SupportCenter />
            </div>
          </section>

          {/* Action Deck (Comandos) */}
          <section className="pt-4">
            <LaunchCommandActionDeck
              eyebrow="Otras Rutas"
              title="¿Buscas algo más?"
              description="Soporte funciona mejor cuando evitamos duplicar conversaciones. Usa estos atajos si necesitas ir a otra sección."
              actions={[
                {
                  href: `${localePrefix}/account/bookings`,
                  label: 'Ir a Mis Reservas',
                  detail: 'Recupera el booking antes de abrir un caso.',
                  tone: 'primary',
                },
                {
                  href: `${localePrefix}/contact?source=account-support`,
                  label: 'Contacto Premium',
                  detail: 'Solicita asesoría para tours privados a la medida.',
                },
                {
                  href: `${localePrefix}/account`,
                  label: 'Volver al Perfil',
                  detail: 'Regresa a la pantalla principal de tu cuenta.',
                },
                {
                  href: `${localePrefix}/tours`,
                  label: 'Explorar Catálogo',
                  detail: 'Vuelve a ver los tours si el problema ya se resolvió.',
                },
              ]}
            />
          </section>
        </div>

        {/* 03. SIDEBAR DE CONSEJOS (Premium Glassmorphism) */}
        <aside className="space-y-8">
          <div className="group relative overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/10 bg-surface p-8 shadow-soft transition-all duration-500 hover:shadow-pop dark:border-white/10">
            {/* Glow sutil */}
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-brand-blue/5 blur-[80px] transition-transform duration-700 group-hover:scale-125"></div>

            <div className="relative z-10">
              <p className="mb-8 border-b border-brand-dark/5 pb-4 text-[10px] font-bold uppercase tracking-widest text-muted dark:border-white/5">
                Tips de Soporte
              </p>

              <div className="space-y-8">
                <div className="group/item flex items-start gap-4">
                  <div className="shrink-0 rounded-xl border border-brand-dark/5 bg-surface-2 p-3 text-muted transition-colors duration-300 group-hover/item:border-green-600 group-hover/item:bg-green-600/10 group-hover/item:text-green-600 dark:border-white/5">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="mb-1 font-heading text-lg tracking-tight text-main transition-colors group-hover/item:text-green-600">
                      Booking ID
                    </p>
                    <p className="text-sm font-light leading-relaxed text-muted">
                      Selecciona la reserva correcta para acelerar la resolución.
                    </p>
                  </div>
                </div>

                <div className="group/item flex items-start gap-4">
                  <div className="shrink-0 rounded-xl border border-brand-dark/5 bg-surface-2 p-3 text-muted transition-colors duration-300 group-hover/item:border-brand-blue group-hover/item:bg-brand-blue/10 group-hover/item:text-brand-blue dark:border-white/5">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="mb-1 font-heading text-lg tracking-tight text-main transition-colors group-hover/item:text-brand-blue">
                      Sé Específico
                    </p>
                    <p className="text-sm font-light leading-relaxed text-muted">
                      Explica qué pasó, qué esperabas y qué necesitas del equipo.
                    </p>
                  </div>
                </div>

                <div className="group/item flex items-start gap-4">
                  <div className="shrink-0 rounded-xl border border-brand-dark/5 bg-surface-2 p-3 text-muted transition-colors duration-300 group-hover/item:border-brand-terra group-hover/item:bg-brand-terra/10 group-hover/item:text-brand-terra dark:border-white/5">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="mb-1 font-heading text-lg tracking-tight text-main transition-colors group-hover/item:text-brand-terra">
                      Conserva el Hilo
                    </p>
                    <p className="text-sm font-light leading-relaxed text-muted">
                      Responde siempre sobre el ticket abierto en lugar de crear uno nuevo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

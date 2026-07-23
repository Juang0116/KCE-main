/* src/app/(marketing)/account/bookings/page.tsx */
import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';

import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import BookingsView from '@/features/bookings/BookingsView';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';
import {
  Compass,
  FileText,
  LifeBuoy,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  MapPin,
} from 'lucide-react';

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
    <PageShell className="mx-auto w-full max-w-[var(--container-max)] animate-fade-in bg-base px-6 py-12 md:py-20">
      {/* 01. HEADER DEL DASHBOARD (Premium Minimalista) */}
      <header className="mb-12 flex flex-col justify-between gap-6 border-b border-brand-dark/10 pb-8 dark:border-white/10 md:flex-row md:items-end">
        <div>
          <div className="bg-surface-2/50 mb-4 inline-flex items-center gap-2 rounded-full border border-brand-dark/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm dark:border-white/10">
            <Compass className="h-3 w-3" /> Itinerario de Viaje
          </div>
          <h1 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
            Tus próximas aventuras
          </h1>
          <p className="mt-4 max-w-xl text-base font-light leading-relaxed text-muted">
            Accede a tus tickets, descarga tus facturas y contacta a tu conserje directamente desde
            aquí.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-4">
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-full border-brand-dark/10 bg-surface px-6 text-xs font-bold uppercase tracking-widest text-main shadow-sm transition-transform hover:-translate-y-1 hover:bg-surface-2 dark:border-white/10"
          >
            <Link href={withLocale(locale, '/account/support')}>Necesito ayuda</Link>
          </Button>
          <Button
            asChild
            className="h-12 rounded-full bg-brand-blue px-8 text-xs font-bold uppercase tracking-widest text-white shadow-pop transition-transform hover:-translate-y-1"
          >
            <Link href={withLocale(locale, '/tours')}>
              Explorar tours <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid items-start gap-12 lg:grid-cols-[1fr_350px]">
        {/* 02. ZONA PRINCIPAL (Historial Activo) */}
        <div className="space-y-12">
          <section className="overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/10 bg-surface shadow-soft dark:border-white/10">
            <div className="bg-surface-2/30 flex flex-col justify-between gap-4 border-b border-brand-dark/5 p-6 dark:border-white/5 sm:flex-row sm:items-center md:p-8">
              <div>
                <h2 className="font-heading text-2xl tracking-tight text-main">Historial Activo</h2>
                <p className="mt-1 text-sm font-light text-muted">
                  Todas tus transacciones y tickets confirmados.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" /> Entorno Seguro
              </div>
            </div>

            <div className="p-4 sm:p-6 md:p-8">
              {/* Aquí se renderiza tu tabla real */}
              <BookingsView />
            </div>
          </section>

          {/* Action Deck (Comandos) */}
          <section className="pt-4">
            <LaunchCommandActionDeck
              eyebrow="Comandos de Ayuda"
              title="¿Necesitas modificar algo?"
              description="Selecciona la ruta adecuada si deseas escalar un caso con un agente o revisar detalles de tu cuenta."
              actions={[
                {
                  href: withLocale(locale, '/account/support?source=account-bookings'),
                  label: 'Abrir ticket de soporte',
                  detail: 'Atención personalizada para tus reservas actuales.',
                  tone: 'primary',
                },
                {
                  href: withLocale(locale, '/contact?source=account-bookings'),
                  label: 'Contactar Asesor',
                  detail: 'Handoff humano para casos complejos o rutas privadas.',
                },
                {
                  href: withLocale(locale, '/account'),
                  label: 'Volver a Perfil',
                  detail: 'Revisa seguridad y actividad de tu cuenta.',
                },
                {
                  href: withLocale(locale, '/tours'),
                  label: 'Ver más tours',
                  detail: 'El viaje no termina aquí. Descubre más de Colombia.',
                },
              ]}
            />
          </section>
        </div>

        {/* 03. SIDEBAR DE GESTIÓN (Premium Glassmorphism) */}
        <aside className="space-y-8">
          <div className="group relative overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/10 bg-surface p-8 shadow-soft transition-all duration-500 hover:shadow-pop dark:border-white/10">
            {/* Glow sutil */}
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-brand-yellow/5 blur-[80px] transition-transform duration-700 group-hover:scale-125"></div>

            <div className="relative z-10">
              <p className="mb-8 border-b border-brand-dark/5 pb-4 text-[10px] font-bold uppercase tracking-widest text-muted dark:border-white/5">
                Gestión Rápida
              </p>

              <div className="space-y-8">
                <div className="group/item flex items-start gap-4">
                  <div className="shrink-0 rounded-xl border border-brand-dark/5 bg-surface-2 p-3 text-muted transition-colors duration-300 group-hover/item:border-brand-blue group-hover/item:bg-brand-blue group-hover/item:text-white dark:border-white/5">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="mb-1 font-heading text-lg tracking-tight text-main transition-colors group-hover/item:text-brand-blue">
                      Tickets & Fechas
                    </p>
                    <p className="text-sm font-light leading-relaxed text-muted">
                      Revisa los puntos de encuentro y horarios de tus tours.
                    </p>
                  </div>
                </div>

                <div className="group/item flex items-start gap-4">
                  <div className="shrink-0 rounded-xl border border-brand-dark/5 bg-surface-2 p-3 text-muted transition-colors duration-300 group-hover/item:border-brand-blue group-hover/item:bg-brand-blue group-hover/item:text-white dark:border-white/5">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="mb-1 font-heading text-lg tracking-tight text-main transition-colors group-hover/item:text-brand-blue">
                      Facturación Segura
                    </p>
                    <p className="text-sm font-light leading-relaxed text-muted">
                      Descarga tus recibos en PDF generados a través de Stripe.
                    </p>
                  </div>
                </div>

                <div className="group/item flex items-start gap-4">
                  <div className="shrink-0 rounded-xl border border-brand-dark/5 bg-surface-2 p-3 text-muted transition-colors duration-300 group-hover/item:border-brand-blue group-hover/item:bg-brand-blue group-hover/item:text-white dark:border-white/5">
                    <LifeBuoy className="h-5 w-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="mb-1 font-heading text-lg tracking-tight text-main transition-colors group-hover/item:text-brand-blue">
                      Soporte Contextual
                    </p>
                    <p className="text-sm font-light leading-relaxed text-muted">
                      Pide ayuda sobre una reserva sin repetir datos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-2/50 group rounded-[var(--radius-xl)] border border-brand-dark/5 p-6 text-center shadow-inner transition-colors hover:bg-surface dark:border-white/5">
            <ShieldCheck className="text-muted/30 mx-auto mb-3 h-8 w-8 transition-colors group-hover:text-green-600" />
            <h4 className="mb-2 font-heading text-lg tracking-tight text-main">Pago Verificado</h4>
            <p className="text-xs font-light leading-relaxed text-muted">
              Tus transacciones están encriptadas y protegidas por infraestructura de grado
              bancario.
            </p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

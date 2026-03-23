/* src/app/(marketing)/account/bookings/page.tsx */
import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';

import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import BookingsView from '@/features/bookings/BookingsView';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';
import { Compass, FileText, LifeBuoy, ArrowRight, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';

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
    <PageShell className="mx-auto w-full max-w-[var(--container-max)] px-6 py-12 md:py-20 animate-fade-in bg-base">
      
      {/* 01. HEADER DEL DASHBOARD (Premium Minimalista) */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-dark/10 dark:border-white/10 pb-8">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-dark/10 dark:border-white/10 bg-surface-2/50 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
            <Compass className="h-3 w-3" /> Itinerario de Viaje
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tight">
            Tus próximas aventuras
          </h1>
          <p className="mt-4 max-w-xl text-base font-light text-muted leading-relaxed">
            Accede a tus tickets, descarga tus facturas y contacta a tu conserje directamente desde aquí.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <Button asChild variant="outline" className="rounded-full bg-surface hover:bg-surface-2 border-brand-dark/10 dark:border-white/10 text-main text-xs font-bold uppercase tracking-widest h-12 px-6 shadow-sm transition-transform hover:-translate-y-1">
            <Link href={withLocale(locale, '/account/support')}>
              Necesito ayuda
            </Link>
          </Button>
          <Button asChild className="rounded-full bg-brand-blue text-white shadow-pop hover:-translate-y-1 transition-transform text-xs font-bold uppercase tracking-widest h-12 px-8">
            <Link href={withLocale(locale, '/tours')}>
              Explorar tours <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_350px] gap-12 items-start">
        
        {/* 02. ZONA PRINCIPAL (Historial Activo) */}
        <div className="space-y-12">
          
          <section className="rounded-[var(--radius-2xl)] border border-brand-dark/10 dark:border-white/10 bg-surface shadow-soft overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-dark/5 dark:border-white/5 bg-surface-2/30 p-6 md:p-8">
              <div>
                <h2 className="font-heading text-2xl text-main tracking-tight">Historial Activo</h2>
                <p className="text-sm text-muted mt-1 font-light">Todas tus transacciones y tickets confirmados.</p>
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
                { href: withLocale(locale, '/account/support?source=account-bookings'), label: 'Abrir ticket de soporte', detail: 'Atención personalizada para tus reservas actuales.', tone: 'primary' },
                { href: withLocale(locale, '/contact?source=account-bookings'), label: 'Contactar Asesor', detail: 'Handoff humano para casos complejos o rutas privadas.' },
                { href: withLocale(locale, '/account'), label: 'Volver a Perfil', detail: 'Revisa seguridad y actividad de tu cuenta.' },
                { href: withLocale(locale, '/tours'), label: 'Ver más tours', detail: 'El viaje no termina aquí. Descubre más de Colombia.' },
              ]}
            />
          </section>

        </div>

        {/* 03. SIDEBAR DE GESTIÓN (Premium Glassmorphism) */}
        <aside className="space-y-8">
          
          <div className="rounded-[var(--radius-2xl)] border border-brand-dark/10 dark:border-white/10 bg-surface p-8 shadow-soft relative overflow-hidden group hover:shadow-pop transition-all duration-500">
            {/* Glow sutil */}
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-brand-yellow/5 rounded-full blur-[80px] pointer-events-none transition-transform duration-700 group-hover:scale-125"></div>
            
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-8 border-b border-brand-dark/5 dark:border-white/5 pb-4">Gestión Rápida</p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4 group/item">
                  <div className="rounded-xl border border-brand-dark/5 dark:border-white/5 bg-surface-2 p-3 text-muted transition-colors duration-300 group-hover/item:bg-brand-blue group-hover/item:border-brand-blue group-hover/item:text-white shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="font-heading text-lg text-main tracking-tight mb-1 group-hover/item:text-brand-blue transition-colors">Tickets & Fechas</p>
                    <p className="text-sm font-light text-muted leading-relaxed">Revisa los puntos de encuentro y horarios de tus tours.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group/item">
                  <div className="rounded-xl border border-brand-dark/5 dark:border-white/5 bg-surface-2 p-3 text-muted transition-colors duration-300 group-hover/item:bg-brand-blue group-hover/item:border-brand-blue group-hover/item:text-white shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="font-heading text-lg text-main tracking-tight mb-1 group-hover/item:text-brand-blue transition-colors">Facturación Segura</p>
                    <p className="text-sm font-light text-muted leading-relaxed">Descarga tus recibos en PDF generados a través de Stripe.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group/item">
                  <div className="rounded-xl border border-brand-dark/5 dark:border-white/5 bg-surface-2 p-3 text-muted transition-colors duration-300 group-hover/item:bg-brand-blue group-hover/item:border-brand-blue group-hover/item:text-white shrink-0">
                    <LifeBuoy className="h-5 w-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="font-heading text-lg text-main tracking-tight mb-1 group-hover/item:text-brand-blue transition-colors">Soporte Contextual</p>
                    <p className="text-sm font-light text-muted leading-relaxed">Pide ayuda sobre una reserva sin repetir datos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-xl)] border border-brand-dark/5 dark:border-white/5 bg-surface-2/50 p-6 shadow-inner text-center group transition-colors hover:bg-surface">
            <ShieldCheck className="mx-auto h-8 w-8 text-muted/30 mb-3 group-hover:text-green-600 transition-colors" />
            <h4 className="font-heading text-lg text-main tracking-tight mb-2">Pago Verificado</h4>
            <p className="text-xs font-light text-muted leading-relaxed">Tus transacciones están encriptadas y protegidas por infraestructura de grado bancario.</p>
          </div>

        </aside>

      </div>
    </PageShell>
  );
}
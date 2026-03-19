import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';

import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import BookingsView from '@/features/bookings/BookingsView';
import AccountServiceRail from '@/features/bookings/components/AccountServiceRail';
import BookingTrustStrip from '@/features/bookings/components/BookingTrustStrip';
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
    <PageShell className="mx-auto w-full max-w-[var(--container-max)] px-6 py-12 md:py-20 animate-fade-in">
      
      {/* 01. HEADER DEL DASHBOARD (Sin cajas oscuras pesadas) */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--color-border)] pb-8">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
            <Compass className="h-3 w-3" /> Itinerario de Viaje
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-[var(--color-text)] tracking-tight">
            Tus próximas aventuras
          </h1>
          <p className="mt-3 max-w-xl text-base font-light text-[var(--color-text-muted)] leading-relaxed">
            Accede a tus tickets, descarga tus facturas y contacta a tu conserje directamente desde aquí.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <Button asChild variant="outline" className="rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text)] transition-colors shadow-sm">
            <Link href={withLocale(locale, '/account/support')}>
              Necesito ayuda
            </Link>
          </Button>
          <Button asChild className="rounded-full bg-brand-blue text-white shadow-pop hover:-translate-y-0.5 transition-transform">
            <Link href={withLocale(locale, '/tours')}>
              Explorar tours <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_350px] gap-12 items-start">
        
        {/* 02. ZONA PRINCIPAL (Tabla de Reservas - Limpia y sin cajas enormes) */}
        <div className="space-y-12">
          
          <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-soft overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/30 p-6 md:p-8">
              <div>
                <h2 className="font-heading text-2xl text-[var(--color-text)] tracking-tight">Historial Activo</h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 font-light">Todas tus transacciones y tickets confirmados.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-success)]">
                <CheckCircle2 className="h-3.5 w-3.5" /> Entorno Seguro
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              {/* Aquí se renderiza tu tabla real. El componente BookingsView 
                  debe heredar estos estilos claros. */}
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
          
          <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl p-8 shadow-soft relative overflow-hidden group">
            {/* Glow sutil */}
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-brand-yellow/5 rounded-full blur-[80px] pointer-events-none transition-transform duration-700 group-hover:scale-125"></div>
            
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] mb-8 border-b border-[var(--color-border)] pb-4">Gestión Rápida</p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4 group/item">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2.5 text-[var(--color-text-muted)] transition-colors group-hover/item:border-brand-blue group-hover/item:text-brand-blue shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="font-heading text-lg text-[var(--color-text)] mb-1 group-hover/item:text-brand-blue transition-colors">Tickets & Fechas</p>
                    <p className="text-sm font-light text-[var(--color-text-muted)] leading-relaxed">Revisa los puntos de encuentro y horarios de tus tours.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group/item">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2.5 text-[var(--color-text-muted)] transition-colors group-hover/item:border-brand-blue group-hover/item:text-brand-blue shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="font-heading text-lg text-[var(--color-text)] mb-1 group-hover/item:text-brand-blue transition-colors">Facturación Segura</p>
                    <p className="text-sm font-light text-[var(--color-text-muted)] leading-relaxed">Descarga tus recibos en PDF generados a través de Stripe.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group/item">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2.5 text-[var(--color-text-muted)] transition-colors group-hover/item:border-brand-blue group-hover/item:text-brand-blue shrink-0">
                    <LifeBuoy className="h-5 w-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="font-heading text-lg text-[var(--color-text)] mb-1 group-hover/item:text-brand-blue transition-colors">Soporte Contextual</p>
                    <p className="text-sm font-light text-[var(--color-text-muted)] leading-relaxed">Pide ayuda sobre una reserva sin repetir datos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/30 p-6 shadow-inner text-center group transition-colors hover:bg-[var(--color-surface)]">
            <ShieldCheck className="mx-auto h-8 w-8 text-brand-blue/30 mb-3 group-hover:text-brand-blue transition-colors" />
            <h4 className="font-heading text-lg text-[var(--color-text)] mb-2">Pago Verificado</h4>
            <p className="text-xs font-light text-[var(--color-text-muted)]">Tus transacciones están encriptadas y protegidas por Stripe.</p>
          </div>

        </aside>

      </div>
    </PageShell>
  );
}
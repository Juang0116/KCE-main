import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';

import { PageShell } from '@/components/layout/PageShell';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';
import SupportCenter from '@/features/auth/SupportCenter';
import { ShieldCheck, MessageSquare, HeadphonesIcon, Clock, HeartHandshake, ArrowRight } from 'lucide-react';
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
    <PageShell className="mx-auto w-full max-w-[var(--container-max)] px-6 py-12 md:py-20 animate-fade-in">
      
      {/* 01. HEADER DEL DASHBOARD (Sin cajas oscuras) */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--color-border)] pb-8">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-terra shadow-sm">
            <HeartHandshake className="h-3 w-3" /> Conserjería 24/7
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-[var(--color-text)] tracking-tight">
            ¿En qué podemos ayudarte?
          </h1>
          <p className="mt-3 max-w-xl text-base font-light text-[var(--color-text-muted)] leading-relaxed">
            Crea tickets, retoma conversaciones activas y resuelve incidencias. Nuestro equipo tiene todo el contexto de tus reservas para ser más eficientes.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <Button asChild variant="outline" className="rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text)] transition-colors shadow-sm">
            <Link href={`${localePrefix}/account/bookings`}>
              Ir a mis reservas
            </Link>
          </Button>
          <Button asChild className="rounded-full bg-[var(--color-success)] text-white shadow-pop hover:-translate-y-0.5 transition-transform">
            <Link href={`${localePrefix}/contact?source=support-center`}>
              Chat Directo <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_350px] gap-12 items-start">
        
        {/* 02. ZONA PRINCIPAL (Tabla de Tickets) */}
        <div className="space-y-12">
          
          <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-soft overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/30 p-6 md:p-8">
              <div>
                <h2 className="font-heading text-2xl text-[var(--color-text)] tracking-tight">Centro de Asistencia</h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 font-light">Listado de tickets activos e históricos.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-brand-blue/20 bg-brand-blue/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-blue">
                <HeadphonesIcon className="h-3.5 w-3.5" /> Equipo Humano
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              {/* Aquí se renderiza tu tabla/listado real de tickets */}
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
                { href: `${localePrefix}/account/bookings`, label: 'Ir a Mis Reservas', detail: 'Recupera el booking antes de abrir un caso.', tone: 'primary' },
                { href: `${localePrefix}/contact?source=account-support`, label: 'Contacto Premium', detail: 'Solicita asesoría para tours privados a la medida.' },
                { href: `${localePrefix}/account`, label: 'Volver al Perfil', detail: 'Regresa a la pantalla principal de tu cuenta.' },
                { href: `${localePrefix}/tours`, label: 'Explorar Catálogo', detail: 'Vuelve a ver los tours si el problema ya se resolvió.' },
              ]}
            />
          </section>

        </div>

        {/* 03. SIDEBAR DE CONSEJOS (Premium Glassmorphism) */}
        <aside className="space-y-8">
          
          <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl p-8 shadow-soft relative overflow-hidden group">
            {/* Glow sutil */}
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-brand-blue/5 rounded-full blur-[80px] pointer-events-none transition-transform duration-700 group-hover:scale-125"></div>
            
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] mb-8 border-b border-[var(--color-border)] pb-4">Tips de Soporte</p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4 group/item">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2.5 text-[var(--color-text-muted)] transition-colors group-hover/item:border-[var(--color-success)] group-hover/item:text-[var(--color-success)] shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="font-heading text-lg text-[var(--color-text)] mb-1 group-hover/item:text-[var(--color-success)] transition-colors">Booking ID</p>
                    <p className="text-sm font-light text-[var(--color-text-muted)] leading-relaxed">Selecciona la reserva correcta para acelerar la resolución.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group/item">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2.5 text-[var(--color-text-muted)] transition-colors group-hover/item:border-brand-blue group-hover/item:text-brand-blue shrink-0">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="font-heading text-lg text-[var(--color-text)] mb-1 group-hover/item:text-brand-blue transition-colors">Sé Específico</p>
                    <p className="text-sm font-light text-[var(--color-text-muted)] leading-relaxed">Explica qué pasó, qué esperabas y qué necesitas del equipo.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group/item">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2.5 text-[var(--color-text-muted)] transition-colors group-hover/item:border-brand-terra group-hover/item:text-brand-terra shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="font-heading text-lg text-[var(--color-text)] mb-1 group-hover/item:text-brand-terra transition-colors">Conserva el Hilo</p>
                    <p className="text-sm font-light text-[var(--color-text-muted)] leading-relaxed">Responde siempre sobre el ticket abierto en lugar de crear uno nuevo.</p>
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
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { UserCircle } from 'lucide-react';

import { PageShell } from '@/components/layout/PageShell';
import TravelerExecutivePanel from '@/components/traveler/TravelerExecutivePanel';
import AccountView from '@/features/auth/AccountView';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

export const metadata: Metadata = {
  title: 'Mi Cuenta | KCE',
  description: 'Gestiona tu sesión, seguridad y continuidad post-compra con KCE.',
  robots: { index: false, follow: false },
};

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const c = await cookies();
  const v = (h.get('x-kce-locale') || c.get('kce.locale')?.value || '').toLowerCase();
  return v === 'en' || v === 'fr' || v === 'de' ? (v as SupportedLocale) : 'es';
}

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (locale === 'es') return href;
  return `/${locale}${href}`;
}

export default async function AccountPage() {
  const locale = await resolveLocale();

  return (
    <PageShell className="mx-auto w-full max-w-[var(--container-max)] px-6 py-12 md:py-20 pb-[calc(10rem+env(safe-area-inset-bottom))] animate-fade-in">
      
      {/* 01. HEADER DASHBOARD (Editorial Parity) */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[color:var(--color-border)] pb-8">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
            <UserCircle className="h-3 w-3" /> Portal del Viajero
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-[color:var(--color-text)] tracking-tight">
            Tu Espacio <span className="text-brand-blue italic font-light">KCE</span>
          </h1>
          <p className="mt-3 max-w-xl text-base font-light text-[color:var(--color-text-muted)] leading-relaxed">
            Gestiona tus reservas, contacta a tu conserje personal y asegura tu información desde un solo lugar.
          </p>
        </div>

        {/* Ícono de cuenta flotante (Glassmorphism sutil) */}
        <div className="hidden md:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] shadow-soft transition-transform hover:scale-105 group">
          <UserCircle className="h-8 w-8 text-[color:var(--color-text-muted)] opacity-50 group-hover:text-brand-blue group-hover:opacity-100 transition-colors" />
        </div>
      </header>

      {/* 02. ZONA PRINCIPAL: Panel Ejecutivo y Detalles de la Cuenta */}
      <div className="space-y-12">
        
        {/* Panel Ejecutivo (Opciones principales) */}
        {/* Asegúrate de que el componente TravelerExecutivePanel tampoco tenga cajas negras enormes en su diseño interno */}
        <TravelerExecutivePanel
          eyebrow="Continuidad de Viaje"
          title="Todo tu viaje, bajo control"
          description="Desde aquí mantienes tu perfil, reservas, soporte y seguridad en un solo hilo. Nuestro objetivo es darte claridad absoluta antes y después de comprar."
          quickLinks={[
            { href: withLocale(locale, '/account/bookings'), label: 'Mis Reservas', tone: 'primary' },
            { href: withLocale(locale, '/account/support'), label: 'Soporte 24/7' },
            { href: withLocale(locale, '/account/security'), label: 'Seguridad' },
            { href: withLocale(locale, '/wishlist'), label: 'Wishlist' },
          ]}
          focusItems={[
            {
              label: 'continuidad',
              title: 'Tours & Reservas',
              body: 'Accede a tus tickets, fechas y puntos de encuentro al instante.',
              href: withLocale(locale, '/account/bookings'),
              cta: 'Abrir reservas',
            },
            {
              label: 'confianza',
              title: 'Seguridad y Perfil',
              body: 'Actualiza tus datos y gestiona el acceso a tu cuenta de forma segura.',
              href: withLocale(locale, '/account/security'),
              cta: 'Ver seguridad',
            },
            {
              label: 'soporte',
              title: 'Conserjería y Ayuda',
              body: '¿Tienes dudas? Tu equipo de soporte está listo para asistirte.',
              href: withLocale(locale, '/account/support'),
              cta: 'Ir a soporte',
            },
          ]}
          notes={[
            {
              title: 'Soporte con Contexto',
              body: 'Al contactarnos desde aquí, sabremos exactamente qué tour reservaste.',
            },
            {
              title: 'Pagos Seguros',
              body: 'Tus facturas y recibos están respaldados y disponibles 24/7.',
            },
            {
              title: 'Garantía KCE',
              body: 'Tu tranquilidad es nuestra prioridad antes, durante y después del viaje.',
            },
          ]}
        />

        {/* Detalles de la Cuenta (Datos Personales) */}
        <section className="pt-8 border-t border-[color:var(--color-border)]">
          <AccountView />
        </section>

      </div>

      {/* 03. NAVEGACIÓN INFERIOR (Launch Command) */}
      <div className="mt-16">
        <LaunchCommandActionDeck
          eyebrow="Navegación Rápida"
          title="¿Qué te gustaría hacer ahora?"
          description="Selecciona tu próximo destino dentro de la plataforma."
          actions={[
            { href: withLocale(locale, '/account/bookings'), label: 'Mis reservas', detail: 'Recupera booking, invoice y calendario desde tu cuenta.', tone: 'primary' },
            { href: withLocale(locale, '/account/support'), label: 'Soporte', detail: 'Escala incidencias sin perder el contexto del caso.' },
            { href: withLocale(locale, '/contact?source=account-final-polish'), label: 'Contacto', detail: 'Habla con un asesor humano para experiencias a medida.' },
            { href: withLocale(locale, '/tours'), label: 'Explorar tours', detail: 'Descubre nuevas experiencias en nuestro catálogo.' },
          ]}
        />
      </div>
      
    </PageShell>
  );
}
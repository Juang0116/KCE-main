import type { Metadata } from 'next';
import { cookies } from 'next/headers';

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
  const c = await cookies();
  const v = (c.get('kce.locale')?.value || '').toLowerCase();
  return v === 'en' || v === 'fr' || v === 'de' ? v : 'es';
}

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

export default async function AccountPage() {
  const locale = await resolveLocale();

  return (
    <PageShell className="mx-auto max-w-6xl px-6 py-12 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      
      {/* Encabezado Premium */}
      <div className="mb-10 rounded-[2.5rem] bg-brand-dark px-8 py-12 text-center text-white shadow-2xl md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark to-brand-blue/30"></div>
        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow backdrop-blur-md">
            Portal del Viajero
          </div>
          <h1 className="font-heading text-4xl md:text-5xl drop-shadow-md">Bienvenido a tu Espacio KCE</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-light leading-relaxed text-white/80 md:text-base">
            Gestiona tus reservas, contacta a tu conserje personal y asegura tu información desde un solo lugar.
          </p>
        </div>
      </div>

      <TravelerExecutivePanel
        eyebrow="Continuidad de Viaje"
        title="Todo tu viaje, bajo control"
        description="Desde aquí deberías poder mantener perfil, reservas, soporte y seguridad dentro del mismo hilo. El objetivo es darte continuidad clara antes y después de comprar."
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

      <section className="mt-12">
        <AccountView />
      </section>

      <div className="mt-12">
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
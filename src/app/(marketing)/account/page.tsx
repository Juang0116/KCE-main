import type { Metadata } from 'next';
import { cookies } from 'next/headers';
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
  const c = await cookies();
  const v = (c.get('kce.locale')?.value || '').toLowerCase();
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
    <PageShell className="mx-auto max-w-6xl px-6 py-12 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      
      {/* Encabezado VIP */}
      <div className="mb-16 rounded-[3.5rem] bg-brand-dark px-8 py-16 text-center text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-brand-blue/30"></div>
        
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md shadow-sm">
            <UserCircle className="h-3 w-3" /> Portal del Viajero
          </div>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl drop-shadow-md leading-tight">
            Bienvenido a tu <br className="hidden md:block" />
            <span className="text-brand-yellow font-light italic">Espacio KCE</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg font-light leading-relaxed text-white/80">
            Gestiona tus reservas, contacta a tu conserje personal y asegura tu información desde un solo lugar.
          </p>
        </div>
      </div>

      {/* Panel Ejecutivo (Opciones principales) */}
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
      <section className="mt-16">
        <AccountView />
      </section>

      {/* Navegación Inferior */}
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
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { PageShell } from '@/components/layout/PageShell';
import TravelerExecutivePanel from '@/components/traveler/TravelerExecutivePanel';
import AccountView from '@/features/auth/AccountView';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

export const metadata: Metadata = {
  title: 'Cuenta | KCE',
  description: 'Gestiona tu sesión, seguridad y continuidad post-compra.',
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
    <PageShell className="max-w-6xl px-6 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      <TravelerExecutivePanel
        eyebrow="account continuity"
        title="Tu cuenta ya debería sentirse como un centro premium de seguimiento"
        description="Desde aquí deberías poder mantener perfil, reservas, soporte y seguridad dentro del mismo hilo. El objetivo del cierre final no es solo verte autenticado, sino darte continuidad clara antes y después de comprar."
        quickLinks={[
          { href: withLocale(locale, '/account/bookings'), label: 'Mis reservas', tone: 'primary' },
          { href: withLocale(locale, '/account/support'), label: 'Soporte' },
          { href: withLocale(locale, '/account/security'), label: 'Seguridad' },
          { href: withLocale(locale, '/wishlist'), label: 'Wishlist' },
        ]}
        focusItems={[
          {
            label: 'continuidad',
            title: 'Todo reunido',
            body: 'Cuenta, reservas, descargas y soporte deben sentirse conectados, no como módulos aislados.',
            href: withLocale(locale, '/account/bookings'),
            cta: 'Abrir reservas',
          },
          {
            label: 'confianza',
            title: 'Seguridad visible',
            body: 'Actualizar datos, revisar sesión y entrar a seguridad debe ser fácil antes de cualquier cambio sensible.',
            href: withLocale(locale, '/account/security'),
            cta: 'Ver seguridad',
          },
          {
            label: 'soporte',
            title: 'Ayuda con contexto',
            body: 'Si algo falla, el viajero debe volver al equipo correcto sin empezar desde cero.',
            href: withLocale(locale, '/account/support'),
            cta: 'Ir a soporte',
          },
        ]}
        notes={[
          {
            title: 'Post-compra real',
            body: 'La cuenta ya forma parte del producto, no solo de autenticación. Tiene que ayudar a recuperar booking, invoice y soporte rápido.',
          },
          {
            title: 'Menos fricción',
            body: 'El siguiente paso después de entrar debería quedar claro en segundos, incluso en mobile.',
          },
          {
            title: 'Release-grade',
            body: 'Una cuenta sólida reduce tickets, baja ansiedad y protege la promesa premium después del pago.',
          },
        ]}
      />

      <div className="mt-8">
        <LaunchCommandActionDeck
          eyebrow="account command"
          title="En mobile o desktop, la cuenta debería empujarte al siguiente paso correcto"
          description="Esta banda final de salida mantiene visibles las cuatro reentradas que más importan: reservas, soporte, contacto y catálogo."
          actions={[
            { href: withLocale(locale, '/account/bookings'), label: 'Mis reservas', detail: 'Recupera booking, invoice y calendario desde tu cuenta.', tone: 'primary' },
            { href: withLocale(locale, '/account/support'), label: 'Soporte', detail: 'Escala incidencias sin perder el contexto del caso.' },
            { href: withLocale(locale, '/contact?source=account-final-polish'), label: 'Contacto', detail: 'Abre handoff humano cuando necesites seguimiento premium.' },
            { href: withLocale(locale, '/tours'), label: 'Explorar tours', detail: 'Vuelve al catálogo si quieres ampliar o extender el viaje.' },
          ]}
        />
      </div>

      <section className="mt-8">
        <AccountView />
      </section>
    </PageShell>
  );
}
/* src/app/(marketing)/privacy/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(BASE_SITE_URL),
  title: 'Privacidad — KCE',
  description:
    'Política de privacidad de KCE: datos que recopilamos, finalidades, cookies, derechos del usuario y contacto.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacidad — KCE',
    description: 'Conoce cómo KCE usa datos de contacto, reservas, soporte, cookies y seguridad.',
    url: '/privacy',
    type: 'article',
    images: [{ url: '/images/hero-kce.jpg', width: 1200, height: 630, alt: 'KCE privacidad y confianza' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacidad — KCE',
    description: 'Política de privacidad, cookies y derechos del usuario en KCE.',
    images: ['/images/hero-kce.jpg'],
  },
};

function Card({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft">
      <h2 className="font-heading text-lg text-brand-blue">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[color:var(--color-text)]/75">{children}</p>;
}

export default function Page() {
  const contactEmail = (process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@kce.travel').trim();
  const site =
    (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').trim().replace(/\/+$/, '');

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="card p-8">
        <h1 className="font-heading text-3xl text-brand-blue">Privacidad</h1>
        <p className="mt-3 text-[color:var(--color-text)]/75">
          En KCE (Knowing Cultures Enterprise) valoramos tu privacidad. Esta política explica qué
          datos recopilamos, por qué lo hacemos y cómo puedes ejercer tus derechos.
        </p>

        <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">
            Información general
          </div>
          <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
            Esta página resume cómo tratamos datos personales en la operación actual de KCE.
            Si el servicio evoluciona o cambian obligaciones legales, publicaremos aquí la versión actualizada.
          </p>
          <p className="mt-2 text-xs text-[color:var(--color-text)]/60">
            Última actualización: marzo de 2026 · Sitio: {site}
          </p>
        </div>

        <nav aria-label="Navegación legal" className="mt-5 flex flex-wrap gap-4 text-sm">
          <Link href="/privacy" className="text-brand-blue underline underline-offset-4 hover:opacity-90">
            Privacidad
          </Link>
          <Link href="/terms" className="text-brand-blue underline underline-offset-4 hover:opacity-90">
            Términos
          </Link>
          <Link href="/cookies" className="text-brand-blue underline underline-offset-4 hover:opacity-90">
            Cookies
          </Link>
          <Link href="/contact" className="text-brand-blue underline underline-offset-4 hover:opacity-90">
            Contacto
          </Link>
        </nav>
      </header>

      <div className="mt-6 grid gap-4">
        <Card title="1) Datos que recopilamos">
          <Muted>
            Dependiendo del uso del sitio, podemos recopilar:
          </Muted>

          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[color:var(--color-text)]/75">
            <li>
              <strong>Cuenta y contacto:</strong> email, nombre y (opcional) teléfono.
            </li>
            <li>
              <strong>Reservas:</strong> tour seleccionado, fecha, número de personas, total,
              estado de pago y referencias técnicas del pago (por ejemplo, <em>session_id</em>).
            </li>
            <li>
              <strong>Soporte:</strong> mensajes y adjuntos que envías en tickets.
            </li>
            <li>
              <strong>Preferencias de viaje:</strong> respuestas de plan personalizado o formularios similares, si decides usarlos.
            </li>
            <li>
              <strong>Datos técnicos:</strong> IP aproximada, user agent, eventos de seguridad,
              logs de errores y eventos anti-fraude/anti-abuso.
            </li>
          </ul>
        </Card>

        <Card title="2) Para qué usamos tus datos">
          <ul className="list-disc space-y-1 pl-5 text-sm text-[color:var(--color-text)]/75">
            <li>Procesar reservas, confirmaciones y soporte post-compra.</li>
            <li>Enviar emails transaccionales (confirmación, enlaces de gestión, notificaciones).</li>
            <li>Mejorar la experiencia del producto, seguridad y prevención de abuso.</li>
            <li>
              En caso de newsletter, enviarte novedades y ofertas <strong>solo si lo autorizas</strong>.
            </li>
          </ul>

          <p className="mt-3 text-xs text-[color:var(--color-text)]/60">
            Nota: Los pagos se procesan con un proveedor externo (por ejemplo, Stripe). KCE no almacena
            números completos de tarjeta.
          </p>
        </Card>

        <Card title="3) Base legal y consentimiento">
          <Muted>
            Tratamos datos bajo una o más de estas bases (según aplique): ejecución de un contrato
            (reserva), interés legítimo (seguridad/mejora) y consentimiento (newsletter/cookies no esenciales).
          </Muted>
        </Card>

        <Card title="4) Cookies y analítica">
          <Muted>
            Podemos usar cookies necesarias para el funcionamiento del sitio y, si lo autorizas, cookies
            de analítica/marketing para entender el uso y mejorar conversiones.
          </Muted>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/cookies"
              className="text-brand-blue underline underline-offset-4 hover:opacity-90"
            >
              Gestionar preferencias de cookies
            </Link>

            <Link
              href="/policies/payments"
              className="text-brand-blue underline underline-offset-4 hover:opacity-90"
            >
              Ver pagos y seguridad
            </Link>
          </div>
        </Card>

        <Card title="5) Con quién compartimos tus datos">
          <Muted>
            Solo compartimos lo necesario con proveedores que nos ayudan a operar el servicio:
          </Muted>

          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[color:var(--color-text)]/75">
            <li>
              <strong>Pagos:</strong> procesadores de pago (p.ej., Stripe).
            </li>
            <li>
              <strong>Email:</strong> servicios de envío transaccional/newsletter (p.ej., Resend).
            </li>
            <li>
              <strong>Infraestructura:</strong> hosting, base de datos y seguridad (p.ej., Vercel/Supabase).
            </li>
          </ul>

          <p className="mt-3 text-xs text-[color:var(--color-text)]/60">
            No vendemos tus datos. No compartimos datos con terceros para “listas” sin tu autorización.
          </p>
        </Card>

        <Card title="6) Retención y eliminación">
          <Muted>
            Conservamos datos solo el tiempo necesario para operar el servicio, cumplir obligaciones
            legales y resolver disputas. Puedes solicitar eliminación cuando aplique.
          </Muted>
        </Card>

        <Card title="7) Tus derechos">
          <Muted>
            Puedes solicitar acceso, corrección, actualización o eliminación de tus datos, así como
            retirar tu consentimiento para newsletter/cookies (cuando aplique).
          </Muted>

          <div className="mt-3 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-sm font-semibold text-[color:var(--color-text)]">Contacto</div>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/75">
              Escríbenos a{' '}
              <a
                className="text-brand-blue underline underline-offset-4 hover:opacity-90"
                href={`mailto:${contactEmail}?subject=${encodeURIComponent('Privacidad | Solicitud de datos')}`}
              >
                {contactEmail}
              </a>{' '}
              indicando tu email de cuenta y el tipo de solicitud.
            </p>
          </div>
        </Card>

        <Card title="8) Seguridad">
          <Muted>
            Aplicamos controles razonables para proteger tus datos (p. ej. enlaces firmados, controles
            de acceso y monitoreo de eventos). Aun así, ningún sistema es 100% infalible.
          </Muted>
        </Card>

        <Card title="9) Cambios a esta política">
          <Muted>
            Podemos actualizar esta política para reflejar cambios del servicio. Publicaremos la versión
            vigente en esta página.
          </Muted>
        </Card>
      </div>
    </main>
  );
}

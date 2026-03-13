// src/app/(marketing)/policies/payments/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { H1, H2, P } from '@/components/ui/Typography';

export const metadata: Metadata = {
  title: 'Pagos y seguridad — KCE',
  description:
    'Información clara sobre pagos seguros con Stripe: moneda, confirmación, facturación y recomendaciones.',
  robots: { index: true, follow: true },
};

function Card({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft">
      <H2>{title}</H2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function PaymentsPolicyPage() {
  return (
    <main>
      <Section>
        <Container>
          <header className="mx-auto max-w-3xl">
            <H1>Pagos y seguridad</H1>

            <P className="mt-3 text-[color:var(--color-text)]/75">
              En KCE usamos un checkout seguro operado por <strong>Stripe</strong>. Eso significa
              que los datos de tu tarjeta se procesan en un entorno cifrado y nosotros{' '}
              <strong>no almacenamos</strong> información sensible de pago.
            </P>

            <P className="mt-3 text-[color:var(--color-text)]/75">
              Nuestro mercado principal es Europa y la <strong>moneda principal es EUR</strong>.
              Si tu banco opera en otra moneda, puede aplicar conversión y comisiones propias.
            </P>

            <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">
                Nota rápida
              </div>
              <P className="mt-1 text-sm text-[color:var(--color-text)]/70">
                Verás el total y la moneda antes de confirmar. Si tu banco muestra un cargo
                “pendiente”, normalmente se libera automáticamente si el pago no se completa.
              </P>
            </div>
          </header>

          <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
            <Card title="¿Qué verás en el checkout?">
              <ul className="space-y-2 text-sm text-[color:var(--color-text)]/75">
                <li>• Total final y moneda antes de confirmar.</li>
                <li>• Resumen del tour y fecha seleccionada (si aplica).</li>
                <li>• Métodos de pago disponibles según tu país/banco.</li>
              </ul>
            </Card>

            <Card title="Confirmación y factura">
              <P className="text-sm text-[color:var(--color-text)]/75">
                Al finalizar, recibirás confirmación por email y acceso a tu factura/recibo. Si no
                lo ves, revisa spam/promociones o contáctanos.
              </P>
              <div className="mt-3 text-sm">
                <Link
                  href="/contact"
                  className="text-brand-blue underline underline-offset-4 hover:opacity-90"
                >
                  Ir a contacto
                </Link>
              </div>
            </Card>

            <Card title="Cancelación y cambios">
              <P className="text-sm text-[color:var(--color-text)]/75">
                Las condiciones dependen de cada experiencia y se muestran de forma transparente en
                la página del tour. Para reglas completas:
              </P>
              <div className="mt-3 text-sm">
                <Link
                  href="/policies/cancellation"
                  className="text-brand-blue underline underline-offset-4 hover:opacity-90"
                >
                  Ver política de cancelación
                </Link>
              </div>
            </Card>
          </div>

          <div className="mx-auto mt-8 max-w-5xl">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft">
              <H2>Buenas prácticas de seguridad</H2>
              <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-text)]/75">
                <li>• Verifica que la URL sea la oficial de KCE antes de pagar.</li>
                <li>• Evita redes Wi-Fi públicas para transacciones.</li>
                <li>• Si tu banco pide verificación adicional (3DS), complétala para aprobar el pago.</li>
                <li>
                  • Si tienes dudas, escríbenos desde{' '}
                  <Link
                    href="/contact"
                    className="text-brand-blue underline underline-offset-4 hover:opacity-90"
                  >
                    contacto
                  </Link>
                  .
                </li>
              </ul>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-5xl">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft">
              <H2>Reembolsos y disputas</H2>
              <P className="mt-3 text-sm text-[color:var(--color-text)]/75">
                Si un reembolso aplica según la política del tour, lo procesamos vía Stripe. El tiempo
                de reflejo depende del banco (normalmente algunos días hábiles).
              </P>
              <P className="mt-3 text-sm text-[color:var(--color-text)]/75">
                Si hay un problema con tu compra, contáctanos primero para resolverlo rápido. En caso
                de disputa con tu banco (chargeback), podemos usar evidencia de servicio (confirmación,
                factura, comunicaciones) para aclarar la transacción.
              </P>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}

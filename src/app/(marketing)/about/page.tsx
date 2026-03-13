/* src/app/(marketing)/about/page.tsx */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre KCE — Knowing Cultures Enterprise',
  description:
    'Experiencias culturales en Colombia con acompañamiento local, checkout internacional y soporte 24/7.',
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
        <header>
          <h1 className="font-heading text-3xl tracking-tight text-brand-blue">Sobre KCE</h1>
          <p className="mt-3 text-sm text-[color:var(--color-text)]/75 md:text-base">
            En KCE diseñamos experiencias auténticas en Colombia: cultura, seguridad y logística
            cuidada. Reserva con confianza y recibe soporte antes, durante y después del viaje.
          </p>
        </header>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-sm font-semibold text-[color:var(--color-text)]">Experiencias reales</div>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
              Tours curados con enfoque cultural, anfitriones locales y recomendaciones claras.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-sm font-semibold text-[color:var(--color-text)]">Pagos internacionales</div>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
              Checkout profesional, confirmación por email, y factura PDF para tu tranquilidad.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-sm font-semibold text-[color:var(--color-text)]">Soporte 24/7</div>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
              Asistente IA y soporte humano para dudas, cambios y preguntas frecuentes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

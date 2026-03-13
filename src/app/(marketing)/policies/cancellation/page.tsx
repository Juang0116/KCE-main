/* src/app/(marketing)/policies/cancellation/page.tsx */
export const metadata = {
  title: 'Cancelación y cambios — KCE',
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="card p-8">
        <>
          <h1 className="font-heading text-3xl text-brand-blue">
            Política de cancelación y cambios
          </h1>
          <p className="text-[color:var(--color-text)]/75 mt-3">
            Esta política resume las reglas generales de cancelación y cambios para operar con claridad.
            Cada experiencia puede incluir condiciones adicionales que se mostrarán antes de pagar.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">48+ horas</div>
              <p className="text-[color:var(--color-text)]/75 mt-2 text-sm">
                Cambios/cancelaciones con suficiente anticipación pueden aplicar a reembolso parcial
                o crédito.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">
                Menos de 48h
              </div>
              <p className="text-[color:var(--color-text)]/75 mt-2 text-sm">
                Generalmente no reembolsable por logística/guías. Evaluamos casos excepcionales.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">
                Clima / fuerza mayor
              </div>
              <p className="text-[color:var(--color-text)]/75 mt-2 text-sm">
                Si el tour se reprograma por seguridad, ofrecemos cambio de fecha o alternativa
                equivalente.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5">
            <h2 className="text-lg font-semibold text-[color:var(--color-text)]">Recomendación</h2>
            <p className="text-[color:var(--color-text)]/75 mt-2 text-sm">
              Antes de pagar, revisa “incluye/no incluye” y la logística del tour. Si tienes dudas,
              contáctanos.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5">
              <h2 className="text-lg font-semibold text-[color:var(--color-text)]">Cómo solicitar cambios</h2>
              <p className="text-[color:var(--color-text)]/75 mt-2 text-sm">
                Escríbenos por email o WhatsApp con tu <strong>booking ID</strong> y la fecha deseada. Siempre
                que la operación lo permita, intentamos reprogramar sin fricción.
              </p>
              <p className="text-[color:var(--color-text)]/75 mt-2 text-sm">
                En alta demanda (puentes/festivos), algunos cambios pueden requerir ajuste de tarifa.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5">
              <h2 className="text-lg font-semibold text-[color:var(--color-text)]">Nota (servicios con fecha)</h2>
              <p className="text-[color:var(--color-text)]/75 mt-2 text-sm">
                Los tours son <strong>servicios de ocio programados para una fecha específica</strong>. En muchos
                marcos regulatorios, el derecho de desistimiento/retracto de compras a distancia no
                aplica a este tipo de servicios.
              </p>
              <p className="text-[color:var(--color-text)]/75 mt-2 text-sm">
                Por eso recomendamos revisar detalles y contactarnos antes de pagar si tienes dudas.
              </p>
            </div>
          </div>
        </>
      </div>
    </div>
  );
}

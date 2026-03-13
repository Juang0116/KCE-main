/* src/app/(marketing)/faq/page.tsx */
import type { Metadata } from 'next';

type Faq = {
  q: string;
  a: string;
  tag: 'Seguridad' | 'Pagos' | 'Cuenta' | 'Soporte' | 'Cambios';
};

const faqs: Faq[] = [
  {
    q: '¿Es seguro viajar con KCE en Colombia?',
    a: 'Sí. Diseñamos itinerarios con enfoque de seguridad y acompañamiento local. Seleccionamos aliados confiables, rutas realistas y horarios adecuados, y te damos recomendaciones claras antes del viaje.',
    tag: 'Seguridad',
  },
  {
    q: '¿En qué moneda se cobra y cómo funciona el pago?',
    a: 'El pago se procesa con tarjeta a través de Stripe y se cobra en EUR. Verás el total antes de pagar y recibirás confirmación y comprobante por email cuando el pago quede aprobado.',
    tag: 'Pagos',
  },
  {
    q: '¿Recibo confirmación y factura?',
    a: 'Sí. Después del pago, te enviamos un email con la confirmación de reserva y un enlace para descargar tu factura en PDF. Si no te llega, revisa spam/promociones o contáctanos.',
    tag: 'Pagos',
  },
  {
    q: '¿Cómo funcionan cancelaciones o cambios?',
    a: 'Depende de cada experiencia. En la página de cada tour verás reglas claras (ventanas de cancelación, reprogramaciones y condiciones). Si tienes un caso especial, escríbenos y lo resolvemos.',
    tag: 'Cambios',
  },
  {
    q: 'No me llega el correo de verificación, ¿qué hago?',
    a: 'Primero revisa la carpeta de spam/promociones. Luego usa “Reenviar verificación” en la página de verificación. Si sigue sin llegar, prueba con otro correo (Gmail suele funcionar mejor) o contáctanos.',
    tag: 'Cuenta',
  },
  {
    q: '¿Por qué mi cuenta dice “email no confirmado”?',
    a: 'Tenemos verificación obligatoria para mayor seguridad. Hasta que confirmes el email, algunas acciones (como wishlist o checkout) pueden estar bloqueadas. Verifica el correo y vuelve a iniciar sesión.',
    tag: 'Cuenta',
  },
  {
    q: '¿Puedo pedir un plan personalizado?',
    a: 'Sí. Envíanos ciudad/destino, fechas aproximadas, número de personas, intereses (cultura, café, naturaleza) y presupuesto. Te respondemos con recomendaciones y opciones reales del catálogo.',
    tag: 'Soporte',
  },
  {
    q: '¿Tienen soporte por WhatsApp?',
    a: 'Sí. Si estás en viaje o necesitas algo rápido, WhatsApp es el canal más ágil. También puedes escribirnos por email desde la página de contacto.',
    tag: 'Soporte',
  },
  {
    q: '¿Puedo reservar una experiencia privada o para grupo?',
    a: 'Sí. Algunas experiencias pueden adaptarse a parejas, familias, grupos pequeños o solicitudes privadas. Escríbenos por contacto o WhatsApp para revisarlo según ciudad, fecha y disponibilidad.',
    tag: 'Soporte',
  },
  {
    q: '¿Con cuánta anticipación debería reservar?',
    a: 'Lo ideal es reservar con varios días de anticipación, especialmente en fines de semana, festivos o temporadas altas. Así es más fácil asegurar cupo y coordinar mejor la experiencia.',
    tag: 'Cambios',
  },
  {
    q: '¿Qué pasa si llueve o cambia una condición operativa?',
    a: 'Si el clima o una condición de seguridad afecta el tour, KCE revisará la mejor alternativa posible: cambio de horario, reprogramación o una opción equivalente cuando aplique.',
    tag: 'Seguridad',
  },
  {
    q: '¿Puedo combinar varias ciudades o experiencias en un mismo viaje?',
    a: 'Sí. Para eso te recomendamos usar el plan personalizado. Así podemos entender fechas, ritmo, presupuesto e intereses antes de sugerirte una ruta más completa.',
    tag: 'Soporte',
  },
  {
    q: '¿Atienden en varios idiomas?',
    a: 'KCE está construyendo atención multilingüe para acompañar mejor a viajeros internacionales. Si necesitas soporte en un idioma concreto, cuéntanos antes de reservar y te diremos qué nivel de acompañamiento está disponible.',
    tag: 'Soporte',
  },
];

export const metadata: Metadata = {
  title: 'Preguntas frecuentes — KCE',
  description: 'Resuelve dudas sobre seguridad, pagos, cancelaciones, verificación de cuenta y soporte.',
};

function safeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function Page() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

  // JSON-LD FAQPage (SEO)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  // UI: chips (server-friendly: sin estado; “simple + pro”)
  // Si luego quieres buscador interactivo (client), lo hacemos con un componente separado.
  const tags: Array<Faq['tag']> = ['Seguridad', 'Pagos', 'Cuenta', 'Cambios', 'Soporte'];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <section className="card p-8">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text)]/70">
            FAQ · KCE Support
          </div>

          <h1 className="font-heading text-3xl tracking-tight text-brand-blue">Preguntas frecuentes</h1>

          <p className="text-[color:var(--color-text)]/70">
            Respuestas claras, sin letra pequeña. Si tu pregunta no está aquí, usa la página de contacto.
          </p>

          {/* Quick filter links (sin JS, súper sólido) */}
          <nav aria-label="Categorías FAQ" className="pt-2">
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <a
                  key={t}
                  href={`#tag-${normalize(t)}`}
                  className={cx(
                    'inline-flex items-center rounded-full border border-[var(--color-border)]',
                    'bg-[color:var(--color-surface)] px-3 py-1 text-xs font-semibold',
                    'text-[color:var(--color-text)]/75 hover:bg-[color:var(--color-surface-2)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40',
                    '!no-underline hover:!no-underline',
                  )}
                >
                  {t}
                </a>
              ))}
            </div>
          </nav>
        </header>

        {/* FAQ list */}
        <div className="mt-8 space-y-8">
          {tags.map((tag) => {
            const group = faqs.filter((f) => f.tag === tag);
            if (group.length === 0) return null;

            return (
              <section key={tag} aria-label={`FAQ ${tag}`}>
                <div className="mb-3 flex items-center justify-between">
                  <h2
                    id={`tag-${normalize(tag)}`}
                    className="font-heading text-lg text-brand-blue"
                  >
                    {tag}
                  </h2>
                  <a
                    href="#top"
                    className="text-xs text-[color:var(--color-text)]/55 underline underline-offset-4 hover:text-[color:var(--color-text)]/80"
                  >
                    Subir ↑
                  </a>
                </div>

                <div className="space-y-3">
                  {group.map((f) => (
                    <details
                      key={f.q}
                      className={cx(
                        'group rounded-2xl border border-[var(--color-border)]',
                        'bg-[color:var(--color-surface-2)] p-5',
                        'shadow-soft transition',
                        'open:bg-[color:var(--color-surface)] open:shadow-md',
                      )}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                        <span className="text-base font-semibold text-[color:var(--color-text)]">
                          {f.q}
                        </span>

                        {/* Chevron (sin icon lib, puro CSS/HTML) */}
                        <span
                          aria-hidden="true"
                          className={cx(
                            'grid size-8 place-items-center rounded-full',
                            'border border-[var(--color-border)] bg-[color:var(--color-surface)]',
                            'text-[color:var(--color-text)]/60',
                            'transition group-open:rotate-180',
                          )}
                        >
                          ▾
                        </span>
                      </summary>

                      <div className="mt-3 text-sm leading-relaxed text-[color:var(--color-text)]/75">
                        {f.a}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Support card */}
        <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-6">
          <div className="text-sm font-semibold text-[color:var(--color-text)]">
            ¿Necesitas ayuda con tu cuenta?
          </div>

          <p className="mt-2 text-sm text-[color:var(--color-text)]/70">
            Si activaste verificación obligatoria, revisa spam/promociones y usa “Reenviar verificación”.
            Si además quieres ayuda para elegir una experiencia, combinar ciudades o resolver una duda antes de pagar, KCE puede orientarte por contacto o plan personalizado.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href="/contact"
              className={cx(
                'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold',
                'bg-[color:var(--color-surface)] border border-[var(--color-border)]',
                'text-brand-blue hover:bg-[color:var(--color-surface-2)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40',
                '!no-underline hover:!no-underline',
              )}
            >
              Ir a Contacto →
            </a>

            <a
              href="/plan"
              className={cx(
                'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold',
                'bg-[color:var(--color-surface)] border border-[var(--color-border)]',
                'text-brand-blue hover:bg-[color:var(--color-surface-2)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40',
                '!no-underline hover:!no-underline',
              )}
            >
              Abrir Plan personalizado →
            </a>

            <span className="text-xs text-[color:var(--color-text)]/55">
              Base: <span className="font-mono">{base}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Anchor target */}
      <div id="top" className="sr-only" />
    </main>
  );
}

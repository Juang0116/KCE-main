import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  HelpCircle, ShieldCheck, CreditCard, Users, RefreshCw, 
  ArrowRight, MessageCircle, Sparkles, ChevronDown 
} from 'lucide-react';

import { Button } from '@/components/ui/Button';

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
    a: 'Sí. Después del pago, te enviamos un email con la confirmación de reserva y un enlace para descargar tu factura en PDF.',
    tag: 'Pagos',
  },
  {
    q: '¿Cómo funcionan cancelaciones o cambios?',
    a: 'Depende de cada experiencia. En la página de cada tour verás reglas claras. Si tienes un caso especial, escríbenos y lo resolvemos.',
    tag: 'Cambios',
  },
  {
    q: 'No me llega el correo de verificación, ¿qué hago?',
    a: 'Primero revisa la carpeta de spam. Luego usa “Reenviar verificación” en la página de acceso. Si persiste, prueba con otro correo o contáctanos.',
    tag: 'Cuenta',
  },
  {
    q: '¿Por qué mi cuenta dice “email no confirmado”?',
    a: 'Tenemos verificación obligatoria por seguridad. Hasta que confirmes el email, algunas acciones de reserva pueden estar bloqueadas.',
    tag: 'Cuenta',
  },
  {
    q: '¿Puedo pedir un plan personalizado?',
    a: 'Sí. Envíanos ciudad, fechas, número de personas e intereses. Te respondemos con recomendaciones reales del catálogo.',
    tag: 'Soporte',
  },
  {
    q: '¿Tienen soporte por WhatsApp?',
    a: 'Sí. Si estás en viaje o necesitas algo rápido, WhatsApp es el canal más ágil.',
    tag: 'Soporte',
  },
  {
    q: '¿Puedo reservar una experiencia privada o para grupo?',
    a: 'Sí. Algunas experiencias pueden adaptarse a parejas o grupos privados. Escríbenos para revisarlo según disponibilidad.',
    tag: 'Soporte',
  },
  {
    q: '¿Con cuánta anticipación debería reservar?',
    a: 'Lo ideal es reservar con varios días de anticipación, especialmente en temporadas altas o fines de semana.',
    tag: 'Cambios',
  },
  {
    q: '¿Qué pasa si llueve o cambia una condición operativa?',
    a: 'KCE revisará la mejor alternativa: cambio de horario, reprogramación o una opción equivalente cuando aplique.',
    tag: 'Seguridad',
  },
  {
    q: '¿Atienden en varios idiomas?',
    a: 'Estamos construyendo atención multilingüe. Si necesitas soporte en un idioma concreto, cuéntanos antes de reservar.',
    tag: 'Soporte',
  },
];

const TAG_ICONS = {
  'Seguridad': ShieldCheck,
  'Pagos': CreditCard,
  'Cuenta': Users,
  'Cambios': RefreshCw,
  'Soporte': MessageCircle,
};

export const metadata: Metadata = {
  title: 'Preguntas frecuentes — KCE',
  description: 'Resuelve dudas sobre seguridad, pagos, cancelaciones, verificación de cuenta y soporte.',
};

function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export default function FAQPage() {
  const tags: Array<Faq['tag']> = ['Seguridad', 'Pagos', 'Cuenta', 'Cambios', 'Soporte'];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* HERO FAQ */}
      <section className="relative overflow-hidden bg-brand-blue px-6 py-24 md:py-32 text-center text-white shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.png')] bg-repeat"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md">
            <HelpCircle className="h-3 w-3" /> Soporte KCE
          </div>
          <h1 className="font-heading text-4xl leading-tight md:text-6xl drop-shadow-md">
            Preguntas frecuentes.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl">
            Respuestas claras, sin letra pequeña. Si tu duda no está aquí, nuestro equipo está a un mensaje de distancia.
          </p>

          {/* Chips de Filtrado */}
          <nav aria-label="Categorías FAQ" className="mt-12 flex flex-wrap justify-center gap-3">
            {tags.map((t) => (
              <a
                key={t}
                href={`#tag-${normalize(t)}`}
                className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm transition hover:bg-white/20 hover:border-white/30"
              >
                {t}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* LISTADO DE PREGUNTAS */}
      <section className="mx-auto max-w-4xl px-6 -mt-10 relative z-20 space-y-12">
        {tags.map((tag) => {
          const group = faqs.filter((f) => f.tag === tag);
          const Icon = TAG_ICONS[tag];
          if (group.length === 0) return null;

          return (
            <div key={tag} className="space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 id={`tag-${normalize(tag)}`} className="font-heading text-2xl text-brand-blue">
                    {tag}
                  </h2>
                </div>
                <a href="#top" className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/40 hover:text-brand-blue">Subir ↑</a>
              </div>

              <div className="grid gap-4">
                {group.map((f) => (
                  <details
                    key={f.q}
                    className="group rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-all open:shadow-xl"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between p-6 md:p-8">
                      <span className="text-lg font-heading text-brand-blue/90 group-open:text-brand-blue transition-colors">
                        {f.q}
                      </span>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-brand-blue transition-transform duration-300 group-open:rotate-180">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </summary>
                    <div className="px-8 pb-8">
                      <p className="text-base font-light leading-relaxed text-[var(--color-text)]/70">
                        {f.a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          );
        })}

        {/* CTA FINAL SOPORTE */}
        <section className="mt-20 overflow-hidden rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-10 md:p-16 shadow-inner text-center">
          <div className="max-w-2xl mx-auto">
            <Sparkles className="mx-auto h-8 w-8 text-brand-yellow mb-6" />
            <h2 className="font-heading text-3xl text-brand-blue mb-4">¿Sigues con dudas?</h2>
            <p className="text-lg font-light text-[var(--color-text)]/60 leading-relaxed mb-10">
              Si tu pregunta es muy específica o necesitas coordinar una ruta compleja para un grupo, lo mejor es que hablemos directamente.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="rounded-full px-8 shadow-md">
                <Link href="/contact">Hablar con KCE <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 border-brand-blue/20 text-brand-blue">
                <Link href="/plan">Abrir Plan Personalizado</Link>
              </Button>
            </div>
          </div>
        </section>
      </section>

      {/* Anchor target */}
      <div id="top" className="sr-only" />
    </main>
  );
}
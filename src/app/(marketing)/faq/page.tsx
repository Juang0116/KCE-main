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
    <main className="min-h-screen bg-[var(--color-bg)] flex flex-col animate-fade-in" id="top">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* 01. HERO FAQ (Editorial Parity - Claro y Elegante) */}
      <section className="relative w-full flex flex-col justify-center overflow-hidden bg-[var(--color-surface)] border-b border-[var(--color-border)] px-6 py-20 md:py-32 text-center">
        {/* Destello sutil azul indicando Servicio/Ayuda */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm backdrop-blur-md">
            <HelpCircle className="h-3 w-3" /> Soporte KCE
          </div>
          
          <h1 className="font-heading text-5xl leading-tight md:text-7xl lg:text-8xl text-[var(--color-text)] drop-shadow-sm tracking-tight mb-6">
            Preguntas <br className="hidden md:block" />
            <span className="text-brand-blue italic font-light">frecuentes.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-[var(--color-text-muted)] md:text-xl">
            Respuestas claras, sin letra pequeña. Si tu duda no está aquí, nuestro equipo está a un mensaje de distancia.
          </p>

          {/* Chips de Filtrado (Píldoras Premium) */}
          <nav aria-label="Categorías FAQ" className="mt-12 flex flex-wrap justify-center gap-3">
            {tags.map((t) => (
              <a
                key={t}
                href={`#tag-${normalize(t)}`}
                className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)] hover:border-brand-blue/30 hover:text-brand-blue shadow-sm"
              >
                {t}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* 02. LISTADO DE PREGUNTAS (Acordeones limpios) */}
      <section className="mx-auto w-full max-w-4xl px-6 py-20 flex flex-col gap-16 flex-1 relative z-20">
        {tags.map((tag) => {
          const group = faqs.filter((f) => f.tag === tag);
          const Icon = TAG_ICONS[tag];
          if (group.length === 0) return null;

          return (
            <div key={tag} className="space-y-6 scroll-mt-24">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-brand-blue border border-[var(--color-border)] shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 id={`tag-${normalize(tag)}`} className="font-heading text-3xl text-[var(--color-text)] tracking-tight">
                    {tag}
                  </h2>
                </div>
                <a href="#top" className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] opacity-60 hover:text-brand-blue hover:opacity-100 transition-colors hidden sm:block">Subir ↑</a>
              </div>

              <div className="grid gap-4">
                {group.map((f) => (
                  <details
                    key={f.q}
                    className="group rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-soft transition-all duration-300 open:shadow-md open:border-brand-blue/20"
                  >
                    <summary className="flex cursor-pointer list-none items-start sm:items-center justify-between gap-4 p-6 md:p-8">
                      <span className="text-lg font-heading text-[var(--color-text)] group-hover:text-brand-blue group-open:text-brand-blue transition-colors">
                        {f.q}
                      </span>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)] transition-transform duration-300 group-open:rotate-180 group-open:bg-brand-blue/5 group-open:text-brand-blue group-open:border-brand-blue/20 mt-0.5 sm:mt-0">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </summary>
                    <div className="px-6 md:px-8 pb-8 pt-0">
                      <p className="text-base font-light leading-relaxed text-[var(--color-text-muted)]">
                        {f.a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* 03. CTA FINAL SOPORTE (Glassmorphism Premium) */}
      <section className="bg-[var(--color-surface-2)]/30 border-t border-[var(--color-border)] py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 md:p-16 shadow-soft text-center group">
            {/* Glow Dinámico */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-blue/5 rounded-full blur-[80px] pointer-events-none transition-transform duration-1000 group-hover:scale-150"></div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-brand-yellow mb-6 shadow-sm">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
              <h2 className="font-heading text-4xl text-[var(--color-text)] tracking-tight mb-4">¿Sigues con dudas?</h2>
              <p className="text-lg font-light text-[var(--color-text-muted)] leading-relaxed mb-10">
                Si tu pregunta es muy específica o necesitas coordinar una ruta compleja para un grupo, lo mejor es que hablemos directamente.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild size="lg" className="rounded-full bg-brand-blue text-white hover:bg-brand-blue/90 px-10 py-6 text-base shadow-pop hover:-translate-y-0.5 transition-transform w-full sm:w-auto">
                  <Link href="/contact">Hablar con KCE <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] px-10 py-6 text-base transition-colors w-full sm:w-auto">
                  <Link href="/plan">Abrir Plan Personalizado</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
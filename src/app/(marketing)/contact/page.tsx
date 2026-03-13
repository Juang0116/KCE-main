/* src/app/(marketing)/contact/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';

import ContactForm from '@/features/marketing/ContactForm';
import PremiumConversionStrip from '@/features/marketing/PremiumConversionStrip';
import { splitCsv } from '@/features/marketing/contactContext';

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kce.travel').replace(
  /\/+$/,
  '',
);

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

async function resolveLocale(): Promise<'es' | 'en' | 'fr' | 'de'> {
  const c = await cookies();
  const v = c.get('kce.locale')?.value?.toLowerCase();
  return v === 'en' || v === 'fr' || v === 'de' ? v : 'es';
}

function absoluteUrl(input?: string) {
  const s = (input || '').trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${BASE_SITE_URL}${s}`;
  return `${BASE_SITE_URL}/${s}`;
}

function safeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function normalizeWhatsApp(raw: string) {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  return digits.length >= 11 ? digits : `57${digits}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const canonical = absoluteUrl(withLocale(locale, '/contact'));
  const title = 'Contacto y soporte premium | KCE';
  const description =
    'Habla con KCE para resolver reservas, cambios, dudas de viaje o continuar un plan personalizado sin perder contexto.';
  return {
    metadataBase: new URL(BASE_SITE_URL),
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      images: [
        {
          url: absoluteUrl('/images/hero-kce.jpg'),
          width: 1200,
          height: 630,
          alt: 'KCE — Contacto y soporte',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl('/images/hero-kce.jpg')],
    },
  };
}

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return (value[0] || '').trim();
  return (value || '').trim();
}

export default async function Page({ searchParams }: Props) {
  const locale = await resolveLocale();
  const sp = (await Promise.resolve(searchParams ?? {})) as SearchParams;

  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'support@kce.travel';
  const whatsappRaw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || '';
  const whatsapp = normalizeWhatsApp(whatsappRaw);

  const canonical = absoluteUrl(withLocale(locale, '/contact'));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contacto — KCE',
    url: canonical,
    inLanguage: locale,
    mainEntity: {
      '@type': 'Organization',
      name: 'Knowing Cultures Enterprise (KCE)',
      url: absoluteUrl('/'),
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email,
          availableLanguage: ['es', 'en', 'fr', 'de'],
        },
        ...(whatsapp
          ? [
              {
                '@type': 'ContactPoint',
                contactType: 'WhatsApp',
                telephone: `+${whatsapp}`,
                availableLanguage: ['es', 'en'],
              },
            ]
          : []),
      ],
    },
  };

  const mailto = `mailto:${encodeURIComponent(email)}`;
  const waHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola KCE, necesito ayuda con mi viaje o reserva.')}`
    : '';
  const planHref = withLocale(locale, '/plan');

  const source = pickFirst(sp.source);
  const emailContext = pickFirst(sp.email);
  const whatsappContext = pickFirst(sp.whatsapp);
  const inboundMessage = pickFirst(sp.message);
  const topic = pickFirst(sp.topic);
  const city = pickFirst(sp.city);
  const query = pickFirst(sp.q);
  const tag = pickFirst(sp.tag);
  const budget = pickFirst(sp.budget);
  const pace = pickFirst(sp.pace);
  const pax = pickFirst(sp.pax);
  const tour = pickFirst(sp.tour);
  const slug = pickFirst(sp.slug);
  const start = pickFirst(sp.start);
  const end = pickFirst(sp.end);
  const ticket = pickFirst(sp.ticket);
  const conversation = pickFirst(sp.conversation);
  const interests = splitCsv(pickFirst(sp.interests)).slice(0, 6);

  const contextRows = [
    city ? ['Ciudad base', city] : null,
    tour ? ['Tour o referencia', tour] : null,
    slug ? ['Slug', slug] : null,
    pax ? ['Personas', pax] : null,
    budget ? ['Presupuesto', budget] : null,
    pace ? ['Ritmo', pace] : null,
    interests.length ? ['Intereses', interests.join(', ')] : null,
    query ? ['Búsqueda', query] : null,
    tag ? ['Tag', tag] : null,
    start || end ? ['Fechas', [start || '—', end || '—'].join(' → ')] : null,
    source ? ['Origen', source] : null,
    ticket ? ['Ticket', ticket] : null,
    conversation ? ['Conversación', conversation] : null,
    emailContext ? ['Email', emailContext] : null,
    whatsappContext ? ['WhatsApp', whatsappContext] : null,
  ].filter(Boolean) as Array<[string, string]>;

  const topicLabel =
    topic === 'plan'
      ? 'Plan personalizado'
      : topic === 'tour'
        ? 'Tour puntual'
        : topic === 'catalog'
          ? 'Catálogo / ayuda para elegir'
          : topic === 'booking'
            ? 'Reserva / post-compra'
            : 'Solicitud general';

  const hasIncomingContext = contextRows.length > 0 || Boolean(topic || source);

  const initialMessage = hasIncomingContext
    ? [
        'Hola KCE, quiero continuar con este caso:',
        `- Motivo: ${topicLabel}`,
        city ? `- Ciudad base: ${city}` : '',
        tour ? `- Tour o referencia: ${tour}` : '',
        query ? `- Búsqueda o idea inicial: ${query}` : '',
        tag ? `- Tag o estilo: ${tag}` : '',
        pax ? `- Personas: ${pax}` : '',
        budget ? `- Presupuesto: ${budget}` : '',
        pace ? `- Ritmo: ${pace}` : '',
        interests.length ? `- Intereses: ${interests.join(', ')}` : '',
        start || end ? `- Fechas aproximadas: ${[start || '—', end || '—'].join(' → ')}` : '',
        inboundMessage ? `- Resumen previo: ${inboundMessage}` : '',
        ticket ? `- Ticket: ${ticket}` : '',
        conversation ? `- Conversación: ${conversation}` : '',
        '',
        'Necesito que me ayuden a seguir con claridad y sin perder el contexto.',
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const salesContext = {
    ...(city ? { city } : {}),
    ...(tour ? { tour } : {}),
    ...(slug ? { slug } : {}),
    ...(budget ? { budget } : {}),
    ...(pace ? { pace } : {}),
    ...(pax ? { pax } : {}),
    ...(interests.length ? { interests } : {}),
    ...(start ? { start } : {}),
    ...(end ? { end } : {}),
    ...(query || inboundMessage ? { query: query || inboundMessage } : {}),
  };

  const continueLinks = [
    slug
      ? {
          href: withLocale(locale, `/tours/${slug}`),
          label: 'Volver al tour',
          copy: 'Retoma el detalle del tour y revisa precio, duración y reserva con el mismo contexto.',
        }
      : null,
    {
      href: planHref,
      label: 'Abrir plan personalizado',
      copy: 'Ordena tu viaje si todavía necesitas comparar ciudad, ritmo, presupuesto o fechas.',
    },
    {
      href: withLocale(locale, '/tours'),
      label: 'Seguir explorando tours',
      copy: 'Vuelve al catálogo si quieres revisar otras rutas antes de cerrar con KCE.',
    },
    {
      href: waHref || withLocale(locale, '/faq'),
      label: whatsapp ? 'Abrir WhatsApp' : 'Ver FAQ',
      copy: whatsapp
        ? 'Usa WhatsApp si tu caso es sensible o necesitas continuidad más rápida.'
        : 'Consulta preguntas frecuentes mientras KCE retoma tu caso.',
    },
  ].filter(Boolean) as Array<{ href: string; label: string; copy: string }>;

  const entryCards = [
    {
      title: 'Quiero elegir el tour correcto',
      copy: 'Comparte ciudad, estilo y presupuesto para que KCE te devuelva una ruta mucho más clara.',
      href: planHref,
      cta: 'Abrir plan personalizado',
    },
    {
      title: 'Quiero ayuda con una reserva',
      copy: 'Pagos, invoice, punto de encuentro, cambios o soporte post-compra con continuidad real.',
      href: waHref || withLocale(locale, '/faq'),
      cta: whatsapp ? 'Abrir WhatsApp' : 'Ver FAQ',
    },
    {
      title: 'Quiero hablar con KCE',
      copy: 'Cuando tu caso necesita más contexto, soporte humano o una respuesta comercial más directa.',
      href: waHref || withLocale(locale, '/contact'),
      cta: whatsapp ? 'Hablar ahora' : 'Usar formulario',
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <section className="overflow-hidden rounded-[calc(var(--radius)+0.5rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[1.06fr_0.94fr]">
          <div className="p-6 md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text-muted)]">
              <span className="text-brand-blue">Contacto premium</span>
              <span className="opacity-50">•</span>
              <span>Continuidad clara</span>
              <span className="opacity-50">•</span>
              <span>Sin perder contexto</span>
            </div>

            <h1 className="mt-4 max-w-3xl font-heading text-3xl text-[color:var(--color-text)] md:text-5xl">
              Habla con KCE y sigue tu viaje, tu reserva o tu plan sin empezar desde cero.
            </h1>

            <p className="mt-4 max-w-2xl text-base text-[color:var(--color-text)]/75 md:text-lg">
              Esta página está pensada para resolver dudas reales, dar soporte con más calma y mantener el hilo cuando vienes desde tours, plan personalizado, chat o post-compra.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              {['Plan personalizado', 'Booking y soporte', 'Continuidad CRM'].map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1.5 text-[color:var(--color-text)]/80"
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {entryCards.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                  <div className="text-sm font-semibold text-[color:var(--color-text)]">{item.title}</div>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--color-text)]/72">{item.copy}</p>
                  <Link className="mt-3 inline-flex text-sm font-semibold text-brand-blue hover:underline" href={item.href}>
                    {item.cta} →
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <aside className="border-t border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-6 md:p-10 lg:border-l lg:border-t-0">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">Cuándo usar mejor esta página</div>
              <div className="mt-4 space-y-3">
                {[
                  ['Continuar un caso', 'Ideal si ya vienes desde tours, chat o plan personalizado y quieres que KCE conserve el contexto.'],
                  ['Resolver una reserva', 'Úsala para cambios, pagos, invoice, punto de encuentro o soporte post-compra.'],
                  ['Escalar a humano', 'Cuando ya sabes que necesitas una respuesta comercial o de soporte mucho más directa.'],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                    <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
                    <div className="mt-1 text-sm text-[color:var(--color-text)]/72">{copy}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-brand-blue/15 bg-brand-blue/5 px-4 py-3 text-xs leading-6 text-[color:var(--color-text)]/75">
                Si llegas con contexto desde tours, plan o chat, KCE puede abrir continuidad comercial y soporte con mejor trazabilidad.
              </div>
            </div>
          </aside>
        </div>

        <div className="border-t border-[var(--color-border)] p-6 md:p-10">
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {[
              ['1', 'Cuéntanos el caso', 'Escribe la situación completa o revisa el contexto precargado si vienes desde otra ruta.'],
              ['2', 'KCE ordena la continuidad', 'Según el caso, abrimos ticket, deal o seguimiento para no perder el hilo.'],
              ['3', 'Recibes siguiente paso', 'Puedes seguir por contacto, WhatsApp, catálogo o soporte según lo que más convenga.'],
            ].map(([step, title, copy]) => (
              <div key={step} className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <div className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-text-muted)]">STEP {step}</div>
                <div className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
                <div className="mt-1 text-sm text-[color:var(--color-text)]/70">{copy}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
                <h2 className="text-lg font-semibold">Escríbenos</h2>
                <p className="mt-1 text-sm text-[color:var(--color-text)]/75">
                  Te respondemos por el canal que elijas. Si es una reserva o un plan, incluye ciudad, fechas aproximadas y número de personas para avanzar con más claridad.
                </p>
                <div className="mt-3 rounded-2xl border border-brand-blue/15 bg-brand-blue/5 px-4 py-3 text-xs leading-6 text-[color:var(--color-text)]/75">
                  Ruta recomendada: si aún no sabes qué elegir, usa <Link className="font-semibold text-brand-blue hover:underline" href={planHref}>Plan personalizado</Link>. Si ya tienes una necesidad concreta, esta página es el mejor punto para continuidad y soporte.
                </div>
                <ContactForm
                  initialEmail={emailContext}
                  initialWhatsapp={whatsappContext}
                  initialMessage={initialMessage}
                  source={source || 'contact_page'}
                  topic={topicLabel}
                  salesContext={salesContext}
                  continueLinks={continueLinks}
                />
              </div>
            </div>

            <aside className="space-y-4">
              {contextRows.length > 0 ? (
                <div className="rounded-2xl border border-brand-blue/15 bg-[color:var(--color-surface-2)] p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">Contexto recibido</div>
                  <div className="mt-2 text-sm font-semibold text-brand-blue">{topicLabel}</div>
                  <div className="mt-4 space-y-2 text-sm text-[color:var(--color-text)]/78">
                    {contextRows.map(([label, value]) => (
                      <div key={label} className="flex items-start justify-between gap-3 border-b border-[var(--color-border)]/60 pb-2 last:border-b-0 last:pb-0">
                        <span className="text-[color:var(--color-text)]/56">{label}</span>
                        <span className="text-right font-medium text-[color:var(--color-text)]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">Entrada limpia</div>
                  <div className="mt-2 text-sm font-semibold text-brand-blue">Sin contexto previo</div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/74">
                    Si vienes directamente desde aquí, te conviene escribir ciudad, fechas, viajeros y estilo del viaje para que KCE responda con una ruta mucho más precisa.
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
                <div className="text-sm font-semibold">Email</div>
                <p className="mt-1 text-sm text-[color:var(--color-text)]/75">
                  <a className="text-brand-blue hover:underline" href={mailto}>
                    {email}
                  </a>
                </p>
              </div>

              {whatsapp ? (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
                  <div className="text-sm font-semibold">WhatsApp</div>
                  <p className="mt-1 text-sm text-[color:var(--color-text)]/75">
                    <a className="text-brand-blue hover:underline" href={waHref} target="_blank" rel="noreferrer">
                      +{whatsapp}
                    </a>
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--color-text)]/70">
                    Si estás en viaje o necesitas una respuesta más rápida, WhatsApp suele ser el mejor carril.
                  </p>
                </div>
              ) : null}

              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
                <div className="text-sm font-semibold">Qué pasa después</div>
                <div className="mt-3 space-y-3 text-sm text-[color:var(--color-text)]/74">
                  {[
                    ['1. Recibimos tu caso', 'Si vienes desde tours, chat o plan personalizado, KCE conserva el contexto.'],
                    ['2. Abrimos continuidad', 'Según el caso, se crea ticket y cuando aplica también deal y task.'],
                    ['3. Respondemos por prioridad', 'Booking sensible ≤2h, plan premium ≤12h y consultas generales el mismo día.'],
                  ].map(([title, copy]) => (
                    <div key={title} className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/48">{title}</div>
                      <div className="mt-1 leading-6">{copy}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
                <div className="text-sm font-semibold">Links útiles</div>
                <div className="mt-2 flex flex-col gap-2 text-sm">
                  <Link className="text-brand-blue hover:underline" href={withLocale(locale, '/tours')}>
                    Ver tours
                  </Link>
                  <Link className="text-brand-blue hover:underline" href={planHref}>
                    Abrir plan personalizado
                  </Link>
                  <Link className="text-brand-blue hover:underline" href={withLocale(locale, '/policies/payments')}>
                    Pagos y seguridad
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <PremiumConversionStrip locale={locale} whatsAppHref={waHref || null} className="px-0 pt-10" />
    </main>
  );
}

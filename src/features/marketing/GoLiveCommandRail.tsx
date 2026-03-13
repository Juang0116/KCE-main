import Link from 'next/link';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
type Variant = 'public' | 'postpurchase' | 'support';

type Item = { title: string; body: string; href: string };

type Props = {
  locale: SupportedLocale;
  variant?: Variant;
  className?: string;
};

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

function labels(locale: SupportedLocale) {
  return {
    tours: locale === 'en' ? 'Tours' : locale === 'fr' ? 'Tours' : locale === 'de' ? 'Touren' : 'Tours',
    plan: locale === 'en' ? 'Personalized plan' : locale === 'fr' ? 'Plan personnalisé' : locale === 'de' ? 'Persönlicher Plan' : 'Plan personalizado',
    contact: locale === 'en' ? 'Contact' : locale === 'fr' ? 'Contact' : locale === 'de' ? 'Kontakt' : 'Contacto',
    account: locale === 'en' ? 'Account' : locale === 'fr' ? 'Compte' : locale === 'de' ? 'Konto' : 'Cuenta',
    bookings: locale === 'en' ? 'Bookings' : locale === 'fr' ? 'Réservations' : locale === 'de' ? 'Buchungen' : 'Reservas',
    support: locale === 'en' ? 'Support' : locale === 'fr' ? 'Support' : locale === 'de' ? 'Support' : 'Soporte',
    destination: locale === 'en' ? 'Destinations' : locale === 'fr' ? 'Destinations' : locale === 'de' ? 'Destinationen' : 'Destinations',
  };
}

function copy(locale: SupportedLocale, variant: Variant): { eyebrow: string; title: string; description: string; note: string; items: Item[] } {
  const l = labels(locale);
  if (variant === 'postpurchase') {
    return {
      eyebrow: locale === 'es' ? 'go-live command' : 'go-live command',
      title: locale === 'es'
        ? 'La salida real depende de que booking, cuenta y soporte se lean como un mismo sistema.'
        : 'Real launch depends on booking, account and support reading like one system.',
      description: locale === 'es'
        ? 'Después del pago no debería existir confusión: recuperar la reserva, pedir ayuda o volver al catálogo tienen que seguir visibles y protegidos.'
        : 'After payment there should be no confusion: recovering the booking, asking for help or returning to the catalog should stay visible and protected.',
      note: locale === 'es'
        ? 'Regla de go-live: el viajero nunca debería preguntarse dónde vive ahora su caso.'
        : 'Go-live rule: the traveler should never wonder where their case lives now.',
      items: [
        { title: l.bookings, body: locale === 'es' ? 'La reserva sigue siendo el centro operativo después del checkout.' : 'The booking stays as the operational center after checkout.', href: withLocale(locale, '/account/bookings') },
        { title: l.account, body: locale === 'es' ? 'Cuenta sirve para recuperar activos y continuidad, no solo para autenticarse.' : 'Account helps recover assets and continuity, not just authenticate.', href: withLocale(locale, '/account') },
        { title: l.support, body: locale === 'es' ? 'Soporte debe abrir un solo hilo por caso con booking, ticket y contexto ya visibles.' : 'Support should open one thread per case with booking, ticket and context already visible.', href: withLocale(locale, '/account/support') },
        { title: l.contact, body: locale === 'es' ? 'Cuando toque escalar, contacto premium debe heredar el contexto y no empezar de cero.' : 'When escalation is needed, premium contact should inherit context instead of starting from zero.', href: withLocale(locale, '/contact?source=go-live-postpurchase') },
      ],
    };
  }
  if (variant === 'support') {
    return {
      eyebrow: locale === 'es' ? 'support go-live' : 'support go-live',
      title: locale === 'es'
        ? 'Soporte de salida real: un solo hilo, contexto importado y escalamiento claro.'
        : 'Go-live support: one thread, imported context and clear escalation.',
      description: locale === 'es'
        ? 'En producción, el objetivo no es solo responder: es reducir fricción, proteger la reserva y dejar claro el siguiente paso.'
        : 'In production, the goal is not only answering: it is reducing friction, protecting the booking and making the next step obvious.',
      note: locale === 'es'
        ? 'Si el caso ya tiene ticket, booking o conversación, soporte debe seguir desde ahí.'
        : 'If the case already has a ticket, booking or conversation, support should continue from there.',
      items: [
        { title: l.support, body: locale === 'es' ? 'Abre o continúa un único ticket por caso principal.' : 'Open or continue a single ticket for the main case.', href: withLocale(locale, '/account/support') },
        { title: l.bookings, body: locale === 'es' ? 'Vuelve a reservas cuando haga falta confirmar fechas, invoice o logística.' : 'Return to bookings when dates, invoice or logistics need confirmation.', href: withLocale(locale, '/account/bookings') },
        { title: l.contact, body: locale === 'es' ? 'Escala a contacto premium solo cuando el caso ya exige un handoff humano más directo.' : 'Escalate to premium contact only when the case truly needs a more direct human handoff.', href: withLocale(locale, '/contact?source=go-live-support') },
        { title: l.account, body: locale === 'es' ? 'Mantén cuenta como base estable para no perder reentrada y continuidad.' : 'Keep account as the stable base to preserve re-entry and continuity.', href: withLocale(locale, '/account') },
      ],
    };
  }
  return {
    eyebrow: locale === 'es' ? 'go-live command' : 'go-live command',
    title: locale === 'es'
      ? 'La salida real exige un frente público más corto, claro y con una sola lectura comercial.'
      : 'Real launch requires a shorter, clearer public surface with one commercial reading.',
    description: locale === 'es'
      ? 'Tours, destinations, plan y contacto ya deberían comportarse como el mismo sistema visible: comparar, decidir, reservar o pedir ayuda con contexto.'
      : 'Tours, destinations, plan and contact should already behave like the same visible system: compare, decide, book or ask for help with context.',
    note: locale === 'es'
      ? 'Regla de go-live: si el viajero duda, la siguiente acción correcta debe seguir visible sin ruido adicional.'
      : 'Go-live rule: when the traveler hesitates, the correct next action should remain visible without extra noise.',
    items: [
      { title: l.tours, body: locale === 'es' ? 'Catálogo para comparar opciones reales y entrar a detalle con menos fricción.' : 'Catalog to compare real options and enter detail with less friction.', href: withLocale(locale, '/tours') },
      { title: l.destination, body: locale === 'es' ? 'Entrada por ciudad o región para viajeros que aún ordenan su ruta.' : 'Entry by city or region for travelers still shaping their route.', href: withLocale(locale, '/destinations') },
      { title: l.plan, body: locale === 'es' ? 'Plan personalizado absorbe la duda y la convierte en decisión guiada.' : 'The personalized plan absorbs uncertainty and turns it into guided choice.', href: withLocale(locale, '/plan') },
      { title: l.contact, body: locale === 'es' ? 'Contacto premium protege el handoff cuando el caso ya merece ayuda humana.' : 'Premium contact protects the handoff when the case deserves human help.', href: withLocale(locale, '/contact') },
    ],
  };
}

export default function GoLiveCommandRail({ locale, variant = 'public', className }: Props) {
  const data = copy(locale, variant);
  return (
    <section className={`rounded-[2rem] border border-brand-blue/12 bg-[color:var(--color-surface)] p-6 shadow-soft ${className || ''}`}>
      <div className="max-w-3xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-blue">{data.eyebrow}</div>
        <h2 className="mt-3 font-heading text-2xl text-brand-blue md:text-3xl">{data.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/74 md:text-base">{data.description}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.items.map((item, idx) => (
          <Link
            key={`${item.title}-${idx}`}
            href={item.href}
            className="group rounded-[1.35rem] border border-brand-blue/10 bg-brand-blue/5 p-4 transition hover:-translate-y-0.5 hover:border-brand-blue/18 hover:bg-brand-blue/7"
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-blue">{String(idx + 1).padStart(2, '0')}</div>
            <div className="mt-3 font-heading text-xl text-brand-blue">{item.title}</div>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/74">{item.body}</p>
            <div className="mt-4 text-sm font-semibold text-brand-blue">{locale === 'es' ? 'Abrir' : 'Open'} →</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-[1.35rem] border border-brand-blue/10 bg-white/70 px-4 py-3 text-sm leading-6 text-[color:var(--color-text)]/72 shadow-soft dark:bg-black/10">
        <span className="font-semibold text-brand-blue">{locale === 'es' ? 'Nota de lanzamiento:' : 'Launch note:'}</span> {data.note}
      </div>
    </section>
  );
}

import Link from 'next/link';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
type Variant = 'public' | 'postpurchase' | 'support' | 'account';

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
    destinations: locale === 'en' ? 'Destinations' : locale === 'fr' ? 'Destinations' : locale === 'de' ? 'Destinationen' : 'Destinations',
  };
}

function copy(locale: SupportedLocale, variant: Variant): { eyebrow: string; title: string; description: string; note: string; items: Item[] } {
  const l = labels(locale);
  if (variant === 'postpurchase') {
    return {
      eyebrow: locale === 'es' ? 'production readiness' : 'production readiness',
      title: locale === 'es'
        ? 'Producción real: booking, cuenta, soporte y contacto deben cerrar el caso sin duplicar canales.'
        : 'Real production: booking, account, support and contact should close the case without duplicating channels.',
      description: locale === 'es'
        ? 'Cuando el viaje ya fue comprado, la prioridad es recuperar activos, resolver incidencias y proteger continuidad con una sola lectura operativa.'
        : 'Once the trip is purchased, the priority is recovering assets, resolving issues and protecting continuity with one operational reading.',
      note: locale === 'es'
        ? 'Checklist mental: recuperar booking, revisar cuenta, abrir soporte con contexto y escalar a contacto solo si hace falta.'
        : 'Mental checklist: recover the booking, review account, open support with context and escalate to contact only when needed.',
      items: [
        { title: l.bookings, body: locale === 'es' ? 'La reserva sigue siendo la verdad operativa después del pago.' : 'The booking remains the operational truth after payment.', href: withLocale(locale, '/account/bookings') },
        { title: l.account, body: locale === 'es' ? 'Cuenta sirve para reentrada, activos y continuidad, no solo para login.' : 'Account is for re-entry, assets and continuity, not only login.', href: withLocale(locale, '/account') },
        { title: l.support, body: locale === 'es' ? 'Soporte trabaja mejor cuando hereda booking, ticket y conversación.' : 'Support works best when it inherits booking, ticket and conversation.', href: withLocale(locale, '/account/support') },
        { title: l.contact, body: locale === 'es' ? 'El handoff humano debe quedarse como escalamiento premium, no como canal paralelo.' : 'Human handoff should remain a premium escalation, not a parallel channel.', href: withLocale(locale, '/contact?source=production-readiness-postpurchase') },
      ],
    };
  }
  if (variant === 'support') {
    return {
      eyebrow: locale === 'es' ? 'production support' : 'production support',
      title: locale === 'es'
        ? 'Soporte listo para producción: un solo hilo por caso y reentradas visibles antes de abrir otro frente.'
        : 'Production-ready support: one thread per case and visible re-entry points before opening another front.',
      description: locale === 'es'
        ? 'En soporte final, lo importante no es solo responder rápido: es conservar el contexto correcto y evitar que el viajero repita la misma historia.'
        : 'In final support, the point is not only responding fast: it is preserving the right context and avoiding the traveler repeating the same story.',
      note: locale === 'es'
        ? 'Antes de abrir otro canal, revisa si ya existe booking, ticket o contacto con contexto suficiente.'
        : 'Before opening another channel, check whether booking, ticket or contact already carry enough context.',
      items: [
        { title: l.support, body: locale === 'es' ? 'Continúa el caso en un único hilo siempre que sea posible.' : 'Continue the case in one thread whenever possible.', href: withLocale(locale, '/account/support') },
        { title: l.bookings, body: locale === 'es' ? 'Confirma fechas, invoice y logística desde reservas antes de escalar.' : 'Confirm dates, invoice and logistics from bookings before escalating.', href: withLocale(locale, '/account/bookings') },
        { title: l.account, body: locale === 'es' ? 'Cuenta conserva la base estable para volver sin perder continuidad.' : 'Account preserves the stable base to return without losing continuity.', href: withLocale(locale, '/account') },
        { title: l.contact, body: locale === 'es' ? 'Escala a contacto premium cuando el caso sí exige un handoff directo.' : 'Escalate to premium contact when the case truly requires direct handoff.', href: withLocale(locale, '/contact?source=production-readiness-support') },
      ],
    };
  }
  if (variant === 'account') {
    return {
      eyebrow: locale === 'es' ? 'production account' : 'production account',
      title: locale === 'es'
        ? 'Cuenta y reservas ya deberían funcionar como una cabina simple de continuidad, no como páginas separadas.'
        : 'Account and bookings should already work like a simple continuity cabin, not like separate pages.',
      description: locale === 'es'
        ? 'Desde aquí el viajero debería recuperar reservas, abrir soporte, escalar a contacto o volver al catálogo sin preguntarse dónde vive ahora su caso.'
        : 'From here the traveler should recover bookings, open support, escalate to contact or return to the catalog without wondering where the case lives now.',
      note: locale === 'es'
        ? 'Regla final de cuenta: cada salida rápida debe reducir ansiedad o esfuerzo, no añadir otra capa de navegación.'
        : 'Final account rule: every quick exit should reduce anxiety or effort, not add another navigation layer.',
      items: [
        { title: l.bookings, body: locale === 'es' ? 'Reserva, invoice y calendario tienen que seguir a un toque de distancia.' : 'Booking, invoice and calendar should remain one tap away.', href: withLocale(locale, '/account/bookings') },
        { title: l.support, body: locale === 'es' ? 'Soporte hereda contexto y evita abrir casos desconectados.' : 'Support inherits context and avoids disconnected cases.', href: withLocale(locale, '/account/support') },
        { title: l.contact, body: locale === 'es' ? 'Contacto queda como handoff premium cuando ya toca seguimiento humano.' : 'Contact stays as premium handoff when human follow-up is needed.', href: withLocale(locale, '/contact?source=production-readiness-account') },
        { title: l.tours, body: locale === 'es' ? 'El catálogo sigue visible para ampliar el viaje sin romper continuidad.' : 'The catalog remains visible to extend the trip without breaking continuity.', href: withLocale(locale, '/tours') },
      ],
    };
  }
  return {
    eyebrow: locale === 'es' ? 'production readiness' : 'production readiness',
    title: locale === 'es'
      ? 'Salida real: el frente público debe guiar al viajero desde comparar hasta reservar o pedir ayuda sin ruido lateral.'
      : 'Real launch: the public front should guide the traveler from comparison to booking or asking for help without lateral noise.',
    description: locale === 'es'
      ? 'Tours, destinations, plan y contacto ya no deberían competir entre sí: deben repartirse la duda, la decisión y el handoff de la forma más clara posible.'
      : 'Tours, destinations, plan and contact should no longer compete with each other: they should distribute doubt, decision and handoff as clearly as possible.',
    note: locale === 'es'
      ? 'Checklist mental: comparar, decidir, escalar si hace falta, reservar o pedir ayuda con contexto.'
      : 'Mental checklist: compare, decide, escalate when needed, book or ask for help with context.',
    items: [
      { title: l.tours, body: locale === 'es' ? 'Comparar opciones reales con menos fricción visual y más claridad comercial.' : 'Compare real options with less visual friction and more commercial clarity.', href: withLocale(locale, '/tours') },
      { title: l.destinations, body: locale === 'es' ? 'Ordenar la ruta por ciudad o región cuando el viaje aún no está cerrado.' : 'Sort the route by city or region when the trip is not closed yet.', href: withLocale(locale, '/destinations') },
      { title: l.plan, body: locale === 'es' ? 'Absorber duda, presupuesto y ritmo para convertirlos en una propuesta guiada.' : 'Absorb doubt, budget and pace to turn them into a guided proposal.', href: withLocale(locale, '/plan') },
      { title: l.contact, body: locale === 'es' ? 'Proteger el handoff humano cuando el caso ya exige seguimiento premium.' : 'Protect human handoff when the case already requires premium follow-up.', href: withLocale(locale, '/contact?source=production-readiness-public') },
    ],
  };
}

export default function ProductionReadinessFinalRail({ locale, variant = 'public', className }: Props) {
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
        <span className="font-semibold text-brand-blue">{locale === 'es' ? 'Nota final:' : 'Final note:'}</span> {data.note}
      </div>
    </section>
  );
}

import Link from 'next/link';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
type Variant = 'public' | 'plan' | 'contact' | 'postpurchase' | 'support';

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

function copy(locale: SupportedLocale, variant: Variant) {
  const labels = {
    tours: locale === 'en' ? 'Tours' : locale === 'fr' ? 'Tours' : locale === 'de' ? 'Touren' : 'Tours',
    destinations: locale === 'en' ? 'Destinations' : locale === 'fr' ? 'Destinations' : locale === 'de' ? 'Destinationen' : 'Destinations',
    plan: locale === 'en' ? 'Personalized plan' : locale === 'fr' ? 'Plan personnalisé' : locale === 'de' ? 'Persönlicher Plan' : 'Plan personalizado',
    contact: locale === 'en' ? 'Contact' : locale === 'fr' ? 'Contact' : locale === 'de' ? 'Kontakt' : 'Contacto',
    support: locale === 'en' ? 'Support' : locale === 'fr' ? 'Support' : locale === 'de' ? 'Support' : 'Soporte',
    account: locale === 'en' ? 'Account' : locale === 'fr' ? 'Compte' : locale === 'de' ? 'Konto' : 'Cuenta',
  };

  const variants = {
    public: {
      eyebrow: locale === 'en' ? 'release candidate' : locale === 'fr' ? 'release candidate' : locale === 'de' ? 'release candidate' : 'release candidate',
      title: locale === 'en'
        ? 'The public core should now read like one commercial system.'
        : locale === 'fr'
          ? 'Le noyau public doit maintenant se lire comme un seul système commercial.'
          : locale === 'de'
            ? 'Der öffentliche Kern sollte jetzt wie ein einziges kommerzielles System wirken.'
            : 'El núcleo público ya debe leerse como un solo sistema comercial.',
      description: locale === 'en'
        ? 'Home, tours, destinations, plan and contact must make the next step obvious without mixing editorial noise with product.'
        : locale === 'fr'
          ? 'Home, tours, destinations, plan et contact doivent rendre la prochaine action évidente, sans mezclar ruido editorial con producto.'
          : locale === 'de'
            ? 'Home, Touren, Destinationen, Plan und Kontakt müssen den nächsten Schritt klar machen, ohne redaktionelles Rauschen mit dem Produkt zu vermischen.'
            : 'Home, tours, destinations, plan y contacto deben dejar obvio el siguiente paso sin mezclar ruido editorial con producto.',
      items: [
        { title: labels.tours, body: locale === 'es' ? 'El catálogo sigue siendo la entrada más directa cuando el viajero ya sabe que quiere explorar opciones reales.' : 'Explore real options from the catalog.', href: withLocale(locale, '/tours') },
        { title: labels.destinations, body: locale === 'es' ? 'Destinations funciona como entrada por ciudad o región, no como capa aparte sin continuidad.' : 'Choose by city or region with continuity into real tours.', href: withLocale(locale, '/destinations') },
        { title: labels.plan, body: locale === 'es' ? 'Plan personalizado absorbe la duda y la convierte en una ruta concreta con contexto útil.' : 'The personalized plan turns uncertainty into a concrete route.', href: withLocale(locale, '/plan') },
        { title: labels.contact, body: locale === 'es' ? 'Contacto y WhatsApp apoyan la decisión y el handoff humano; no reemplazan el núcleo.' : 'Contact and WhatsApp support the handoff without replacing the core flow.', href: withLocale(locale, '/contact') },
      ],
      note: locale === 'es' ? 'Regla final de salida: el frente público debe dejar claro qué hacer primero, qué hacer después y cuándo pedir ayuda humana.' : 'Final release rule: the public surface should make the first step, next step and human help obvious.',
    },
    plan: {
      eyebrow: locale === 'es' ? 'plan continuity' : 'plan continuity',
      title: locale === 'es' ? 'Plan personalizado ya funciona como puerta premium, no como quiz disfrazado.' : 'The personalized plan now works like a premium entry point, not a disguised quiz.',
      description: locale === 'es' ? 'Aquí el viajero debería salir con una ruta clara: tours, contacto o seguimiento comercial con contexto.' : 'This page should end with a clear route: tours, contact or contextual follow-up.',
      items: [
        { title: labels.plan, body: locale === 'es' ? 'Comparte estilo, fechas, idioma y presupuesto para reducir fricción.' : 'Share style, dates, language and budget to reduce friction.', href: withLocale(locale, '/plan') },
        { title: labels.tours, body: locale === 'es' ? 'Si el ajuste ya es claro, la siguiente pantalla correcta es el catálogo.' : 'If the fit is already clear, the catalog is the right next screen.', href: withLocale(locale, '/tours') },
        { title: labels.contact, body: locale === 'es' ? 'Cuando el caso merece acompañamiento, el handoff humano debe quedar visible.' : 'When the case deserves guidance, human handoff should stay visible.', href: withLocale(locale, '/contact') },
        { title: labels.support, body: locale === 'es' ? 'Después del envío, la continuidad CRM debe evitar que el viajero repita la historia.' : 'After submission, CRM continuity should avoid repetition.', href: withLocale(locale, '/account/support') },
      ],
      note: locale === 'es' ? 'Lo importante aquí no es llenar un formulario; es salir con una decisión mejor.' : 'The point here is not filling a form; it is leaving with a better decision.',
    },
    contact: {
      eyebrow: locale === 'es' ? 'contact release' : 'contact release',
      title: locale === 'es' ? 'Contacto ya debe sentirse como un triage premium y no como buzón genérico.' : 'Contact should now feel like premium triage, not a generic inbox.',
      description: locale === 'es' ? 'Esta pantalla tiene que resolver si el caso va a tours, plan, soporte o booking sensible sin perder contexto.' : 'This screen should resolve whether the case goes to tours, plan, support or a sensitive booking lane without losing context.',
      items: [
        { title: labels.tours, body: locale === 'es' ? 'Cuando el caso es simple, la salida correcta sigue siendo el catálogo.' : 'For simple cases, the catalog remains the best exit.', href: withLocale(locale, '/tours') },
        { title: labels.plan, body: locale === 'es' ? 'Si todavía falta claridad, Plan personalizado debe seguir visible.' : 'If clarity is still missing, the plan should remain visible.', href: withLocale(locale, '/plan') },
        { title: labels.support, body: locale === 'es' ? 'Booking, cambios o incidencias ya deberían escalar a soporte con contexto.' : 'Bookings, changes or incidents should escalate to support with context.', href: withLocale(locale, '/account/support') },
        { title: labels.account, body: locale === 'es' ? 'Cuenta y reservas deben convertirse en la base poscompra cuando el viaje ya existe.' : 'Account and bookings should become the post-purchase base once the trip exists.', href: withLocale(locale, '/account') },
      ],
      note: locale === 'es' ? 'Contacto ya no es un callejón lateral; es una entrada controlada para continuidad comercial y operativa.' : 'Contact is no longer a side alley; it is a controlled entry into commercial and operational continuity.',
    },
    postpurchase: {
      eyebrow: locale === 'es' ? 'post-purchase release' : 'post-purchase release',
      title: locale === 'es' ? 'Después del pago, KCE debe seguir sintiéndose como un sistema completo.' : 'After payment, KCE should still feel like one complete system.',
      description: locale === 'es' ? 'Booking, factura, calendario, cuenta y soporte tienen que convivir como una sola continuidad visible.' : 'Booking, invoice, calendar, account and support should live as one visible continuity layer.',
      items: [
        { title: 'Booking', body: locale === 'es' ? 'El booking es la base operativa del viajero después del checkout.' : 'Booking becomes the traveler’s operational base after checkout.', href: withLocale(locale, '/account/bookings') },
        { title: labels.account, body: locale === 'es' ? 'Cuenta debe ayudar a recuperar activos y no solo a iniciar sesión.' : 'Account should help recover assets, not just authenticate.', href: withLocale(locale, '/account') },
        { title: labels.support, body: locale === 'es' ? 'Soporte debe abrir un hilo con contexto importado y no otro caso desconectado.' : 'Support should open a contextual thread, not a disconnected case.', href: withLocale(locale, '/account/support') },
        { title: labels.contact, body: locale === 'es' ? 'Si el caso escala, contacto premium tiene que seguir disponible.' : 'If the case escalates, premium contact must remain available.', href: withLocale(locale, '/contact') },
      ],
      note: locale === 'es' ? 'Una compra cerrada no termina la experiencia; abre la fase donde más importa conservar confianza.' : 'A completed purchase does not end the experience; it starts the phase where trust matters most.',
    },
    support: {
      eyebrow: locale === 'es' ? 'support readiness' : 'support readiness',
      title: locale === 'es' ? 'Soporte final ya debe ayudarte a resolver el caso sin romper continuidad.' : 'Final support should help resolve the case without breaking continuity.',
      description: locale === 'es' ? 'Booking, conversación, ticket y contacto humano tienen que convivir en una misma ruta de ayuda.' : 'Booking, conversation, ticket and human contact should coexist in one help route.',
      items: [
        { title: labels.support, body: locale === 'es' ? 'Abre o continúa un solo ticket por caso principal.' : 'Open or continue a single ticket for the main case.', href: withLocale(locale, '/account/support') },
        { title: 'Booking', body: locale === 'es' ? 'Trae tu booking para reducir tiempo de resolución y evitar repeticiones.' : 'Bring your booking to reduce resolution time and avoid repetition.', href: withLocale(locale, '/account/bookings') },
        { title: labels.contact, body: locale === 'es' ? 'Si el caso es premium o sensible, contacto premium debe seguir a un toque.' : 'For premium or sensitive cases, premium contact should stay one tap away.', href: withLocale(locale, '/contact') },
        { title: labels.account, body: locale === 'es' ? 'La cuenta mantiene visible el resto de la relación: seguridad, reservas y actividad.' : 'Account keeps the rest of the relationship visible: security, bookings and activity.', href: withLocale(locale, '/account') },
      ],
      note: locale === 'es' ? 'Soporte release-grade significa menos canales paralelos, más contexto y un siguiente paso claro.' : 'Release-grade support means fewer parallel channels, more context and a clearer next step.',
    },
  } as const;

  return variants[variant];
}

export default function ReleaseCandidateReadinessRail({ locale, variant = 'public', className }: Props) {
  const content = copy(locale, variant);

  return (
    <section className={`rounded-[1.9rem] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,244,236,0.96))] p-6 shadow-soft md:p-7 ${className ?? ''}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue/75">{content.eyebrow}</div>
          <h2 className="mt-3 font-heading text-2xl text-brand-blue md:text-[2rem]">{content.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--color-text)]/75 md:text-base">{content.description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={content.items[0].href} className="inline-flex items-center rounded-full bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white no-underline transition hover:opacity-95 hover:no-underline">
            {content.items[0].title}
          </Link>
          <Link href={content.items[2].href} className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-brand-blue no-underline transition hover:bg-[color:var(--color-surface-2)] hover:no-underline">
            {content.items[2].title}
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {content.items.map((item, index) => (
          <Link
            key={`${item.title}-${index}`}
            href={item.href}
            className="group rounded-[1.35rem] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4 no-underline shadow-soft transition hover:-translate-y-0.5 hover:bg-[color:var(--color-surface-2)] hover:no-underline"
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-yellow">0{index + 1}</div>
            <div className="mt-2 font-heading text-lg text-brand-blue">{item.title}</div>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">{item.body}</p>
            <div className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue/78">Abrir ruta</div>
          </Link>
        ))}
      </div>

      <div className="mt-5 rounded-[1.25rem] border border-brand-blue/10 bg-brand-blue/5 px-4 py-3 text-sm leading-6 text-[color:var(--color-text)]/74">
        <span className="font-semibold text-brand-blue">Release note:</span> {content.note}
      </div>
    </section>
  );
}

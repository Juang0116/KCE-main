import clsx from 'clsx';
import Link from 'next/link';

import { buildContextHref, type MarketingLocale } from '@/features/marketing/contactContext';

export type PublicCoreDecisionRailVariant = 'home' | 'catalog' | 'detail';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

type Props = {
  locale: SupportedLocale;
  className?: string;
  variant?: PublicCoreDecisionRailVariant;
};

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

function copy(locale: SupportedLocale, variant: PublicCoreDecisionRailVariant) {
  const byVariant = {
    home: {
      en: {
        kicker: 'Core path',
        title: 'Start from the lane that reduces friction faster',
        body: 'KCE works better when the traveler sees a clear hierarchy: browse tours, explore destinations or use a personalized plan when they still need guidance.',
        helpTitle: 'Need a calmer next step?',
        helpBody: 'Talk to KCE when you want human help comparing options, checking fit or protecting the booking path.',
        helpCta: 'Talk to KCE',
      },
      fr: {
        kicker: 'Chemin principal',
        title: 'Commence par la voie qui réduit le plus la friction',
        body: 'KCE fonctionne mieux quand le voyageur voit une hiérarchie claire : tours, destinations ou plan personnalisé si l’orientation est encore nécessaire.',
        helpTitle: 'Besoin d’une étape plus calme ?',
        helpBody: 'Parle avec KCE pour comparer les options, vérifier le bon fit ou protéger le chemin vers la réservation.',
        helpCta: 'Parler à KCE',
      },
      de: {
        kicker: 'Kernpfad',
        title: 'Starte mit dem Pfad, der Reibung am schnellsten senkt',
        body: 'KCE funktioniert besser, wenn Reisende eine klare Hierarchie sehen: Touren, Destinationen oder einen persönlichen Plan, wenn noch Führung nötig ist.',
        helpTitle: 'Brauchst du einen ruhigeren nächsten Schritt?',
        helpBody: 'Sprich mit KCE, wenn du Optionen vergleichen, den Fit prüfen oder den Buchungsweg schützen willst.',
        helpCta: 'Mit KCE sprechen',
      },
      es: {
        kicker: 'Ruta principal',
        title: 'Empieza por el carril que reduce fricción más rápido',
        body: 'KCE funciona mejor cuando el viajero ve una jerarquía clara: tours, destinos o plan personalizado si todavía necesita orientación.',
        helpTitle: '¿Necesitas un siguiente paso más calmado?',
        helpBody: 'Habla con KCE si quieres comparar opciones, validar encaje o proteger el camino hacia la reserva.',
        helpCta: 'Hablar con KCE',
      },
    },
    catalog: {
      en: {
        kicker: 'Decision rail',
        title: 'Do not force the same next step for every traveler',
        body: 'Some visitors are ready to compare cards. Others still need a city-first view or a guided plan. Keep those three lanes visible and premium.',
        helpTitle: 'When confidence drops, do not lose the traveler',
        helpBody: 'Move them to contact or to the personalized plan instead of letting the catalog feel heavy.',
        helpCta: 'Talk to KCE',
      },
      fr: {
        kicker: 'Rail de décision',
        title: 'N’impose pas la même étape suivante à tous les voyageurs',
        body: 'Certains sont prêts à comparer les cartes. D’autres ont encore besoin d’une lecture par ville ou d’un plan guidé. Garde ces trois voies visibles.',
        helpTitle: 'Quand la confiance baisse, ne perds pas le voyageur',
        helpBody: 'Envoie-le vers contact ou vers le plan personnalisé au lieu de laisser le catalogue devenir lourd.',
        helpCta: 'Parler à KCE',
      },
      de: {
        kicker: 'Entscheidungsrail',
        title: 'Erzwinge nicht für alle Reisenden denselben nächsten Schritt',
        body: 'Manche sind bereit, Karten zu vergleichen. Andere brauchen noch eine Stadtansicht oder einen geführten Plan. Halte diese drei Wege sichtbar.',
        helpTitle: 'Wenn Vertrauen sinkt, verliere den Reisenden nicht',
        helpBody: 'Schicke ihn zu Kontakt oder zum persönlichen Plan, statt den Katalog schwer wirken zu lassen.',
        helpCta: 'Mit KCE sprechen',
      },
      es: {
        kicker: 'Carril de decisión',
        title: 'No obligues el mismo siguiente paso para todos los viajeros',
        body: 'Algunos ya están listos para comparar cards. Otros todavía necesitan una lectura por ciudad o una ruta guiada. Mantén visibles esos tres caminos.',
        helpTitle: 'Si baja la confianza, no pierdas al viajero',
        helpBody: 'Pásalo a contacto o al plan personalizado en vez de dejar que el catálogo se sienta pesado.',
        helpCta: 'Hablar con KCE',
      },
    },
    detail: {
      en: {
        kicker: 'Decision support',
        title: 'A strong detail page still keeps alternate lanes visible',
        body: 'If this tour is not the right fit, the traveler should be able to step back toward destinations or a personalized plan without losing momentum.',
        helpTitle: 'Still unsure after reading the detail?',
        helpBody: 'Move to a guided lane or ask KCE with context instead of abandoning the page.',
        helpCta: 'Talk to KCE',
      },
      fr: {
        kicker: 'Support de décision',
        title: 'Une bonne page détail garde aussi des voies alternatives visibles',
        body: 'Si ce tour n’est pas le bon fit, le voyageur doit pouvoir revenir vers destinations ou un plan personnalisé sans perdre son élan.',
        helpTitle: 'Encore incertain après la lecture ?',
        helpBody: 'Passe vers une voie guidée ou contacte KCE avec contexte au lieu de quitter la page.',
        helpCta: 'Parler à KCE',
      },
      de: {
        kicker: 'Entscheidungshilfe',
        title: 'Eine starke Detailseite hält alternative Wege sichtbar',
        body: 'Wenn diese Tour nicht passt, sollte der Reisende zu Destinationen oder einem persönlichen Plan zurückgehen können, ohne Momentum zu verlieren.',
        helpTitle: 'Nach dem Lesen noch unsicher?',
        helpBody: 'Wechsle in einen geführten Pfad oder sprich mit KCE mit Kontext, statt die Seite einfach zu verlassen.',
        helpCta: 'Mit KCE sprechen',
      },
      es: {
        kicker: 'Apoyo a la decisión',
        title: 'Un buen detalle también mantiene visibles las rutas alternativas',
        body: 'Si este tour no es el encaje correcto, el viajero debería poder volver hacia destinos o a un plan personalizado sin perder impulso.',
        helpTitle: '¿Sigues dudando después de leer el detalle?',
        helpBody: 'Pasa a una ruta guiada o habla con KCE con contexto en vez de abandonar la página.',
        helpCta: 'Hablar con KCE',
      },
    },
  } as const;

  const common = {
    en: {
      cards: [
        {
          kicker: 'Core path',
          title: 'Tours',
          body: 'Use the catalog when you are already comparing experiences, prices and fit.',
          cta: 'Browse tours',
          href: '/tours',
        },
        {
          kicker: 'Explore first',
          title: 'Destinations',
          body: 'Start with city or region when you want a calmer, geography-first path.',
          cta: 'Explore destinations',
          href: '/destinations',
        },
        {
          kicker: 'Guided path',
          title: 'Personalized plan',
          body: 'Use a shorter guided flow when timing, budget or travel style still need alignment.',
          cta: 'Open personalized plan',
          href: '/plan',
        },
      ],
    },
    fr: {
      cards: [
        {
          kicker: 'Voie principale',
          title: 'Tours',
          body: 'Utilise le catalogue quand tu compares déjà expériences, prix et bon fit.',
          cta: 'Voir les tours',
          href: '/tours',
        },
        {
          kicker: 'Explorer d’abord',
          title: 'Destinations',
          body: 'Commence par ville ou région si tu veux un chemin plus calme et géographique.',
          cta: 'Explorer les destinations',
          href: '/destinations',
        },
        {
          kicker: 'Voie guidée',
          title: 'Plan personnalisé',
          body: 'Utilise un flux guidé plus court si le rythme, le budget ou le style de voyage ne sont pas encore clairs.',
          cta: 'Ouvrir le plan',
          href: '/plan',
        },
      ],
    },
    de: {
      cards: [
        {
          kicker: 'Kernpfad',
          title: 'Touren',
          body: 'Nutze den Katalog, wenn du schon Erlebnisse, Preise und Fit vergleichst.',
          cta: 'Touren ansehen',
          href: '/tours',
        },
        {
          kicker: 'Erst entdecken',
          title: 'Destinationen',
          body: 'Starte mit Stadt oder Region, wenn du einen ruhigeren, geografischen Pfad brauchst.',
          cta: 'Destinationen ansehen',
          href: '/destinations',
        },
        {
          kicker: 'Geführter Pfad',
          title: 'Persönlicher Plan',
          body: 'Nutze einen kürzeren geführten Flow, wenn Timing, Budget oder Reisestil noch offen sind.',
          cta: 'Plan öffnen',
          href: '/plan',
        },
      ],
    },
    es: {
      cards: [
        {
          kicker: 'Ruta principal',
          title: 'Tours',
          body: 'Usa el catálogo cuando ya quieres comparar experiencias, precios y encaje.',
          cta: 'Ver tours',
          href: '/tours',
        },
        {
          kicker: 'Explora primero',
          title: 'Destinations',
          body: 'Empieza por ciudad o región si necesitas una ruta más calmada y más geográfica.',
          cta: 'Explorar destinos',
          href: '/destinations',
        },
        {
          kicker: 'Ruta guiada',
          title: 'Plan personalizado',
          body: 'Usa un flujo guiado más corto cuando todavía comparas presupuesto, ritmo o estilo de viaje.',
          cta: 'Abrir plan personalizado',
          href: '/plan',
        },
      ],
    },
  } as const;

  const scoped = byVariant[variant][locale];
  const shared = common[locale];
  return { ...scoped, cards: shared.cards };
}

export default function PublicCoreDecisionRail({ locale, className, variant = 'home' }: Props) {
  const c = copy(locale, variant);
  const contactHref = buildContextHref(locale as MarketingLocale, '/contact', {
    source: variant === 'home' ? 'home' : variant === 'catalog' ? 'tours' : 'tour-detail',
    topic: variant === 'detail' ? 'tour' : variant === 'catalog' ? 'catalog' : 'plan',
  });

  return (
    <section
      className={clsx(
        'overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.985),rgba(248,244,236,0.97))] shadow-hard',
        className,
      )}
    >
      <div className="border-b border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(11,84,162,0.06),rgba(255,255,255,0.98),rgba(216,176,74,0.08))] px-5 py-5 md:px-7">
        <div className="inline-flex rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue/80">
          {c.kicker}
        </div>
        <h2 className="mt-3 max-w-3xl font-heading text-2xl text-brand-blue md:text-[2.1rem]">{c.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/72">{c.body}</p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="grid gap-4 p-5 md:grid-cols-3 md:p-7">
          {c.cards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-5 shadow-soft"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">{card.kicker}</div>
              <h3 className="mt-3 font-heading text-2xl text-brand-blue">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[color:var(--color-text)]/75">{card.body}</p>
              <div className="mt-5">
                <Link
                  href={withLocale(locale, card.href)}
                  className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-text)] transition hover:border-brand-blue/20 hover:text-brand-blue"
                >
                  {card.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <aside className="border-t border-[var(--color-border)] bg-[linear-gradient(160deg,rgba(6,29,61,0.98),rgba(10,69,135,0.96)_62%,rgba(216,176,74,0.72))] p-5 text-white lg:border-l lg:border-t-0 md:p-7">
          <div className="rounded-[1.6rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62">KCE support</div>
            <h3 className="mt-3 font-heading text-2xl text-white">{c.helpTitle}</h3>
            <p className="mt-3 text-sm leading-6 text-white/78">{c.helpBody}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={contactHref}
                className="inline-flex items-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-brand-blue shadow-soft transition hover:opacity-95"
              >
                {c.helpCta}
              </Link>
              <Link
                href={withLocale(locale, '/faq')}
                className="inline-flex items-center rounded-full border border-white/18 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/14"
              >
                FAQ
              </Link>
            </div>
            <div className="mt-5 rounded-[1.25rem] border border-white/12 bg-black/10 p-4 text-sm leading-6 text-white/72">
              {locale === 'en'
                ? 'Release rule: Tours, Destinations and Personalized plan stay visible as the public center. Contact and WhatsApp support the decision instead of replacing it.'
                : locale === 'fr'
                  ? 'Règle de release : Tours, Destinations et Plan personnalisé restent le centre public. Contact et WhatsApp soutiennent la décision sans le remplacer.'
                  : locale === 'de'
                    ? 'Release-Regel: Touren, Destinationen und persönlicher Plan bleiben das öffentliche Zentrum. Kontakt und WhatsApp unterstützen die Entscheidung, ersetzen sie aber nicht.'
                    : 'Regla de release: Tours, Destinations y Plan personalizado se mantienen como centro público. Contacto y WhatsApp apoyan la decisión, no la reemplazan.'}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

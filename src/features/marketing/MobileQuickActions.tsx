import Link from 'next/link';
import { Compass, Heart, LogIn, MessageCircleMore, Sparkles } from 'lucide-react';

import { t, type Dictionary, type SupportedLocale } from '@/i18n/getDictionary';

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

export default function MobileQuickActions({
  locale,
  dict,
  whatsAppHref,
  showAccount = true,
}: {
  locale: SupportedLocale;
  dict: Dictionary;
  whatsAppHref?: string | null;
  showAccount?: boolean;
}) {
  const next = encodeURIComponent(withLocale(locale, '/'));
  const loginHref = withLocale(locale, `/login?next=${next}`);

  const items = [
    {
      href: withLocale(locale, '/tours'),
      label: t(dict, 'home.mobile_actions.tours', 'Tours'),
      sub: locale === 'en' ? 'Browse the catalog' : locale === 'fr' ? 'Voir le catalogue' : locale === 'de' ? 'Katalog ansehen' : 'Explorar catálogo',
      icon: Compass,
      tone: 'primary' as const,
    },
    {
      href: withLocale(locale, '/plan'),
      label: 'Plan personalizado',
      sub: locale === 'en' ? 'Tailored help' : locale === 'fr' ? 'Aide personnalisée' : locale === 'de' ? 'Persönliche Hilfe' : 'Ayuda a tu medida',
      icon: Sparkles,
      tone: 'soft' as const,
    },
    ...(showAccount
      ? [
          {
            href: loginHref,
            label: t(dict, 'nav.login', 'Iniciar sesión'),
            sub: locale === 'en' ? 'Account access' : locale === 'fr' ? 'Accès compte' : locale === 'de' ? 'Kontozugang' : 'Acceso a cuenta',
            icon: LogIn,
            tone: 'soft' as const,
          },
        ]
      : []),
    {
      href: whatsAppHref || withLocale(locale, '/contact'),
      label: whatsAppHref ? 'WhatsApp' : t(dict, 'nav.contact', 'Contacto'),
      sub: locale === 'en' ? 'Talk to KCE' : locale === 'fr' ? 'Parler à KCE' : locale === 'de' ? 'Mit KCE sprechen' : 'Hablar con KCE',
      icon: MessageCircleMore,
      external: Boolean(whatsAppHref),
      tone: 'accent' as const,
    },
    {
      href: withLocale(locale, '/wishlist'),
      label: t(dict, 'nav.wishlist', 'Wishlist'),
      sub: locale === 'en' ? 'Save favorites' : locale === 'fr' ? 'Sauvegarder' : locale === 'de' ? 'Favoriten' : 'Guardar favoritos',
      icon: Heart,
      tone: 'soft' as const,
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-5 md:hidden">
      <div className="overflow-hidden rounded-[calc(var(--radius)+0.55rem)] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(7,34,72,0.98),rgba(11,84,162,0.94)_62%,rgba(216,176,74,0.66))] shadow-hard">
        <div className="px-4 py-4 text-white">
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur">
            KCE quick access
          </div>
          <div className="mt-2 text-lg font-semibold leading-tight text-white">
            {locale === 'en'
              ? 'A clearer mobile path to explore, plan and talk to KCE.'
              : locale === 'fr'
                ? 'Une route mobile plus claire pour explorer, qualifier et contacter.'
                : locale === 'de'
                  ? 'Ein klarerer mobiler Pfad zum Entdecken, Qualifizieren und Kontaktieren.'
                  : 'Una ruta mobile más clara para explorar, planear y hablar con KCE.'}
          </div>
          <div className="mt-2 text-sm leading-6 text-white/78">
            {locale === 'en'
              ? 'Keep the strongest actions visible on the first screen, especially when the traveler still needs guidance.'
              : locale === 'fr'
                ? 'Les acciones más fuertes quedan visibles desde la primera pantalla, incluso cuando el viajero todavía necesita guía.'
                : locale === 'de'
                  ? 'Die wichtigsten Aktionen bleiben direkt auf dem ersten Screen sichtbar, auch wenn der Reisende noch Orientierung braucht.'
                  : 'Las acciones más útiles quedan visibles desde la primera pantalla, incluso cuando el viajero todavía necesita orientación.'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-[linear-gradient(180deg,rgba(252,249,243,0.9),rgba(255,255,255,0.97))] p-3">
          {items.map((item) => {
            const Icon = item.icon;
            const shared =
              'group min-h-[86px] rounded-[1.45rem] border px-3 py-3 shadow-soft transition duration-200 !no-underline hover:-translate-y-0.5 hover:shadow-hard hover:!no-underline';
            const tone =
              item.tone === 'primary'
                ? 'border-white/18 bg-white text-brand-blue ring-1 ring-white/30'
                : item.tone === 'accent'
                  ? 'border-brand-blue/10 bg-[linear-gradient(135deg,rgba(255,240,196,0.96),rgba(255,255,255,0.94))] text-[color:var(--color-text)]'
                  : 'border-[var(--color-border)] bg-white/96 text-[color:var(--color-text)]';
            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="grid size-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgba(11,84,162,0.12),rgba(255,255,255,0.96))] ring-1 ring-[var(--color-border)]">
                    <Icon className="h-4.5 w-4.5 text-brand-blue" aria-hidden="true" />
                  </div>
                  <span className="rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                    go
                  </span>
                </div>
                <div className="mt-3 text-sm font-semibold leading-snug">{item.label}</div>
                <div className="mt-1 text-xs leading-5 text-[color:var(--color-text)]/65">{item.sub}</div>
              </>
            );
            if (item.external) {
              return (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className={`${shared} ${tone}`}>
                  {body}
                </a>
              );
            }
            return (
              <Link key={item.label} href={item.href} className={`${shared} ${tone}`}>
                {body}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// src/app/(marketing)/page.tsx
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

import { Button } from '@/components/ui/Button';
import OpenChatButton from '@/features/ai/OpenChatButton';
import MobileQuickActions from '@/features/marketing/MobileQuickActions';
import PublicCoreDecisionRail from '@/features/marketing/PublicCoreDecisionRail';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { ReviewsList } from '@/features/reviews/ReviewsList';
import { toTourLike } from '@/features/tours/adapters';
import { listTours } from '@/features/tours/catalog.server';
import TourCard from '@/features/tours/components/TourCard';
import { getDictionary, t, type Dictionary, type SupportedLocale } from '@/i18n/getDictionary';

export const revalidate = 3600;

const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;

  const c = await cookies();
  const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;

  return 'es';
}

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

function getBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://kce.travel';
  return raw.trim().replace(/\/+$/, '');
}

function absoluteUrl(base: string, href: string) {
  const s = (href || '').trim();
  if (!s) return base;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${base}${s}`;
  return `${base}/${s}`;
}

function safeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}


export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const base = getBaseUrl();
  const canonicalPath = withLocale(locale, '/');
  const canonicalAbs = absoluteUrl(base, canonicalPath);

  return {
    metadataBase: new URL(base),
    title: 'KCE — Premium travel in Colombia with clearer planning',
    description:
      'Discover premium travel in Colombia with curated tours, personalized planning and real human support before and after booking.',
    alternates: {
      canonical: canonicalAbs,
      languages: {
        es: '/es',
        en: '/en',
        fr: '/fr',
        de: '/de',
      },
    },
    openGraph: {
      title: 'KCE — Premium travel in Colombia with clearer planning',
      description:
        'Curated tours, premium planning and real support for travelers exploring Colombia with more clarity.',
      url: canonicalAbs,
      type: 'website',
      images: [{ url: absoluteUrl(base, '/images/hero-kce.jpg') }],
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function HomePage() {
  const base = getBaseUrl();
  const locale = await resolveLocale();
  const dict: Dictionary = await getDictionary(locale);

  const { items: featured } = await listTours({ sort: 'popular', limit: 6 });

  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message:
      process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE ||
      'Hola KCE, quiero información sobre un tour.',
    url: absoluteUrl(base, withLocale(locale, '/')),
  });

  const featuredItems = featured.map((item, i) => {
    const href = withLocale(locale, `/tours/${encodeURIComponent(item.slug)}`);
    return {
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(base, href),
      name: item.title,
    };
  });

  const schemaList = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Knowing Cultures Enterprise',
        alternateName: 'KCE',
        url: base,
      },
      {
        '@type': 'WebSite',
        name: 'KCE',
        url: base,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${base}/${locale}/tours?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'ItemList',
        itemListElement: featuredItems,
      },
    ],
  };

  return (
    <>
      {/* HERO */}
      <section
        aria-labelledby="home-hero-title"
        className="relative min-h-[74vh] w-full bg-brand-dark/5 md:min-h-[82vh]"
      >
        <Image
          src="/images/hero-kce.jpg"
          alt="Paisaje colombiano: experiencias auténticas con KCE"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/46 to-black/24" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[color:var(--color-bg)] to-transparent" />

        <div className="relative mx-auto grid min-h-[74vh] max-w-6xl items-center gap-8 px-6 py-16 md:min-h-[82vh] lg:grid-cols-[1.08fr_0.92fr]">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full border border-white/12 bg-white/10 px-3 py-1 text-sm font-medium text-white/82 backdrop-blur">
              {t(dict, 'home.hero.kicker', 'KCE • Unique experiences in Colombia')}
            </p>

            <h1
              id="home-hero-title"
              className="font-heading text-4xl leading-[0.95] text-white md:text-[4.2rem]"
            >
              {t(dict, 'home.hero.title_a', 'More than a trip,')}&nbsp;
              <span className="text-brand-yellow">
                {t(dict, 'brand.tagline_home', 'a cultural awakening.')}
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/88 md:text-lg">
              {t(
                dict,
                'home.hero.subtitle',
                'Discover curated experiences, clear booking and real support to plan your trip through Colombia with more confidence.',
              )}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="px-5 py-2.5">
                <Link
                  href={withLocale(locale, '/tours')}
                  aria-label={t(dict, 'home.hero.cta_aria', 'Explore all KCE tours')}
                >
                  {t(dict, 'home.hero.cta', 'Explore tours')}
                </Link>
              </Button>

              <OpenChatButton variant="accent" addQueryParam className="px-5 py-2.5">
                {t(dict, 'home.hero.chat', 'Plan your trip')}
              </OpenChatButton>

              {waHref ? (
                <Button asChild variant="outline" className="border-white/18 bg-white/8 px-5 py-2.5 text-white hover:bg-white/14">
                  <a href={waHref} target="_blank" rel="noreferrer">
                    {t(dict, 'home.hero.whatsapp', 'WhatsApp')}
                  </a>
                </Button>
              ) : null}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.35rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] p-4 shadow-soft backdrop-blur-xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/62">Secure booking</div>
                <div className="mt-2 text-sm font-semibold text-white">Pago seguro y confirmación clara</div>
                <div className="mt-1 text-xs leading-5 text-white/70">Checkout en EUR, factura y acceso simple a tus activos.</div>
              </div>
              <div className="rounded-[1.35rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] p-4 shadow-soft backdrop-blur-xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/62">Real support</div>
                <div className="mt-2 text-sm font-semibold text-white">Atención multilingüe cuando hace falta</div>
                <div className="mt-1 text-xs leading-5 text-white/70">WhatsApp, contacto y acompañamiento durante la reserva.</div>
              </div>
              <div className="rounded-[1.35rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] p-4 shadow-soft backdrop-blur-xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/62">Clear delivery</div>
                <div className="mt-2 text-sm font-semibold text-white">Proceso claro antes y después de reservar</div>
                <div className="mt-1 text-xs leading-5 text-white/70">Menos fricción para entender qué reservar, cómo pagar y qué pasa después.</div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/88">
              <Link href={withLocale(locale, '/destinations')} className="underline decoration-white/30 underline-offset-4 hover:decoration-white">
                Explora destinos
              </Link>
              <Link href={withLocale(locale, '/plan')} className="underline decoration-white/30 underline-offset-4 hover:decoration-white">
                Pide un plan personalizado
              </Link>
              <Link href={withLocale(locale, '/contact')} className="underline decoration-white/30 underline-offset-4 hover:decoration-white">
                Habla con un asesor
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="ml-auto max-w-md rounded-[calc(var(--radius)+0.75rem)] border border-white/12 bg-white/12 p-6 text-white shadow-hard backdrop-blur-xl">
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
                {locale === 'en' ? 'Plan your route' : locale === 'fr' ? 'Planifie ton voyage' : locale === 'de' ? 'Plane deine Route' : 'Planea tu ruta'}
              </div>
              <h2 className="mt-4 font-heading text-[2rem] leading-tight text-white">{locale === 'en' ? 'Start with the clearest path for your trip in Colombia.' : locale === 'fr' ? 'Commence par le chemin le plus clair pour ton voyage en Colombie.' : locale === 'de' ? 'Starte mit dem klarsten Weg für deine Reise durch Kolumbien.' : 'Empieza por la entrada más clara para tu viaje en Colombia.'}</h2>
              <p className="mt-3 text-sm leading-6 text-white/78">{locale === 'en' ? 'KCE works best when the traveler can quickly decide how to move: start with tours, start with destinations or start with a personalized plan.' : locale === 'fr' ? 'KCE fonctionne mieux quand le voyageur peut vite décider comment avancer : commencer par les tours, par les destinations ou par un plan personnalisé.' : locale === 'de' ? 'KCE funktioniert am besten, wenn Reisende schnell entscheiden können, wie sie starten: mit Touren, Destinationen oder einem persönlichen Plan.' : 'KCE funciona mejor cuando el viajero puede decidir rápido cómo empezar: por tours, por destinos o por un plan personalizado.'}</p>
              <div className="mt-6 grid gap-3">
                {(locale === 'en'
                  ? [['01', 'Tours'], ['02', 'Destinations'], ['03', 'Personalized plan']]
                  : locale === 'fr'
                    ? [['01', 'Tours'], ['02', 'Destinations'], ['03', 'Plan personnalisé']]
                    : locale === 'de'
                      ? [['01', 'Touren'], ['02', 'Destinationen'], ['03', 'Persönlicher Plan']]
                      : [['01', 'Tours'], ['02', 'Destinations'], ['03', 'Plan personalizado']]).map(([n, label]) => (
                  <div key={n} className="flex items-center gap-3 rounded-[1.15rem] border border-white/10 bg-black/12 px-4 py-3">
                    <div className="grid size-10 place-items-center rounded-full border border-white/12 bg-white/10 text-sm font-semibold text-brand-yellow">{n}</div>
                    <div className="text-sm font-semibold text-white">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>




      <MobileQuickActions locale={locale} dict={dict} whatsAppHref={waHref} />

      <PublicCoreDecisionRail locale={locale} variant="home" className="mx-auto mt-4 max-w-6xl" />

      {/* DESTACADOS */}
      <section id="experiences" className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl text-brand-blue">
              {t(dict, 'home.featured.title', 'Tours destacados para empezar mejor')}
            </h2>
            <p className="text-[color:var(--color-text)]/80 mt-2">
              {t(
                dict,
                'home.featured.subtitle',
                'Una selección inicial para comparar con claridad antes de pasar a plan, contacto o checkout.',
              )}
            </p>
          </div>
          <Button asChild variant="outline" className="hidden px-4 py-2 sm:inline-block">
            <Link href={withLocale(locale, '/tours')}>
              {t(dict, 'home.featured.see_all', 'See all tours')} →
            </Link>
          </Button>
        </header>

        {featured.length === 0 ? (
          <div className="text-[color:var(--color-text)]/80 rounded-2xl border border-brand-dark/10 bg-[color:var(--color-surface)] p-6">
            {t(dict, 'home.featured.empty', 'Your featured tours will appear here soon.')}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item, idx) => (
              <TourCard
                key={item.id}
                tour={toTourLike(item)}
                priority={idx < 3}
                href={withLocale(locale, `/tours/${encodeURIComponent(item.slug)}`)}
              />
            ))}
          </div>
        )}

        <div className="mt-8 sm:hidden">
          <Button asChild variant="outline" className="w-full px-4 py-3">
            <Link href={withLocale(locale, '/tours')} className="font-heading text-brand-blue">
              {t(dict, 'home.featured.see_all', 'See all tours')} →
            </Link>
          </Button>
        </div>
      </section>


      {/* RESEÑAS */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl text-brand-blue">
              {t(dict, 'home.reviews.title', 'Confianza real de viajeros')}
            </h2>
            <p className="text-[color:var(--color-text)]/70 mt-1 text-sm">
              {t(
                dict,
                'home.reviews.subtitle',
                'Prueba social para reforzar la promesa: menos fricción, mejor acompañamiento y una experiencia más clara.',
              )}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={withLocale(locale, '/review-demo')}>
              {t(dict, 'home.reviews.cta', 'Ver más')}
            </Link>
          </Button>
        </div>
        <ReviewsList limit={6} />
      </section>


      {/* WHY KCE / HOW IT WORKS */}
      <section aria-labelledby="why-kce" className="mx-auto max-w-6xl px-6 pb-12">
        <div className="overflow-hidden rounded-[calc(var(--radius)+0.7rem)] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.985),rgba(248,244,236,0.96))] shadow-hard">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-[var(--color-border)] bg-[linear-gradient(160deg,rgba(6,29,61,0.98),rgba(10,69,135,0.96)_58%,rgba(216,176,74,0.78))] px-6 py-7 text-white lg:border-b-0 lg:border-r lg:px-8 lg:py-8">
              <div className="inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/78">
                KCE promise
              </div>
              <h2 id="why-kce" className="mt-4 font-heading text-[2rem] leading-[0.98] text-white md:text-[2.45rem]">
                Una marca más clara para elegir, reservar y continuar.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/80 md:text-[0.98rem]">
                La experiencia pública de KCE funciona mejor cuando Tours, Destinations y Plan personalizado se sienten como un sistema simple, no como muchas ramas compitiendo entre sí.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  ['Autenticidad local', 'Experiencias reales con anfitriones locales, lejos del turismo genérico.'],
                  ['Booking serio', 'Checkout protegido, invoice, booking y apoyo humano antes y después del pago.'],
                  ['Plan personalizado + soporte', 'Empieza con una recomendación guiada y pasa a ayuda humana si la necesitas.'],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-[1.25rem] border border-white/12 bg-white/8 p-4 backdrop-blur">
                    <div className="text-sm font-semibold text-white">{title}</div>
                    <p className="mt-2 text-sm leading-6 text-white/76">{copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-7 lg:px-8 lg:py-8">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue/80">Cómo funciona el núcleo KCE</div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {[
                  ['01', 'Explora o cuéntanos qué buscas', 'Tours, destinos, plan personalizado o contacto según el tipo de viaje que quieres.'],
                  ['02', 'Califica mejor antes de pagar', 'Shortlist, recomendaciones y soporte humano para reducir fricción y dudas.'],
                  ['03', 'Reserva y recibe seguimiento claro', 'Pago seguro, booking, invoice, coordinación y apoyo posterior al checkout.'],
                ].map(([step, title, copy]) => (
                  <div key={step} className="rounded-[1.45rem] border border-[var(--color-border)] bg-white p-5 shadow-soft">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-yellow">{step}</div>
                    <h3 className="mt-3 font-heading text-xl text-brand-blue">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--color-text)]/78">{copy}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.35rem] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue/80">Atención multilingüe cuando hace falta</div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--color-text)]/75">
                    Si el viajero necesita más contexto, KCE puede orientar en varios idiomas y acompañar el siguiente paso con más calma.
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue/80">Proceso claro antes y después de reservar</div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--color-text)]/75">
                    Desde la elección inicial hasta el booking y el soporte posterior, la experiencia busca sentirse ordenada, seria y fácil de seguir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section
        aria-labelledby="home-final-cta"
        className="bg-[color:var(--color-bg)]/60 border-t border-brand-dark/10"
      >
        <div className="mx-auto max-w-6xl px-6 py-12 text-center">
          <h2 id="home-final-cta" className="font-heading text-2xl text-brand-blue md:text-3xl">
            ¿Listo para vivir Colombia como un local?
          </h2>
          <p className="text-[color:var(--color-text)]/80 mx-auto mt-3 max-w-2xl text-sm md:text-base">
            Cuéntanos tu idea de viaje y KCE te ayuda a pasar con más claridad de la exploración a la decisión.
            Puedes empezar por tours, por destinos o por un plan personalizado y luego continuar con apoyo humano cuando haga falta.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild className="px-5 py-2.5">
              <Link href={withLocale(locale, '/tours')}>Explorar tours disponibles</Link>
            </Button>
            <OpenChatButton variant="outline" addQueryParam className="px-5 py-2.5">
              Abrir plan personalizado
            </OpenChatButton>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(schemaList) }}
      />
    </>
  );
}

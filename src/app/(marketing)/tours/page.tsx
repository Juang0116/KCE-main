// src/app/(marketing)/tours/page.tsx
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';

import FeaturedReviews from '@/features/reviews/FeaturedReviews';
import { toTourLike } from '@/features/tours/adapters';
import { getFacets, listTours } from '@/features/tours/catalog.server';
import TourCardPremium from '@/features/tours/components/TourCardPremium';
import ToursToolbar from '@/features/tours/components/ToursToolbar';
import Pagination from '@/features/tours/components/Pagination';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { buildContextHref, type MarketingLocale } from '@/features/marketing/contactContext';
import ReleaseConfidenceBand from '@/features/marketing/ReleaseConfidenceBand';
import MobileQuickActions from '@/features/marketing/MobileQuickActions';
import PublicCoreDecisionRail from '@/features/marketing/PublicCoreDecisionRail';
import { getDictionary } from '@/i18n/getDictionary';

export const revalidate = 300;

type SearchParams = { [key: string]: string | string[] | undefined };
type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? '') : (v ?? ''));
const isSort = (v: string): v is 'price-asc' | 'price-desc' => v === 'price-asc' || v === 'price-desc';

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;

  const c = await cookies();
  const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;

  return 'es';
}

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

type PageCopy = {
  badge: string;
  title: string;
  subtitle: string;
  studioLabel: string;
  studioTitle: string;
  studioCopy: string;
  studioCta: string;
  helperKicker: string;
  helperTitle: string;
  helperCopy: string;
  helperPrimary: string;
  helperSecondary: string;
  chips: string[];
  quickTitle: string;
  quickStyles: string;
  resultPrefix: string;
  decisionTitle: string;
  decisionCopy: string;
  decisionPlan: string;
  decisionContact: string;
};

function getCopy(locale: SupportedLocale): PageCopy {
  switch (locale) {
    case 'en':
      return {
        badge: 'KCE tours • curated experiences',
        title: 'Tours in Colombia with a more premium and focused booking path',
        subtitle: 'Compare curated experiences with clearer pricing, calmer guidance and a more direct route toward the right booking.',
        studioLabel: 'Plan personalizado KCE',
        studioTitle: 'Build a shorter, clearer shortlist before you commit',
        studioCopy: 'Start with city, style and price. If the right option is still not obvious, move to the personalized plan or speak with KCE.',
        studioCta: 'Open personalized plan',
        helperKicker: 'Prefer a guided path?',
        helperTitle: 'Choose with support when you need it',
        helperCopy: 'Compare tours first. If you are still undecided, ask for a personalized recommendation or speak with KCE.',
        helperPrimary: 'Talk to KCE',
        helperSecondary: 'Browse destinations',
        chips: ['Secure checkout', 'Human support', 'EUR pricing'],
        quickTitle: 'Explore faster',
        quickStyles: 'Recommended styles',
        resultPrefix: 'Showing',
        decisionTitle: 'Still comparing options?',
        decisionCopy: 'Move to the next step with a clearer path: compare tours, ask for a personalized plan or speak with an advisor.',
        decisionPlan: 'Open personalized plan',
        decisionContact: 'Talk to an advisor',
      };
    case 'fr':
      return {
        badge: 'catalogue KCE • expériences curées',
        title: 'Des tours en Colombie avec un parcours plus premium et plus clair',
        subtitle: 'Compare des expériences curées avec des prix plus lisibles, un meilleur accompagnement et une route plus directe vers la bonne réservation.',
        studioLabel: 'Plan personnalisé KCE',
        studioTitle: 'Construis une shortlist plus courte et plus claire',
        studioCopy: 'Commence par la ville, le style et le prix. Si le bon choix n’est pas encore évident, ouvre le plan personnalisé ou parle avec KCE.',
        studioCta: 'Ouvrir le plan personnalisé',
        helperKicker: 'Besoin d’aide ?',
        helperTitle: 'Choisis avec plus d’accompagnement si tu en as besoin',
        helperCopy: 'Compare d’abord les options. Si tu hésites encore, ouvre un plan personnalisé ou parle avec l’équipe KCE.',
        helperPrimary: 'Parler à KCE',
        helperSecondary: 'Voir les destinations',
        chips: ['Checkout sécurisé', 'Support humain', 'Prix en EUR'],
        quickTitle: 'Explorer plus vite',
        quickStyles: 'Styles recommandés',
        resultPrefix: 'Affichage',
        decisionTitle: 'Encore en train de comparer ?',
        decisionCopy: 'Passe à l’étape suivante avec un chemin plus clair : comparer les tours, ouvrir un plan personnalisé ou parler avec un conseiller.',
        decisionPlan: 'Ouvrir le plan personnalisé',
        decisionContact: 'Parler à un conseiller',
      };
    case 'de':
      return {
        badge: 'KCE-Touren • kuratierte Erlebnisse',
        title: 'Touren in Kolumbien mit fokussierterem Premium-Buchungsweg',
        subtitle: 'Vergleiche kuratierte Erlebnisse mit klareren Preisen, ruhigerer Führung und einem direkteren Weg zur passenden Buchung.',
        studioLabel: 'KCE persönlicher Plan',
        studioTitle: 'Baue eine kürzere und klarere Shortlist auf',
        studioCopy: 'Starte mit Stadt, Stil und Preis. Wenn die richtige Option noch nicht klar ist, öffne den persönlichen Plan oder sprich mit KCE.',
        studioCta: 'Persönlichen Plan öffnen',
        helperKicker: 'Brauchst du Hilfe?',
        helperTitle: 'Wähle mit Unterstützung, wenn du sie brauchst',
        helperCopy: 'Vergleiche zuerst die Touren. Wenn du noch unsicher bist, öffne einen persönlichen Plan oder sprich direkt mit KCE.',
        helperPrimary: 'Mit KCE sprechen',
        helperSecondary: 'Destinationen ansehen',
        chips: ['Sicherer Checkout', 'Menschlicher Support', 'EUR-Preise'],
        quickTitle: 'Schneller entdecken',
        quickStyles: 'Empfohlene Stile',
        resultPrefix: 'Anzeige',
        decisionTitle: 'Noch am Vergleichen?',
        decisionCopy: 'Führe den Reisenden mit einem klareren Pfad weiter: Shortlist → persönlicher Plan → Beratung → sicherer Checkout.',
        decisionPlan: 'Persönlichen Plan öffnen',
        decisionContact: 'Mit Berater sprechen',
      };
    default:
      return {
        badge: 'catálogo KCE • experiencias curadas',
        title: 'Tours en Colombia con una ruta más premium y enfocada para reservar',
        subtitle: 'Compara experiencias curadas con precios más claros, mejor apoyo y un camino más directo hacia la reserva correcta.',
        studioLabel: 'Plan personalizado KCE',
        studioTitle: 'Arma una shortlist más corta y más clara antes de decidir',
        studioCopy: 'Empieza por ciudad, estilo y precio. Si todavía no es obvio cuál encaja mejor, abre el plan personalizado o habla con KCE.',
        studioCta: 'Abrir plan personalizado',
        helperKicker: '¿Prefieres una ruta guiada?',
        helperTitle: 'Elige con apoyo cuando lo necesites',
        helperCopy: 'Primero compara tours. Si sigues indeciso, pide una recomendación personalizada o habla con KCE.',
        helperPrimary: 'Hablar con KCE',
        helperSecondary: 'Ver destinos',
        chips: ['Checkout seguro', 'Soporte humano', 'Precios en EUR'],
        quickTitle: 'Explora más rápido',
        quickStyles: 'Estilos recomendados',
        resultPrefix: 'Mostrando',
        decisionTitle: '¿Todavía comparando opciones?',
        decisionCopy: 'Da el siguiente paso con una ruta más clara: compara tours, pide un plan personalizado o habla con un asesor.',
        decisionPlan: 'Abrir plan personalizado',
        decisionContact: 'Hablar con un asesor',
      };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const base = getPublicBaseUrl().replace(/\/+$/, '');

  const canonicalPath = withLocale(locale, '/tours');
  const canonicalAbs = absoluteUrl(canonicalPath);

  return {
    metadataBase: new URL(base),
    title: 'KCE Tours — curated tours in Colombia with clearer booking',
    description:
      'Compara tours en Colombia con una ruta más premium: ciudad, estilo, precio y plan personalizado cuando haga falta.',
    alternates: {
      canonical: canonicalAbs,
      languages: {
        es: '/es/tours',
        en: '/en/tours',
        fr: '/fr/tours',
        de: '/de/tours',
      },
    },
    openGraph: {
      title: 'KCE Tours — curated tours in Colombia with clearer booking',
      description: 'Curated tours with clearer comparison, real support and a more focused booking path.',
      url: canonicalAbs,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    },
  };
}

export default async function ToursPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const locale = await resolveLocale();
  const copy = getCopy(locale);
  const dict = await getDictionary(locale);
  const sp = (await Promise.resolve(searchParams ?? {})) as SearchParams;

  const q = pick(sp.q).trim();
  const tag = pick(sp.tag).trim();
  const city = pick(sp.city).trim();

  const pminRaw = pick(sp.pmin).trim();
  const pmaxRaw = pick(sp.pmax).trim();
  const pmin = pminRaw && Number.isFinite(Number(pminRaw)) ? Number(pminRaw) : undefined;
  const pmax = pmaxRaw && Number.isFinite(Number(pmaxRaw)) ? Number(pmaxRaw) : undefined;

  const pageRaw = pick(sp.page).trim();
  const page = Math.max(1, Math.trunc(Number(pageRaw || '1') || 1));

  const sortRaw = pick(sp.sort).trim();
  const sort: 'popular' | 'price-asc' | 'price-desc' = isSort(sortRaw) ? sortRaw : 'popular';

  const limit = 12;
  const offset = (page - 1) * limit;

  const [{ tags, cities }, toursRes] = await Promise.all([
    getFacets(),
    listTours({
      ...(q ? { q } : {}),
      ...(tag ? { tag } : {}),
      ...(city ? { city } : {}),
      sort,
      limit,
      offset,
      ...(pmin !== undefined ? { minPrice: pmin } : {}),
      ...(pmax !== undefined ? { maxPrice: pmax } : {}),
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil((toursRes.total || 0) / limit));

  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message:
      process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE ||
      'Hola KCE, quiero ayuda para elegir un tour.',
    url: withLocale(locale, '/tours'),
  });

  const base = getPublicBaseUrl().replace(/\/+$/, '');
  const canonicalPath = withLocale(locale, '/tours');
  const contactHref = buildContextHref(locale as MarketingLocale, '/contact', {
    source: 'tours',
    topic: 'catalog',
    city: city || undefined,
    q: q || undefined,
    tag: tag || undefined,
  });
  const canonicalAbs = absoluteUrl(canonicalPath);

  const hasHeavyFilters = Boolean(q || pminRaw || pmaxRaw || page > 1);
  const robots = hasHeavyFilters ? { index: false, follow: true } : undefined;

  const items = (toursRes.items ?? []).slice(0, 12).map((t, i) => {
    const ui = toTourLike(t);
    const url = absoluteUrl(withLocale(locale, `/tours/${encodeURIComponent(ui.slug)}`));
    const image = Array.isArray(ui.images) && ui.images[0]?.url ? ui.images[0].url : ui.image;

    return {
      '@type': 'ListItem',
      position: i + 1,
      url,
      item: {
        '@type': 'TouristTrip',
        name: ui.title,
        url,
        ...(image ? { image } : {}),
      },
    };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Tours en Colombia',
        url: canonicalAbs,
        isPartOf: { '@type': 'WebSite', name: 'KCE', url: base },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(withLocale(locale, '/')) },
          { '@type': 'ListItem', position: 2, name: 'Tours', item: canonicalAbs },
        ],
      },
      ...(items.length ? [{ '@type': 'ItemList', name: 'Tours', itemListElement: items }] : []),
    ],
  };

  return (
    <>
      {robots ? <meta name="robots" content="noindex,follow" /> : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <main className="mx-auto max-w-[var(--container-max)] px-4 py-10">
        
        <section className="overflow-hidden rounded-[calc(var(--radius)+1rem)] border border-[color:var(--color-border)] bg-[linear-gradient(135deg,rgba(8,41,86,0.07),rgba(255,255,255,0.985)_40%,rgba(216,176,74,0.10))] shadow-hard">
          <div className="grid gap-0 lg:grid-cols-[1.12fr_0.88fr]">
            <div className="border-b border-[color:var(--color-border)] px-6 py-7 md:px-8 lg:border-b-0 lg:border-r lg:px-9 lg:py-9">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue/85 shadow-soft">
                {copy.badge}
              </div>
              <h1 className="mt-4 max-w-3xl font-heading text-[2.3rem] leading-[0.92] text-brand-blue md:text-[3.65rem]">
                {copy.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--color-text)]/76 md:text-base">
                {copy.subtitle}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <Link className="font-semibold text-brand-blue hover:underline" href={withLocale(locale, '/faq')}>
                  FAQ
                </Link>
                <span className="text-[color:var(--color-text)]/30">•</span>
                <Link className="font-semibold text-brand-blue hover:underline" href={withLocale(locale, '/policies/cancellation')}>
                  Cancelación y cambios
                </Link>
                <span className="text-[color:var(--color-text)]/30">•</span>
                <Link className="font-semibold text-brand-blue hover:underline" href={contactHref}>
                  Contacto
                </Link>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {copy.chips.map((item) => (
                  <div key={item} className="rounded-[1.2rem] border border-white/80 bg-white/92 px-4 py-3 text-sm font-semibold text-[color:var(--color-text)] shadow-soft">
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-[1.25rem] border border-[color:var(--color-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,244,235,0.96))] px-4 py-4 shadow-soft">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">Resultados</div>
                  <div className="mt-2 font-heading text-3xl text-brand-blue">{toursRes.total}</div>
                  <div className="mt-1 text-sm text-[color:var(--color-text)]/68">tours activos</div>
                </div>
                <div className="rounded-[1.25rem] border border-[color:var(--color-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,244,235,0.96))] px-4 py-4 shadow-soft">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">Ciudades</div>
                  <div className="mt-2 font-heading text-3xl text-brand-blue">{cities.length}</div>
                  <div className="mt-1 text-sm text-[color:var(--color-text)]/68">puntos de entrada</div>
                </div>
                <div className="rounded-[1.25rem] border border-[color:var(--color-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,244,235,0.96))] px-4 py-4 shadow-soft">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">Estilos</div>
                  <div className="mt-2 font-heading text-3xl text-brand-blue">{tags.length}</div>
                  <div className="mt-1 text-sm text-[color:var(--color-text)]/68">estilos disponibles</div>
                </div>
              </div>
            </div>

            <aside className="px-6 py-7 md:px-8 lg:px-9 lg:py-9">
              <div className="overflow-hidden rounded-[calc(var(--radius)+0.25rem)] border border-[color:var(--color-border)] bg-[linear-gradient(160deg,rgba(8,41,86,0.98),rgba(11,84,162,0.96)_62%,rgba(216,176,74,0.74))] p-5 text-white shadow-hard">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">{copy.studioLabel}</p>
                <h2 className="mt-2 text-xl font-semibold leading-snug text-white">{copy.studioTitle}</h2>
                <p className="mt-3 text-sm leading-6 text-white/78">{copy.studioCopy}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <Link href={withLocale(locale, '/plan')} className="rounded-[1.1rem] bg-white px-4 py-3 text-sm font-semibold text-brand-blue shadow-soft transition hover:opacity-95">
                    {copy.studioCta}
                  </Link>
                  <Link href={withLocale(locale, '/destinations')} className="rounded-[1.1rem] border border-white/18 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/14">
                    {copy.helperSecondary}
                  </Link>
                </div>
              </div>

              <div className="mt-4 rounded-[calc(var(--radius)+0.25rem)] border border-[color:var(--color-border)] bg-white p-5 shadow-soft">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue/80">{copy.helperKicker}</p>
                <h3 className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">{copy.helperTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">{copy.helperCopy}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href={waHref || withLocale(locale, '/contact')} target={waHref ? '_blank' : undefined} rel={waHref ? 'noreferrer' : undefined} className="rounded-[1.1rem] border border-brand-blue/18 bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-soft">
                    {copy.helperPrimary}
                  </a>
                  <Link href={withLocale(locale, '/destinations')} className="rounded-[1.1rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-text)]">
                    {copy.helperSecondary}
                  </Link>
                </div>
                <div className="mt-4 rounded-[1.1rem] border border-[color:var(--color-border)] bg-[linear-gradient(135deg,rgba(11,84,162,0.05),rgba(255,255,255,0.96))] px-4 py-3 text-sm text-[color:var(--color-text)]/72">
                  <span className="font-semibold text-[color:var(--color-text)]">{toursRes.total}</span> resultados activos •{' '}
                  <span className="font-semibold text-[color:var(--color-text)]">{toursRes.source}</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <MobileQuickActions locale={locale} dict={dict} whatsAppHref={waHref} showAccount={false} />

        <div className="mt-7">
          <ToursToolbar
            initial={{ q, tag, city, sort, pmin: pminRaw, pmax: pmaxRaw }}
            tags={tags}
            cities={cities}
          />
        </div>

        {cities.length || tags.length ? (
          <div className="mt-7 overflow-hidden rounded-[calc(var(--radius)+0.55rem)] border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.985),rgba(248,244,236,0.97))] shadow-hard">
            <div className="border-b border-[color:var(--color-border)] bg-[linear-gradient(135deg,rgba(11,84,162,0.06),rgba(255,255,255,0.98),rgba(216,176,74,0.08))] px-5 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue/80">Quick ways to explore</div>
              <div className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">{locale === 'en' ? 'Use cities and styles as premium shortcuts instead of forcing a cold search.' : locale === 'fr' ? 'Utilise villes et styles comme raccourcis premium au lieu d’une recherche froide.' : locale === 'de' ? 'Nutze Städte und Stile als Premium-Abkürzungen statt einer kalten Suche.' : 'Usa ciudades y estilos como atajos para encontrar más rápido la experiencia que te interesa.'}</div>
            </div>
            <div className="p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue/80">{copy.quickTitle}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {cities.slice(0, 8).map((c) => (
                    <Link
                      key={c}
                      href={`${withLocale(locale, '/tours')}?city=${encodeURIComponent(c)}`}
                      className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-[color:var(--color-surface)]"
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue/80">{copy.quickStyles}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.slice(0, 8).map((item) => (
                    <Link
                      key={item}
                      href={`${withLocale(locale, '/tours')}?tag=${encodeURIComponent(item)}`}
                      className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-[color:var(--color-surface)]"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </div>
        ) : null}

      <PublicCoreDecisionRail locale={locale} variant="catalog" className="mt-7" />

      <div className="mt-4 flex flex-col gap-3 rounded-[calc(var(--radius)+0.45rem)] border border-[color:var(--color-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.99),rgba(248,244,236,0.98))] px-5 py-4 text-sm shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[color:var(--color-text)]/70">
            {toursRes.total ? (
              <>
                {copy.resultPrefix}{' '}
                <span className="font-semibold text-[color:var(--color-text)]">{Math.min(toursRes.total, offset + 1)}</span>
                –
                <span className="font-semibold text-[color:var(--color-text)]">{Math.min(toursRes.total, offset + limit)}</span>{' '}
                de <span className="font-semibold text-[color:var(--color-text)]">{toursRes.total}</span>
              </>
            ) : (
              <>
                {copy.resultPrefix} <span className="font-semibold text-[color:var(--color-text)]">0</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link className="font-semibold text-brand-blue hover:underline" href={canonicalPath}>
              Limpiar filtros
            </Link>
            <span className="text-[color:var(--color-text)]/30">•</span>
            <Link className="font-semibold text-brand-blue hover:underline" href={withLocale(locale, '/faq')}>
              FAQ
            </Link>
            <span className="text-[color:var(--color-text)]/30">•</span>
            <Link className="font-semibold text-brand-blue hover:underline" href={contactHref}>
              Contacto
            </Link>
          </div>
        </div>

        <section aria-label="Resultados" className="mt-8">
          {toursRes.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {toursRes.items.map((tour, idx) => {
                const ui = toTourLike(tour);
                return (
                  <TourCardPremium
                    key={ui.slug}
                    tour={ui}
                    priority={idx < 6}
                    href={withLocale(locale, `/tours/${ui.slug}`)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mt-2 overflow-hidden rounded-[calc(var(--radius)+0.5rem)] border border-[color:var(--color-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,244,236,0.96))] p-6 shadow-hard">
              <h2 className="font-heading text-lg text-brand-blue">Sin resultados</h2>
              <p className="mt-2 text-sm text-[color:var(--color-text)]/75">
                No encontramos tours con esos filtros. Prueba cambiando la búsqueda o limpiando los filtros.
              </p>

              <div className="mt-4 text-sm text-[color:var(--color-text)]/70">
                Sugerencias:
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Quita el tag o cambia la ciudad.</li>
                  <li>Usa una búsqueda más corta (por ejemplo: “café”, “historia”).</li>
                  <li>Vuelve a “popular” si estabas ordenando por precio.</li>
                </ul>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={canonicalPath} className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-soft hover:opacity-95">
                  Limpiar filtros
                </Link>
                <Link href={contactHref} className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm font-semibold text-brand-blue shadow-soft hover:bg-[color:var(--color-surface-2)]">
                  Contacto
                </Link>
                <Link href={withLocale(locale, '/faq')} className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm font-semibold text-brand-blue shadow-soft hover:bg-[color:var(--color-surface-2)]">
                  Ver FAQ
                </Link>
                <Link href={withLocale(locale, '/plan')} className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm font-semibold text-brand-blue shadow-soft hover:bg-[color:var(--color-surface-2)]">
                  Abrir plan personalizado
                </Link>
              </div>
            </div>
          )}
        </section>

        <Pagination
          basePath={withLocale(locale, '/tours')}
          query={{
            q: q || undefined,
            tag: tag || undefined,
            city: city || undefined,
            sort: sort !== 'popular' ? sort : undefined,
            pmin: pminRaw || undefined,
            pmax: pmaxRaw || undefined,
          }}
          page={page}
          totalPages={totalPages}
        />

        <div className="mt-12">
          <ReleaseConfidenceBand
            eyebrow={locale === 'en' ? 'release-grade catalog' : locale === 'fr' ? 'catalogue prêt au lancement' : locale === 'de' ? 'launch-reifer katalog' : 'catálogo listo para release'}
            title={copy.decisionTitle}
            description={locale === 'en' ? 'This catalog now tries to do one job very well: help the traveler compare, choose with confidence and move into the next lane without friction.' : locale === 'fr' ? 'Ce catalogue cherche maintenant à faire une chose très bien : aider le voyageur à comparer, choisir avec confiance et passer à l’étape suivante sans friction.' : locale === 'de' ? 'Dieser Katalog soll jetzt vor allem eines sehr gut tun: Reisenden helfen zu vergleichen, sicher zu wählen und ohne Reibung in den nächsten Schritt zu gehen.' : 'Este catálogo ahora intenta hacer una cosa muy bien: ayudar al viajero a comparar, elegir con confianza y pasar a la siguiente ruta sin fricción.'}
            primaryHref={withLocale(locale, '/plan')}
            primaryLabel={copy.decisionPlan}
            secondaryHref={contactHref}
            secondaryLabel={copy.decisionContact}
            items={[
              {
                eyebrow: '01',
                title: locale === 'en' ? 'Compare faster' : locale === 'fr' ? 'Comparer plus vite' : locale === 'de' ? 'Schneller vergleichen' : 'Comparar más rápido',
                body: locale === 'en' ? 'Use city, style and price to shrink the search before you spend energy reading every detail page.' : locale === 'fr' ? 'Utilise ville, style et prix pour réduire la recherche avant de lire chaque détail.' : locale === 'de' ? 'Nutze Stadt, Stil und Preis, um die Auswahl zu verkleinern, bevor du jede Detailseite liest.' : 'Usa ciudad, estilo y precio para reducir la búsqueda antes de gastar energía leyendo cada detalle.',
              },
              {
                eyebrow: '02',
                title: locale === 'en' ? 'Escalate when needed' : locale === 'fr' ? 'Monter d’un niveau si besoin' : locale === 'de' ? 'Bei Bedarf eskalieren' : 'Escalar cuando haga falta',
                body: locale === 'en' ? 'Move into the personalized plan when you are still balancing dates, budget, pace or group needs.' : locale === 'fr' ? 'Passe au plan personnalisé si tu hésites encore entre dates, budget, rythme ou besoins du groupe.' : locale === 'de' ? 'Wechsle in den persönlichen Plan, wenn du noch Datum, Budget, Tempo oder Gruppenbedarf abwägst.' : 'Pasa al plan personalizado si todavía estás equilibrando fechas, presupuesto, ritmo o necesidades del grupo.',
              },
              {
                eyebrow: '03',
                title: locale === 'en' ? 'Keep support close' : locale === 'fr' ? 'Gardez le support proche' : locale === 'de' ? 'Support griffbereit halten' : 'Mantener soporte cerca',
                body: locale === 'en' ? 'When confidence drops, jump to contact or WhatsApp instead of abandoning the booking path.' : locale === 'fr' ? 'Si la confiance baisse, passe au contact ou à WhatsApp au lieu d’abandonner le parcours.' : locale === 'de' ? 'Wenn das Vertrauen sinkt, wechsle zu Kontakt oder WhatsApp statt den Buchungsweg abzubrechen.' : 'Si baja la confianza, salta a contacto o WhatsApp en vez de abandonar el camino de reserva.',
              },
            ]}
          />
        </div>

        <div className="mt-12">
          <FeaturedReviews locale={locale} />
        </div>
      </main>
    </>
  );
}

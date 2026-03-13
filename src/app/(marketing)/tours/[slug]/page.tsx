/* src/app/(marketing)/tours/[slug]/page.tsx */
import { cookies } from 'next/headers';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { buildContextHref, type MarketingLocale } from '@/features/marketing/contactContext';
import { ReviewForm } from '@/features/reviews/ReviewForm';
import { ReviewsList } from '@/features/reviews/ReviewsList';
import { getTourBySlug, listTours } from '@/features/tours/catalog.server';
import { toTourLike } from '@/features/tours/adapters';
import TourCard from '@/features/tours/components/TourCard';
import BookingWidget from '@/features/tours/components/BookingWidget';
import { TrustBar } from '@/features/tours/components/TrustBar';
import MobileStickyBookingCta from '@/features/tours/components/MobileStickyBookingCta';
import { TourViewTracker } from '@/features/tours/components/TourViewTracker';
import WishlistButton from '@/features/wishlist/WishlistButton';
import { formatMinorUnits, hoursLabel } from '@/utils/format';
import { MarketingMarkdown } from '@/components/MarketingMarkdown';
import ReleaseConfidenceBand from '@/features/marketing/ReleaseConfidenceBand';
import PublicCoreDecisionRail from '@/features/marketing/PublicCoreDecisionRail';

import type { Metadata } from 'next';

export const revalidate = 300;

type Locale = 'es' | 'en' | 'fr' | 'de';
type ImageLike = string | { url?: string; alt?: string } | null | undefined;

type TourLike = {
  id: string;
  slug: string;
  title: string;
  city?: string | null;
  summary?: string | null;
  short?: string | null;
  body_md?: string | null;

  base_price?: number | null;
  price?: number | null;
  duration_hours?: number | null;
  durationHours?: number | null;

  image?: string | null;
  images?: ImageLike[] | null;

  tags?: unknown;
  rating?: number | null;
  source?: string | null;
};

type DetailCopy = {
  breadcrumbHome: string;
  breadcrumbTours: string;
  eyebrow: string;
  reserveNow: string;
  askWhatsapp: string;
  quickNav: { details: string; includes: string; itinerary: string; faq: string; reviews: string };
  cityLabel: string;
  fromLabel: string;
  durationLabel: string;
  ratingLabel: string;
  sourceLabel: string;
  snapshotTitle: string;
  snapshotCopy: string;
  idealForTitle: string;
  idealForCopy: string;
  confidenceTitle: string;
  confidenceCopy: string;
  includesTitle: string;
  excludesTitle: string;
  itineraryTitle: string;
  itineraryCopy: string;
  policyTitle: string;
  policyCopy: string;
  faqTitle: string;
  reviewsTitle: string;
  relatedTitle: string;
  relatedCopy: string;
  sidebarTitle: string;
  priceFrom: string;
  planTitle: string;
  planCopy: string;
  planCta: string;
  contactTitle: string;
  contactCopy: string;
  contactCta: string;
  supportTitle: string;
  supportCopy: string;
  checklistTitle: string;
  checklist: string[];
  stages: Array<{ step: string; title: string; body: string }>;
  faqs: Array<{ q: string; a: string }>;
};

const BASE_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  'https://kce.travel'
).replace(/\/+$/, '');

function getCopy(locale: Locale): DetailCopy {
  switch (locale) {
    case 'en':
      return {
        breadcrumbHome: 'Home',
        breadcrumbTours: 'Tours',
        eyebrow: 'Premium KCE experience',
        reserveNow: 'Reserve now',
        askWhatsapp: 'Ask on WhatsApp',
        quickNav: { details: 'Details', includes: 'Includes', itinerary: 'Itinerary', faq: 'FAQ', reviews: 'Reviews' },
        cityLabel: 'City',
        fromLabel: 'From',
        durationLabel: 'Duration',
        ratingLabel: 'Rating',
        sourceLabel: 'Source',
        snapshotTitle: 'Experience snapshot',
        snapshotCopy: 'A quick, honest read on what this experience feels like before you move into booking.',
        idealForTitle: 'Best for',
        idealForCopy: 'Use this section to understand whether the experience matches your pace, interests and travel style.',
        confidenceTitle: 'Booking confidence',
        confidenceCopy: 'Secure payment, real support and a clear booking flow help the decision feel calmer and safer.',
        includesTitle: 'What is included',
        excludesTitle: 'What is not included',
        itineraryTitle: 'Indicative journey',
        itineraryCopy: 'A cleaner structure to help the traveler imagine the flow before booking.',
        policyTitle: 'Meeting point & policies',
        policyCopy: 'We confirm logistics before the experience and help with adjustments when needed.',
        faqTitle: 'Frequently asked questions',
        reviewsTitle: 'Reviews & social proof',
        relatedTitle: 'Continue your shortlist',
        relatedCopy: 'Complement this tour with nearby or similar experiences.',
        sidebarTitle: 'Trip summary',
        priceFrom: 'Price from',
        planTitle: 'Need a more guided recommendation?',
        planCopy: 'Use the personalized plan to narrow your shortlist by style, city and budget.',
        planCta: 'Open personalized plan',
        contactTitle: 'Prefer human support?',
        contactCopy: 'We can help you compare tours, check fit and suggest the best next step before checkout.',
        contactCta: 'Talk to KCE',
        supportTitle: 'Reserve with more clarity',
        supportCopy: 'This page brings together key details, booking steps and support options so you can decide without jumping across multiple screens.',
        checklistTitle: 'Before you book',
        checklist: ['Comfortable shoes and weather-appropriate layers', 'Tell us in advance about restrictions or accessibility needs', 'You receive booking, invoice and follow-up support after payment'],
        stages: [
          { step: '01', title: 'Meet & align', body: 'Quick context, meeting point confirmation and route overview.' },
          { step: '02', title: 'Live the core experience', body: 'Main stops, local interpretation and curated moments.' },
          { step: '03', title: 'Wrap with next steps', body: 'Final recommendations, optional add-ons and local tips.' },
        ],
        faqs: [
          { q: 'What should I bring?', a: 'Comfortable shoes, water, sunscreen and a light layer are usually enough.' },
          { q: 'Is it family friendly?', a: 'Usually yes, but we confirm the fit according to pace, route and child age.' },
          { q: 'What happens after payment?', a: 'You receive booking confirmation, invoice and direct contact for coordination.' },
          { q: 'Can I change the date?', a: 'That depends on the tour and timing. Our team can guide you before or after payment.' },
        ],
      };
    default:
      return {
        breadcrumbHome: 'Inicio',
        breadcrumbTours: 'Tours',
        eyebrow: 'Experiencia KCE',
        reserveNow: 'Reservar ahora',
        askWhatsapp: 'Hablar por WhatsApp',
        quickNav: { details: 'Detalles', includes: 'Incluye', itinerary: 'Itinerario', faq: 'FAQ', reviews: 'Reseñas' },
        cityLabel: 'Ciudad',
        fromLabel: 'Desde',
        durationLabel: 'Duración',
        ratingLabel: 'Calificación',
        sourceLabel: 'Fuente',
        snapshotTitle: 'Resumen de experiencia',
        snapshotCopy: 'Una lectura rápida y honesta de cómo se siente esta experiencia antes de reservar.',
        idealForTitle: 'Ideal para',
        idealForCopy: 'Aquí puedes entender si la experiencia encaja con tu ritmo, intereses y forma de viajar.',
        confidenceTitle: 'Reserva con más claridad',
        confidenceCopy: 'Pago seguro, apoyo real y un proceso claro ayudan a decidir con más calma y confianza.',
        includesTitle: 'Qué incluye',
        excludesTitle: 'Qué no incluye',
        itineraryTitle: 'Ruta estimada',
        itineraryCopy: 'Una estructura más limpia para que el viajero visualice el recorrido antes de pagar.',
        policyTitle: 'Punto de encuentro y políticas',
        policyCopy: 'Confirmamos logística antes de la experiencia y ayudamos a ajustar cuando hace falta.',
        faqTitle: 'Preguntas frecuentes',
        reviewsTitle: 'Reseñas y prueba social',
        relatedTitle: 'Sigue armando tu shortlist',
        relatedCopy: 'Si esta experiencia te encaja, aquí tienes opciones cercanas o de estilo parecido para seguir armando tu viaje.',
        sidebarTitle: 'Resumen del viaje',
        priceFrom: 'Precio desde',
        planTitle: '¿Quieres una recomendación más guiada?',
        planCopy: 'Usa el plan personalizado para aterrizar tu shortlist por estilo, ciudad y presupuesto.',
        planCta: 'Abrir plan personalizado',
        contactTitle: '¿Prefieres apoyo humano?',
        contactCopy: 'Si aún comparas rutas, fechas o logística, KCE puede ayudarte a decidir con más contexto antes del checkout.',
        contactCta: 'Hablar con KCE',
        supportTitle: 'Reserva con más claridad',
        supportCopy: 'Aquí reunimos lo esencial de la experiencia, el proceso de reserva y las vías de ayuda para que puedas decidir sin saltar entre muchas pantallas.',
        checklistTitle: 'Antes de reservar',
        checklist: ['Zapatos cómodos y ropa adecuada para el clima', 'Avísanos si tienes restricciones, necesidades de accesibilidad o cambios de ritmo', 'Después del pago recibes booking, invoice y seguimiento para coordinar'],
        stages: [
          { step: '01', title: 'Encuentro y contexto', body: 'Confirmamos punto, ritmo y enfoque de la experiencia.' },
          { step: '02', title: 'Vive la experiencia central', body: 'Paradas principales, interpretación local y momentos curados.' },
          { step: '03', title: 'Cierre con próximos pasos', body: 'Recomendaciones, extras opcionales y tips locales para seguir el viaje.' },
        ],
        faqs: [
          { q: '¿Qué debo llevar?', a: 'Zapatos cómodos, hidratación, bloqueador y una capa ligera suelen ser suficientes.' },
          { q: '¿Es apto para familias?', a: 'Normalmente sí, pero confirmamos el encaje según ritmo, ruta y edad de los niños.' },
          { q: '¿Qué pasa después del pago?', a: 'Recibes confirmación, booking, invoice y contacto directo para coordinar detalles.' },
          { q: '¿Puedo cambiar la fecha?', a: 'Depende del tour y la anticipación. Nuestro equipo puede orientarte antes o después del pago.' },
        ],
      };
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function absoluteUrl(input?: string) {
  const s = (input || '').trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${BASE_SITE_URL}${s}`;
  return `${BASE_SITE_URL}/${s}`;
}

function withLocale(locale: Locale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

async function resolveLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get('kce.locale')?.value?.toLowerCase();
  return v === 'en' || v === 'fr' || v === 'de' ? v : 'es';
}

function safeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function pickImage(tour: TourLike): { src: string; alt: string } {
  const alt = tour.title || 'Tour';

  const images = tour.images;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];

    if (typeof first === 'string' && first.trim()) return { src: first.trim(), alt };

    if (isRecord(first)) {
      const url = typeof first.url === 'string' ? first.url.trim() : '';
      if (url) {
        return {
          src: url,
          alt: typeof first.alt === 'string' && first.alt.trim() ? first.alt.trim() : alt,
        };
      }
    }
  }

  if (typeof tour.image === 'string' && tour.image.trim()) return { src: tour.image.trim(), alt };

  return { src: '/images/hero-kce.jpg', alt };
}

function getPriceMinor(tour: TourLike): number {
  const v =
    typeof tour.base_price === 'number'
      ? tour.base_price
      : typeof tour.price === 'number'
        ? tour.price
        : 0;

  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

function getDurationHours(tour: TourLike): number | null {
  const v =
    typeof tour.duration_hours === 'number'
      ? tour.duration_hours
      : typeof tour.durationHours === 'number'
        ? tour.durationHours
        : null;

  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getSummary(tour: TourLike): string {
  return String(tour.summary || tour.short || '').trim();
}

function getTags(tour: TourLike): string[] {
  const t = tour.tags;

  if (Array.isArray(t)) {
    return t
      .map((x) => String(x))
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  if (typeof t === 'string') {
    return t
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale();
  const copy = getCopy(locale);
  const awaitedParams = await params;

  const tour = (await getTourBySlug(awaitedParams.slug)) as TourLike | null;
  if (!tour) {
    return {
      metadataBase: new URL(BASE_SITE_URL),
      title: 'Tour — KCE',
      robots: { index: false, follow: false },
    };
  }

  const priceMinor = getPriceMinor(tour);
  const summary = getSummary(tour);

  const canonicalPath = `/${locale}/tours/${encodeURIComponent(tour.slug)}`;
  const canonicalUrl = absoluteUrl(canonicalPath);

  const ogImageUrl = absoluteUrl(`/tours/${encodeURIComponent(tour.slug)}/opengraph-image`);

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: `${tour.title} — KCE tour with clearer booking`,
    description:
      summary ||
      `${tour.title} • ${copy.priceFrom} ${formatMinorUnits(priceMinor, 'EUR', 'es-ES')} • booking claro y soporte KCE.`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${tour.title} — KCE tour with clearer booking`,
      description: summary || undefined,
      url: canonicalUrl,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: tour.title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogImageUrl],
    },
  };
}

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await resolveLocale();
  const copy = getCopy(locale);
  const awaitedParams = await params;

  const tour = (await getTourBySlug(awaitedParams.slug)) as TourLike | null;
  if (!tour) notFound();

  const img = pickImage(tour);
  const priceMinor = getPriceMinor(tour);
  const duration = getDurationHours(tour);
  const summary = getSummary(tour);
  const tags = getTags(tour);
  const rating = typeof tour.rating === 'number' && Number.isFinite(tour.rating)
    ? Math.max(0, Math.min(5, tour.rating))
    : null;

  const related = await listTours({
    ...(tour.city ? { city: tour.city } : {}),
    sort: 'popular',
    limit: 8,
  });

  const relatedTours = related.items
    .filter((x) => x.slug !== tour.slug)
    .slice(0, 4)
    .map((x) => toTourLike(x));

  const canonical = absoluteUrl(`/${locale}/tours/${encodeURIComponent(tour.slug)}`);
  const imgAbs = absoluteUrl(img.src);
  const priceMajor = priceMinor > 0 ? priceMinor / 100 : 0;
  const priceLabel = formatMinorUnits(priceMinor, 'EUR', 'es-ES');
  const locationLabel = tour.city || 'Colombia';
  const contactHref = buildContextHref(locale as MarketingLocale, '/contact', {
    source: 'tour-detail',
    topic: 'tour',
    city: tour.city ?? undefined,
    tour: tour.title,
    slug: tour.slug,
  });

  const whatsAppHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: [
      process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE || 'Hola KCE, quiero información sobre este tour.',
      '',
      `${tour.title}`,
      `${copy.cityLabel}: ${locationLabel}`,
      `${copy.priceFrom}: ${priceLabel}`,
    ].join('\n'),
    url: withLocale(locale, `/tours/${tour.slug}`),
  });

  const jsonLdTour = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: tour.title,
    description: summary || undefined,
    image: imgAbs,
    url: canonical,
    itinerary: tour.city ? `${tour.city}, Colombia` : 'Colombia',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: priceMajor > 0 ? priceMajor.toFixed(2) : undefined,
      url: canonical,
      availability: 'https://schema.org/InStock',
    },
    ...(rating != null
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: rating.toFixed(1),
            bestRating: '5',
            worstRating: '1',
          },
        }
      : {}),
    inLanguage: locale,
  };

  const jsonLdBreadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: copy.breadcrumbHome, item: absoluteUrl(`/${locale}`) },
      { '@type': 'ListItem', position: 2, name: copy.breadcrumbTours, item: absoluteUrl(`/${locale}/tours`) },
      { '@type': 'ListItem', position: 3, name: tour.title, item: canonical },
    ],
  };

  return (
    <>
      <TourViewTracker slug={tour.slug} />
      <MobileStickyBookingCta
        targetId="booking-widget"
        title={tour.title}
        priceMinor={priceMinor}
        planHref={withLocale(locale, '/plan')}
        helpHref={whatsAppHref || contactHref}
        helpLabel={whatsAppHref ? copy.askWhatsapp : copy.contactCta}
        helpExternal={Boolean(whatsAppHref)}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdTour) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdBreadcrumbs) }}
      />

      <main className="mx-auto max-w-[var(--container-max)] overflow-x-clip px-4 py-6 pb-32 md:py-10 md:pb-10">
        <div className="grid min-w-0 gap-8 xl:grid-cols-12">
          <section className="min-w-0 space-y-8 overflow-x-clip xl:col-span-8">
            <div className="text-[color:var(--color-text)]/60 flex flex-wrap items-center gap-2 text-sm">
              <a className="hover:text-brand-blue" href={withLocale(locale, '/')}>{copy.breadcrumbHome}</a>
              <span>•</span>
              <a className="hover:text-brand-blue" href={withLocale(locale, '/tours')}>{copy.breadcrumbTours}</a>
              <span>•</span>
              <span className="text-[color:var(--color-text)]/80">{tour.title}</span>
            </div>

            <section className="card relative overflow-hidden rounded-[22px] md:rounded-[28px]">
              <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] md:aspect-[16/8]">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 1280px) 100vw, 66vw"
                  className="object-cover"
                  priority
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/35 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />

                <div className="absolute left-4 top-4 flex flex-wrap gap-2 md:left-6 md:top-6">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur">
                    {copy.eyebrow}
                  </span>
                  <span className="rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs text-white/85 backdrop-blur">
                    {locationLabel}
                  </span>
                  {duration ? (
                    <span className="rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs text-white/85 backdrop-blur">
                      {hoursLabel(duration)}
                    </span>
                  ) : null}
                  {rating != null ? (
                    <span className="rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs text-white/85 backdrop-blur">
                      ⭐ {rating.toFixed(1)}
                    </span>
                  ) : null}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 md:p-7">
                  <div className="w-full max-w-none rounded-[24px] border border-white/10 bg-slate-950/52 p-4 text-white shadow-2xl backdrop-blur-md sm:max-w-3xl sm:p-5 md:rounded-[28px] md:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                      <div className="max-w-2xl">
                        <h1 className="font-heading text-[1.75rem] leading-[0.95] text-white sm:text-3xl md:text-[2.5rem]">
                          {tour.title}
                        </h1>
                        {summary ? (
                          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78 md:text-base">
                            {summary}
                          </p>
                        ) : null}
                      </div>

                      <div className="w-full max-w-[260px] min-w-0 rounded-2xl border border-white/10 bg-white/8 p-4 text-white/90 backdrop-blur lg:w-auto lg:min-w-[220px]">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                          {copy.priceFrom}
                        </div>
                        <div className="mt-1 font-heading text-2xl text-white">{priceLabel}</div>
                        <div className="mt-1 text-xs text-white/60">
                          {duration ? `${copy.durationLabel}: ${hoursLabel(duration)}` : locationLabel}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {tags.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-white/78"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <a
                        href="#booking-widget"
                        className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90 sm:w-auto sm:py-2.5"
                      >
                        {copy.reserveNow}
                      </a>
                      {whatsAppHref ? (
                        <a
                          href={whatsAppHref}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-full items-center justify-center rounded-xl border border-white/16 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/12 sm:w-auto sm:py-2.5"
                        >
                          {copy.askWhatsapp}
                        </a>
                      ) : (
                        <a
                          href={contactHref}
                          className="inline-flex w-full items-center justify-center rounded-xl border border-white/16 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/12 sm:w-auto sm:py-2.5"
                        >
                          {copy.contactCta}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-2 pb-1 md:grid-cols-5 md:gap-3">
              <a href="#details" className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 text-center text-sm font-medium text-[color:var(--color-text)] transition hover:border-brand-blue/25 hover:text-brand-blue">{copy.quickNav.details}</a>
              <a href="#includes" className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 text-center text-sm font-medium text-[color:var(--color-text)] transition hover:border-brand-blue/25 hover:text-brand-blue">{copy.quickNav.includes}</a>
              <a href="#itinerary" className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 text-center text-sm font-medium text-[color:var(--color-text)] transition hover:border-brand-blue/25 hover:text-brand-blue">{copy.quickNav.itinerary}</a>
              <a href="#faq" className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 text-center text-sm font-medium text-[color:var(--color-text)] transition hover:border-brand-blue/25 hover:text-brand-blue">{copy.quickNav.faq}</a>
              <a href="#reviews" className="col-span-2 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-center text-sm font-medium text-[color:var(--color-text)] transition hover:border-brand-blue/25 hover:text-brand-blue md:col-span-1">{copy.quickNav.reviews}</a>
            </div>

            <div className="space-y-4 xl:hidden">
              <div className="rounded-[20px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,244,236,0.96))] p-4 shadow-soft">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue/80">Siguiente paso</div>
                <div className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/74">Reserva, consulta o guarda la experiencia sin perseguir la información por toda la página.</div>
              </div>
              <div className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">{copy.sidebarTitle}</div>
                    <div className="mt-2 font-heading text-3xl text-brand-blue">{priceLabel}</div>
                    <div className="mt-1 text-sm text-[color:var(--color-text)]/62">{copy.priceFrom} · {locationLabel}</div>
                  </div>
                  <WishlistButton tourId={tour.id} tourSlug={tour.slug} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-[22px] border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4 text-sm">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/42">{copy.durationLabel}</div>
                    <div className="mt-1 font-medium text-[color:var(--color-text)]">{duration ? hoursLabel(duration) : '—'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/42">{copy.cityLabel}</div>
                    <div className="mt-1 font-medium text-[color:var(--color-text)]">{locationLabel}</div>
                  </div>
                  {rating != null ? (
                    <div className="col-span-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/42">{copy.ratingLabel}</div>
                      <div className="mt-1 font-medium text-[color:var(--color-text)]">{rating.toFixed(1)} / 5</div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div id="booking-widget" className="scroll-mt-24">
                <BookingWidget slug={tour.slug} title={tour.title} short={summary} price={priceMinor} />
              </div>

              <TrustBar compact />
            </div>

            <PublicCoreDecisionRail locale={locale} variant="detail" className="xl:hidden" />

            <section className="grid gap-4 lg:grid-cols-3" id="details">
              <div className="card p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">{copy.snapshotTitle}</div>
                <h2 className="mt-3 font-heading text-xl text-brand-blue">{tour.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[color:var(--color-text)]/78">{copy.snapshotCopy}</p>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3"><dt className="text-[color:var(--color-text)]/58">{copy.cityLabel}</dt><dd className="font-medium text-[color:var(--color-text)]">{locationLabel}</dd></div>
                  <div className="flex items-center justify-between gap-3"><dt className="text-[color:var(--color-text)]/58">{copy.fromLabel}</dt><dd className="font-medium text-[color:var(--color-text)]">{priceLabel}</dd></div>
                  <div className="flex items-center justify-between gap-3"><dt className="text-[color:var(--color-text)]/58">{copy.durationLabel}</dt><dd className="font-medium text-[color:var(--color-text)]">{duration ? hoursLabel(duration) : '—'}</dd></div>
                  {rating != null ? (
                    <div className="flex items-center justify-between gap-3"><dt className="text-[color:var(--color-text)]/58">{copy.ratingLabel}</dt><dd className="font-medium text-[color:var(--color-text)]">{rating.toFixed(1)} / 5</dd></div>
                  ) : null}
                  {tour.source ? (
                    <div className="flex items-center justify-between gap-3"><dt className="text-[color:var(--color-text)]/58">{copy.sourceLabel}</dt><dd className="font-medium text-[color:var(--color-text)]">{tour.source}</dd></div>
                  ) : null}
                </dl>
              </div>

              <div className="card p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">{copy.idealForTitle}</div>
                <h2 className="mt-3 font-heading text-xl text-brand-blue">{tags.length ? tags.slice(0, 2).join(' · ') : locationLabel}</h2>
                <p className="mt-3 text-sm leading-6 text-[color:var(--color-text)]/78">{copy.idealForCopy}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {(tags.length ? tags : [locationLabel, 'Culture', 'Flexible pace']).slice(0, 6).map((tag) => (
                    <span key={tag} className="badge-muted">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">{copy.confidenceTitle}</div>
                <h2 className="mt-3 font-heading text-xl text-brand-blue">Pago · factura · soporte</h2>
                <p className="mt-3 text-sm leading-6 text-[color:var(--color-text)]/78">{copy.confidenceCopy}</p>
                <ul className="mt-5 space-y-2 text-sm text-[color:var(--color-text)]/75">
                  <li>• Checkout seguro y confirmación rápida</li>
                  <li>• Booking e invoice entregados tras el pago</li>
                  <li>• Ayuda real por WhatsApp o contacto</li>
                </ul>
              </div>
            </section>

            {tour.body_md ? (
              <section className="card p-6">
                <div className="max-w-3xl">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">Más detalles</div>
                  <h2 className="mt-3 font-heading text-2xl text-brand-blue">{copy.snapshotTitle}</h2>
                </div>
                <div className="mt-4 text-sm text-[color:var(--color-text)]/82">
                  <MarketingMarkdown
                    content={tour.body_md}
                    className="prose prose-slate max-w-none prose-sm prose-headings:font-semibold prose-a:text-[color:var(--brand-blue)]"
                  />
                </div>
              </section>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card p-6" id="includes">
                <h2 className="font-heading text-lg text-brand-blue">{copy.includesTitle}</h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[color:var(--color-text)]/80">
                  <li>Guía local o acompañamiento según disponibilidad</li>
                  <li>Contexto cultural y recomendaciones durante la experiencia</li>
                  <li>Soporte por WhatsApp o email antes y después de reservar</li>
                  <li>Ruta pensada para que la experiencia se sienta curada y clara</li>
                </ul>
              </div>

              <div className="card p-6">
                <h2 className="font-heading text-lg text-brand-blue">{copy.excludesTitle}</h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[color:var(--color-text)]/80">
                  <li>Transporte intermunicipal o recogida especial si no se especifica</li>
                  <li>Compras personales, souvenirs y consumos no incluidos</li>
                  <li>Propinas opcionales</li>
                  <li>Add-ons no acordados antes de iniciar el checkout</li>
                </ul>
              </div>

              <div className="card p-6 lg:col-span-2" id="itinerary">
                <div className="max-w-2xl">
                  <h2 className="font-heading text-lg text-brand-blue">{copy.itineraryTitle}</h2>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/75">{copy.itineraryCopy}</p>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {copy.stages.map((stage) => (
                    <div key={stage.step} className="rounded-[26px] border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">{stage.step}</div>
                      <div className="mt-3 font-heading text-lg text-brand-blue">{stage.title}</div>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/78">{stage.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="font-heading text-lg text-brand-blue">{copy.checklistTitle}</h2>
                <ul className="mt-4 space-y-3 text-sm text-[color:var(--color-text)]/80">
                  {copy.checklist.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-blue/70" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card p-6">
                <h2 className="font-heading text-lg text-brand-blue">{copy.policyTitle}</h2>
                <p className="mt-3 text-sm leading-6 text-[color:var(--color-text)]/78">{copy.policyCopy}</p>
                <div className="mt-5 grid gap-2 text-sm">
                  <div className="flex items-center justify-between gap-3 text-[color:var(--color-text)]/75">
                    <span>Cancelación</span>
                    <a className="font-medium text-brand-blue hover:underline" href={withLocale(locale, '/policies/cancellation')}>
                      Ver política
                    </a>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[color:var(--color-text)]/75">
                    <span>Idioma</span>
                    <span className="font-medium text-[color:var(--color-text)]">ES / EN</span>
                  </div>
                </div>
              </div>

              <div className="card p-6 lg:col-span-2" id="faq">
                <h2 className="font-heading text-lg text-brand-blue">{copy.faqTitle}</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {copy.faqs.map((item) => (
                    <div key={item.q} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                      <p className="text-sm font-semibold text-[color:var(--color-text)]">{item.q}</p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/75">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <section className="card p-6" id="reviews" aria-label="Reseñas">
              <div className="max-w-2xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">{copy.reviewsTitle}</div>
                <h2 className="mt-3 font-heading text-2xl text-brand-blue">{tour.title}</h2>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <ReviewsList tourSlug={tour.slug} limit={10} />
                </div>
                <div>
                  <ReviewForm tourSlug={tour.slug} />
                </div>
              </div>
            </section>

            <ReleaseConfidenceBand
              className="mt-10"
              eyebrow={locale === 'en' ? 'before and after checkout' : locale === 'fr' ? 'avant et après le checkout' : locale === 'de' ? 'vor und nach dem checkout' : 'antes y después del checkout'}
              title={locale === 'en' ? 'This tour already connects the full journey, not just the payment' : locale === 'fr' ? 'Ce tour relie déjà tout le parcours, pas seulement le paiement' : locale === 'de' ? 'Diese Tour verbindet bereits die ganze Reise, nicht nur die Zahlung' : 'Este tour ya conecta el recorrido completo, no solo el pago'}
              description={locale === 'en' ? 'From this detail page, KCE should make it obvious what you are buying, how to book it, and what happens immediately after checkout.' : locale === 'fr' ? 'Depuis cette page détail, KCE doit rendre évident ce que tu achètes, comment le réserver et ce qui se passe juste après le checkout.' : locale === 'de' ? 'Von dieser Detailseite aus soll KCE klar machen, was du kaufst, wie du buchst und was direkt nach dem Checkout passiert.' : 'Desde este detalle, KCE debería dejar clarísimo qué compras, cómo lo reservas y qué pasa inmediatamente después del checkout.'}
              primaryHref={withLocale(locale, '/plan')}
              primaryLabel={copy.planCta}
              secondaryHref={contactHref}
              secondaryLabel={copy.contactCta}
              items={[
                {
                  eyebrow: '01',
                  title: locale === 'en' ? 'Clear fit' : locale === 'fr' ? 'Choix clair' : locale === 'de' ? 'Klarer Fit' : 'Encaje claro',
                  body: locale === 'en' ? 'The detail page now reinforces city, duration, price and confidence so the traveler can validate the fit quickly.' : locale === 'fr' ? 'La page renforce ville, durée, prix et confiance pour valider le bon choix rapidement.' : locale === 'de' ? 'Die Seite stärkt Stadt, Dauer, Preis und Vertrauen, damit der Fit schnell validiert werden kann.' : 'La página refuerza ciudad, duración, precio y confianza para validar rápido si el tour sí encaja.',
                },
                {
                  eyebrow: '02',
                  title: locale === 'en' ? 'Protected checkout' : locale === 'fr' ? 'Checkout protégé' : locale === 'de' ? 'Geschützter Checkout' : 'Checkout protegido',
                  body: locale === 'en' ? 'Booking, invoice, calendar and support are presented as part of the same experience instead of disconnected follow-up tasks.' : locale === 'fr' ? 'Booking, facture, calendrier et support se présentent comme une seule expérience au lieu de tâches dispersées.' : locale === 'de' ? 'Booking, Rechnung, Kalender und Support erscheinen als ein gemeinsames Erlebnis statt als getrennte Folgeaufgaben.' : 'Booking, factura, calendario y soporte se presentan como parte de la misma experiencia y no como tareas dispersas.',
                },
                {
                  eyebrow: '03',
                  title: locale === 'en' ? 'Human back-up' : locale === 'fr' ? 'Soutien humain' : locale === 'de' ? 'Menschliches Backup' : 'Respaldo humano',
                  body: locale === 'en' ? 'If the traveler still hesitates, the next lane is human support with context — not abandonment.' : locale === 'fr' ? 'Si le voyageur hésite encore, l’étape suivante est un support humain avec contexte — pas l’abandon.' : locale === 'de' ? 'Wenn der Reisende noch zögert, ist der nächste Schritt menschlicher Support mit Kontext – nicht Abbruch.' : 'Si el viajero todavía duda, la siguiente ruta es soporte humano con contexto, no abandono.',
                },
              ]}
            />

            {relatedTours.length > 0 ? (
              <section className="mt-10">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-2xl text-brand-blue">{copy.relatedTitle}</h2>
                    <p className="mt-1 text-sm text-[color:var(--color-text)]/75">{copy.relatedCopy}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {relatedTours.map((t) => (
                    <TourCard key={t.slug} tour={t} href={withLocale(locale, `/tours/${t.slug}`)} />
                  ))}
                </div>
              </section>
            ) : null}

          </section>

          <aside className="hidden xl:col-span-4 xl:block">
            <div className="sticky top-24 space-y-6">
              <div className="overflow-hidden rounded-[28px] border border-brand-blue/12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-soft">
                <div className="border-b border-white/10 p-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{copy.sidebarTitle}</div>
                  <div className="mt-3 font-heading text-3xl text-white">{priceLabel}</div>
                  <div className="mt-1 text-sm text-white/60">{copy.priceFrom} · {locationLabel}</div>
                </div>
                <div className="space-y-3 p-6 text-sm">
                  <div className="flex items-center justify-between gap-3 text-white/72"><span>{copy.durationLabel}</span><span className="font-medium text-white">{duration ? hoursLabel(duration) : '—'}</span></div>
                  <div className="flex items-center justify-between gap-3 text-white/72"><span>{copy.cityLabel}</span><span className="font-medium text-white">{locationLabel}</span></div>
                  {rating != null ? <div className="flex items-center justify-between gap-3 text-white/72"><span>{copy.ratingLabel}</span><span className="font-medium text-white">{rating.toFixed(1)} / 5</span></div> : null}
                </div>
                <div className="border-t border-white/10 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-white/70">Guardar para después</span>
                    <WishlistButton tourId={tour.id} tourSlug={tour.slug} />
                  </div>
                </div>
              </div>

              <div id="booking-widget-desktop" className="hidden xl:block xl:scroll-mt-24">
                <BookingWidget slug={tour.slug} title={tour.title} short={summary} price={priceMinor} />
              </div>

              <TrustBar compact />

              <div className="card p-6">
                <h3 className="font-heading text-base text-brand-blue">{copy.planTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/75">{copy.planCopy}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a className="inline-flex items-center justify-center rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-95" href={withLocale(locale, '/plan')}>
                    {copy.planCta} →
                  </a>
                  <a className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text)] transition hover:border-brand-blue/25 hover:text-brand-blue" href={withLocale(locale, '/tours')}>
                    {copy.breadcrumbTours}
                  </a>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-heading text-base text-brand-blue">{copy.contactTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/75">{copy.contactCopy}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {whatsAppHref ? (
                    <a target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue/8" href={whatsAppHref}>
                      {copy.askWhatsapp}
                    </a>
                  ) : null}
                  <a className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text)] transition hover:border-brand-blue/25 hover:text-brand-blue" href={contactHref}>
                    {copy.contactCta}
                  </a>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-heading text-base text-brand-blue">{copy.supportTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/75">{copy.supportCopy}</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

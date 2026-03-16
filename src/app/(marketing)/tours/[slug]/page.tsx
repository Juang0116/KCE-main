import { cookies } from 'next/headers';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { buildContextHref, type MarketingLocale } from '@/features/marketing/contactContext';
import { ReviewForm } from '@/features/reviews/ReviewForm';
import { ReviewsList } from '@/features/reviews/ReviewsList';
import { getTourBySlug, listTours } from '@/features/tours/catalog.server';
import { toTourLike } from '@/features/tours/adapters';
import BookingWidget from '@/features/tours/components/BookingWidget';
import { TrustBar } from '@/features/tours/components/TrustBar';
import MobileStickyBookingCta from '@/features/tours/components/MobileStickyBookingCta';
import { TourViewTracker } from '@/features/tours/components/TourViewTracker';
import WishlistButton from '@/features/wishlist/WishlistButton';
import { formatMinorUnits, hoursLabel } from '@/utils/format';
import { MarketingMarkdown } from '@/components/MarketingMarkdown';

import type { Metadata } from 'next';

export const revalidate = 300;

type Locale = 'es' | 'en' | 'fr' | 'de';
type ImageLike = string | { url?: string; alt?: string } | null | undefined;

type TourLike = {
  id: string; slug: string; title: string; city?: string | null; summary?: string | null; short?: string | null; body_md?: string | null;
  base_price?: number | null; price?: number | null; duration_hours?: number | null; durationHours?: number | null;
  image?: string | null; images?: ImageLike[] | null; tags?: unknown; rating?: number | null; source?: string | null;
};

// Diccionario Base para Copys Fijos
type DetailCopy = {
  breadcrumbHome: string; breadcrumbTours: string; eyebrow: string; reserveNow: string; askWhatsapp: string;
  quickNav: { details: string; includes: string; itinerary: string; faq: string; reviews: string };
  cityLabel: string; fromLabel: string; durationLabel: string; ratingLabel: string; sourceLabel: string;
  snapshotTitle: string; snapshotCopy: string; idealForTitle: string; idealForCopy: string; confidenceTitle: string; confidenceCopy: string;
  includesTitle: string; excludesTitle: string; itineraryTitle: string; itineraryCopy: string; policyTitle: string; policyCopy: string;
  faqTitle: string; reviewsTitle: string; relatedTitle: string; relatedCopy: string; sidebarTitle: string; priceFrom: string;
  planTitle: string; planCopy: string; planCta: string; contactTitle: string; contactCopy: string; contactCta: string; supportTitle: string; supportCopy: string;
  checklistTitle: string; checklist: string[]; stages: Array<{ step: string; title: string; body: string }>; faqs: Array<{ q: string; a: string }>;
};

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

function getCopy(locale: Locale): DetailCopy {
  switch (locale) {
    case 'en': return { breadcrumbHome: 'Home', breadcrumbTours: 'Tours', eyebrow: 'Premium KCE experience', reserveNow: 'Reserve now', askWhatsapp: 'Ask on WhatsApp', quickNav: { details: 'Details', includes: 'Includes', itinerary: 'Itinerary', faq: 'FAQ', reviews: 'Reviews' }, cityLabel: 'City', fromLabel: 'From', durationLabel: 'Duration', ratingLabel: 'Rating', sourceLabel: 'Source', snapshotTitle: 'Experience snapshot', snapshotCopy: 'A quick, honest read on what this experience feels like before you move into booking.', idealForTitle: 'Best for', idealForCopy: 'Use this section to understand whether the experience matches your pace, interests and travel style.', confidenceTitle: 'Booking confidence', confidenceCopy: 'Secure payment, real support and a clear booking flow help the decision feel calmer and safer.', includesTitle: 'What is included', excludesTitle: 'What is not included', itineraryTitle: 'Indicative journey', itineraryCopy: 'A cleaner structure to help the traveler imagine the flow before booking.', policyTitle: 'Meeting point & policies', policyCopy: 'We confirm logistics before the experience and help with adjustments when needed.', faqTitle: 'Frequently asked questions', reviewsTitle: 'Reviews & social proof', relatedTitle: 'Continue your shortlist', relatedCopy: 'Complement this tour with nearby or similar experiences.', sidebarTitle: 'Trip summary', priceFrom: 'Price from', planTitle: 'Need a more guided recommendation?', planCopy: 'Use the personalized plan to narrow your shortlist by style, city and budget.', planCta: 'Open personalized plan', contactTitle: 'Prefer human support?', contactCopy: 'We can help you compare tours, check fit and suggest the best next step before checkout.', contactCta: 'Talk to KCE', supportTitle: 'Reserve with more clarity', supportCopy: 'This page brings together key details, booking steps and support options so you can decide without jumping across multiple screens.', checklistTitle: 'Before you book', checklist: ['Comfortable shoes and weather-appropriate layers', 'Tell us in advance about restrictions or accessibility needs', 'You receive booking, invoice and follow-up support after payment'], stages: [{ step: '01', title: 'Meet & align', body: 'Quick context, meeting point confirmation and route overview.' }, { step: '02', title: 'Live the core experience', body: 'Main stops, local interpretation and curated moments.' }, { step: '03', title: 'Wrap with next steps', body: 'Final recommendations, optional add-ons and local tips.' }], faqs: [{ q: 'What should I bring?', a: 'Comfortable shoes, water, sunscreen and a light layer are usually enough.' }, { q: 'Is it family friendly?', a: 'Usually yes, but we confirm the fit according to pace, route and child age.' }, { q: 'What happens after payment?', a: 'You receive booking confirmation, invoice and direct contact for coordination.' }, { q: 'Can I change the date?', a: 'That depends on the tour and timing. Our team can guide you before or after payment.' }] };
    default: return { breadcrumbHome: 'Inicio', breadcrumbTours: 'Tours', eyebrow: 'Experiencia KCE', reserveNow: 'Reservar ahora', askWhatsapp: 'Hablar por WhatsApp', quickNav: { details: 'Detalles', includes: 'Incluye', itinerary: 'Itinerario', faq: 'FAQ', reviews: 'Reseñas' }, cityLabel: 'Ciudad', fromLabel: 'Desde', durationLabel: 'Duración', ratingLabel: 'Calificación', sourceLabel: 'Fuente', snapshotTitle: 'Resumen de experiencia', snapshotCopy: 'Una lectura rápida y honesta de cómo se siente esta experiencia antes de reservar.', idealForTitle: 'Ideal para', idealForCopy: 'Aquí puedes entender si la experiencia encaja con tu ritmo, intereses y forma de viajar.', confidenceTitle: 'Reserva con más claridad', confidenceCopy: 'Pago seguro, apoyo real y un proceso claro ayudan a decidir con más calma y confianza.', includesTitle: 'Qué incluye', excludesTitle: 'Qué no incluye', itineraryTitle: 'Ruta estimada', itineraryCopy: 'Una estructura más limpia para que el viajero visualice el recorrido antes de pagar.', policyTitle: 'Punto de encuentro y políticas', policyCopy: 'Confirmamos logística antes de la experiencia y ayudamos a ajustar cuando hace falta.', faqTitle: 'Preguntas frecuentes', reviewsTitle: 'Reseñas y prueba social', relatedTitle: 'Sigue armando tu shortlist', relatedCopy: 'Si esta experiencia te encaja, aquí tienes opciones cercanas o de estilo parecido para seguir armando tu viaje.', sidebarTitle: 'Resumen del viaje', priceFrom: 'Precio desde', planTitle: '¿Quieres una recomendación más guiada?', planCopy: 'Usa el plan personalizado para aterrizar tu shortlist por estilo, ciudad y presupuesto.', planCta: 'Abrir plan personalizado', contactTitle: '¿Prefieres apoyo humano?', contactCopy: 'Si aún comparas rutas, fechas o logística, KCE puede ayudarte a decidir con más contexto antes del checkout.', contactCta: 'Hablar con KCE', supportTitle: 'Reserva con más claridad', supportCopy: 'Aquí reunimos lo esencial de la experiencia, el proceso de reserva y las vías de ayuda para que puedas decidir sin saltar entre muchas pantallas.', checklistTitle: 'Antes de reservar', checklist: ['Zapatos cómodos y ropa adecuada para el clima', 'Avísanos si tienes restricciones, necesidades de accesibilidad o cambios de ritmo', 'Después del pago recibes booking, invoice y seguimiento para coordinar'], stages: [{ step: '01', title: 'Encuentro y contexto', body: 'Confirmamos punto, ritmo y enfoque de la experiencia.' }, { step: '02', title: 'Vive la experiencia central', body: 'Paradas principales, interpretación local y momentos curados.' }, { step: '03', title: 'Cierre con próximos pasos', body: 'Recomendaciones, extras opcionales y tips locales para seguir el viaje.' }], faqs: [{ q: '¿Qué debo llevar?', a: 'Zapatos cómodos, hidratación, bloqueador y una capa ligera suelen ser suficientes.' }, { q: '¿Es apto para familias?', a: 'Normalmente sí, pero confirmamos el encaje según ritmo, ruta y edad de los niños.' }, { q: '¿Qué pasa después del pago?', a: 'Recibes confirmación, booking, invoice y contacto directo para coordinar detalles.' }, { q: '¿Puedo cambiar la fecha?', a: 'Depende del tour y la anticipación. Nuestro equipo puede orientarte antes o después del pago.' }] };
  }
}

function isRecord(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null; }
function absoluteUrl(input?: string) { const s = (input || '').trim(); if (!s) return ''; if (s.startsWith('http')) return s; return `${BASE_SITE_URL}${s.startsWith('/') ? s : '/' + s}`; }
function withLocale(locale: Locale, href: string) { if (!href.startsWith('/')) return href; if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href; return href === '/' ? `/${locale}` : `/${locale}${href}`; }
async function resolveLocale(): Promise<Locale> { const c = await cookies(); const v = c.get('kce.locale')?.value?.toLowerCase(); return v === 'en' || v === 'fr' || v === 'de' ? v : 'es'; }
function safeJsonLd(data: unknown) { return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026'); }

function pickImage(tour: TourLike) {
  const alt = tour.title || 'Tour';
  const imgs = tour.images;
  if (Array.isArray(imgs) && imgs.length > 0) {
    const f = imgs[0];
    if (typeof f === 'string' && f.trim()) return { src: f.trim(), alt };
    if (isRecord(f) && typeof f.url === 'string' && f.url.trim()) return { src: f.url, alt: typeof f.alt === 'string' ? f.alt : alt };
  }
  if (typeof tour.image === 'string' && tour.image.trim()) return { src: tour.image.trim(), alt };
  return { src: '/images/hero-kce.jpg', alt };
}

function getPriceMinor(tour: TourLike) {
  const v = typeof tour.base_price === 'number' ? tour.base_price : typeof tour.price === 'number' ? tour.price : 0;
  const n = Number(v);
  return !Number.isFinite(n) || n < 0 ? 0 : Math.round(n);
}

function getDurationHours(tour: TourLike) {
  const v = typeof tour.duration_hours === 'number' ? tour.duration_hours : typeof tour.durationHours === 'number' ? tour.durationHours : null;
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getSummary(tour: TourLike) { return String(tour.summary || tour.short || '').trim(); }
function getTags(tour: TourLike) {
  const t = tour.tags;
  if (Array.isArray(t)) return t.map(String).map(x => x.trim()).filter(Boolean).slice(0, 10);
  if (typeof t === 'string') return t.split(',').map(x => x.trim()).filter(Boolean).slice(0, 10);
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const locale = await resolveLocale();
  const copy = getCopy(locale);
  const awaitedParams = await params;
  const tour = (await getTourBySlug(awaitedParams.slug)) as TourLike | null;
  if (!tour) return { metadataBase: new URL(BASE_SITE_URL), title: 'Tour — KCE', robots: { index: false, follow: false } };
  
  const priceMinor = getPriceMinor(tour);
  const summary = getSummary(tour);
  const canonicalUrl = absoluteUrl(`/${locale}/tours/${encodeURIComponent(tour.slug)}`);
  const ogImageUrl = absoluteUrl(`/tours/${encodeURIComponent(tour.slug)}/opengraph-image`);

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: `${tour.title} — KCE`,
    description: summary || `${tour.title} • ${copy.priceFrom} ${formatMinorUnits(priceMinor, 'EUR', 'es-ES')}`,
    alternates: { canonical: canonicalUrl },
    openGraph: { title: `${tour.title} — KCE`, description: summary || undefined, url: canonicalUrl, images: [{ url: ogImageUrl, width: 1200, height: 630, alt: tour.title }], type: 'website' },
    twitter: { card: 'summary_large_image', images: [ogImageUrl] },
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
  const rating = typeof tour.rating === 'number' && Number.isFinite(tour.rating) ? Math.max(0, Math.min(5, tour.rating)) : null;

  const canonical = absoluteUrl(`/${locale}/tours/${encodeURIComponent(tour.slug)}`);
  const imgAbs = absoluteUrl(img.src);
  const priceMajor = priceMinor > 0 ? priceMinor / 100 : 0;
  const priceLabel = formatMinorUnits(priceMinor, 'EUR', 'es-ES');
  const locationLabel = tour.city || 'Colombia';
  const contactHref = buildContextHref(locale as MarketingLocale, '/contact', { source: 'tour-detail', topic: 'tour', city: tour.city ?? undefined, tour: tour.title, slug: tour.slug });

  const whatsAppHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: [process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE || 'Hola KCE, quiero información sobre este tour.', '', `${tour.title}`, `${copy.cityLabel}: ${locationLabel}`, `${copy.priceFrom}: ${priceLabel}`].join('\n'),
    url: withLocale(locale, `/tours/${tour.slug}`),
  });

  const jsonLdTour = { '@context': 'https://schema.org', '@type': 'TouristTrip', name: tour.title, description: summary || undefined, image: imgAbs, url: canonical, itinerary: tour.city ? `${tour.city}, Colombia` : 'Colombia', offers: { '@type': 'Offer', priceCurrency: 'EUR', price: priceMajor > 0 ? priceMajor.toFixed(2) : undefined, url: canonical, availability: 'https://schema.org/InStock' }, ...(rating != null ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: rating.toFixed(1), bestRating: '5', worstRating: '1' } } : {}), inLanguage: locale };
  const jsonLdBreadcrumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: copy.breadcrumbHome, item: absoluteUrl(`/${locale}`) }, { '@type': 'ListItem', position: 2, name: copy.breadcrumbTours, item: absoluteUrl(`/${locale}/tours`) }, { '@type': 'ListItem', position: 3, name: tour.title, item: canonical }] };

  // ESTA CLASE ES LA MAGIA: Define cómo se ven las cajas de contenido
  const elegantCard = "rounded-[2.5rem] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-12 shadow-sm";

  return (
    <>
      <TourViewTracker slug={tour.slug} />
      
      {/* WIDGET MÓVIL PEGADO ABAJO */}
      <MobileStickyBookingCta
        targetId="booking-widget-desktop"
        title={tour.title}
        priceMinor={priceMinor}
        planHref={withLocale(locale, '/plan')}
        helpHref={whatsAppHref || contactHref}
        helpLabel={whatsAppHref ? copy.askWhatsapp : copy.contactCta}
        helpExternal={Boolean(whatsAppHref)}
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdTour) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdBreadcrumbs) }} />

      <main className="mx-auto max-w-[1240px] px-4 py-8 pb-32 md:py-12">
        <div className="grid min-w-0 gap-10 xl:grid-cols-12">
          
          {/* COLUMNA IZQUIERDA (CONTENIDO) */}
          <section className="min-w-0 space-y-10 xl:col-span-8">
            
            {/* Breadcrumbs */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40">
              <Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/')}>{copy.breadcrumbHome}</Link>
              <span>/</span>
              <Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/tours')}>{copy.breadcrumbTours}</Link>
              <span>/</span>
              <span className="text-brand-blue">{tour.title}</span>
            </div>

            {/* HERO DEL TOUR */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-brand-dark shadow-2xl">
              <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] md:aspect-[21/9]">
                <Image src={img.src} alt={img.alt} fill sizes="(max-width: 1280px) 100vw, 66vw" className="object-cover opacity-80" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-8 md:p-12">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="max-w-2xl">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow">
                          {copy.eyebrow}
                        </span>
                      </div>
                      <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl leading-tight text-white drop-shadow-md">
                        {tour.title}
                      </h1>
                    </div>

                    {/* Resumen de Precio en móvil (En desktop va a la derecha) */}
                    <div className="xl:hidden shrink-0 rounded-[2rem] border border-white/20 bg-white/10 backdrop-blur-lg p-6 text-white shadow-xl">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">{copy.priceFrom}</div>
                      <div className="mt-1 font-heading text-4xl">{priceLabel}</div>
                      <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/90">
                        <span>{locationLabel}</span>
                        {duration && <span>{hoursLabel(duration)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Navegación Interna */}
            <div className="flex flex-wrap gap-2 sticky top-[var(--header-h)] z-20 bg-[var(--color-bg)]/90 backdrop-blur-md py-4">
              {[
                { id: 'details', label: copy.quickNav.details },
                { id: 'includes', label: copy.quickNav.includes },
                { id: 'itinerary', label: copy.quickNav.itinerary },
                { id: 'faq', label: copy.quickNav.faq },
                { id: 'reviews', label: copy.quickNav.reviews }
              ].map(n => (
                <a key={n.id} href={`#${n.id}`} className="rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/70 transition hover:border-brand-blue hover:text-brand-blue shadow-sm">
                  {n.label}
                </a>
              ))}
            </div>

            {/* MÓVIL: Booking Widget */}
            <div className="xl:hidden">
              <div id="booking-widget-mobile" className="scroll-mt-24 rounded-[2.5rem] bg-white p-6 shadow-xl border border-brand-blue/10">
                <BookingWidget slug={tour.slug} title={tour.title} short={summary} price={priceMinor} />
                <div className="mt-6 pt-6 border-t border-[var(--color-border)] flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text)]/40">Guardar Tour</span>
                  <WishlistButton tourId={tour.id} tourSlug={tour.slug} />
                </div>
              </div>
              <div className="mt-6">
                <TrustBar compact />
              </div>
            </div>

            {/* GRILLA DE INFO RÁPIDA */}
            <section className="grid gap-6 sm:grid-cols-2" id="details">
              <div className={elegantCard}>
                <div className="text-[10px] font-bold uppercase tracking-widest text-brand-blue mb-4">{copy.snapshotTitle}</div>
                <h2 className="font-heading text-3xl text-[var(--color-text)] leading-tight">{tour.title}</h2>
                <p className="mt-4 text-[color:var(--color-text)]/70 leading-relaxed font-light">{copy.snapshotCopy}</p>
              </div>

              <div className={elegantCard}>
                <div className="text-[10px] font-bold uppercase tracking-widest text-brand-blue mb-4">{copy.idealForTitle}</div>
                <h2 className="font-heading text-3xl text-[var(--color-text)] leading-tight">{tags.length ? tags.slice(0, 2).join(' & ') : locationLabel}</h2>
                <div className="mt-6 flex flex-wrap gap-2">
                  {(tags.length ? tags : [locationLabel, 'Cultura']).slice(0, 5).map((tag) => (
                    <span key={tag} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-1.5 text-xs font-medium text-[var(--color-text)]/70">{tag}</span>
                  ))}
                </div>
              </div>
            </section>

            {/* DESCRIPCIÓN MD */}
            {tour.body_md && (
              <section className={elegantCard}>
                <MarketingMarkdown content={tour.body_md} className="prose prose-slate max-w-none prose-p:font-light prose-p:leading-relaxed prose-headings:font-heading prose-headings:text-brand-blue prose-strong:text-brand-dark prose-a:text-brand-blue" />
              </section>
            )}

            {/* INCLUYE / NO INCLUYE */}
            <div className="grid gap-6 md:grid-cols-2" id="includes">
              <div className="rounded-[2.5rem] border border-emerald-500/20 bg-emerald-500/5 p-8 md:p-10 shadow-sm">
                <h2 className="font-heading text-2xl text-emerald-800 mb-6">{copy.includesTitle}</h2>
                <ul className="space-y-4 text-[color:var(--color-text)]/80 font-light text-sm">
                  <li className="flex gap-3 items-start"><span className="text-emerald-600 font-bold mt-0.5">✓</span> <span>Guía o acompañamiento oficial KCE</span></li>
                  <li className="flex gap-3 items-start"><span className="text-emerald-600 font-bold mt-0.5">✓</span> <span>Soporte logístico por WhatsApp</span></li>
                  <li className="flex gap-3 items-start"><span className="text-emerald-600 font-bold mt-0.5">✓</span> <span>Experiencia 100% curada y segura</span></li>
                </ul>
              </div>

              <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-8 md:p-10 shadow-sm">
                <h2 className="font-heading text-2xl text-[var(--color-text)]/60 mb-6">{copy.excludesTitle}</h2>
                <ul className="space-y-4 text-[color:var(--color-text)]/60 font-light text-sm">
                  <li className="flex gap-3 items-start"><span className="text-[var(--color-text)]/30 font-bold mt-0.5">×</span> <span>Transporte intermunicipal (salvo especificado)</span></li>
                  <li className="flex gap-3 items-start"><span className="text-[var(--color-text)]/30 font-bold mt-0.5">×</span> <span>Gastos personales o propinas</span></li>
                </ul>
              </div>
            </div>

            {/* ITINERARIO */}
            <div className={elegantCard} id="itinerary">
              <h2 className="font-heading text-3xl text-brand-blue mb-3">{copy.itineraryTitle}</h2>
              <p className="text-[color:var(--color-text)]/70 font-light mb-8">{copy.itineraryCopy}</p>
              
              <div className="space-y-8 pl-4 border-l-2 border-brand-blue/10 ml-2">
                {copy.stages.map((stage) => (
                  <div key={stage.step} className="relative pl-8">
                    <div className="absolute -left-11 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue text-white shadow-md font-bold text-xs">
                      {stage.step}
                    </div>
                    <h3 className="font-heading text-xl text-[color:var(--color-text)] mb-2">{stage.title}</h3>
                    <p className="text-sm text-[color:var(--color-text)]/70 font-light leading-relaxed">{stage.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* REVIEWS */}
            <section className={elegantCard} id="reviews">
              <h2 className="font-heading text-3xl text-brand-blue mb-8">{copy.reviewsTitle}</h2>
              <div className="grid gap-12 lg:grid-cols-2">
                <ReviewsList tourSlug={tour.slug} limit={10} />
                <ReviewForm tourSlug={tour.slug} />
              </div>
            </section>

          </section>

          {/* COLUMNA DERECHA: SIDEBAR DE DESKTOP (Limpio y corporativo) */}
          <aside className="hidden xl:col-span-4 xl:block">
            <div className="sticky top-24 space-y-6">
              
              {/* Tarjeta Principal de Pago */}
              <div className="overflow-hidden rounded-[2.5rem] bg-white border border-brand-blue/10 shadow-2xl">
                <div className="p-8 bg-brand-dark border-b border-brand-blue/10 text-white">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-brand-yellow mb-2">{copy.sidebarTitle}</div>
                  <div className="font-heading text-5xl">{priceLabel}</div>
                  <div className="mt-3 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/70 border-t border-white/10 pt-3">
                    <span>{copy.priceFrom}</span>
                    <span>{locationLabel}</span>
                  </div>
                </div>
                
                <div className="p-8">
                  <div id="booking-widget-desktop" className="scroll-mt-24">
                    <BookingWidget slug={tour.slug} title={tour.title} short={summary} price={priceMinor} />
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-text)]/50">Guardar tour</span>
                    <WishlistButton tourId={tour.id} tourSlug={tour.slug} />
                  </div>
                </div>
              </div>

              <TrustBar compact />

              {/* Módulo de Apoyo KCE */}
              <div className="rounded-[2.5rem] bg-brand-blue/5 border border-brand-blue/10 p-8 text-center">
                <h3 className="font-heading text-2xl text-brand-blue mb-3">{copy.contactTitle}</h3>
                <p className="text-sm text-[color:var(--color-text)]/70 font-light leading-relaxed mb-8">{copy.contactCopy}</p>
                <div className="flex flex-col gap-3">
                  <Link href={withLocale(locale, '/plan')} className="w-full flex items-center justify-center rounded-full bg-brand-blue px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 shadow-md">
                    {copy.planCta}
                  </Link>
                  {whatsAppHref && (
                    <a href={whatsAppHref} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center rounded-full border border-brand-blue/20 bg-white px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-blue transition hover:bg-brand-blue/5 shadow-sm">
                      {copy.askWhatsapp}
                    </a>
                  )}
                </div>
              </div>

            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
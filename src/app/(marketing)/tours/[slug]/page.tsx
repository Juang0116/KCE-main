import { cookies } from 'next/headers';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, Clock, Star, CheckCircle2, XCircle, 
  ShieldCheck, MessageCircle, Sparkles, Compass, 
  ArrowRight, Heart, Share2, Info 
} from 'lucide-react';

import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { buildContextHref, type MarketingLocale } from '@/features/marketing/contactContext';
import { ReviewForm } from '@/features/reviews/ReviewForm';
import { ReviewsList } from '@/features/reviews/ReviewsList';
import { getTourBySlug } from '@/features/tours/catalog.server';
import BookingWidget from '@/features/tours/components/BookingWidget';
import { TrustBar } from '@/features/tours/components/TrustBar';
import MobileStickyBookingCta from '@/features/tours/components/MobileStickyBookingCta';
import { TourViewTracker } from '@/features/tours/components/TourViewTracker';
import WishlistButton from '@/features/wishlist/WishlistButton';
import { formatMinorUnits, hoursLabel } from '@/utils/format';
import { MarketingMarkdown } from '@/components/MarketingMarkdown';
import { Button } from '@/components/ui/Button';

import type { Metadata } from 'next';

export const revalidate = 300;

type Locale = 'es' | 'en' | 'fr' | 'de';
type ImageLike = string | { url?: string; alt?: string } | null | undefined;

type TourLike = {
  id: string; slug: string; title: string; city?: string | null; summary?: string | null; short?: string | null; body_md?: string | null;
  base_price?: number | null; price?: number | null; duration_hours?: number | null; durationHours?: number | null;
  image?: string | null; images?: ImageLike[] | null; tags?: unknown; rating?: number | null; source?: string | null;
};

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

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

function getCopy(locale: Locale): DetailCopy {
  switch (locale) {
    case 'en': return { breadcrumbHome: 'Home', breadcrumbTours: 'Tours', eyebrow: 'Premium KCE experience', reserveNow: 'Reserve now', askWhatsapp: 'Ask on WhatsApp', quickNav: { details: 'Details', includes: 'Includes', itinerary: 'Itinerary', faq: 'FAQ', reviews: 'Reviews' }, cityLabel: 'City', fromLabel: 'From', durationLabel: 'Duration', ratingLabel: 'Rating', sourceLabel: 'Source', snapshotTitle: 'Experience snapshot', snapshotCopy: 'A quick, honest read on what this experience feels like before you move into booking.', idealForTitle: 'Best for', idealForCopy: 'Use this section to understand whether the experience matches your pace, interests and travel style.', confidenceTitle: 'Booking confidence', confidenceCopy: 'Secure payment, real support and a clear booking flow help the decision feel calmer and safer.', includesTitle: 'What is included', excludesTitle: 'What is not included', itineraryTitle: 'Indicative journey', itineraryCopy: 'A cleaner structure to help the traveler imagine the flow before booking.', policyTitle: 'Meeting point & policies', policyCopy: 'We confirm logistics before the experience and help with adjustments when needed.', faqTitle: 'Frequently asked questions', reviewsTitle: 'Reviews & social proof', relatedTitle: 'Continue your shortlist', relatedCopy: 'Complement this tour with nearby or similar experiences.', sidebarTitle: 'Trip summary', priceFrom: 'Price from', planTitle: 'Need a more guided recommendation?', planCopy: 'Use the personalized plan to narrow your shortlist by style, city and budget.', planCta: 'Open personalized plan', contactTitle: 'Prefer human support?', contactCopy: 'We can help you compare tours, check fit and suggest the best next step before checkout.', contactCta: 'Talk to KCE', supportTitle: 'Reserve with more clarity', supportCopy: 'This page brings together key details, booking steps and support options so you can decide without jumping across multiple screens.', checklistTitle: 'Before you book', checklist: ['Comfortable shoes and weather-appropriate layers', 'Tell us in advance about restrictions or accessibility needs', 'You receive booking, invoice and follow-up support after payment'], stages: [{ step: '01', title: 'Meet & align', body: 'Quick context, meeting point confirmation and route overview.' }, { step: '02', title: 'Live the core experience', body: 'Main stops, local interpretation and curated moments.' }, { step: '03', title: 'Wrap with next steps', body: 'Final recommendations, optional add-ons and local tips.' }], faqs: [{ q: 'What should I bring?', a: 'Comfortable shoes, water, sunscreen and a light layer are usually enough.' }, { q: 'Is it family friendly?', a: 'Usually yes, but we confirm the fit according to pace, route and child age.' }, { q: 'What happens after payment?', a: 'You receive booking confirmation, invoice and direct contact for coordination.' }, { q: 'Can I change the date?', a: 'That depends on the tour and timing. Our team can guide you before or after payment.' }] };
    default: return { breadcrumbHome: 'Inicio', breadcrumbTours: 'Tours', eyebrow: 'Experiencia KCE', reserveNow: 'Reservar ahora', askWhatsapp: 'Hablar por WhatsApp', quickNav: { details: 'Detalles', includes: 'Incluye', itinerary: 'Itinerario', faq: 'FAQ', reviews: 'Reseñas' }, cityLabel: 'Ciudad', fromLabel: 'Desde', durationLabel: 'Duración', ratingLabel: 'Calificación', sourceLabel: 'Fuente', snapshotTitle: 'Resumen de experiencia', snapshotCopy: 'Una lectura rápida y honesta de cómo se siente esta experiencia antes de reservar.', idealForTitle: 'Ideal para', idealForCopy: 'Aquí puedes entender si la experiencia encaja con tu ritmo, intereses y forma de viajar.', confidenceTitle: 'Reserva con más claridad', confidenceCopy: 'Pago seguro, apoyo real y un proceso claro ayudan a decidir con más calma y confianza.', includesTitle: 'Qué incluye', excludesTitle: 'Qué no incluye', itineraryTitle: 'Ruta estimada', itineraryCopy: 'Una estructura más limpia para que el viajero visualice el recorrido antes de pagar.', policyTitle: 'Punto de encuentro y políticas', policyCopy: 'Confirmamos logística antes de la experiencia y ayudamos a ajustar cuando hace falta.', faqTitle: 'Preguntas frecuentes', reviewsTitle: 'Reseñas y prueba social', relatedTitle: 'Sigue armando tu shortlist', relatedCopy: 'Si esta experiencia te encaja, aquí tienes opciones cercanas o de estilo parecido para seguir armando tu viaje.', sidebarTitle: 'Resumen del viaje', priceFrom: 'Precio desde', planTitle: '¿Quieres una recomendación más guiada?', planCopy: 'Usa el plan personalizado para aterrizar tu shortlist por estilo, ciudad y presupuesto.', planCta: 'Abrir plan personalizado', contactTitle: '¿Prefieres apoyo humano?', contactCopy: 'Si aún comparas rutas, fechas o logística, KCE puede ayudarte a decidir con más contexto antes del checkout.', contactCta: 'Hablar con KCE', supportTitle: 'Reserva con más claridad', supportCopy: 'Aquí reunimos lo esencial de la experiencia, el proceso de reserva y las vías de ayuda para que puedas decidir sin saltar entre muchas pantallas.', checklistTitle: 'Antes de reservar', checklist: ['Zapatos cómodos y ropa adecuada para el clima', 'Avísanos si tienes restricciones, necesidades de accesibilidad o cambios de ritmo', 'Después del pago recibes booking, invoice y seguimiento para coordinar'], stages: [{ step: '01', title: 'Encuentro y contexto', body: 'Confirmamos punto, ritmo y enfoque de la experiencia.' }, { step: '02', title: 'Vive la experiencia central', body: 'Paradas principales, interpretación local y momentos curados.' }, { step: '03', title: 'Cierre con próximos pasos', body: 'Recomendaciones, extras opcionales y tips locales para seguir el viaje.' }], faqs: [{ q: '¿Qué debo llevar?', a: 'Zapatos cómodos, hidratación, bloqueador y una capa ligera suelen ser suficientes.' }, { q: '¿Es apto para familias?', a: 'Normalmente sí, pero confirmamos el encaje según ritmo, ruta y edad de los niños.' }, { q: '¿Qué pasa después del pago?', a: 'Recibes confirmación, booking, invoice y contacto directo para coordinar detalles.' }, { q: '¿Puedo cambiar la fecha?', a: 'Depende del tour y la anticipación. Nuestro equipo puede orientarte antes o después del pago.' }] };
  }
}

function isRecord(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null; }
function absoluteUrl(input?: string) { const s = (input || '').trim(); if (!s) return ''; if (s.startsWith('http')) return s; return `${BASE_SITE_URL}${s.startsWith('/') ? s : '/' + s}`; }
function withLocale(locale: Locale, href: string) { if (!href.startsWith('/')) return href; if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href; return href === '/' ? `/${locale}` : `/${locale}${href}`; }
async function resolveLocale(): Promise<Locale> { const c = await cookies(); const v = c.get('kce.locale')?.value?.toLowerCase(); return (v === 'en' || v === 'fr' || v === 'de') ? v as Locale : 'es'; }
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
  const priceLabel = formatMinorUnits(priceMinor, 'EUR', locale === 'es' ? 'es-ES' : 'en-US');
  const locationLabel = tour.city || 'Colombia';
  const contactHref = buildContextHref(locale as MarketingLocale, '/contact', { source: 'tour-detail', topic: 'tour', city: tour.city ?? undefined, tour: tour.title, slug: tour.slug });

  const whatsAppHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: [process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE || 'Hola KCE, quiero información sobre este tour.', '', `${tour.title}`, `${copy.cityLabel}: ${locationLabel}`, `${copy.priceFrom}: ${priceLabel}`].join('\n'),
    url: withLocale(locale, `/tours/${tour.slug}`),
  });

  const jsonLdTour = { '@context': 'https://schema.org', '@type': 'TouristTrip', name: tour.title, description: summary || undefined, image: imgAbs, url: canonical, itinerary: tour.city ? `${tour.city}, Colombia` : 'Colombia', offers: { '@type': 'Offer', priceCurrency: 'EUR', price: priceMajor > 0 ? priceMajor.toFixed(2) : undefined, url: canonical, availability: 'https://schema.org/InStock' }, ...(rating != null ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: rating.toFixed(1), bestRating: '5', worstRating: '1' } } : {}), inLanguage: locale };
  const jsonLdBreadcrumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: copy.breadcrumbHome, item: absoluteUrl(`/${locale}`) }, { '@type': 'ListItem', position: 2, name: copy.breadcrumbTours, item: absoluteUrl(`/${locale}/tours`) }, { '@type': 'ListItem', position: 3, name: tour.title, item: canonical }] };

  const elegantCard = "rounded-[2.5rem] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-12 shadow-sm";

  return (
    <>
      <TourViewTracker slug={tour.slug} />
      
      {/* CORRECCIÓN 1: whatsAppHref || contactHref asegura que sea string y no null */}
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

      <main className="mx-auto max-w-7xl px-6 py-12 pb-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
          
          {/* COLUMNA IZQUIERDA */}
          <section className="space-y-12">
            
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40">
              <Link href={withLocale(locale, '/')} className="hover:text-brand-blue">{copy.breadcrumbHome}</Link>
              <ArrowRight className="h-3 w-3" />
              <Link href={withLocale(locale, '/tours')} className="hover:text-brand-blue">{copy.breadcrumbTours}</Link>
              <ArrowRight className="h-3 w-3" />
              <span className="text-brand-blue">{tour.title}</span>
            </nav>

            {/* HERO DEL TOUR */}
            <section className="relative overflow-hidden rounded-[3.5rem] bg-brand-dark shadow-2xl group">
              <div className="relative aspect-[16/10] md:aspect-[21/9]">
                <Image src={img.src} alt={img.alt} fill priority className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent" />
                <div className="absolute top-8 left-8">
                  <div className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow">
                    <Sparkles className="mr-2 inline h-3 w-3" /> {copy.eyebrow}
                  </div>
                </div>
                <div className="absolute bottom-10 left-10 right-10">
                  <h1 className="font-heading text-4xl md:text-6xl text-white leading-[1.1] drop-shadow-xl">{tour.title}</h1>
                </div>
              </div>
            </section>

            {/* QUICK NAV */}
            <nav className="flex flex-wrap gap-3 sticky top-24 z-30 py-4 bg-[var(--color-bg)]/80 backdrop-blur-md">
              {['details', 'includes', 'itinerary', 'reviews'].map((id) => (
                <a key={id} href={`#${id}`} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/50 transition-all hover:border-brand-blue hover:text-brand-blue shadow-sm">
                  {id}
                </a>
              ))}
            </nav>

            {/* INFO BLOCKS */}
            <div id="details" className="grid gap-6 md:grid-cols-2">
              <div className={elegantCard}>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-2xl text-brand-blue mb-4">{copy.cityLabel}</h3>
                <p className="text-lg font-light text-[var(--color-text)]/70">{locationLabel}</p>
                {duration && <p className="mt-2 text-sm font-bold text-brand-blue/40 uppercase tracking-widest">{hoursLabel(duration)}</p>}
              </div>

              <div className={elegantCard}>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
                  <Star className="h-6 w-6 text-brand-yellow" />
                </div>
                <h3 className="font-heading text-2xl text-brand-blue mb-4">{copy.idealForTitle}</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 4).map((t: string) => (
                    <span key={t} className="rounded-full bg-[var(--color-surface-2)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 border border-[var(--color-border)]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* DESCRIPCIÓN MD */}
            {tour.body_md && (
              <section className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 md:p-16 shadow-inner overflow-hidden relative">
                <MarketingMarkdown content={tour.body_md} className="prose prose-lg prose-slate max-w-none font-light leading-relaxed prose-headings:font-heading prose-headings:text-brand-blue prose-strong:font-bold" />
              </section>
            )}

            {/* INCLUDES / EXCLUDES */}
            <div id="includes" className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[2.5rem] border border-emerald-500/20 bg-emerald-500/5 p-10 shadow-sm">
                <h3 className="font-heading text-2xl text-emerald-800 mb-8 flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6" /> {copy.includesTitle}
                </h3>
                <ul className="space-y-4">
                  {copy.checklist.map((item, i) => (
                    <li key={i} className="flex gap-4 text-sm font-light text-emerald-900/70"><span className="font-bold">•</span> {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[2.5rem] border border-red-500/10 bg-red-500/[0.02] p-10 shadow-sm opacity-60">
                <h3 className="font-heading text-2xl text-red-800 mb-8 flex items-center gap-3">
                  <XCircle className="h-6 w-6" /> {copy.excludesTitle}
                </h3>
                <ul className="space-y-4">
                  <li className="flex gap-4 text-sm font-light text-red-900/70"><span className="font-bold">•</span> Gastos personales</li>
                  <li className="flex gap-4 text-sm font-light text-red-900/70"><span className="font-bold">•</span> Propinas</li>
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
                    <div className="absolute -left-11 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue text-white shadow-md font-bold text-xs">{stage.step}</div>
                    <h3 className="font-heading text-xl text-brand-blue mb-2">{stage.title}</h3>
                    <p className="text-sm text-[color:var(--color-text)]/70 font-light leading-relaxed">{stage.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* REVIEWS */}
            <section id="reviews" className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 md:p-16 shadow-xl">
              <h2 className="font-heading text-3xl text-brand-blue mb-12 flex items-center gap-4">
                <Star className="h-8 w-8 fill-brand-yellow text-brand-yellow" /> {copy.reviewsTitle}
              </h2>
              <div className="grid gap-16 lg:grid-cols-2">
                <ReviewsList tourSlug={tour.slug} limit={10} />
                <ReviewForm tourSlug={tour.slug} />
              </div>
            </section>

          </section>

          {/* SIDEBAR (DESKTOP) */}
          <aside className="hidden lg:block">
            <div className="sticky top-32 space-y-8">
              
              <div className="overflow-hidden rounded-[3rem] border border-brand-blue/10 bg-white shadow-2xl">
                <div className="bg-brand-dark p-10 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow mb-2">{copy.sidebarTitle}</p>
                  <div className="font-heading text-5xl">{priceLabel}</div>
                  <p className="mt-4 text-xs font-light text-white/50 border-t border-white/10 pt-4 italic">Impuestos y soporte concierge incluidos.</p>
                </div>
                
                <div className="p-10">
                  <div id="booking-widget-desktop" className="scroll-mt-32">
                    <BookingWidget slug={tour.slug} title={tour.title} price={priceMinor} />
                  </div>
                  
                  <div className="mt-10 flex items-center justify-between border-t border-[var(--color-border)] pt-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">Guardar en favoritos</p>
                    <WishlistButton tourId={tour.id} tourSlug={tour.slug} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <TrustBar compact />
                <div className="rounded-[2.5rem] bg-brand-blue/5 border border-brand-blue/10 p-10 text-center">
                  <MessageCircle className="mx-auto h-8 w-8 text-brand-blue mb-4" />
                  <h4 className="font-heading text-xl text-brand-blue mb-4">{copy.supportTitle}</h4>
                  <Button asChild className="w-full rounded-full shadow-lg">
                    {/* CORRECCIÓN 2: ?? undefined asegura que href no sea null */}
                    <a href={whatsAppHref ?? undefined} target="_blank" rel="noreferrer">
                      {copy.askWhatsapp}
                    </a>
                  </Button>
                </div>
              </div>

            </div>
          </aside>

        </div>
      </main>
    </>
  );
}
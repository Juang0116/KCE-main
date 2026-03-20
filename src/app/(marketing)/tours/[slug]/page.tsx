import { cookies } from 'next/headers';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, Clock, Star, CheckCircle2, XCircle, 
  ShieldCheck, MessageCircle, Sparkles, Compass, 
  ArrowRight, Heart, Share2, Info, Map 
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
    case 'fr': return { breadcrumbHome: 'Accueil', breadcrumbTours: 'Tours', eyebrow: 'Expérience KCE', reserveNow: 'Réserver', askWhatsapp: 'Demander sur WhatsApp', quickNav: { details: 'Détails', includes: 'Inclus', itinerary: 'Itinéraire', faq: 'FAQ', reviews: 'Avis' }, cityLabel: 'Ville', fromLabel: 'À partir de', durationLabel: 'Durée', ratingLabel: 'Évaluation', sourceLabel: 'Source', snapshotTitle: 'Aperçu', snapshotCopy: 'Lecture rapide avant de réserver.', idealForTitle: 'Idéal pour', idealForCopy: 'Vérifiez si cette expérience correspond à votre rythme.', confidenceTitle: 'Confiance', confidenceCopy: 'Paiement sécurisé et support réel.', includesTitle: 'Ce qui est inclus', excludesTitle: 'Ce qui n’est pas inclus', itineraryTitle: 'Itinéraire', itineraryCopy: 'Structure claire du parcours.', policyTitle: 'Politiques', policyCopy: 'Nous confirmons la logistique avant l’expérience.', faqTitle: 'Questions fréquentes', reviewsTitle: 'Avis', relatedTitle: 'Continuer', relatedCopy: 'Complétez ce tour.', sidebarTitle: 'Résumé', priceFrom: 'À partir de', planTitle: 'Besoin d’aide ?', planCopy: 'Utilisez le plan personnalisé.', planCta: 'Créer mon plan', contactTitle: 'Support humain ?', contactCopy: 'Nous pouvons vous aider à comparer.', contactCta: 'Parler à KCE', supportTitle: 'Réserver avec clarté', supportCopy: 'Détails clés et support.', checklistTitle: 'Avant de réserver', checklist: ['Chaussures confortables', 'Signalez les restrictions', 'Vous recevrez une facture'], stages: [{ step: '01', title: 'Rencontre', body: 'Confirmation du point de rendez-vous.' }, { step: '02', title: 'L’expérience', body: 'Arrêts principaux et interprétation locale.' }, { step: '03', title: 'Clôture', body: 'Recommandations finales.' }], faqs: [{ q: 'Que dois-je apporter ?', a: 'Chaussures confortables et crème solaire.' }, { q: 'Adapté aux familles ?', a: 'Généralement oui, nous confirmons selon le parcours.' }, { q: 'Après le paiement ?', a: 'Vous recevez une confirmation et facture.' }, { q: 'Changer la date ?', a: 'Possible selon le tour et le délai.' }] };
    case 'de': return {
      book: 'Jetzt buchen', included: 'Inbegriffen', notIncluded: 'Nicht inbegriffen',
      itinerary: 'Reiseplan', reviews: 'Bewertungen', faq: 'FAQ',
      from: 'ab', duration: 'Dauer', whatsapp: 'Auf WhatsApp schreiben',
      backCatalog: '← Zum Katalog', similar: 'Ähnliche Touren',
    };
        default: return { breadcrumbHome: 'Inicio', breadcrumbTours: 'Tours', eyebrow: 'Experiencia KCE', reserveNow: 'Reservar ahora', askWhatsapp: 'Hablar por WhatsApp', quickNav: { details: 'Detalles', includes: 'Incluye', itinerary: 'Itinerario', faq: 'FAQ', reviews: 'Reseñas' }, cityLabel: 'Destino', fromLabel: 'Desde', durationLabel: 'Duración', ratingLabel: 'Calificación', sourceLabel: 'Fuente', snapshotTitle: 'Resumen de experiencia', snapshotCopy: 'Una lectura rápida y honesta de cómo se siente esta experiencia antes de reservar.', idealForTitle: 'Ideal para', idealForCopy: 'Aquí puedes entender si la experiencia encaja con tu ritmo, intereses y forma de viajar.', confidenceTitle: 'Reserva con más claridad', confidenceCopy: 'Pago seguro, apoyo real y un proceso claro ayudan a decidir con más calma y confianza.', includesTitle: 'Qué incluye', excludesTitle: 'No incluye', itineraryTitle: 'Ruta estimada', itineraryCopy: 'Una estructura limpia para visualizar el recorrido antes de reservar.', policyTitle: 'Punto de encuentro y políticas', policyCopy: 'Confirmamos logística antes de la experiencia y ayudamos a ajustar cuando hace falta.', faqTitle: 'Preguntas frecuentes', reviewsTitle: 'Reseñas de viajeros', relatedTitle: 'Sigue armando tu viaje', relatedCopy: 'Si esta experiencia te encaja, aquí tienes opciones cercanas.', sidebarTitle: 'Resumen de Inversión', priceFrom: 'Precio desde', planTitle: '¿Quieres una recomendación más guiada?', planCopy: 'Usa el plan personalizado para aterrizar tu shortlist por estilo, ciudad y presupuesto.', planCta: 'Abrir plan personalizado', contactTitle: '¿Prefieres apoyo humano?', contactCopy: 'Si aún comparas rutas, fechas o logística, KCE puede ayudarte a decidir con más contexto antes del checkout.', contactCta: 'Hablar con Asesor', supportTitle: 'Reserva con claridad', supportCopy: 'Aquí reunimos lo esencial de la experiencia y las vías de ayuda para que puedas decidir con seguridad.', checklistTitle: 'Antes de reservar', checklist: ['Zapatos cómodos y ropa adecuada para el clima', 'Avísanos si tienes restricciones, necesidades de accesibilidad o cambios de ritmo', 'Después del pago recibes tu confirmación y seguimiento logístico'], stages: [{ step: '01', title: 'Encuentro y contexto', body: 'Confirmamos punto, ritmo y enfoque de la experiencia.' }, { step: '02', title: 'Inmersión local', body: 'Paradas principales, interpretación local y momentos curados.' }, { step: '03', title: 'Cierre y recomendaciones', body: 'Recomendaciones, extras opcionales y tips locales para seguir tu viaje.' }], faqs: [{ q: '¿Qué debo llevar?', a: 'Zapatos cómodos, hidratación, bloqueador y una capa ligera suelen ser suficientes.' }, { q: '¿Es apto para familias?', a: 'Normalmente sí, pero confirmamos el encaje según ritmo, ruta y edad de los niños.' }, { q: '¿Qué pasa después del pago?', a: 'Recibes confirmación, booking, invoice y contacto directo para coordinar detalles.' }, { q: '¿Puedo cambiar la fecha?', a: 'Depende del tour y la anticipación. Nuestro equipo puede orientarte antes o después del pago.' }] };
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

  // El estándar premium
  const elegantCard = "rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-10 shadow-soft";

  return (
    <>
      <TourViewTracker slug={tour.slug} />
      
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

      <main className="mx-auto max-w-[var(--container-max)] px-6 py-12 pb-32 animate-fade-in">
        
        {/* Breadcrumbs Sutiles */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)] opacity-80">
          <Link href={withLocale(locale, '/')} className="hover:text-brand-blue transition-colors">{copy.breadcrumbHome}</Link>
          <ArrowRight className="h-3 w-3" />
          <Link href={withLocale(locale, '/tours')} className="hover:text-brand-blue transition-colors">{copy.breadcrumbTours}</Link>
          <ArrowRight className="h-3 w-3" />
          <span className="text-[color:var(--color-text)] opacity-50 truncate max-w-[200px] sm:max-w-none">{tour.title}</span>
        </nav>

        {/* HERO DEL TOUR (Visualmente inmersivo) */}
        <section className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-brand-dark shadow-soft group mb-12 border border-[color:var(--color-border)]">
          <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]">
            <Image src={img.src} alt={img.alt} fill priority className="object-cover opacity-90 transition-transform duration-1000 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent" />
            
            <div className="absolute top-6 left-6 md:top-8 md:left-8">
              <div className="inline-flex items-center gap-2 rounded-md bg-[color:var(--color-surface)]/10 backdrop-blur-md border border-[color:var(--color-surface)]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
                <Sparkles className="h-3 w-3 text-brand-yellow" /> {copy.eyebrow}
              </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-10">
              <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl text-white leading-[1.1] drop-shadow-md tracking-tight">{tour.title}</h1>
              {summary && (
                <p className="mt-4 max-w-3xl text-sm sm:text-base md:text-lg font-light text-white/80 line-clamp-2 md:line-clamp-none drop-shadow-sm">
                  {summary}
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
          
          {/* COLUMNA IZQUIERDA (Contenido Principal) */}
          <section className="space-y-12">
            
            {/* NAVEGACIÓN RÁPIDA (Glassmorphism Navbar) */}
            <nav className="flex flex-nowrap overflow-x-auto custom-scrollbar gap-2 sticky top-24 z-30 py-4 bg-[color:var(--color-bg)]/80 backdrop-blur-xl border-b border-[color:var(--color-border)]/50 -mx-6 px-6 lg:mx-0 lg:px-0 lg:border-none">
              {[
                { id: 'details', label: copy.quickNav.details },
                { id: 'includes', label: copy.quickNav.includes },
                { id: 'itinerary', label: copy.quickNav.itinerary },
                { id: 'reviews', label: copy.quickNav.reviews }
              ].map((item) => (
                <a key={item.id} href={`#${item.id}`} className="shrink-0 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] transition-all hover:border-brand-blue hover:text-brand-blue shadow-sm">
                  {item.label}
                </a>
              ))}
            </nav>

            {/* BLOQUE DE INFORMACIÓN RÁPIDA (Reemplaza las cajas grandes) */}
            <div id="details" className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`${elegantCard} p-6 md:p-6 flex flex-col items-center justify-center text-center`}>
                <Map className="h-6 w-6 text-brand-blue mb-2 opacity-70" />
                <span className="text-[10px] uppercase tracking-widest text-[color:var(--color-text-muted)]">{copy.cityLabel}</span>
                <span className="font-semibold text-[color:var(--color-text)] mt-1">{locationLabel}</span>
              </div>
              <div className={`${elegantCard} p-6 md:p-6 flex flex-col items-center justify-center text-center`}>
                <Clock className="h-6 w-6 text-brand-blue mb-2 opacity-70" />
                <span className="text-[10px] uppercase tracking-widest text-[color:var(--color-text-muted)]">{copy.durationLabel}</span>
                <span className="font-semibold text-[color:var(--color-text)] mt-1">{duration ? hoursLabel(duration) : 'Flexible'}</span>
              </div>
              <div className={`${elegantCard} p-6 md:p-6 flex flex-col items-center justify-center text-center`}>
                <Compass className="h-6 w-6 text-brand-terra mb-2 opacity-70" />
                <span className="text-[10px] uppercase tracking-widest text-[color:var(--color-text-muted)]">{copy.idealForTitle}</span>
                <span className="font-semibold text-[color:var(--color-text)] mt-1 truncate w-full">{tags[0] || 'Todos'}</span>
              </div>
              <div className={`${elegantCard} p-6 md:p-6 flex flex-col items-center justify-center text-center`}>
                <Star className="h-6 w-6 text-brand-yellow mb-2 opacity-70" />
                <span className="text-[10px] uppercase tracking-widest text-[color:var(--color-text-muted)]">{copy.ratingLabel}</span>
                <span className="font-semibold text-[color:var(--color-text)] mt-1">{rating ? `${rating.toFixed(1)} / 5` : 'Nuevo'}</span>
              </div>
            </div>

            {/* DESCRIPCIÓN MD */}
            {tour.body_md && (
              <section className="prose prose-lg md:prose-xl prose-slate max-w-none font-light leading-relaxed prose-headings:font-heading prose-headings:text-[color:var(--color-text)] prose-strong:font-semibold prose-a:text-brand-blue prose-p:text-[color:var(--color-text-muted)] text-[color:var(--color-text-muted)]">
                <MarketingMarkdown content={tour.body_md} />
              </section>
            )}

            {/* INCLUDES / EXCLUDES (Sin cajas rojas o verdes fuertes) */}
            <div id="includes" className="grid gap-6 md:grid-cols-2 pt-8">
              {/* Incluye (Verde muy sutil) */}
              <div className="rounded-[var(--radius-xl)] border border-[color:var(--color-success)]/20 bg-[color:var(--color-success)]/5 p-8 shadow-sm">
                <h3 className="font-heading text-xl text-[color:var(--color-text)] mb-6 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[color:var(--color-success)]" /> {copy.includesTitle}
                </h3>
                <ul className="space-y-4">
                  {copy.checklist.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm font-light text-[color:var(--color-text-muted)] leading-snug">
                      <span className="font-bold text-[color:var(--color-success)] opacity-50 mt-0.5">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* No Incluye (Rojo muy sutil) */}
              <div className="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-8 shadow-sm">
                <h3 className="font-heading text-xl text-[color:var(--color-text)] mb-6 flex items-center gap-3 opacity-80">
                  <XCircle className="h-5 w-5 text-[color:var(--color-text-muted)] opacity-50" /> {copy.excludesTitle}
                </h3>
                <ul className="space-y-4 opacity-80">
                  <li className="flex gap-3 text-sm font-light text-[color:var(--color-text-muted)] leading-snug">
                    <span className="font-bold text-[color:var(--color-text-muted)] opacity-30 mt-0.5">•</span> Vuelos internacionales
                  </li>
                  <li className="flex gap-3 text-sm font-light text-[color:var(--color-text-muted)] leading-snug">
                    <span className="font-bold text-[color:var(--color-text-muted)] opacity-30 mt-0.5">•</span> Gastos personales y propinas
                  </li>
                </ul>
              </div>
            </div>

            {/* ITINERARIO (Seamless List) */}
            <div className={`${elegantCard} overflow-hidden`} id="itinerary">
              <h2 className="font-heading text-3xl text-[color:var(--color-text)] tracking-tight mb-2">{copy.itineraryTitle}</h2>
              <p className="text-[color:var(--color-text-muted)] font-light mb-10">{copy.itineraryCopy}</p>
              
              <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--color-border)] before:to-transparent">
                {copy.stages.map((stage, i) => (
                  <div key={stage.step} className="relative flex items-start md:items-center justify-between md:justify-normal md:odd:flex-row-reverse group py-4">
                    {/* El punto del timeline */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[color:var(--color-surface)] bg-brand-blue text-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110">
                      <span className="text-[10px] font-bold">{stage.step}</span>
                    </div>
                    {/* Contenido */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[color:var(--color-surface-2)] p-6 rounded-xl border border-[color:var(--color-border)] transition-colors group-hover:border-brand-blue/30 group-hover:bg-[color:var(--color-surface)]">
                      <h3 className="font-heading text-lg text-[color:var(--color-text)] mb-2 group-hover:text-brand-blue transition-colors">{stage.title}</h3>
                      <p className="text-sm text-[color:var(--color-text-muted)] font-light leading-relaxed">{stage.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* REVIEWS */}
            <section id="reviews" className="pt-12 border-t border-[color:var(--color-border)]">
              <h2 className="font-heading text-3xl text-[color:var(--color-text)] mb-10 flex items-center gap-3">
                <Star className="h-6 w-6 text-brand-yellow" /> {copy.reviewsTitle}
              </h2>
              <div className="grid gap-12 lg:grid-cols-2">
                <ReviewsList tourSlug={tour.slug} limit={10} />
                <ReviewForm tourSlug={tour.slug} />
              </div>
            </section>

          </section>

          {/* COLUMNA DERECHA (Sidebar Desktop) */}
          <aside className="hidden lg:block relative">
            <div className="sticky top-32 space-y-6">
              
              {/* Booking Widget Container (Premium) */}
              <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-pop">
                {/* Header Financiero */}
                <div className="bg-[color:var(--color-surface-2)] border-b border-[color:var(--color-border)] p-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-blue" /> {copy.sidebarTitle}
                  </p>
                  <div className="font-heading text-4xl text-[color:var(--color-text)] tracking-tight">
                    {priceLabel}
                  </div>
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-widest text-[color:var(--color-text-muted)] opacity-70">
                    Por persona / Impuestos incluidos
                  </p>
                </div>
                
                {/* Widget Area */}
                <div className="p-8 pb-6">
                  <div id="booking-widget-desktop" className="scroll-mt-32">
                    <BookingWidget slug={tour.slug} title={tour.title} price={priceMinor} />
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-8 flex items-center justify-between border-t border-[color:var(--color-border)] pt-6">
                    <p className="text-xs font-medium text-[color:var(--color-text-muted)] flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5" /> Guardar ruta
                    </p>
                    <WishlistButton tourId={tour.id} tourSlug={tour.slug} />
                  </div>
                </div>
              </div>

              {/* Support / Trust Strip */}
              <div className="space-y-4">
                <TrustBar compact />
                
                <div className="rounded-[var(--radius-xl)] bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] p-6 flex flex-col sm:flex-row items-center gap-4 group">
                  <div className="h-12 w-12 rounded-full bg-[color:var(--color-surface)] border border-[color:var(--color-border)] flex items-center justify-center shrink-0 group-hover:border-brand-blue/30 transition-colors">
                    <MessageCircle className="h-5 w-5 text-brand-blue" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-medium text-[color:var(--color-text)] text-sm">{copy.contactTitle}</h4>
                    <a href={whatsAppHref ?? undefined} target="_blank" rel="noreferrer" className="text-xs text-[color:var(--color-text-muted)] hover:text-brand-blue underline mt-0.5 inline-block">
                      {copy.askWhatsapp}
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </aside>

        </div>
      </main>
    </>
  );
}
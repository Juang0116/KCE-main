// src/features/tours/components/TourCardPremium.tsx
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Star } from 'lucide-react';

import WishlistButton from '@/features/wishlist/WishlistButton';
import { formatCurrencyEUR, formatDuration } from '@/utils/format';

import type { TourLike } from '@/features/tours/adapters';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function pickString(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
}

function getTourImage(tour: TourLike): { url: string; alt: string } {
  const alt = tour.title || 'Tour';

  if (Array.isArray(tour.images) && tour.images.length > 0) {
    const first = tour.images[0];
    if (first && typeof first.url === 'string' && first.url.trim()) {
      return { url: first.url.trim(), alt: (first.alt || alt).trim() };
    }
  }

  const t = tour as unknown as Record<string, unknown>;
  const direct =
    pickString(tour.image) ||
    pickString(t.image_url) ||
    pickString(t.cover_image_url) ||
    pickString(t.hero_image_url);
  if (direct) return { url: direct, alt };

  const imagesUnknown = (t.images ?? null) as unknown;
  if (Array.isArray(imagesUnknown) && imagesUnknown.length > 0) {
    const first = imagesUnknown[0] as unknown;
    const s = pickString(first);
    if (s) return { url: s, alt };
    if (isRecord(first) && pickString(first.url)) {
      return { url: String(first.url), alt: pickString(first.alt) ?? alt };
    }
  }

  return { url: '/images/tours/placeholder.jpg', alt };
}

function getDuration(tour: TourLike): number | null {
  const v =
    typeof tour.duration_hours === 'number'
      ? tour.duration_hours
      : typeof tour.durationHours === 'number'
        ? tour.durationHours
        : null;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

type UiCopy = {
  kicker: string;
  from: string;
  details: string;
  book: string;
  realSupport: string;
  protectedBooking: string;
  bestFor: string;
  secureCheckout: string;
  shortlistReady: string;
  curated: string;
};

function inferLocaleFromHref(href?: string): 'es' | 'en' | 'fr' | 'de' {
  const v = String(href || '').trim().toLowerCase();
  const m = v.match(/^\/(es|en|fr|de)(\/|$)/i);
  return (m?.[1] as 'es' | 'en' | 'fr' | 'de' | undefined) ?? 'es';
}

function getCopy(locale: 'es' | 'en' | 'fr' | 'de'): UiCopy {
  switch (locale) {
    case 'en':
      return {
        kicker: 'Curated experience • Professional operation',
        from: 'From',
        details: 'View details',
        book: 'Book now',
        realSupport: 'Real support',
        protectedBooking: 'Protected booking flow',
        bestFor: 'Best for',
        secureCheckout: 'Secure checkout',
        shortlistReady: 'Shortlist ready',
        curated: 'Curated by KCE',
      };
    case 'fr':
      return {
        kicker: 'Expérience sélectionnée • Opération professionnelle',
        from: 'À partir de',
        details: 'Voir les détails',
        book: 'Réserver',
        realSupport: 'Assistance réelle',
        protectedBooking: 'Réservation protégée',
        bestFor: 'Idéal pour',
        secureCheckout: 'Checkout sécurisé',
        shortlistReady: 'Prêt à comparer',
        curated: 'Sélection KCE',
      };
    case 'de':
      return {
        kicker: 'Kuratiertes Erlebnis • Professioneller Betrieb',
        from: 'Ab',
        details: 'Details ansehen',
        book: 'Jetzt buchen',
        realSupport: 'Echter Support',
        protectedBooking: 'Geschützter Buchungsfluss',
        bestFor: 'Ideal für',
        secureCheckout: 'Sicherer Checkout',
        shortlistReady: 'Shortlist bereit',
        curated: 'Von KCE kuratiert',
      };
    default:
      return {
        kicker: 'Experiencia curada • Operación profesional',
        from: 'Desde',
        details: 'Ver detalles',
        book: 'Reservar',
        realSupport: 'Soporte real',
        protectedBooking: 'Booking protegido',
        bestFor: 'Ideal para',
        secureCheckout: 'Checkout seguro',
        shortlistReady: 'Lista corta rápida',
        curated: 'Curado por KCE',
      };
  }
}

export default function TourCardPremium({
  tour,
  priority,
  href,
}: {
  tour: TourLike;
  priority?: boolean;
  href?: string;
}) {
  const { url: imgUrl, alt } = getTourImage(tour);
  const link = href ?? `/tours/${tour.slug}`;
  const locale = inferLocaleFromHref(link);
  const copy = getCopy(locale);
  const duration = getDuration(tour);
  const price = tour.base_price ?? tour.price;
  const tags = (tour.tags ?? []).slice(0, 2);
  const description = (tour.short || tour.summary || '').trim();
  const audience = tags.length ? `${copy.bestFor} ${tags.slice(0, 2).join(' · ')}` : copy.protectedBooking;
  const rating = typeof tour.rating === 'number' && Number.isFinite(tour.rating) ? Math.max(0, Math.min(5, tour.rating)) : null;

  return (
    <article
      className={[
        'group overflow-hidden rounded-[calc(var(--radius)+0.35rem)] border border-[color:var(--color-border)]',
        'bg-[color:var(--color-surface)] shadow-soft transition duration-300',
        'hover:-translate-y-1 hover:shadow-hard',
      ].join(' ')}
    >
      <div className="relative">
        <Link href={link} className="block">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[color:var(--color-surface-2)]">
            <Image
              src={imgUrl}
              alt={alt}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={Boolean(priority)}
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/18 to-transparent" />
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        </Link>

        <div className="absolute right-3 top-3">
          <WishlistButton tourId={tour.id} tourSlug={tour.slug} />
        </div>

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {tour.city ?? 'Colombia'}
          </span>
          {duration ? (
            <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {formatDuration(duration)}
            </span>
          ) : null}
          {rating ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Star className="h-3.5 w-3.5 fill-current text-brand-yellow" />
              {rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {copy.curated}
            </div>
            <Link href={link} className="mt-3 block no-underline hover:no-underline">
              <h3 className="line-clamp-2 font-heading text-[1.35rem] leading-tight text-white">{tour.title}</h3>
            </Link>
            {description ? <p className="mt-1 line-clamp-2 text-sm text-white/82">{description}</p> : null}
          </div>

          <div className="hidden shrink-0 rounded-[1.15rem] border border-white/15 bg-white/12 px-4 py-3 text-right text-white shadow-soft backdrop-blur md:block">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/70">{copy.from}</div>
            <div className="mt-1 font-heading text-2xl">{typeof price === 'number' ? formatCurrencyEUR(price) : '—'}</div>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[color:var(--color-text-muted)]">{copy.kicker}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text-muted)]">
                EUR
              </span>
              <span className="rounded-full bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text-muted)]">
                {copy.realSupport}
              </span>
              {tags.map((x) => (
                <span
                  key={x}
                  className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text)]"
                >
                  {x}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[1.1rem] border border-[color:var(--color-border)] bg-[linear-gradient(135deg,rgba(11,84,162,0.06),rgba(255,255,255,0.96))] px-4 py-3 text-left md:hidden">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">{copy.from}</div>
            <div className="mt-1 font-heading text-xl text-[color:var(--color-text)]">{typeof price === 'number' ? formatCurrencyEUR(price) : '—'}</div>
          </div>
        </div>

        <div className="mt-5 rounded-[1.15rem] border border-[color:var(--color-border)] bg-[linear-gradient(135deg,rgba(11,84,162,0.05),rgba(255,255,255,0.98))] px-4 py-3 text-sm text-[color:var(--color-text)]/76">
          <div className="flex items-center gap-2 font-semibold text-[color:var(--color-text)]">
            <ShieldCheck className="h-4 w-4 text-brand-blue" />
            {audience}
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
            <span className="rounded-full border border-[color:var(--color-border)] bg-white px-3 py-1">{copy.shortlistReady}</span>
            <span className="rounded-full border border-[color:var(--color-border)] bg-white px-3 py-1">{copy.secureCheckout}</span>
            <span className="rounded-full border border-[color:var(--color-border)] bg-white px-3 py-1">EUR</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Link
            href={link}
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2.5 text-sm font-semibold text-brand-blue no-underline transition hover:bg-[color:var(--color-surface)] hover:no-underline"
          >
            {copy.details}
          </Link>

          <Link
            href={link}
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:opacity-95 hover:no-underline"
          >
            {copy.book}
          </Link>
        </div>
      </div>
    </article>
  );
}

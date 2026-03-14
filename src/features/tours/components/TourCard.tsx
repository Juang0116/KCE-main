import Image from 'next/image';
import Link from 'next/link';

import WishlistButton from '@/features/wishlist/WishlistButton';
import { formatCurrencyEUR, formatDuration } from '@/utils/format';

import type { TourLike } from '../../../types/tours';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function pickString(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
}

function getTourImage(tour: TourLike): { url: string; alt: string } {
  const t = tour as unknown as Record<string, unknown>;

  const direct =
    pickString(t.image) ||
    pickString(t.image_url) ||
    pickString(t.cover_image_url) ||
    pickString(t.hero_image_url);

  if (direct) return { url: direct, alt: tour.title };

  const imagesUnknown = (t.images ?? null) as unknown;

  if (Array.isArray(imagesUnknown) && imagesUnknown.length > 0) {
    const first = imagesUnknown[0] as unknown;

    const s = pickString(first);
    if (s) return { url: s, alt: tour.title };

    if (isRecord(first) && pickString(first.url)) {
      return { url: String(first.url), alt: pickString(first.alt) ?? tour.title };
    }
  }

  return { url: '/images/tours/placeholder.svg', alt: tour.title };
}

function getDuration(tour: TourLike): number | null {
  const v =
    typeof tour.duration_hours === 'number'
      ? tour.duration_hours
      : typeof (tour as any).durationHours === 'number'
        ? (tour as any).durationHours
        : null;

  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

export default function TourCard({
  tour,
  priority,
  href,
}: {
  tour: TourLike;
  priority?: boolean;
  href?: string; // pásalo desde pages con locale: `/${locale}/tours/${slug}`
}) {
  const { url: imgUrl, alt } = getTourImage(tour);
  const link = href ?? `/tours/${tour.slug}`;
  const duration = getDuration(tour);

  return (
    <article
      className={[
        'group overflow-hidden rounded-[var(--radius)] border border-[color:var(--color-border)]',
        'bg-[color:var(--color-surface)] shadow-soft transition',
        'hover:shadow-pop',
      ].join(' ')}
    >
      <div className="relative">
        <Link
          href={link}
          className="block"
        >
          <div className="relative aspect-[16/10] w-full bg-[color:var(--color-surface-2)]">
            <Image
              src={imgUrl}
              alt={alt}
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={Boolean(priority)}
            />
            <div
              aria-hidden
              className="via-black/18 absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"
            />
          </div>
        </Link>

        <div className="absolute right-3 top-3">
          <WishlistButton
            tourId={tour.id}
            tourSlug={tour.slug}
          />
        </div>

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs text-white">
            {tour.city ?? 'Colombia'}
          </span>
          {duration ? (
            <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs text-white">
              {formatDuration(duration)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={link}
              className="block no-underline hover:no-underline"
            >
              <h3 className="truncate font-heading text-lg text-[color:var(--color-text)]">
                {tour.title}
              </h3>
            </Link>
            <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
              Experiencia curada • Operación profesional
            </p>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-xs text-[color:var(--color-text-muted)]">Desde</div>
            <div className="font-heading text-base text-[color:var(--color-text)]">
              {tour.base_price != null ? formatCurrencyEUR(tour.base_price) : '—'}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Link
            href={link}
            className="btn-outline rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold no-underline hover:no-underline"
          >
            Ver detalles →
          </Link>

          <Link
            href={link}
            className="text-sm font-semibold text-[color:var(--brand-blue)] underline-offset-4 hover:underline"
          >
            Reservar
          </Link>
        </div>
      </div>
    </article>
  );
}

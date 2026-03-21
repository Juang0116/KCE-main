import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, ArrowRight } from 'lucide-react';

import WishlistButton from '@/features/wishlist/WishlistButton';
import { formatCurrencyEUR, formatDuration } from '@/utils/format';

// 🛡️ FIX: Importamos TourLike desde los adapters (donde sí existe 'short')
import type { TourLike } from '@/features/tours/adapters';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function pickString(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
}

function getTourImage(tour: TourLike): { url: string; alt: string } {
  const t = tour as unknown as Record<string, unknown>;
  const direct = pickString(t.image) || pickString(t.image_url) || pickString(t.cover_image_url) || pickString(t.hero_image_url);
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
  const v = typeof tour.duration_hours === 'number' ? tour.duration_hours : typeof tour.durationHours === 'number' ? tour.durationHours : null;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

export default function TourCard({ tour, priority, href }: { tour: TourLike; priority?: boolean; href?: string; }) {
  const { url: imgUrl, alt } = getTourImage(tour);
  const link = href ?? `/tours/${tour.slug}`;
  const duration = getDuration(tour);

  return (
    <article className="group flex flex-col overflow-hidden rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-pop hover:border-brand-blue/30">
      
      {/* Contenedor de Imagen */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[color:var(--color-surface-2)]">
        <Link href={link} className="absolute inset-0 z-10">
          <span className="sr-only">Ver detalles de {tour.title}</span>
        </Link>
        <Image
          src={imgUrl}
          alt={alt}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
          priority={Boolean(priority)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent opacity-80" />

        {/* Botón Flotante Wishlist */}
        <div className="absolute right-4 top-4 z-20">
          <WishlistButton tourId={tour.id} tourSlug={tour.slug} />
        </div>

        {/* Badges Flotantes */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 z-20">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
            <MapPin className="h-3 w-3" /> {tour.city ?? 'Colombia'}
          </span>
          {duration && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
              <Clock className="h-3 w-3" /> {formatDuration(duration)}
            </span>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-2 flex items-start justify-between gap-4">
          <Link href={link} className="no-underline hover:no-underline z-10">
            <h3 className="font-heading text-xl leading-tight text-[color:var(--color-text)] group-hover:text-brand-blue transition-colors line-clamp-2">
              {tour.title}
            </h3>
          </Link>
        </div>

        <p className="text-sm font-light text-[color:var(--color-text)]/70 line-clamp-2 flex-1 mt-2">
          {tour.short || tour.summary || 'Descubre la magia de Colombia con KCE.'}
        </p>

        {/* Footer de Tarjeta (Precio y CTA) */}
        <div className="mt-6 flex items-end justify-between border-t border-[color:var(--color-border)] pt-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)]">Desde</p>
            <p className="font-heading text-2xl text-brand-blue">
              {tour.base_price != null ? formatCurrencyEUR(tour.base_price) : tour.price != null ? formatCurrencyEUR(tour.price) : '—'}
            </p>
          </div>
          <Link href={link} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white z-10">
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Star, MapPin, Clock, ArrowRight } from 'lucide-react';

import WishlistButton from '@/features/wishlist/WishlistButton';
import { formatCurrencyEUR, formatDuration } from '@/utils/format';
import type { TourLike } from '@/features/tours/adapters';

function isRecord(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null; }
function pickString(v: unknown): string | null { return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null; }

function getTourImage(tour: TourLike): { url: string; alt: string } {
  const alt = tour.title || 'Tour';
  if (Array.isArray(tour.images) && tour.images.length > 0) {
    const first = tour.images[0];
    if (first && typeof first.url === 'string' && first.url.trim()) return { url: first.url.trim(), alt: (first.alt || alt).trim() };
  }
  const t = tour as unknown as Record<string, unknown>;
  const direct = pickString(tour.image) || pickString(t.image_url) || pickString(t.cover_image_url) || pickString(t.hero_image_url);
  if (direct) return { url: direct, alt };
  return { url: '/images/tours/placeholder.svg', alt };
}

function getDuration(tour: TourLike): number | null {
  const v = typeof tour.duration_hours === 'number' ? tour.duration_hours : typeof tour.durationHours === 'number' ? tour.durationHours : null;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

function inferLocaleFromHref(href?: string): 'es' | 'en' | 'fr' | 'de' {
  const v = String(href || '').trim().toLowerCase();
  const m = v.match(/^\/(es|en|fr|de)(\/|$)/i);
  return (m?.[1] as 'es' | 'en' | 'fr' | 'de' | undefined) ?? 'es';
}

export default function TourCardPremium({ tour, priority, href }: { tour: TourLike; priority?: boolean; href?: string; }) {
  const { url: imgUrl, alt } = getTourImage(tour);
  const link = href ?? `/tours/${tour.slug}`;
  const duration = getDuration(tour);
  const price = tour.base_price ?? tour.price;
  const tags = (tour.tags ?? []).slice(0, 2);
  const description = (tour.short || tour.summary || '').trim();
  const rating = typeof tour.rating === 'number' && Number.isFinite(tour.rating) ? Math.max(0, Math.min(5, tour.rating)) : null;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-hard">
      
      {/* Contenedor Superior (Imagen) */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-dark">
        <Link href={link} className="absolute inset-0 z-10"><span className="sr-only">Reservar {tour.title}</span></Link>
        <Image
          src={imgUrl}
          alt={alt}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
          sizes="(max-width: 768px) 100vw, 33vw"
          priority={Boolean(priority)}
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/20 to-transparent" />
        
        {/* Wishlist */}
        <div className="absolute right-5 top-5 z-20">
          <WishlistButton tourId={tour.id} tourSlug={tour.slug} />
        </div>

        {/* Info Integrada en la Imagen */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-yellow/30 bg-brand-yellow/20 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-brand-yellow backdrop-blur-md mb-3">
            <Sparkles className="h-3 w-3" /> Selección KCE
          </div>
          <h3 className="font-heading text-2xl leading-tight text-white drop-shadow-md line-clamp-2">
            {tour.title}
          </h3>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-white/80">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-brand-yellow"/> {tour.city ?? 'Colombia'}</span>
            {duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-brand-yellow"/> {formatDuration(duration)}</span>}
            {rating && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-current text-brand-yellow"/> {rating.toFixed(1)}</span>}
          </div>
        </div>
      </div>

      {/* Contenedor Inferior (Detalles) */}
      <div className="flex flex-1 flex-col p-6 bg-[color:var(--color-surface)]">
        {description && <p className="text-sm font-light leading-relaxed text-[color:var(--color-text)]/70 line-clamp-2 mb-4">{description}</p>}
        
        <div className="mb-6 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t} className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/60">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-[color:var(--color-border)] pt-5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 mb-1">Desde</span>
            <span className="font-heading text-3xl text-[color:var(--color-text)]">{typeof price === 'number' ? formatCurrencyEUR(price) : '—'}</span>
          </div>
          <Link href={link} className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 shadow-md hover:-translate-y-0.5 relative z-10">
            Ver Viaje <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
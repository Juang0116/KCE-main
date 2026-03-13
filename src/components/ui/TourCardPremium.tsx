import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { Badge } from '@/components/ui/Badge';

type Tour = {
  slug: string;
  title: string;
  image?: string | null;
  city?: string | null;
  short?: string | null;
  price?: number | null;
  durationHours?: number | null;
  tags?: string[] | null;
};

function moneyCOP(value?: number | null) {
  if (!value) return '';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function TourCardPremium({ tour, href }: { tour: Tour; href: string }) {
  const img = tour.image || '/images/placeholder.jpg';

  return (
    <Link
      href={href}
      className={clsx(
        'group block overflow-hidden rounded-[var(--radius-lg)]',
        'border border-[color:var(--border)] bg-[color:var(--surface)]',
        'shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)]',
      )}
    >
      <div className="relative aspect-[16/10]">
        <Image
          src={img}
          alt={tour.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          priority={false}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'var(--img-overlay)' }}
        />
        <div className="absolute left-4 top-4 flex gap-2">
          {tour.city ? (
            <Badge className="border-white/20 bg-black/20 text-white">{tour.city}</Badge>
          ) : null}
          {tour.durationHours ? (
            <Badge className="border-white/20 bg-black/20 text-white">{tour.durationHours}h</Badge>
          ) : null}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-heading text-lg leading-tight text-white">{tour.title}</h3>
          {tour.short ? (
            <p className="mt-1 line-clamp-2 text-sm text-white/80">{tour.short}</p>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-[color:var(--muted)]">Desde</div>
          <div className="text-base font-semibold text-[color:var(--text)]">
            {moneyCOP(tour.price)}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(tour.tags || []).slice(0, 3).map((x) => (
            <Badge key={x}>{x}</Badge>
          ))}
        </div>

        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--brand)]">
          Ver tour
          <span className="transition group-hover:translate-x-0.5">→</span>
        </div>
      </div>
    </Link>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
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

/**
 * Formateador de moneda local para Colombia
 */
function moneyCOP(value?: number | null) {
  if (!value) return 'Consultar precio';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function TourCardPremium({ tour, href, priority = false }: { tour: Tour; href: string, priority?: boolean }) {
  const img = tour.image || '/images/tours/placeholder.svg';

  return (
    <Link
      href={href}
      className={clsx(
        'group relative flex flex-col overflow-hidden rounded-[2rem] border border-brand-dark/5 dark:border-white/5 bg-surface transition-all duration-500',
        'hover:-translate-y-1 hover:shadow-pop hover:border-brand-blue/30'
      )}
    >
      {/* Contenedor de Imagen con Overlays Oscuros (Estilo Lujo) */}
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-dark">
        <Image
          src={img}
          alt={tour.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105 opacity-90"
          priority={priority}
        />
        
        {/* Gradiente de legibilidad elegante (Negro en lugar de azul) */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />

        {/* Badges Flotantes sobre imagen */}
        <div className="absolute left-5 top-5 flex flex-wrap gap-2">
          {tour.city && (
            <Badge variant="brand" className="bg-surface/90 text-main backdrop-blur-md border-none shadow-sm px-3 py-1">
              <MapPin className="mr-1.5 h-3 w-3 text-brand-blue" />
              {tour.city}
            </Badge>
          )}
          {tour.durationHours && (
            <Badge className="bg-brand-dark/60 backdrop-blur-md border border-white/10 text-white px-3 py-1">
              <Clock className="mr-1.5 h-3 w-3 text-brand-yellow" />
              {tour.durationHours}h
            </Badge>
          )}
        </div>

        {/* Título en la imagen */}
        <div className="absolute bottom-0 left-0 right-0 p-6 transform transition-transform duration-500 group-hover:-translate-y-1">
          <h3 className="font-heading text-2xl font-bold leading-tight text-white drop-shadow-md tracking-tight">
            {tour.title}
          </h3>
        </div>
      </div>

      {/* Cuerpo de la Card Blanca */}
      <div className="flex flex-1 flex-col p-6 md:p-8">
        {tour.short && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted/80 font-light">
            {tour.short}
          </p>
        )}

        {/* Tags secundarios */}
        <div className="mt-5 flex flex-wrap gap-2">
          {(tour.tags || []).slice(0, 3).map((tag) => (
            <Badge key={tag} className="text-[10px] py-1 px-3 bg-surface-2 border-brand-dark/5 dark:border-white/5 text-muted opacity-80 group-hover:opacity-100 transition-opacity font-medium tracking-wide">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Footer: Precio y Acción */}
        <div className="mt-auto pt-6 flex items-center justify-between border-t border-brand-dark/5 dark:border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-0.5">Desde</span>
            <span className="text-xl font-heading text-main tracking-tight">
              {moneyCOP(tour.price)}
            </span>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 border border-brand-dark/5 dark:border-white/5 text-main transition-all duration-300 group-hover:bg-brand-blue group-hover:text-white group-hover:border-brand-blue shadow-sm group-hover:shadow-md">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
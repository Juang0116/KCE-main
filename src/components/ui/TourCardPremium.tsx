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

export function TourCardPremium({ tour, href }: { tour: Tour; href: string }) {
  const img = tour.image || '/images/tours/placeholder.svg';

  return (
    <Link
      href={href}
      className={clsx(
        'group relative flex flex-col overflow-hidden rounded-[2rem] border border-brand-dark/10 bg-white transition-all duration-500',
        'hover:-translate-y-1 hover:shadow-hard hover:border-brand-blue/20'
      )}
    >
      {/* Contenedor de Imagen con Overlays */}
      <div className="relative aspect-[16/11] overflow-hidden">
        <Image
          src={img}
          alt={tour.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          priority={false}
        />
        
        {/* Gradiente de legibilidad para el título sobre la imagen */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

        {/* Badges Flotantes sobre imagen */}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {tour.city && (
            <Badge variant="brand" className="bg-white/90 backdrop-blur-sm border-none shadow-sm">
              <MapPin className="mr-1 h-3 w-3" />
              {tour.city}
            </Badge>
          )}
          {tour.durationHours && (
            <Badge className="bg-brand-dark/40 backdrop-blur-sm border-none text-white">
              <Clock className="mr-1 h-3 w-3" />
              {tour.durationHours}h
            </Badge>
          )}
        </div>

        {/* Título y descripción interna (opcional, para look "Journal") */}
        <div className="absolute bottom-0 left-0 right-0 p-5 transform transition-transform duration-500 group-hover:-translate-y-1">
          <h3 className="font-heading text-xl font-bold leading-tight text-white drop-shadow-md">
            {tour.title}
          </h3>
        </div>
      </div>

      {/* Cuerpo de la Card */}
      <div className="flex flex-1 flex-col p-6">
        {tour.short && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted/80">
            {tour.short}
          </p>
        )}

        {/* Tags secundarios */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {(tour.tags || []).slice(0, 2).map((tag) => (
            <Badge key={tag} className="text-[9px] py-0 px-2 opacity-70 group-hover:opacity-100 transition-opacity">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Footer: Precio y Acción */}
        <div className="mt-auto pt-6 flex items-center justify-between border-t border-brand-dark/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted/50">Desde</span>
            <span className="text-lg font-bold text-brand-blue">
              {moneyCOP(tour.price)}
            </span>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/5 text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Globe,
  MapPin,
  DollarSign,
  Edit3,
  Eye,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Compass,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type TourItem = {
  id: string;
  slug: string;
  title: string;
  city?: string | null;
  base_price?: number | null;
  price?: number | null;
  rating?: number | null;
  duration_hours?: number | null;
  durationHours?: number | null;
  image?: string | null;
  tags?: unknown;
  source?: string;
};

function fmtPrice(minor: number | null | undefined) {
  if (!minor) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function getTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.map(String);
    } catch {}
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function AdminToursClient({ initialItems }: { initialItems: TourItem[] }) {
  const [q, setQ] = useState('');
  const [filterCity, setFilterCity] = useState('');

  const cities = useMemo(() => {
    const all = initialItems.map((t) => t.city).filter(Boolean) as string[];
    return [...new Set(all)].sort();
  }, [initialItems]);

  const filtered = useMemo(() => {
    let list = initialItems;
    if (q.trim()) {
      const term = q.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          t.slug.includes(term) ||
          t.city?.toLowerCase().includes(term),
      );
    }
    if (filterCity) list = list.filter((t) => t.city === filterCity);
    return list;
  }, [initialItems, q, filterCity]);

  return (
    <div className="space-y-6">
      {/* FILTERS */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted opacity-50" />
          <input
            type="text"
            placeholder="Buscar tour por nombre, slug o ciudad..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-11 w-full rounded-2xl border border-brand-dark/10 bg-surface pl-12 text-sm text-main outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
          />
        </div>
        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="h-11 rounded-2xl border border-brand-dark/10 bg-surface px-4 text-sm text-main outline-none focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
        >
          <option value="">Todas las ciudades</option>
          {cities.map((c) => (
            <option
              key={c}
              value={c}
            >
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Total Tours',
            value: initialItems.length,
            icon: Compass,
            color: 'text-brand-blue',
          },
          { label: 'Filtrados', value: filtered.length, icon: Filter, color: 'text-brand-yellow' },
          { label: 'Ciudades', value: cities.length, icon: MapPin, color: 'text-brand-red' },
          {
            label: 'Con precio',
            value: initialItems.filter((t) => (t.base_price ?? t.price ?? 0) > 0).length,
            icon: DollarSign,
            color: 'text-green-500',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="flex items-center gap-3 rounded-2xl border border-brand-dark/5 bg-surface p-4 dark:border-white/5"
          >
            <div className={`rounded-xl bg-brand-dark/5 p-2 dark:bg-white/5 ${kpi.color}`}>
              <kpi.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-heading text-2xl text-main">{kpi.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* GRID */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-brand-dark/10 p-16 text-center dark:border-white/10">
          <Compass className="mx-auto mb-4 h-12 w-12 text-muted opacity-30" />
          <p className="text-sm text-muted">No se encontraron tours con ese criterio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tour) => {
            const price = tour.base_price ?? tour.price ?? 0;
            const tags = getTags(tour.tags);
            const hours = tour.duration_hours ?? tour.durationHours;
            return (
              <div
                key={tour.id}
                className="group overflow-hidden rounded-2xl border border-brand-dark/5 bg-surface transition-all hover:border-brand-blue/20 hover:shadow-lg dark:border-white/5"
              >
                {/* Image */}
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-brand-blue/10 to-brand-red/10">
                  {tour.image && (
                    <img
                      src={tour.image}
                      alt={tour.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  {!tour.image && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Compass className="h-12 w-12 text-brand-blue/30" />
                    </div>
                  )}
                  <div className="absolute right-3 top-3 flex gap-1.5">
                    <span className="rounded-full bg-black/50 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                      {tour.source ?? 'catalog'}
                    </span>
                  </div>
                  {price > 0 && (
                    <div className="absolute bottom-3 left-3 rounded-full bg-brand-blue px-3 py-1 text-xs font-bold text-white">
                      {fmtPrice(price)}/p
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-main">
                      {tour.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                      {tour.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {tour.city}
                        </span>
                      )}
                      {hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {hours}h
                        </span>
                      )}
                      {tour.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-brand-yellow text-brand-yellow" />
                          {tour.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-brand-dark/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted dark:bg-white/5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/tours/${tour.slug}`}
                      target="_blank"
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        className="h-8 w-full rounded-xl text-[10px]"
                      >
                        <Eye className="mr-1 h-3 w-3" /> Ver Público
                      </Button>
                    </Link>
                    <Link
                      href={`/admin/catalog?q=${tour.slug}`}
                      className="flex-1"
                    >
                      <Button className="h-8 w-full rounded-xl bg-brand-blue text-[10px] text-white hover:bg-brand-dark">
                        <Edit3 className="mr-1 h-3 w-3" /> Editar
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

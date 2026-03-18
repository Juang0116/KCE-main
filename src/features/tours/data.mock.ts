import type { Tour, TourSort } from '../types';

/**
 * 🧪 Mock de tours para la demo. Estilo "Agencia Boutique"
 * - Precios en EUR en minor units (centavos).
 * - Descripciones enriquecidas.
 */

export const TOURS: Tour[] = [
  {
    id: 't_001',
    slug: 'bogota-coffee-culture',
    title: 'Bogotá Coffee Culture: De la Semilla a la Taza',
    city: 'Bogotá',
    durationHours: 4,
    price: 4_900,
    rating: 4.9,
    image: '/images/tours/bogota-coffee.jpg',
    short: 'Explora la escena cafetera más exclusiva de la capital. Catas privadas, tostión artesanal y un recorrido por los barrios más bohemios de Bogotá.',
    tags: ['coffee', 'culture', 'exclusive'],
  },
  {
    id: 't_002',
    slug: 'medellin-street-art',
    title: 'Medellín Street Art & Transformación Social',
    city: 'Medellín',
    durationHours: 5,
    price: 11_000,
    rating: 4.8,
    image: '/images/tours/medellin.jpg',
    short: 'Recorre la Comuna 13 acompañado de artistas locales. Una inmersión profunda en la historia de resiliencia y el arte urbano que transformó la ciudad.',
    tags: ['art', 'history', 'walking'],
  },
  {
    id: 't_003',
    slug: 'guatape-luxury-day-trip',
    title: 'Guatapé Luxury Day Trip',
    city: 'Guatapé',
    durationHours: 8,
    price: 28_000,
    rating: 5.0,
    image: '/images/tours/guatape.jpg',
    short: 'Asciende a la imponente Piedra del Peñol y navega en lancha privada por la represa. Incluye almuerzo gourmet y transporte VIP desde Medellín.',
    tags: ['nature', 'day-trip', 'luxury'],
  },
  {
    id: 't_004',
    slug: 'cartagena-sunset-sail',
    title: 'Cartagena Sunset Sail: Bahía Histórica',
    city: 'Cartagena',
    durationHours: 3,
    price: 8_500,
    rating: 4.7,
    image: '/images/tours/cartagena-sunset.jpg',
    short: 'Navega en un exclusivo catamarán al atardecer por la bahía de Cartagena. Disfruta de vistas a la ciudad amurallada con un cóctel de autor en mano.',
    tags: ['sunset', 'romantic', 'boat'],
  },
  {
    id: 't_005',
    slug: 'cocora-valley-hike',
    title: 'Valle de Cocora: Ruta de las Palmas de Cera',
    city: 'Salento',
    durationHours: 6,
    price: 26_000,
    rating: 4.9,
    image: '/images/tours/cocora.jpg',
    short: 'Una expedición guiada por el icónico Valle de Cocora. Conecta con el Eje Cafetero en una ruta diseñada para amantes de la naturaleza y la fotografía.',
    tags: ['hike', 'nature', 'coffee'],
  },
  {
    id: 't_006',
    slug: 'tayrona-paradise-beaches',
    title: 'Tayrona Paradise: Expedición Costera',
    city: 'Santa Marta',
    durationHours: 9,
    price: 32_000,
    rating: 4.8,
    image: '/images/tours/tayrona.jpg',
    short: 'Senderismo suave a través de la selva tropical hasta llegar a las playas más prístinas y sagradas del Parque Nacional Natural Tayrona.',
    tags: ['beach', 'nature', 'expedition'],
  },
];

/* ───────────────────────── helpers ───────────────────────── */

const collator = new Intl.Collator('es-CO', { sensitivity: 'base' });

function toSearch(s: string): string {
  return s.normalize('NFKD').replace(/[\u0300-\u036F]/g, '').toLowerCase().trim();
}

export const TOURS_BY_SLUG = new Map<string, Tour>(TOURS.map((t) => [t.slug.toLowerCase(), t]));
export const TAGS = Array.from(new Set(TOURS.flatMap((t) => (t.tags ?? []).map((x: string) => String(x).toLowerCase().trim())))).sort(collator.compare);
export const CITIES = Array.from(new Set(TOURS.map((t) => t.city))).sort(collator.compare);

export function getTourBySlug(slug: string | undefined | null): Tour | undefined {
  if (!slug) return undefined;
  return TOURS_BY_SLUG.get(String(slug).toLowerCase());
}

export function filterAndSortTours({ q = '', tag = '', city = '', sort = 'popular' }: { q?: string; tag?: string; city?: string; sort?: TourSort; minPriceMinor?: number; maxPriceMinor?: number; }): Tour[] {
  const qSearch = toSearch(q);
  const tagLc = tag.trim().toLowerCase();
  const cityCmp = city.trim();

  const items = TOURS.filter((t) => {
    const haystack = [t.title, t.short ?? '', ...(t.tags ?? []), t.city].map((s) => toSearch(String(s))).join(' • ');
    const matchQ = !qSearch || haystack.includes(qSearch);
    const matchTag = !tagLc || (t.tags ?? []).some((x: string) => String(x).toLowerCase() === tagLc);
    const matchCity = !cityCmp || collator.compare(t.city, cityCmp) === 0;
    return matchQ && matchTag && matchCity;
  });

  if (sort === 'price-asc') {
    return [...items].sort((a, b) => {
      const pa = a.price ?? 0; const pb = b.price ?? 0;
      if (pa !== pb) return pa - pb;
      if ((b.rating ?? 0) !== (a.rating ?? 0)) return (b.rating ?? 0) - (a.rating ?? 0);
      return collator.compare(a.title, b.title);
    });
  }

  if (sort === 'price-desc') {
    return [...items].sort((a, b) => {
      const pa = a.price ?? 0; const pb = b.price ?? 0;
      if (pa !== pb) return pb - pa;
      if ((b.rating ?? 0) !== (a.rating ?? 0)) return (b.rating ?? 0) - (a.rating ?? 0);
      return collator.compare(a.title, b.title);
    });
  }

  return items;
}
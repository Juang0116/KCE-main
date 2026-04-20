import type { Tour, TourSort } from '../types';

/**
 * Catálogo oficial KCE — 3 experiencias premium en Bogotá.
 * Precios en EUR minor units (centavos) por persona.
 * Base COP: Tour1=540k/pareja, Tour2=350k/pareja, Tour3=480k/pareja
 */

export const TOURS: Tour[] = [
  {
    id: 't_bog_01',
    slug: 'cima-al-origen-bogota',
    title: 'De la Cima al Origen: Monserrate + Centro Histórico',
    city: 'Bogotá',
    durationHours: 5,
    price: 6_000, // ~60 EUR por persona (135 USD / pareja)
    rating: 5.0,
    image: '/images/tours/bogota-monserrate.jpg',
    short:
      'Desde las nubes de Monserrate hasta las calles más antiguas de La Candelaria. Una experiencia que conecta geografía, historia y cultura colombiana en 5 horas.',
    tags: ['historia', 'cultura', 'walking-tour', 'iconico'],
  },
  {
    id: 't_bog_02',
    slug: 'sabores-autenticos-bogota',
    title: 'Sabores Auténticos de Colombia',
    city: 'Bogotá',
    durationHours: 3,
    price: 3_900, // ~39 EUR por persona (87 USD / pareja)
    rating: 5.0,
    image: '/images/tours/bogota-gastronomia.jpg',
    short:
      'Paloquemao, frutas exóticas, ajiaco tradicional y café de origen. Una inmersión en la cocina colombiana que va más allá de los restaurantes.',
    tags: ['gastronomia', 'cultura', 'food-tour', 'mercado'],
  },
  {
    id: 't_bog_03',
    slug: 'bogota-sobre-ruedas',
    title: 'Bogotá sobre Ruedas: Ciclismo y Arte Urbano',
    city: 'Bogotá',
    durationHours: 3.5,
    price: 5_300, // ~53 EUR por persona (120 USD / pareja)
    rating: 5.0,
    image: '/images/tours/bogota-cicla.jpg',
    short:
      'Pedaleamos por La Concordia, los murales de la Calle 26 y Park Way. Graffiti, protesta social y cultura popular desde la bicicleta. Bici y casco incluidos.',
    tags: ['ciclovía', 'arte-urbano', 'aventura', 'bike-tour'],
  },
];

const collator = new Intl.Collator('es', { sensitivity: 'base' });

export const TAGS = Array.from(
  new Set(TOURS.flatMap((t) => (t.tags ?? []).map((x: string) => String(x).toLowerCase().trim()))),
).sort(collator.compare);

export const CITIES = Array.from(new Set(TOURS.map((t) => t.city))).sort(collator.compare);

// ---------- filtrado + ordenamiento ----------

type FilterParams = {
  q?: string;
  city?: string;
  tag?: string;
  sort?: TourSort;
  minPrice?: number;
  maxPrice?: number;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function filterAndSortTours(params: FilterParams): Tour[] {
  let list = [...TOURS];

  if (params.q) {
    const q = normalize(params.q);
    list = list.filter(
      (t) =>
        normalize(t.title).includes(q) ||
        normalize(t.city).includes(q) ||
        (t.short && normalize(t.short).includes(q)),
    );
  }

  if (params.city) {
    const city = normalize(params.city);
    list = list.filter((t) => normalize(t.city).includes(city));
  }

  if (params.tag) {
    const tag = normalize(params.tag);
    list = list.filter((t) => t.tags?.some((tg) => normalize(tg) === tag));
  }

  if (typeof params.minPrice === 'number') {
    list = list.filter((t) => t.price >= params.minPrice!);
  }

  if (typeof params.maxPrice === 'number') {
    list = list.filter((t) => t.price <= params.maxPrice!);
  }

  const sort = params.sort ?? 'popular';
  if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  // 'popular' → mantiene orden natural (por rating implícito)

  return list;
}

export function getTourBySlug(slug: string): Tour | undefined {
  return TOURS.find((t) => t.slug === slug);
}

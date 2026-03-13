// src/types/tours.ts

export type TourImage = { url: string; alt?: string | null };

// “TourLike” = lo mínimo que necesita el UI (cards, wishlist, etc.)
// images queda como unknown porque en DB es jsonb (puede venir string[] o {url}[])
export type TourLike = {
  id: string;
  slug: string;
  title: string;
  city?: string | null;
  tags?: string[] | null;
  rating?: number | null;

  // Precio en minor units (EUR cents) según tu schema
  base_price?: number | null;

  // Horas (int en DB)
  duration_hours?: number | null;

  images?: unknown;
};
